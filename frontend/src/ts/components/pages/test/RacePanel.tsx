import { createSignal, For, JSXElement, Match, Show, Switch } from "solid-js";

import { getUserId } from "../../../states/core";
import { showSuccessNotification } from "../../../states/notifications";
import {
  createRace,
  getMe,
  getPendingRaceCode,
  getRace,
  getRaceClock,
  getRaceLink,
  isHost,
  isRaceBusy,
  isRacePanelOpen,
  joinRace,
  leaveRace,
  rematch,
  serverNow,
  setRacePanelOpen,
  startRace,
} from "../../../states/race";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

function copy(text: string, label: string): void {
  void navigator.clipboard
    .writeText(text)
    .then(() => showSuccessNotification(`${label} copied`));
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function Lobby(): JSXElement {
  const [code, setCode] = createSignal(getPendingRaceCode());

  return (
    <Show
      when={getUserId() !== null}
      fallback={
        <div class="flex flex-wrap items-center gap-4">
          <p class="text-sub">Log in with your roll number to race.</p>
          <Button
            text="login"
            href="/login"
            router-link
            fa={{ icon: "fa-sign-in-alt" }}
          />
        </div>
      }
    >
      <div class="flex flex-wrap items-center gap-4">
        <Button
          text="create race"
          fa={{ icon: "fa-plus" }}
          disabled={isRaceBusy()}
          onClick={() => void createRace()}
        />
        <span class="text-sub">or</span>
        <form
          class="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void joinRace(code());
          }}
        >
          <input
            type="text"
            class="w-32 uppercase"
            placeholder="race code"
            maxLength={5}
            value={code()}
            onInput={(e) => setCode(e.currentTarget.value)}
          />
          <Button
            type="submit"
            text="join"
            fa={{ icon: "fa-sign-in-alt" }}
            disabled={isRaceBusy() || code().trim().length !== 5}
          />
        </form>
      </div>
    </Show>
  );
}

function Players(): JSXElement {
  return (
    <div class="grid gap-2">
      <For each={getRace()?.players ?? []}>
        {(player) => (
          <div class="grid grid-cols-[8rem_1fr_7rem] items-center gap-3 text-sm">
            <span
              class={cn("truncate", {
                "text-main": player.uid === getUserId(),
              })}
            >
              {player.place === 1 ? "🏆 " : ""}
              {player.name}
              {player.uid === getRace()?.hostUid ? " (host)" : ""}
            </span>
            <div class="h-2 overflow-hidden rounded bg-sub-alt">
              <div
                class={cn("h-full rounded transition-[width] duration-500", {
                  "bg-main": player.uid === getUserId(),
                  "bg-sub": player.uid !== getUserId(),
                })}
                style={{ width: `${Math.round(player.progress * 100)}%` }}
              ></div>
            </div>
            <span class="text-right text-sub tabular-nums">
              <Show when={player.finished} fallback={`${player.wpm} wpm`}>
                #{player.place} · {player.wpm} wpm
              </Show>
            </span>
          </div>
        )}
      </For>
    </div>
  );
}

