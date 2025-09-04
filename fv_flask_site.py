from flask import Flask, jsonify, render_template
import pymysql as mariadb
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Feature flags
ENABLE_WARP_HALL_STALL_PAGES = False  # Set to True to enable Warp Hall stall pages and clickable entries

def get_db_connection():
    """Get database connection"""
    try:
        conn = mariadb.connect(
            user="fv-index-reader",
            password=os.getenv('FV_INDEX_READER_PASS'),
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME')
        )
        return conn
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
        return None

@app.route('/')
def home():
    """Home endpoint - serves the main page"""
    return render_template('index.html', title='Furryville - Home',message='NEW FEATURES: STALL PAGES AND REVIEWS!')

@app.route('/warp-hall')
def warp_hall():
    """The Warp Hall"""
    return render_template('warp_hall.html', 
                         title='The Warp Hall - Furryville',
                         message='Search for warp stalls',
                         enable_stall_pages=ENABLE_WARP_HALL_STALL_PAGES)

@app.route('/the-mall')
def the_mall():
    """The Mall"""
    return render_template('the_mall.html', title='The Mall - Furryville',message='Search for shop stalls in The Mall')

@app.route('/the-mall/map')
def the_mall_map():
    """The Mall Interactive Map"""
    return render_template('mall_map.html', title='Mall Interactive Map - Furryville', message='Navigate through all 5 floors of The Mall')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html', title='About - Furryville', message='Learn more about Furryville.')

@app.route('/stall/warp-hall/<int:stall_number>')
@app.route('/stall/warp-hall/<float:stall_number>')
def warp_hall_stall(stall_number):
    """Dynamic stall page for Warp Hall"""
    # Check if Warp Hall stall pages are enabled
    if not ENABLE_WARP_HALL_STALL_PAGES:
        return render_template('404.html'), 404
    
    # Get stall data from database
    conn = get_db_connection()
    if not conn:
        return render_template('500.html'), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT StallNumber, IGN, StallName FROM warp_hall WHERE StallNumber = %s", (stall_number,))
        result = cursor.fetchone()
        
        if result:
            stall_data = {
                "StallNumber": result[0],
                "IGN": result[1],
                "StallName": result[2],
                "Location": "Warp Hall"
            }
        else:
            cursor.close()
            conn.close()
            return render_template('404.html'), 404
        
        cursor.close()
        conn.close()
        
        return render_template('stall.html', 
                             stall=stall_data, 
                             location='warp-hall',
                             title=f"{stall_data['StallName']} - {stall_data['Location']}")
        
    except mariadb.Error as e:
        print(f"Error querying stall data: {e}")
        if conn:
            conn.close()
        return render_template('500.html'), 500

@app.route('/stall/the-mall/<street_name>/<int:stall_number>')
@app.route('/stall/the-mall/<street_name>/<float:stall_number>')
def the_mall_stall(street_name, stall_number):
    """Dynamic stall page for The Mall"""
    # Get stall data from database
    conn = get_db_connection()
    if not conn:
        return render_template('500.html'), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT StallNumber, StreetName, IGN, StallName, ItemsSold FROM the_mall WHERE StallNumber = %s AND StreetName = %s", (stall_number, street_name))
        result = cursor.fetchone()
        
        if result:
            stall_data = {
                "StallNumber": result[0],
                "StreetName": result[1],
                "IGN": result[2],
                "StallName": result[3],
                "ItemsSold": result[4],
                "Location": "The Mall"
            }
        else:
            cursor.close()
            conn.close()
            return render_template('404.html'), 404
        
        cursor.close()
        conn.close()
        
        return render_template('stall.html', 
                             stall=stall_data, 
                             location='the-mall',
                             title=f"{stall_data['StallName']} - {stall_data['Location']}")
        
    except mariadb.Error as e:
        print(f"Error querying stall data: {e}")
        if conn:
            conn.close()
        return render_template('500.html'), 500

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
        # Try to get stall dimensions if they exist, otherwise use defaults
        cursor.execute("""
            SELECT StallNumber, StreetName, IGN, StallName, ItemsSold,
                   COALESCE(StallWidth, 3) as stall_width,
                   COALESCE(StallDepth, 3) as stall_depth
            FROM the_mall 
            ORDER BY StallNumber
        """)
        
        shops = []
        for row in cursor:
            stall_number, street_name, ign, stall_name, items_sold, stall_width, stall_depth = row
            shops.append({
                "StallNumber": stall_number,
                "StreetName": street_name,
                "IGN": ign,
                "StallName": stall_name,
                "ItemsSold": items_sold,
                "stall_width": stall_width,
                "stall_depth": stall_depth
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "shops": shops,
            "count": len(shops)
        })
        
    except mariadb.Error as e:
        print(f"Error querying the_mall: {e}")
        # Fallback to original query if stall_width/stall_depth columns don't exist
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
                    "ItemsSold": items_sold,
                    "stall_width": 3,  # Default fallback to match JavaScript config
                    "stall_depth": 3   # Default fallback to match JavaScript config
                })
            
            cursor.close()
            conn.close()
            
            return jsonify({
                "shops": shops,
                "count": len(shops)
            })
            
        except mariadb.Error as e2:
            print(f"Error with fallback query: {e2}")
            if conn:
                conn.close()
            return jsonify({
                "error": "Database query failed",
                "shops": []
            }), 500

@app.route('/api/reviews/<location>/<path:identifier>')
def api_reviews(location, identifier):
    """API endpoint to get reviews for a specific stall"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "error": "Database connection failed",
            "reviews": []
        }), 500
    
    try:
        cursor = conn.cursor()
        
        if location == 'the-mall':
            # For The Mall, identifier should be "street_name/stall_number"
            try:
                street_name, stall_number = identifier.rsplit('/', 1)
                stall_number = int(stall_number)
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Invalid stall identifier format",
                    "reviews": []
                }), 400
            
            cursor.execute("""
                SELECT ReviewID, StallNumber, StreetName, ReviewerName, ReviewText, Rating, CreatedAt, UpdatedAt 
                FROM the_mall_reviews 
                WHERE StallNumber = %s AND StreetName = %s 
                ORDER BY CreatedAt DESC
            """, (stall_number, street_name))
            
        else:
            # For now, only The Mall has reviews
            return jsonify({
                "message": "Reviews not available for this location",
                "reviews": []
            })
        
        reviews = []
        for (review_id, stall_num, street, reviewer, review_text, rating, created_at, updated_at) in cursor:
            reviews.append({
                "ReviewID": review_id,
                "StallNumber": stall_num,
                "StreetName": street,
                "ReviewerName": reviewer,
                "ReviewText": review_text,
                "Rating": rating,
                "CreatedAt": created_at.isoformat() if created_at else None,
                "UpdatedAt": updated_at.isoformat() if updated_at else None
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "reviews": reviews,
            "count": len(reviews),
            "average_rating": sum(r["Rating"] for r in reviews) / len(reviews) if reviews else 0
        })
        
    except mariadb.Error as e:
        print(f"Error querying reviews: {e}")
        if conn:
            conn.close()
        return jsonify({
            "error": "Database query failed",
            "reviews": []
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

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors by serving custom 404 page"""
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
