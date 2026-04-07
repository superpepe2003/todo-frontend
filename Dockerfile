# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine AS serve

# Copiar el build de Angular al directorio de nginx
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiar configuración de nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
