/**
 * 1v1 races. The room lives on the backend (redis) and is polled while the
 * player is in it. When the countdown ends the race text is loaded into a
 * custom test, live progress is reported while typing and the result is sent
 * when the test finishes. Finish times are measured by the server clock.
 */
import type { RaceRoom } from "@monkeytype/schemas/races";
import { createEffect, createSignal, on } from "solid-js";

import Ape from "../ape";
import { setConfig } from "../config/setters";
import { Config } from "../config/store";
import { restartTestEvent } from "../events/test";
import { authPromise } from "../firebase";
import * as CustomText from "../test/custom-text";
import * as PractiseWords from "../test/practise-words";
import { getUserId } from "./core";
import { showErrorNotification } from "./notifications";
import {
  currentLiveStats,
  getActiveWordIndex,
  getLastResult,
  isTestActive,
  setLoadedChallenge,
  getLoadedChallenge,
} from "./test";

const POLL_MS = 500;
/** keep request counts low outside of an active race (shared lab ips) */
const WAITING_POLL_MS = 2000;
const FINISHED_POLL_MS = 5000;
const HIDDEN_POLL_MS = 15000;

function getIdlePollDelay(status: RaceRoom["status"]): number {
  if (document.hidden) return HIDDEN_POLL_MS;
  if (status === "racing") return POLL_MS;
  if (status === "finished") return FINISHED_POLL_MS;
  return WAITING_POLL_MS;
}
const PENDING_CODE_KEY = "pendingRaceCode";

export const [getRace, setRace] = createSignal<RaceRoom | null>(null);
export const [isRacePanelOpen, setRacePanelOpen] = createSignal(false);
export const [isRaceBusy, setRaceBusy] = createSignal(false);
/** ticks while a countdown is running so the ui can render it */
export const [getRaceClock, setRaceClock] = createSignal(Date.now());

/** server time minus local time */
let clockOffset = 0;
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;
/** round whose text is currently loaded into the test */
let loadedRound: { code: string; round: number } | null = null;
/** result object present when the race text was loaded, to detect a new one */
let resultAtLoad: unknown = null;
let finishSent = false;
let wordCount = 1;

export function serverNow(): number {
  return Date.now() + clockOffset;
}

export function getMe(): RaceRoom["players"][number] | undefined {
  const uid = getUserId();
  return getRace()?.players.find((p) => p.uid === uid);
}

export function isHost(): boolean {
  const race = getRace();
  return race !== null && race.hostUid === getUserId();
}

