# furryville-index

## MariaDB Info
Site DB user is **READ ONLY**

- Host: `furryville-index.db`
- Read account: I'm not telling :3
- Password stored in local .env

## Warp Hall DB entry format
Table Name: warp_hall

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

## The Mall Street Names
- Wall Street
- Artist Alley
- Woke Ave
- Five
- Poland Street

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