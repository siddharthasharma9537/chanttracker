#!/bin/bash

set -e

echo "🚀 ChantTracker Local Database Setup"
echo "===================================="
echo ""

# 1. Check Docker
echo "📦 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# Wait for Docker daemon
echo "⏳ Waiting for Docker daemon..."
max_attempts=30
attempt=0
while ! docker ps &> /dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Docker daemon is not running after 30 seconds."
        echo "Please start Docker Desktop and try again."
        exit 1
    fi
    echo "   Attempt $attempt/30... (waiting for Docker)"
    sleep 1
done

echo "✅ Docker is ready"
echo ""

# 2. Start Supabase
echo "🗄️  Starting Supabase (this takes 20-40 seconds)..."
cd supabase
pnpm exec supabase start 2>&1 | tail -20 &
SUPABASE_PID=$!

# Wait for services to be ready
echo "⏳ Waiting for Supabase services..."
sleep 40

# Check if database is ready
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0
while ! pg_isready -h 127.0.0.1 -p 54322 > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Database failed to start after 30 seconds."
        exit 1
    fi
    echo "   Attempt $attempt/30..."
    sleep 1
done

echo "✅ Database is ready"
echo ""

# 3. Apply migrations
echo "🔧 Applying database migrations..."
cd ..
pnpm supabase:migrate 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! All migrations applied."
    echo ""
    echo "📊 Your Supabase instance is running at:"
    echo "   Studio:   http://localhost:54323"
    echo "   API:      http://localhost:54321"
    echo "   Database: localhost:54322"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Open http://localhost:54323 in your browser"
    echo "   2. Verify the database schema (projects table should have project_code)"
    echo "   3. Run: npm run dev"
    echo ""
    echo "✨ Happy chanting! 🙏"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    exit 1
fi
