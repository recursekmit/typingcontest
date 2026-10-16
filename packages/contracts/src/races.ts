import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { RaceCodeSchema, RaceRoomSchema } from "@monkeytype/schemas/races";
import { CommonResponses, meta, responseWithData } from "./util/api";

export const RaceResponseSchema = responseWithData(RaceRoomSchema);
export type RaceResponse = z.infer<typeof RaceResponseSchema>;

export const RacePathParamsSchema = z.object({
  code: RaceCodeSchema,
});
export type RacePathParams = z.infer<typeof RacePathParamsSchema>;

export const RaceProgressRequestSchema = z.object({
  progress: z.number().min(0).max(1),
  wpm: z.number().min(0).max(1000),
});
export type RaceProgressRequest = z.infer<typeof RaceProgressRequestSchema>;

export const RaceFinishRequestSchema = z.object({
  wpm: z.number().min(0).max(1000),
  acc: z.number().min(0).max(100),
});
export type RaceFinishRequest = z.infer<typeof RaceFinishRequestSchema>;

const c = initContract();
export const racesContract = c.router(
  {
    create: {
      summary: "create race",
      description: "Creates a new 1v1 race room, the caller becomes the host",
      method: "POST",
      path: "",
      body: c.noBody(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
    get: {
      summary: "get race",
      description: "Gets the current state of a race room (polled)",
      method: "GET",
      path: "/:code",
      pathParams: RacePathParamsSchema.strict(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceGet" }),
    },
    join: {
      summary: "join race",
      description: "Joins a race room that has not started yet",
      method: "POST",
      path: "/:code/join",
      pathParams: RacePathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
    start: {
      summary: "start race",
      description: "Host only. Starts the countdown, needs at least 2 players",
      method: "POST",
      path: "/:code/start",
      pathParams: RacePathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
    rematch: {
      summary: "rematch",
      description: "Host only. Resets the room with a new text",
      method: "POST",
      path: "/:code/rematch",
      pathParams: RacePathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
    progress: {
      summary: "update progress",
      description: "Reports live progress while racing",
      method: "POST",
      path: "/:code/progress",
      pathParams: RacePathParamsSchema.strict(),
      body: RaceProgressRequestSchema.strict(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceGet" }),
    },
    finish: {
      summary: "finish race",
      description:
        "Reports the final result, finish time is taken from the server clock",
      method: "POST",
      path: "/:code/finish",
      pathParams: RacePathParamsSchema.strict(),
      body: RaceFinishRequestSchema.strict(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
    leave: {
      summary: "leave race",
      description: "Leaves a race room",
      method: "POST",
      path: "/:code/leave",
      pathParams: RacePathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: RaceResponseSchema,
      },
      metadata: meta({ rateLimit: "raceCreate" }),
    },
  },
  {
    pathPrefix: "/races",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "races",
    }),
    commonResponses: CommonResponses,
  },
);
