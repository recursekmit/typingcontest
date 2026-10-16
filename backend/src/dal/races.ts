import { randomInt } from "crypto";
import * as RedisClient from "../init/redis";
import MonkeyError from "../utils/error";
import { RacePlayer, RaceRoom, RaceStatus } from "@monkeytype/schemas/races";
import { festiveTexts } from "@monkeytype/util/festive-texts";

/**
 * 1v1 race rooms, stored in redis.
 * One hash per room: field "meta" holds the room, field "p:<uid>" holds each player.
 * Players only ever write their own field, so concurrent progress updates never clobber each other.
 */

const ROOM_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const COUNTDOWN_MS = 4000;
const MAX_PLAYERS = 4;
/** a race is force-finished after this long, in case someone never finishes */
const MAX_RACE_MS = 10 * 60 * 1000;
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

type RoomMeta = {
  hostUid: string;
  round: number;
  textName: string;
  startAt?: number;
  createdAt: number;
};

type StoredPlayer = Omit<RacePlayer, "place"> & { joinedAt: number };

function key(code: string): string {
  return `race:${code}`;
}

function getRedis(): NonNullable<ReturnType<typeof RedisClient.getConnection>> {
  const connection = RedisClient.getConnection();
  if (connection === null) {
    throw new MonkeyError(503, "Races are unavailable right now");
  }
  return connection;
}

function pickText(exclude?: string): string {
  const names = Object.keys(festiveTexts).filter((n) => n !== exclude);
  return names[randomInt(names.length)] as string;
}

function newPlayer(uid: string, name: string): StoredPlayer {
  return {
    uid,
    name,
    progress: 0,
    wpm: 0,
    finished: false,
    joinedAt: Date.now(),
  };
}

async function load(
  code: string,
): Promise<{ meta: RoomMeta; players: StoredPlayer[] }> {
  const raw = await getRedis().hgetall(key(code));
  if (raw["meta"] === undefined) {
    throw new MonkeyError(404, "Race not found - check the code");
  }
  const meta = JSON.parse(raw["meta"]) as RoomMeta;
  const players = Object.entries(raw)
    .filter(([field]) => field.startsWith("p:"))
    .map(([, value]) => JSON.parse(value) as StoredPlayer)
    .sort((a, b) => a.joinedAt - b.joinedAt);
  return { meta, players };
}

async function save(
  code: string,
  fields: { meta?: RoomMeta; players?: StoredPlayer[] },
): Promise<void> {
  const values: Record<string, string> = {};
  if (fields.meta !== undefined) values["meta"] = JSON.stringify(fields.meta);
  for (const player of fields.players ?? []) {
    values[`p:${player.uid}`] = JSON.stringify(player);
  }
  await getRedis()
    .multi()
    .hset(key(code), values)
    .expire(key(code), ROOM_TTL_SECONDS)
    .exec();
}

function getStatus(
  meta: RoomMeta,
  players: StoredPlayer[],
  now: number,
): RaceStatus {
  if (meta.startAt === undefined) return "waiting";
  if (now < meta.startAt) return "countdown";
  if (players.every((p) => p.finished) || now > meta.startAt + MAX_RACE_MS) {
    return "finished";
  }
  return "racing";
}

function toView(
  code: string,
  meta: RoomMeta,
  players: StoredPlayer[],
): RaceRoom {
  const now = Date.now();
  const status = getStatus(meta, players, now);

  const finishOrder = players
    .filter((p) => p.finished && p.finishMs !== undefined)
    .sort((a, b) => (a.finishMs as number) - (b.finishMs as number))
    .map((p) => p.uid);

  return {
    code,
    hostUid: meta.hostUid,
    status,
    round: meta.round,
    textName: meta.textName,
    text:
      status === "racing" || status === "finished"
        ? festiveTexts[meta.textName]
        : undefined,
    startAt: meta.startAt,
    serverTime: now,
    players: players.map(({ joinedAt: _joinedAt, ...player }) => {
      const place = finishOrder.indexOf(player.uid);
      return place === -1 ? player : { ...player, place: place + 1 };
    }),
  };
}

