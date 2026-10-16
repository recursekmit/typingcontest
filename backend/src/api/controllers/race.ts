import {
  RaceFinishRequest,
  RacePathParams,
  RaceProgressRequest,
  RaceResponse,
} from "@monkeytype/contracts/races";
import * as RaceDAL from "../../dal/races";
import * as UserDAL from "../../dal/user";
import { MonkeyResponse } from "../../utils/monkey-response";
import { MonkeyRequest } from "../types";

async function getName(uid: string): Promise<string> {
  const { name } = await UserDAL.getPartialUser(uid, "race player name", [
    "name",
  ]);
  return name;
}

export async function createRace(req: MonkeyRequest): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.createRoom(uid, await getName(uid));
  return new MonkeyResponse("Race created", room);
}

export async function getRace(
  req: MonkeyRequest<undefined, undefined, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.getRoom(req.params.code, uid);
  return new MonkeyResponse("Race retrieved", room);
}

export async function joinRace(
  req: MonkeyRequest<undefined, undefined, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.joinRoom(req.params.code, uid, await getName(uid));
  return new MonkeyResponse("Race joined", room);
}

export async function startRace(
  req: MonkeyRequest<undefined, undefined, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.startRace(req.params.code, uid);
  return new MonkeyResponse("Race started", room);
}

export async function rematch(
  req: MonkeyRequest<undefined, undefined, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.rematch(req.params.code, uid);
  return new MonkeyResponse("Rematch ready", room);
}

export async function updateProgress(
  req: MonkeyRequest<undefined, RaceProgressRequest, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const { progress, wpm } = req.body;
  const room = await RaceDAL.updateProgress(
    req.params.code,
    uid,
    progress,
    wpm,
  );
  return new MonkeyResponse("Progress updated", room);
}

export async function finishRace(
  req: MonkeyRequest<undefined, RaceFinishRequest, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const { wpm, acc } = req.body;
  const room = await RaceDAL.finishRace(req.params.code, uid, wpm, acc);
  return new MonkeyResponse("Race finished", room);
}

export async function leaveRace(
  req: MonkeyRequest<undefined, undefined, RacePathParams>,
): Promise<RaceResponse> {
  const { uid } = req.ctx.decodedToken;
  const room = await RaceDAL.leaveRoom(req.params.code, uid);
  return new MonkeyResponse("Left race", room);
}
