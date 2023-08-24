FROM node:16 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build

FROM base AS common
COPY --from=prod-deps /app/packages/common/node_modules/ /app/packages/common/node_modules
# COPY --from=build /app/packages/common/dist /app/packages/common/dist

FROM common AS admin-ui
COPY --from=prod-deps /app/apps/admin-ui/node_modules/ /app/apps/admin-ui/node_modules
COPY --from=build /app/apps/admin-ui/.next /app/apps/admin-ui/.next
#USER default
WORKDIR /app/apps/admin-ui
#RUN install -d -o default -g root /app/admin-ui/.next/cache/images && chmod g+w -R /app/apps/admin-ui/.next
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1
CMD [ "pnpm", "start" ]

FROM common AS ui
COPY --from=prod-deps /app/apps/ui/node_modules/ /app/apps/ui/node_modules
COPY --from=build /app/apps/ui/.next /app/apps/ui/.next
#USER default
WORKDIR /app/apps/ui
#RUN install -d -o default -g root /app/apps/ui/.next/cache/images && chmod g+w -R /app/apps/admin-ui/.next
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1
CMD [ "pnpm", "start" ]
