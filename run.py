#!/usr/bin/env python3
"""
Main entry point for the Furryville Index application.
"""

from fv_flask_site import app

if __name__ == '__main__':
    print("Starting Furryville Index server...")
    app.run(debug=True, host='0.0.0.0', port=5000)