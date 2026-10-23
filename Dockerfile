FROM node:20.19.1-bookworm-slim

WORKDIR /app

# Copy workspace manifests first so dependency installation remains cacheable.
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci --omit=dev --workspace backend --include-workspace-root

COPY tsconfig.base.json ./
COPY shared/ shared/
COPY backend/ backend/

ENV REGISTRY_PORT=4000
EXPOSE 4000

CMD ["npm", "run", "start", "-w", "backend"]
