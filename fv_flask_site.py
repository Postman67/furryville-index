from flask import Flask, jsonify, render_template
import pymysql as mariadb
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

def get_db_connection():
    """Get database connection"""
    try:
        conn = mariadb.connect(
            user="fv-index-reader",
            password=os.getenv('FV_INDEX_READER_PASS'),
            host="furryville-index.db",
            database="furryville"
        )
        return conn
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
        return None

@app.route('/')
def home():
    """Home endpoint - serves the main page"""
    return render_template('index.html', title='Furryville - Home',message='This website is currently in BETA!')

@app.route('/warp-hall')
def warp_hall():
    """The Warp Hall - Magical shops page"""
    return render_template('warp_hall.html', title='The Warp Hall - Furryville',message='Search for warp stalls')

@app.route('/the-mall')
def the_mall():
    """The Mall - Modern shopping page"""
    return render_template('the_mall.html', title='The Mall - Furryville',message='Search for shop stalls in The Mall')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html', title='About - Furryville', message='Learn more about Furryville.')

@app.route('/api/warp-hall')
def api_warp_hall():
    """API endpoint to get Warp Hall shop data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "error": "Database connection failed",
            "shops": []
        }), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT StallNumber, StallName, IGN FROM warp_hall ORDER BY StallNumber")
        
        shops = []
        for (stall_number, stall_name, ign) in cursor:
            shops.append({
                "StallNumber": stall_number,
                "StallName": stall_name,
                "IGN": ign
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "shops": shops,
            "count": len(shops)
        })
        
    except mariadb.Error as e:
        print(f"Error querying warp_hall: {e}")
        if conn:
            conn.close()
        return jsonify({
            "error": "Database query failed",
            "shops": []
        }), 500

@app.route('/api/the-mall')
def api_the_mall():
    """API endpoint to get The Mall shop data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "error": "Database connection failed",
            "shops": []
        }), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT StallNumber, StreetName, IGN, StallName, ItemsSold FROM the_mall ORDER BY StallNumber")
        
        shops = []
        for (stall_number, street_name, ign, stall_name, items_sold) in cursor:
            shops.append({
                "StallNumber": stall_number,
                "StreetName": street_name,
                "IGN": ign,
                "StallName": stall_name,
                "ItemsSold": items_sold
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "shops": shops,
            "count": len(shops)
        })
        
    except mariadb.Error as e:
        print(f"Error querying the_mall: {e}")
        if conn:
            conn.close()
        return jsonify({
            "error": "Database query failed",
            "shops": []
        }), 500

@app.route('/api/status')
def api_status():
    """API status endpoint - test database connection"""
    conn = get_db_connection()
    db_status = "connected" if conn else "disconnected"
    if conn:
        conn.close()
    
    return jsonify({
        "api_version": "1.0.0",
        "database_status": db_status,
        "endpoints": [
            "/",
            "/warp-hall",
            "/the-mall",
            "/api/warp-hall",
            "/api/the-mall",
            "/api/home",
            "/health",
            "/api/status"
        ]
    })

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
