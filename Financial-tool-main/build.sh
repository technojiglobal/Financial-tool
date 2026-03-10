#!/usr/bin/env bash
# Build script for Render — backend only
set -e

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend build complete!"
