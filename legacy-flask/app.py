from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
from bson import ObjectId
import statistics

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

jwt = JWTManager(app)
CORS(app)

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'message': f'Invalid token: {error}'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'message': f'Missing token: {error}'}), 401

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['iot_analytics']

# Collections
users_collection = db['users']
data_collection = db['sensor_data']
analysis_collection = db['analysis']
sessions_collection = db['generation_sessions']

# Sample users with different roles
SAMPLE_USERS = [
    {
        'username': 'admin',
        'password': 'admin123',
        'role': 'admin',
        'email': 'admin@iot.com'
    },
    {
        'username': 'analyst',
        'password': 'analyst123',
        'role': 'analyst',
        'email': 'analyst@iot.com'
    }
]

def init_database():
    """Initialize database with sample users"""
    for user in SAMPLE_USERS:
        existing_user = users_collection.find_one({'username': user['username']})
        if not existing_user:
            user['password'] = generate_password_hash(user['password'])
            users_collection.insert_one(user)
            print(f"Created user: {user['username']}")

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if users_collection.find_one({'username': data['username']}):
        return jsonify({'message': 'User already exists'}), 400
    
    user = {
        'username': data['username'],
        'password': generate_password_hash(data['password']),
        'role': data.get('role', 'user'),
        'email': data.get('email', ''),
        'created_at': datetime.utcnow()
    }
    
    users_collection.insert_one(user)
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'username': data['username']})
    
    if user and check_password_hash(user['password'], data['password']):
        access_token = create_access_token(identity=user['username'])
        return jsonify({
            'access_token': access_token,
            'user': {
                'username': user['username'],
                'role': user['role'],
                'email': user['email']
            }
        }), 200
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    current_username = get_jwt_identity()
    user = users_collection.find_one({'username': current_username})
    
    if user:
        return jsonify({
            'username': user['username'],
            'role': user['role'],
            'email': user['email']
        }), 200
    
    return jsonify({'message': 'User not found'}), 404

def generate_sensor_data():
    """Generate random IoT sensor data"""
    return {
        'temperature': round(random.uniform(20.0, 45.0), 1),
        'humidity': round(random.uniform(30.0, 80.0), 1),
        'pressure': round(random.uniform(950.0, 1050.0), 1),
        'timestamp': datetime.utcnow()
    }

def analyze_data(data_points):
    """Analyze sensor data and provide insights"""
    if not data_points:
        return {'error': 'No data to analyze'}
    
    temperatures = [d['temperature'] for d in data_points]
    humidities = [d['humidity'] for d in data_points]
    pressures = [d['pressure'] for d in data_points]
    
    analysis = {
        'total_readings': len(data_points),
        'temperature': {
            'avg': round(statistics.mean(temperatures), 2),
            'min': min(temperatures),
            'max': max(temperatures),
            'std': round(statistics.stdev(temperatures) if len(temperatures) > 1 else 0, 2)
        },
        'humidity': {
            'avg': round(statistics.mean(humidities), 2),
            'min': min(humidities),
            'max': max(humidities),
            'std': round(statistics.stdev(humidities) if len(humidities) > 1 else 0, 2)
        },
        'pressure': {
            'avg': round(statistics.mean(pressures), 2),
            'min': min(pressures),
            'max': max(pressures),
            'std': round(statistics.stdev(pressures) if len(pressures) > 1 else 0, 2)
        },
        'alerts': []
    }
    
    # Check for alerts
    if analysis['temperature']['max'] > 40:
        analysis['alerts'].append('High temperature detected')
    if analysis['humidity']['max'] > 75:
        analysis['alerts'].append('High humidity detected')
    if analysis['pressure']['min'] < 980:
        analysis['alerts'].append('Low pressure detected')
    
    return analysis

