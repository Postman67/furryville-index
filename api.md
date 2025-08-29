# Furryville Index API Documentation

This document provides comprehensive documentation for all API endpoints in the Furryville Index Flask application.

## API Endpoints

### 1. Health Check Endpoints

#### GET `/health`
**Description:** Health check endpoint to verify if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "furryville-index"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

#### GET `/api/status`
**Description:** API status endpoint that provides API version, database connectivity status, and available endpoints.

**Response:**
```json
{
  "api_version": "1.0.0",
  "database_status": "connected",
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
}
```

**Status Codes:**
- `200 OK` - Status retrieved successfully

**Fields:**
- `api_version`: Current API version
- `database_status`: Either "connected" or "disconnected"
- `endpoints`: List of available endpoints

### 2. General API Endpoints

#### GET `/api/home`
**Description:** API endpoint for home data.

**Response:**
```json
{
  "message": "Welcome to Furryville Index API",
  "status": "running"
}
```

**Status Codes:**
- `200 OK` - Home data retrieved successfully

### 3. Shop Data Endpoints

#### GET `/api/warp-hall`
**Description:** Retrieves all shop data from the Warp Hall location.

**Response:**
```json
{
  "shops": [
    {
      "StallNumber": 1,
      "StallName": "Example Shop",
      "IGN": "PlayerName"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200 OK` - Shop data retrieved successfully
- `500 Internal Server Error` - Database connection or query failed

**Error Response:**
```json
{
  "error": "Database connection failed",
  "shops": []
}
```

**Fields:**
- `shops`: Array of shop objects
- `count`: Total number of shops
- Each shop contains:
  - `StallNumber`: Unique stall identifier
  - `StallName`: Name of the shop/stall
  - `IGN`: In-game name of the shop owner

#### GET `/api/the-mall`
**Description:** Retrieves all shop data from The Mall location.

**Response:**
```json
{
  "shops": [
    {
      "StallNumber": 1,
      "StreetName": "Main Street",
      "IGN": "PlayerName",
      "StallName": "Example Shop",
      "ItemsSold": "Various items"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200 OK` - Shop data retrieved successfully
- `500 Internal Server Error` - Database connection or query failed

**Error Response:**
```json
{
  "error": "Database connection failed",
  "shops": []
}
```

**Fields:**
- `shops`: Array of shop objects
- `count`: Total number of shops
- Each shop contains:
  - `StallNumber`: Unique stall identifier
  - `StreetName`: Street location within The Mall
  - `IGN`: In-game name of the shop owner
  - `StallName`: Name of the shop/stall
  - `ItemsSold`: Description of items sold at the stall

### 4. Review Endpoints

#### GET `/api/reviews/<location>/<identifier>`
**Description:** Retrieves reviews for a specific stall at a given location.

**Parameters:**
- `location`: The location of the stall (currently only "the-mall" is supported)
- `identifier`: For The Mall, use format "street_name/stall_number" (e.g., "main-street/5")

**Example Request:**
```
GET /api/reviews/the-mall/main-street/5
```

**Response:**
```json
{
  "reviews": [
    {
      "ReviewID": 1,
      "StallNumber": 5,
      "StreetName": "main-street",
      "ReviewerName": "CustomerName",
      "ReviewText": "Great service and prices!",
      "Rating": 5,
      "CreatedAt": "2024-01-15T10:30:00",
      "UpdatedAt": "2024-01-15T10:30:00"
    }
  ],
  "count": 1,
  "average_rating": 5.0
}
```

**Status Codes:**
- `200 OK` - Reviews retrieved successfully
- `400 Bad Request` - Invalid stall identifier format
- `500 Internal Server Error` - Database connection or query failed

**Error Responses:**
```json
{
  "error": "Invalid stall identifier format",
  "reviews": []
}
```

```json
{
  "message": "Reviews not available for this location",
  "reviews": []
}
```

**Fields:**
- `reviews`: Array of review objects
- `count`: Total number of reviews
- `average_rating`: Average rating across all reviews (0 if no reviews)
- Each review contains:
  - `ReviewID`: Unique review identifier
  - `StallNumber`: Stall number being reviewed
  - `StreetName`: Street name in The Mall
  - `ReviewerName`: Name of the person who left the review
  - `ReviewText`: Text content of the review
  - `Rating`: Numeric rating (typically 1-5)
  - `CreatedAt`: ISO timestamp when review was created
  - `UpdatedAt`: ISO timestamp when review was last updated

## Web Page Routes

The following routes serve HTML pages rather than JSON data:

### GET `/`
**Description:** Home page of the Furryville Index.

### GET `/warp-hall`
**Description:** The Warp Hall page.

### GET `/the-mall`
**Description:** The Mall page.

### GET `/about`
**Description:** About page with information about Furryville.

### GET `/stall/warp-hall/<stall_number>`
**Description:** Individual stall page for Warp Hall stalls.
- **Note:** This feature is controlled by the `ENABLE_WARP_HALL_STALL_PAGES` flag
- Returns 404 if the feature is disabled

### GET `/stall/the-mall/<street_name>/<stall_number>`
**Description:** Individual stall page for The Mall stalls.

## Environment Variables

The application requires the following environment variable:
- `FV_INDEX_READER_PASS` - Password for the database user "fv-index-reader"

## Error Handling

All API endpoints implement consistent error handling:

- **Database Connection Errors:** Return 500 status with error message
- **Invalid Parameters:** Return 400 status with descriptive error
- **Missing Resources:** Return 404 status
- **Database Query Errors:** Return 500 status with error message

## Features Flags

- `ENABLE_WARP_HALL_STALL_PAGES`: Controls whether individual Warp Hall stall pages are accessible (currently set to `False`)
