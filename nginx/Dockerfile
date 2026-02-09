# Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the application
RUN npm run build

# Production nginx
FROM nginx:alpine

# Copy built frontend files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
