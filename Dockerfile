FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 9090

CMD ["bun", "run", "dev"]