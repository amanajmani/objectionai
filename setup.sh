#!/bin/bash

# ObjectionAI Development Setup Script

set -e

echo "🛠️ Setting up ObjectionAI development environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Setup backend
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env file from template..."
    cp .env.example .env
    echo "⚠️  Please configure your environment variables in backend/.env"
fi

echo "📦 Installing backend dependencies..."
npm install

cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file from template..."
    cp .env.example .env
    echo "⚠️  Please configure your environment variables in frontend/.env"
fi

echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo "✅ Setup completed successfully!"
echo ""
echo "🔧 Configuration required:"
echo "1. Configure backend/.env with your Supabase and API keys"
echo "2. Configure frontend/.env with your Supabase URL and keys"
echo "3. Run the database schema in your Supabase project (backend/db/schema.sql)"
echo ""
echo "🚀 To start development:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Access application at http://localhost:5173"
echo ""
echo "📚 For more information, see README.md"