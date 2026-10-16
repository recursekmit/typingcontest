FROM node:24.11.0-alpine3.22 AS builder
WORKDIR /app

#ENV
ENV BACKEND_URL=###MONKEYTYPE_BACKENDURL### RECAPTCHA_SITE_KEY=###RECAPTCHA_SITE_KEY###

#gimme pnpm (cached layer)
RUN npm i -g pnpm@11.21.0

#download dependencies from the lockfile only, so this layer stays cached
#until dependencies change (source changes no longer trigger a full download)
COPY ["pnpm-lock.yaml", "pnpm-workspace.yaml", "./"]
RUN pnpm fetch

#COPY
COPY ["package.json", "turbo.json", "./"]
COPY packages packages
COPY frontend frontend

COPY docker/frontend/firebase-config-live.ts frontend/src/ts/constants/firebase-config.ts
COPY docker/frontend/firebase-config-live.ts frontend/src/ts/constants/firebase-config-live.ts

#link from the local store + build
RUN pnpm i --frozen-lockfile --prefer-offline && \
    npm run build

# COPY to target
FROM nginx:mainline-alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend/updateConfig.sh /docker-entrypoint.d/updateConfig.sh
RUN chmod +x /docker-entrypoint.d/updateConfig.sh

# entry
#CMD ["./entryPoint.sh"]
