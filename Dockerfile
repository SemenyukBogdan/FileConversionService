FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libreoffice \
    pandoc \
    texlive-xetex \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "scripts/start.js"]