@app.route('/api/generate-data', methods=['POST'])
@jwt_required()
def generate_data():
    try:
        current_username = get_jwt_identity()
        print(f"Current user: {current_username}")  # Debug log
        
        # Generate sensor data
        sensor_data = generate_sensor_data()
        sensor_data['user_id'] = current_username
        sensor_data['generated_at'] = datetime.utcnow()
        
        # Store in database
        result = data_collection.insert_one(sensor_data)
        sensor_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'message': 'Data generated successfully',
            'data': sensor_data
        }), 201
    except Exception as e:
        print(f"Error in generate_data: {e}")  # Debug log
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/api/clear-data', methods=['POST'])
@jwt_required()
def clear_data():
    try:
        current_username = get_jwt_identity()
        print(f"Clearing data for user: {current_username}")  # Debug log
        
        # Delete all data for this user
        result = data_collection.delete_many({'user_id': current_username})
        
        # Also delete analysis for this user
        analysis_collection.delete_many({'user_id': current_username})
        
        # Also delete sessions for this user
        sessions_collection.delete_many({'user_id': current_username})
        
        return jsonify({
            'message': f'Cleared {result.deleted_count} data points successfully'
        }), 200
    except Exception as e:
        print(f"Error in clear_data: {e}")  # Debug log
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/api/stop-generation', methods=['POST'])
@jwt_required()
def stop_generation():
    current_username = get_jwt_identity()
    stop_timestamp = datetime.utcnow()
    
    # Get all data for this user
    user_data = list(data_collection.find({'user_id': current_username}))
    
    if not user_data:
        return jsonify({'message': 'No data found for analysis. Please generate some data first.'}), 200
    
    # Perform analysis
    analysis = analyze_data(user_data)
    analysis['user_id'] = current_username
    analysis['analyzed_at'] = stop_timestamp
    analysis['total_data_points'] = len(user_data)
    
    # Store analysis
    result = analysis_collection.insert_one(analysis)
    analysis['_id'] = str(result.inserted_id)
    
    # Create session record with timestamp, all readings, and analysis
    session_record = {
        'user_id': current_username,
        'session_id': f"{current_username}_{stop_timestamp.strftime('%Y%m%d_%H%M%S')}",
        'start_time': user_data[0]['generated_at'] if user_data else stop_timestamp,
        'stop_time': stop_timestamp,
        'duration_seconds': (stop_timestamp - user_data[0]['generated_at']).total_seconds() if user_data else 0,
        'total_readings': len(user_data),
        'generated_readings': user_data,
        'analysis': analysis,
        'created_at': stop_timestamp
    }
    
    # Store session record
    session_result = sessions_collection.insert_one(session_record)
    session_record['_id'] = str(session_result.inserted_id)
    
    return jsonify({
        'message': 'Generation stopped and analysis completed',
        'analysis': analysis,
        'session': {
            'session_id': session_record['session_id'],
            'stop_time': session_record['stop_time'].isoformat(),
            'total_readings': session_record['total_readings'],
            'duration_seconds': session_record['duration_seconds']
        }
    }), 200

@app.route('/api/user-data', methods=['GET'])
@jwt_required()
def get_user_data():
    try:
        current_username = get_jwt_identity()
        print(f"Getting data for user: {current_username}")  # Debug log
        
        # Get user's data
        user_data = list(data_collection.find({'user_id': current_username}))
        
        # Convert ObjectId to string for JSON serialization
        for data in user_data:
            data['_id'] = str(data['_id'])
        
        return jsonify({
            'data': user_data,
            'count': len(user_data)
        }), 200
    except Exception as e:
        print(f"Error in get_user_data: {e}")  # Debug log
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/api/user-analysis', methods=['GET'])
@jwt_required()
def get_user_analysis():
    current_username = get_jwt_identity()
    
    # Get user's analysis
    user_analysis = list(analysis_collection.find({'user_id': current_username}))
    
    # Convert ObjectId to string for JSON serialization
    for analysis in user_analysis:
        analysis['_id'] = str(analysis['_id'])
    
    return jsonify({
        'analysis': user_analysis,
        'count': len(user_analysis)
    }), 200

@app.route('/api/user-sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    current_username = get_jwt_identity()
    
    # Get user's generation sessions
    user_sessions = list(sessions_collection.find({'user_id': current_username}).sort('created_at', -1))
    
    # Convert ObjectId to string for JSON serialization and format timestamps
    for session in user_sessions:
        session['_id'] = str(session['_id'])
        session['start_time'] = session['start_time'].isoformat()
        session['stop_time'] = session['stop_time'].isoformat()
        session['created_at'] = session['created_at'].isoformat()
        
        # Convert generated_readings ObjectIds
        for reading in session['generated_readings']:
            reading['_id'] = str(reading['_id'])
    
    return jsonify({
        'sessions': user_sessions,
        'count': len(user_sessions)
    }), 200

@app.route('/api/admin/all-data', methods=['GET'])
@jwt_required()
def get_all_data():
    current_username = get_jwt_identity()
    user = users_collection.find_one({'username': current_username})
    
    if not user or user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get all data
    all_data = list(data_collection.find())
    
    # Convert ObjectId to string for JSON serialization
    for data in all_data:
        data['_id'] = str(data['_id'])
    
    return jsonify({
        'data': all_data,
        'count': len(all_data)
    }), 200

if __name__ == '__main__':
    init_database()
    app.run(debug=True, port=5001)
