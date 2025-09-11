# Environment Variables and Secrets

This document outlines all the environment variables required for the Furryville Index application to function properly.

## Required Environment Variables

### Database Configuration

#### `FV_INDEX_READER_PASS`
- **Description:** Password for the MySQL database user "fv-index-reader"
- **Type:** Secret (sensitive)
- **Example:** `your_secure_password_here`
- **Required:** Yes

#### `DB_HOST`
- **Description:** MySQL database host/server address
- **Type:** Configuration
- **Example:** `mysql.railway.internal` (for Railway hosting)
- **Required:** Yes

#### `DB_NAME`
- **Description:** Name of the MySQL database to connect to
- **Type:** Configuration
- **Example:** `furryville`
- **Required:** Yes

## Setting Environment Variables

### Local Development (.env file)
Create a `.env` file in the project root directory:

```env
# Database Configuration
FV_INDEX_READER_PASS=your_secure_password_here
DB_HOST=mysql.railway.internal
DB_NAME=furryville
```

### Production/Railway Deployment
Set these variables in your Railway project settings:

1. Go to your Railway project dashboard
2. Navigate to the Variables tab
3. Add each variable with its corresponding value

## Security Notes

- ⚠️ **Never commit the `.env` file to version control**
- ⚠️ **Keep passwords secure and rotate them regularly**
- ⚠️ **Use strong, unique passwords for database access**
- ✅ The `.env` file should be included in `.gitignore`

## Database User Permissions

The `fv-index-reader` user should have the following permissions:
- `SELECT` on all tables in the `furryville` database
- No write permissions (INSERT, UPDATE, DELETE) for security

## Troubleshooting

### Connection Issues
If you encounter database connection errors:

1. Verify all environment variables are set correctly
2. Check that the database host is accessible
3. Ensure the password is correct
4. Verify the database name exists
5. Check that the `cryptography` package is installed (required for MySQL 8.0+ authentication)

### Railway-Specific Notes
- Use `mysql.railway.internal` as the DB_HOST for internal Railway MySQL connections
- External connections may require different host addresses and ports
- Railway automatically provides database credentials in the environment

## Environment Variable Validation

The application will fail to start if any required environment variables are missing. Check the console output for specific error messages about missing variables.
