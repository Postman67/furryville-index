from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        "message": "Welcome to Furryville Index API",
        "status": "running"
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "furryville-index"
    })

@app.route('/api/status')
def api_status():
    """API status endpoint"""
    return jsonify({
        "api_version": "1.0.0",
        "endpoints": [
            "/",
            "/health",
            "/api/status"
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
