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

# Use default nginx config (no custom file needed)
# The default config serves static files from /usr/share/nginx/html correctly.

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]