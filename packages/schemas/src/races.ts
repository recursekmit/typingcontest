import { z } from "zod";

/** 5 char room code, no ambiguous characters (0/O, 1/I/L) */
export const RaceCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/, "Invalid race code");
export type RaceCode = z.infer<typeof RaceCodeSchema>;

export const RaceStatusSchema = z.enum([
  "waiting",
  "countdown",
  "racing",
  "finished",
]);
export type RaceStatus = z.infer<typeof RaceStatusSchema>;

export const RacePlayerSchema = z.object({
  uid: z.string(),
  name: z.string(),
  /** 0-1, share of words completed */
  progress: z.number().min(0).max(1),
  wpm: z.number().min(0),
  finished: z.boolean(),
  /** ms between race start and finish, measured by the server */
  finishMs: z.number().int().nonnegative().optional(),
  acc: z.number().min(0).max(100).optional(),
  /** 1 = winner, only set once finished */
  place: z.number().int().positive().optional(),
});
export type RacePlayer = z.infer<typeof RacePlayerSchema>;

export const RaceRoomSchema = z.object({
  code: RaceCodeSchema,
  hostUid: z.string(),
  status: RaceStatusSchema,
  round: z.number().int().positive(),
  textName: z.string(),
  /** only revealed once the race has started */
  text: z.string().optional(),
  /** unix ms, set when the host starts the race */
  startAt: z.number().int().optional(),
  /** server clock at the time of the response, used to sync countdowns */
  serverTime: z.number().int(),
  players: z.array(RacePlayerSchema),
});
export type RaceRoom = z.infer<typeof RaceRoomSchema>;
