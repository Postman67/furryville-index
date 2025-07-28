from flask import Flask, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def home():
    """Home endpoint - serves the main page"""
    return render_template('index.html', 
                         title='Furryville Index - Home',
                         message='Welcome to your shop directory!')

@app.route('/warp-hall')
def warp_hall():
    """The Warp Hall - Magical shops page"""
    return render_template('warp_hall.html', 
                         title='The Warp Hall - Furryville Index',
                         message='Discover magical shops and mystical services')

@app.route('/the-mall')
def the_mall():
    """The Mall - Modern shopping page"""
    return render_template('the_mall.html', 
                         title='The Mall - Furryville Index',
                         message='Browse modern shops and everyday essentials')

@app.route('/api/home')
def api_home():
    """API endpoint for home data"""
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
            "/warp-hall",
            "/the-mall",
            "/api/home",
            "/health",
            "/api/status"
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