function requirePlayer(players: StoredPlayer[], uid: string): StoredPlayer {
  const player = players.find((p) => p.uid === uid);
  if (player === undefined) {
    throw new MonkeyError(403, "You are not in this race");
  }
  return player;
}

export async function createRoom(uid: string, name: string): Promise<RaceRoom> {
  const redis = getRedis();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from(
      { length: 5 },
      () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
    ).join("");
    const meta: RoomMeta = {
      hostUid: uid,
      round: 1,
      textName: pickText(),
      createdAt: Date.now(),
    };
    // hsetnx guards against (unlikely) code collisions
    const created = await redis.hsetnx(key(code), "meta", JSON.stringify(meta));
    if (created === 0) continue;
    const player = newPlayer(uid, name);
    await save(code, { players: [player] });
    return toView(code, meta, [player]);
  }
  throw new MonkeyError(500, "Could not create a race, try again");
}

export async function getRoom(code: string, uid: string): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  requirePlayer(players, uid);
  return toView(code, meta, players);
}

export async function joinRoom(
  code: string,
  uid: string,
  name: string,
): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  if (players.some((p) => p.uid === uid)) {
    return toView(code, meta, players);
  }
  if (meta.startAt !== undefined) {
    throw new MonkeyError(409, "This race has already started");
  }
  if (players.length >= MAX_PLAYERS) {
    throw new MonkeyError(409, "This race is full");
  }
  const player = newPlayer(uid, name);
  await save(code, { players: [player] });
  return toView(code, meta, [...players, player]);
}

export async function startRace(code: string, uid: string): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  if (meta.hostUid !== uid) {
    throw new MonkeyError(403, "Only the host can start the race");
  }
  if (meta.startAt !== undefined) {
    throw new MonkeyError(409, "This race has already started");
  }
  if (players.length < 2) {
    throw new MonkeyError(409, "Waiting for an opponent to join");
  }
  meta.startAt = Date.now() + COUNTDOWN_MS;
  await save(code, { meta });
  return toView(code, meta, players);
}

export async function rematch(code: string, uid: string): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  if (meta.hostUid !== uid) {
    throw new MonkeyError(403, "Only the host can start a rematch");
  }
  if (getStatus(meta, players, Date.now()) !== "finished") {
    throw new MonkeyError(409, "The current race is not finished yet");
  }
  meta.round += 1;
  meta.textName = pickText(meta.textName);
  delete meta.startAt;
  const reset = players.map((p) => ({
    ...newPlayer(p.uid, p.name),
    joinedAt: p.joinedAt,
  }));
  await save(code, { meta, players: reset });
  return toView(code, meta, reset);
}

export async function updateProgress(
  code: string,
  uid: string,
  progress: number,
  wpm: number,
): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  const player = requirePlayer(players, uid);
  if (getStatus(meta, players, Date.now()) === "racing" && !player.finished) {
    player.progress = Math.max(player.progress, progress);
    player.wpm = Math.round(wpm);
    await save(code, { players: [player] });
  }
  return toView(code, meta, players);
}

export async function finishRace(
  code: string,
  uid: string,
  wpm: number,
  acc: number,
): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  const player = requirePlayer(players, uid);
  const now = Date.now();
  if (
    meta.startAt !== undefined &&
    now >= meta.startAt &&
    !player.finished &&
    getStatus(meta, players, now) === "racing"
  ) {
    player.finished = true;
    player.progress = 1;
    player.wpm = Math.round(wpm);
    player.acc = Math.round(acc * 10) / 10;
    player.finishMs = now - meta.startAt;
    await save(code, { players: [player] });
  }
  return toView(code, meta, players);
}

export async function leaveRoom(code: string, uid: string): Promise<RaceRoom> {
  const { meta, players } = await load(code);
  requirePlayer(players, uid);
  const remaining = players.filter((p) => p.uid !== uid);
  const redis = getRedis();
  if (remaining.length === 0) {
    await redis.del(key(code));
    return toView(code, meta, []);
  }
  await redis.hdel(key(code), `p:${uid}`);
  if (meta.hostUid === uid) {
    meta.hostUid = (remaining[0] as StoredPlayer).uid;
    await save(code, { meta });
  }
  return toView(code, meta, remaining);
}
