# Containerfile for WebTermCom (Linux)
# This can be used with Podman or Docker

# Build stage for Frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final stage
FROM python:3.13-slim
WORKDIR /app

# Install system dependencies if any (e.g., for asyncssh/pyvnc if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets from builder
# We'll serve them via FastAPI or a separate web server.
# For simplicity, let's assume we might want to serve them via FastAPI static files or just have them available.
COPY --from=frontend-builder /app/dist/ ./frontend/dist/

# Environment variables
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8000

# Run the backend
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
