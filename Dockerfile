# Multi-stage build: compile the Vite app, then serve the static output with nginx.
# Produces a small container image suitable for ZNAP (Kubernetes) or any container host.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Static build output
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing + asset serving config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
