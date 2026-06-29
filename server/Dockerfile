# ==========================================
# Stage 1: Install Dependencies
# ==========================================
FROM node:20-bookworm-slim AS deps

WORKDIR /usr/src/app

# Copy package manifests
COPY package.json package-lock.json ./

# Cleanly install production dependencies
RUN npm ci --omit=dev

# ================================================  
# Stage 2: Production Runner
# ================================================
FROM node:20-bookworm-slim AS runner

WORKDIR /usr/src/app

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Run container as non-root user (AWS ECS Security Best Practice)
USER node

# Copy dependencies from deps stage
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules

# Copy application code
COPY --chown=node:node . .

# Expose server port
EXPOSE 5000

# Built-in container health check hitting the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Entrypoint
CMD ["node", "server.js"]

