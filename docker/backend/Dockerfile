FROM node:24.11.0-alpine3.22 AS builder

WORKDIR /app

#gimme pnpm (cached layer)
RUN npm i -g pnpm@11.21.0

#download dependencies from the lockfile only, so this layer stays cached
#until dependencies change (source changes no longer trigger a full download)
COPY ["pnpm-lock.yaml", "pnpm-workspace.yaml", "./"]
RUN pnpm fetch

#copy
COPY ["package.json", "turbo.json", "./"]
COPY packages packages
COPY backend backend

#link from the local store + build
RUN pnpm i --frozen-lockfile --prefer-offline && \
    npm run build

#deploy (install all non-dev dependencies in a single node_module folder)
#inject copies workspace packages (@monkeytype/*) instead of symlinking them to /app/packages, which is not in the target image
RUN pnpm deploy --filter backend --prod --prefer-offline --config.inject-workspace-packages=true /prod/backend

#---------------------------------

## target image
FROM node:24.11.0-alpine3.22

## get server_version from build-arg, default to UNKNOWN
ARG server_version=UNKNOWN

# COPY to target
COPY --from=builder /prod/backend/node_modules /app/backend/node_modules
COPY --from=builder /prod/backend/dist /app/backend/dist
COPY --from=builder /prod/backend/email-templates /app/backend/email-templates
COPY --from=builder /prod/backend/redis-scripts /app/backend/redis-scripts
COPY --from=builder /prod/backend/private /app/backend/private

## to build directory
WORKDIR /app/backend/dist

## logs
RUN mkdir -p /app/backend/dist/logs

COPY ["docker/backend/entry-point.sh", "./"]

RUN echo "${server_version}" > /app/backend/dist/server.version

#run in prod mode, but don't require anti-cheat, email client or firebase
ENV MODE=prod
ENV BYPASS_ANTICHEAT=true
ENV BYPASS_EMAILCLIENT=true
ENV BYPASS_FIREBASE=true

EXPOSE 5005
USER node

CMD [ "/bin/sh", "./entry-point.sh" ]
