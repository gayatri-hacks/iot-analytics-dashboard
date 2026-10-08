#!/bin/bash

echo "🚀 Starting IoT Analytics System (Simple Version)..."

# Stop existing processes
echo "🛑 Stopping existing processes..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "python3 -m http.server" 2>/dev/null || true

# Check if MongoDB is running
echo "🗄️ Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    brew services start mongodb-community || {
        echo "❌ MongoDB not found. Please install MongoDB first:"
        echo "brew tap mongodb/brew"
        echo "brew install mongodb-community"
        echo "brew services start mongodb-community"
        exit 1
    }
else
    echo "✅ MongoDB is already running"
fi

# Start backend
echo "🔧 Starting Flask backend on port 5001..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend
python3 -m http.server 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ System started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "👤 Sample Users:"
echo "   Admin: admin / admin123"
echo "   Analyst: analyst / analyst123"
echo ""
echo "📝 Features:"
echo "   - Login with JWT authentication"
echo "   - Generate IoT sensor data"
echo "   - Stop generation and analyze data"
echo "   - View real-time data and analysis"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
