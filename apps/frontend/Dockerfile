FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install all workspace deps (ensures native bindings like lightningcss resolve correctly)
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci \
  && npm install lightningcss-linux-arm64-gnu@1.32.0 @tailwindcss/oxide-linux-arm64-gnu@4.3.1 --no-save \
  && mkdir -p apps/frontend/node_modules/@tailwindcss \
  && ln -sf ../../node_modules/lightningcss-linux-arm64-gnu apps/frontend/node_modules/lightningcss-linux-arm64-gnu \
  && ln -sf ../../../node_modules/@tailwindcss/oxide-linux-arm64-gnu apps/frontend/node_modules/@tailwindcss/oxide-linux-arm64-gnu

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
