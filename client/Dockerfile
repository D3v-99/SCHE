# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set base path for the app (must match Nginx location)
ENV VITE_BASE_URL=/apps/schedule/

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (if you have one)
# If you don't have a custom nginx.conf in client/, this line will fail.
# Remove it or create a simple one.
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]