export function getPendingRaceCode(): string {
  try {
    return window.sessionStorage.getItem(PENDING_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setPendingRaceCode(code: string | null): void {
  try {
    if (code === null) window.sessionStorage.removeItem(PENDING_CODE_KEY);
    else window.sessionStorage.setItem(PENDING_CODE_KEY, code);
  } catch {
    //
  }
}

export function getRaceLink(code: string): string {
  return `${window.location.origin}/?race=${code}`;
}

function applyRoom(room: RaceRoom): void {
  clockOffset = room.serverTime - Date.now();
  setRace(room);
}

type RaceCall = () => Promise<
  | { status: 200; body: { data: RaceRoom } }
  | { status: number; body: { message: string } }
>;

async function call(
  fn: RaceCall,
  options: { silent?: boolean; busy?: boolean } = {},
): Promise<boolean> {
  if (options.busy === true) setRaceBusy(true);
  try {
    const response = await fn();
    if (response.status === 200 && "data" in response.body) {
      applyRoom(response.body.data);
      return true;
    }
    if (response.status === 404 || response.status === 403) {
      // room expired or we were removed
      stopRace();
    }
    if (options.silent !== true) {
      const message =
        "message" in response.body ? response.body.message : "unknown error";
      showErrorNotification(`Race: ${message}`);
    }
    return false;
  } finally {
    if (options.busy === true) setRaceBusy(false);
  }
}

function schedulePoll(delay = POLL_MS): void {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => void poll(), delay);
}

async function poll(): Promise<void> {
  const race = getRace();
  if (race === null) return;
  const me = getMe();

  if (race.status === "racing" && me !== undefined && !me.finished) {
    const progress = isTestActive()
      ? Math.min(1, getActiveWordIndex() / wordCount)
      : me.progress;
    await call(
      async () =>
        Ape.races.progress({
          params: { code: race.code },
          body: { progress, wpm: Math.max(0, currentLiveStats.wpm ?? 0) },
        }),
      { silent: true },
    );
  } else {
    await call(async () => Ape.races.get({ params: { code: race.code } }), {
      silent: true,
    });
  }

  const updated = getRace();
  if (updated === null) return;
  if (updated.status === "countdown" && updated.startAt !== undefined) {
    // poll right when the countdown ends so the text appears on time
    const untilStart = updated.startAt - serverNow();
    schedulePoll(Math.max(20, Math.min(POLL_MS, untilStart + 20)));
  } else {
    schedulePoll(getIdlePollDelay(updated.status));
  }
}

function startPolling(): void {
  schedulePoll(0);
  clearInterval(clockTimer);
  clockTimer = setInterval(() => setRaceClock(Date.now()), 100);
}

function stopRace(): void {
  clearTimeout(pollTimer);
  clearInterval(clockTimer);
  setRace(null);
  loadedRound = null;
  finishSent = false;
}

function loadRaceText(room: RaceRoom): void {
  if (room.text === undefined) return;
  const words = room.text.split(/\s+/).filter((w) => w !== "");
  wordCount = words.length;

  if (getLoadedChallenge() !== null) setLoadedChallenge(null);
  CustomText.setMode("repeat");
  CustomText.setPipeDelimiter(false);
  CustomText.setText(words);
  CustomText.setLimitMode("word");
  CustomText.setLimitValue(words.length);
  if (Config.mode !== "custom") {
    setConfig("mode", "custom");
  }
  PractiseWords.resetBefore();

  loadedRound = { code: room.code, round: room.round };
  resultAtLoad = getLastResult();
  finishSent = false;
  restartTestEvent.dispatch();
}

// load the text the moment the race starts (also on rematch)
createEffect(
  on(getRace, (room) => {
    if (room?.status !== "racing") return;
    if (
      loadedRound !== null &&
      loadedRound.code === room.code &&
      loadedRound.round === room.round
    ) {
      return;
    }
    const me = room.players.find((p) => p.uid === getUserId());
    if (me === undefined || me.finished) return;
    loadRaceText(room);
  }),
);

// report the result when the race test finishes
createEffect(
  on(getLastResult, (result) => {
    const room = getRace();
    if (
      result === null ||
      room === null ||
      finishSent ||
      result === resultAtLoad ||
      loadedRound?.code !== room.code ||
      loadedRound.round !== room.round ||
      result.mode !== "custom"
    ) {
      return;
    }
    finishSent = true;
    void call(async () =>
      Ape.races.finish({
        params: { code: room.code },
        body: { wpm: result.wpm, acc: result.acc },
      }),
    );
  }),
);

export async function createRace(): Promise<void> {
  if (await call(async () => Ape.races.create(), { busy: true })) {
    setPendingRaceCode(null);
    startPolling();
  }
}

export async function joinRace(code: string): Promise<void> {
  const cleaned = code.trim().toUpperCase();
  if (cleaned === "") return;
  if (getUserId() === null) {
    setPendingRaceCode(cleaned);
    showErrorNotification("Log in with your roll number to join the race");
    return;
  }
  if (
    await call(async () => Ape.races.join({ params: { code: cleaned } }), {
      busy: true,
    })
  ) {
    setPendingRaceCode(null);
    startPolling();
  }
}

export async function startRace(): Promise<void> {
  const race = getRace();
  if (race === null) return;
  if (
    await call(async () => Ape.races.start({ params: { code: race.code } }), {
      busy: true,
    })
  ) {
    schedulePoll(0);
  }
}

export async function rematch(): Promise<void> {
  const race = getRace();
  if (race === null) return;
  await call(async () => Ape.races.rematch({ params: { code: race.code } }), {
    busy: true,
  });
}

export async function leaveRace(): Promise<void> {
  const race = getRace();
  if (race === null) return;
  await call(async () => Ape.races.leave({ params: { code: race.code } }), {
    silent: true,
  });
  stopRace();
}

// leave the race if the user signs out
createEffect(
  on(getUserId, (uid) => {
    if (uid === null && getRace() !== null) stopRace();
    // join a race from a shared link once signed in
    if (uid !== null && getRace() === null) {
      const pending = getPendingRaceCode();
      if (pending !== "") {
        setRacePanelOpen(true);
        void joinRace(pending);
      }
    }
  }),
);

// shared link: /?race=CODE
const linkCode = new URLSearchParams(window.location.search).get("race");
if (linkCode !== null && linkCode !== "") {
  setPendingRaceCode(linkCode.trim().toUpperCase());
  setRacePanelOpen(true);
  const url = new URL(window.location.href);
  url.searchParams.delete("race");
  window.history.replaceState(null, "", url.toString());
  void authPromise.then(() => {
    if (getUserId() !== null && getRace() === null) {
      void joinRace(getPendingRaceCode());
    }
  });
}

// poll right away when the tab becomes visible again
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && getRace() !== null) schedulePoll(0);
});
