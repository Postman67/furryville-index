# furryville-index

## Setup

### Environment Variables
Copy `.env.example` to `.env` and configure the following variables:
- `FV_INDEX_READER_PASS` - Database password
- `DB_HOST` - Database host (e.g., `mysql.railway.internal`)
- `DB_NAME` - Database name (e.g., `furryville`)

See `secrets.md` for detailed environment variable documentation.

## Database Info
Site DB user is **READ ONLY**

- Host: Configurable via `DB_HOST` environment variable
- Database: Configurable via `DB_NAME` environment variable  
- Read account: fv-index-reader
- Password stored in environment variables

## Warp Hall DB entry format
Table Name: `warp_hall`

- `StallNumber` (INT-11) - `warp_hall_pk` 
- `IGN` (VARCHAR-100) - Owner/Manager IGN 
- `StallName` (VARCHAR-100) - Friendly name of the warp 

## The Mall Entry format
#### Table Name: `the_mall`
The Mall uses a composite priamry key to handle duplicate stall numbers relative to the street
- `StallNumber` (VARCHAR-5) - `the_mall_pk`
- `StreetName` (VARCHAR-100) - `the_mall_pk`
- `IGN` (VCHAR-100) - Owner IGN
- `StallName` (VCHAR-100) - Friendly name of the stall/shop
- `ItemsSold` (MEDIUMTEXT) - Types of items sold

## The Mall Review entry format
Table Name: `the_mall_reviews`
- `ReviewID` (BIGINT-20) - Primary key
- `StallNumber` (VARCHAR-5) - Foreign key to `the_mall`
- `StreetName` (VARCHAR-100) - Foreign key to `the_mall`
- `ReviewerID` (BIGINT-20) - Discord ID of reviewer
- `ReviewerName` (VARCHAR-60) - Name of reviewer
- `ReviewText` (TEXT) (Review Text) - Review content
- `Rating` (TINYINT-3) - Numeric rating
- `CreatedAt` (DATETIME) - Creation timestamp
- `UpdatedAt` (DATETIME) - Last update timestamp

## The Mall Street Names
- Wall Street
- Artist Alley
- Woke Ave
- Five
- Poland Street