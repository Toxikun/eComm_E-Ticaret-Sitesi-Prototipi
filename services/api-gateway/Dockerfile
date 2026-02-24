FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/common ./packages/common
COPY packages/shared-types ./packages/shared-types
COPY services/api-gateway ./services/api-gateway
RUN npm install --workspace=@ecommerce/api-gateway
RUN npm run build --workspace=@ecommerce/shared-types
RUN npm run build --workspace=@ecommerce/common
RUN npm run build --workspace=@ecommerce/api-gateway

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/package.json
EXPOSE 3000
CMD ["node", "services/api-gateway/dist/index.js"]
