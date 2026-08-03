#!/usr/bin/env bash

set -e

echo "🚀 Starting WORKIZO Production Deployment..."

# 1. Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

# 2. Build and start containers
echo "📦 Building and starting Docker containers..."
docker compose down --remove-orphans || true
docker compose up -d --build

# 3. Wait for database and backend
echo "⏳ Waiting for backend container to be healthy..."
sleep 5

# 4. Run database migrations
echo "🗄️ Running Django Database Migrations..."
docker compose exec backend python manage.py migrate --noinput

# 5. Collect static assets
echo "🎨 Collecting Static Files..."
docker compose exec backend python manage.py collectstatic --noinput

# 6. Seed initial service categories if command exists
echo "🌱 Checking for initial service categories..."
docker compose exec backend python manage.py seed_categories || true

echo "✅ WORKIZO successfully deployed!"
echo "🌐 App running at: http://localhost"
echo "📊 API running at: http://localhost/api/"
