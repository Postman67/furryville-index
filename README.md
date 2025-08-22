# furryville-index

## MariaDB Info
Site DB user is READ ONLY

- Host: furryville-index.db
- Read account: I'm not telling :3
- Password stored in local .env

## Warp Hall DB entry format
Table Name: warp_hall

- Stall Number (StallNumber) (warp_hall_pk)
- Owner IGN (IGN)
- Stall Name (StallName)

## The Mall Entry format
Table Name: the_mall  
The Mall uses a composite priamry key to handle duplicate stall numbers relative to the street
- Stall Number (StallNumber) (the_mall_pk)
- Street Name (StreetName) (the_mall_pk)
- Owner IGN (IGN)
- Stall Name (StallName)
- Items Sold (ItemsSold)

## The Mall Street Names
- Wall Street
- Artist Alley
- Woke Ave
- Five
- Poland Street

## The Mall Review entry format
Table Name: the_mall_reviews
- ReviewID (INT)
- StallNumber (INT)
- StreetName (String)
- ReviewerID (BIGINT)
- ReviewerName (String)
- ReviewText (String) (Review Text)
- Rating (INT)
- CreatedAt (DATETIME)
- UpdatedAt (DATETIME)