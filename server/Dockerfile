# Multi-stage build for Canvas Studio Server
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production --workspace=server

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies (including dev dependencies)
RUN npm ci --workspace=server

# Copy source code
COPY server/ ./server/

# Build the application
RUN npm run build --workspace=server

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 canvasstudio

# Copy built application
COPY --from=builder --chown=canvasstudio:nodejs /app/server/dist ./dist
COPY --from=deps --chown=canvasstudio:nodejs /app/server/node_modules ./node_modules
COPY --from=builder --chown=canvasstudio:nodejs /app/server/package.json ./package.json

# Create necessary directories
RUN mkdir -p /app/logs && chown canvasstudio:nodejs /app/logs

USER canvasstudio

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]
