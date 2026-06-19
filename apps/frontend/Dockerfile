FROM node:20-bookworm-slim AS builder
WORKDIR /app

ARG TARGETARCH=amd64

# Workspace hoisting can skip platform-specific optional deps for apps/frontend — install per arch.
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci \
  && if [ "$TARGETARCH" = "arm64" ]; then \
       LC_PKG="lightningcss-linux-arm64-gnu"; \
       OX_PKG="@tailwindcss/oxide-linux-arm64-gnu"; \
     else \
       LC_PKG="lightningcss-linux-x64-gnu"; \
       OX_PKG="@tailwindcss/oxide-linux-x64-gnu"; \
     fi \
  && npm install "${LC_PKG}@1.32.0" "${OX_PKG}@4.3.1" --no-save \
  && mkdir -p apps/frontend/node_modules/@tailwindcss \
  && ln -sf "../../node_modules/${LC_PKG}" "apps/frontend/node_modules/${LC_PKG}" \
  && ln -sf "../../../node_modules/${OX_PKG}" "apps/frontend/node_modules/${OX_PKG}"

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w apps/frontend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