function Results(): JSXElement {
  const ranked = () =>
    [...(getRace()?.players ?? [])].sort(
      (a, b) => (a.place ?? 99) - (b.place ?? 99),
    );
  const winner = () => ranked()[0];

  return (
    <div class="grid gap-3">
      <p class="text-xl">
        <Show
          when={winner()?.finished === true}
          fallback={<span class="text-sub">Nobody finished.</span>}
        >
          <Show
            when={winner()?.uid === getUserId()}
            fallback={
              <span>
                <span class="text-main">{winner()?.name}</span> wins!
              </span>
            }
          >
            <span class="text-main">You win! 🎉</span>
          </Show>
        </Show>
      </p>
      <div class="grid gap-1 text-sm">
        <For each={ranked()}>
          {(player) => (
            <div class="grid grid-cols-[2rem_8rem_repeat(3,5rem)] gap-2 tabular-nums">
              <span class="text-sub">{player.place ?? "-"}</span>
              <span class="truncate">{player.name}</span>
              <span>{player.wpm} wpm</span>
              <span class="text-sub">
                {player.acc !== undefined ? `${player.acc}%` : "-"}
              </span>
              <span class="text-sub">
                {player.finishMs !== undefined
                  ? formatMs(player.finishMs)
                  : "dnf"}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function Room(): JSXElement {
  const race = () => getRace();
  const countdown = () => {
    getRaceClock();
    const startAt = race()?.startAt;
    if (startAt === undefined) return 0;
    return Math.max(0, Math.ceil((startAt - serverNow()) / 1000));
  };

  return (
    <div class="grid gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sub">race</span>
        <button
          type="button"
          class="text-2xl tracking-[0.2em] text-main"
          title="copy code"
          onClick={() => copy(race()?.code ?? "", "Race code")}
        >
          {race()?.code}
        </button>
        <Button
          text="copy link"
          fa={{ icon: "fa-link" }}
          onClick={() => copy(getRaceLink(race()?.code ?? ""), "Race link")}
        />
        <span class="text-sub">· {race()?.textName}</span>
        <div class="grow"></div>
        <Button
          text="leave"
          variant="text"
          fa={{ icon: "fa-sign-out-alt" }}
          onClick={() => void leaveRace()}
        />
      </div>

      <Switch>
        <Match when={race()?.status === "waiting"}>
          <div class="flex flex-wrap items-center gap-4">
            <Show
              when={(race()?.players.length ?? 0) >= 2}
              fallback={
                <p class="text-sub">
                  Waiting for an opponent. Share the code or link.
                </p>
              }
            >
              <Show
                when={isHost()}
                fallback={
                  <p class="text-sub">Waiting for the host to start.</p>
                }
              >
                <Button
                  text="start race"
                  fa={{ icon: "fa-flag-checkered" }}
                  disabled={isRaceBusy()}
                  onClick={() => void startRace()}
                />
              </Show>
            </Show>
          </div>
        </Match>
        <Match when={race()?.status === "countdown"}>
          <p class="text-4xl text-main tabular-nums">{countdown()}</p>
        </Match>
        <Match when={race()?.status === "racing"}>
          <p class="text-sub">
            <Show
              when={getMe()?.finished === true}
              fallback="Go! Type the text below."
            >
              Finished! Waiting for the others…
            </Show>
          </p>
        </Match>
        <Match when={race()?.status === "finished"}>
          <Results />
          <Show
            when={isHost()}
            fallback={<p class="text-sub">The host can start a rematch.</p>}
          >
            <div>
              <Button
                text="rematch"
                fa={{ icon: "fa-redo" }}
                disabled={isRaceBusy()}
                onClick={() => void rematch()}
              />
            </div>
          </Show>
        </Match>
      </Switch>

      <Show when={race()?.status !== "finished"}>
        <Players />
      </Show>
    </div>
  );
}

/**
 * 1v1 race panel above the typing test. Opened from the "1v1" nav button or a
 * shared race link (/?race=CODE).
 */
export function RacePanel(): JSXElement {
  return (
    <Show when={isRacePanelOpen() || getRace() !== null}>
      <div
        class="mb-4 w-full rounded border border-sub-alt p-4"
        data-ui-element="racePanel"
      >
        <div class="mb-3 flex items-center gap-2">
          <i class="fas fa-fw fa-bolt text-main"></i>
          <span class="tracking-[0.06em] text-main uppercase">1v1 race</span>
          <div class="grow"></div>
          <Show when={getRace() === null}>
            <Button
              variant="text"
              fa={{ icon: "fa-times" }}
              onClick={() => setRacePanelOpen(false)}
            />
          </Show>
        </div>
        <Show when={getRace() !== null} fallback={<Lobby />}>
          <Room />
        </Show>
      </div>
    </Show>
  );
}
