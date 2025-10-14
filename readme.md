# IoT Analytics Dashboard

A full-stack IoT data analytics system with user authentication, data generation, and real-time analysis.

## Features

- **User Authentication**: JWT-based login system with role-based access
- **Data Generation**: Generate random IoT sensor data (temperature, humidity, pressure)
- **Real-time Analysis**: Statistical analysis with alerts for anomalies
- **MongoDB Storage**: Persistent storage for users, sensor data, and analysis results
- **Modern UI**: Clean, responsive HTML/JavaScript frontend

## Sample Users

- **Admin**: `admin` / `admin123` (full access)
- **Analyst**: `analyst` / `analyst123` (data generation and analysis)

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB
- Homebrew (for macOS)

### Installation

1. **Install MongoDB** (if not already installed):
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Start the system**:
   ```bash
   ./start_simple.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Manual Setup

If you prefer to run components separately:

#### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd frontend
python3 -m http.server 3000
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/profile` - Get user profile

### Data Operations
- `POST /api/generate-data` - Generate new sensor data
- `POST /api/stop-generation` - Stop generation and analyze data
- `GET /api/user-data` - Get user's sensor data
- `GET /api/user-analysis` - Get user's analysis results

### Admin (Admin role required)
- `GET /api/admin/all-data` - Get all system data

## Data Structure

### Sensor Data
```json
{
  "temperature": 32.5,
  "humidity": 61.3,
  "pressure": 1013.2,
  "timestamp": "2025-10-13T16:30:00Z",
  "user_id": "admin"
}
```

### Analysis Results
```json
{
  "total_readings": 100,
  "temperature": {
    "avg": 31.2,
    "min": 20.1,
    "max": 44.8,
    "std": 6.5
  },
  "humidity": {
    "avg": 58.3,
    "min": 30.0,
    "max": 79.9,
    "std": 12.1
  },
  "pressure": {
    "avg": 1012.8,
    "min": 950.2,
    "max": 1049.7,
    "std": 15.3
  },
  "alerts": ["High temperature detected"]
}
```

## MongoDB Collections

- `users` - User accounts and roles
- `sensor_data` - Generated sensor readings
- `analysis` - Analysis results and insights

## Technology Stack

### Backend
- Flask - Web framework
- Flask-JWT-Extended - JWT authentication
- PyMongo - MongoDB driver
- Flask-CORS - Cross-origin resource sharing

### Frontend
- HTML5 - Structure
- JavaScript (ES6+) - Interactivity
- CSS3 - Styling with modern features

### Database
- MongoDB - NoSQL document database

## Security Features

- JWT token-based authentication
- Password hashing with Werkzeug
- Role-based access control
- CORS protection
- Input validation

## Development

### Adding New Features

1. **Backend**: Add new routes in `backend/app.py`
2. **Frontend**: Update HTML/JavaScript in `frontend/index.html`
3. **Database**: Modify MongoDB collections as needed

### Environment Variables

- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string (defaults to localhost)

## Troubleshooting

### Common Issues

1. **MongoDB not running**:
   ```bash
   brew services start mongodb-community
   ```

2. **Port conflicts**:
   - Backend: Change port in `backend/app.py`
   - Frontend: Change port in `start_simple.sh`

3. **Permission errors**:
   ```bash
   chmod +x start_simple.sh
   ```

### Logs

- Backend logs: Check terminal output
- Frontend logs: Check browser console
- MongoDB logs: `brew services info mongodb-community`

## License

MIT License - feel free to use and modify as needed.