# Database Setup

## Initialize Database

Run this in your Neon database console or via psql:

```bash
psql $DATABASE_URL < schema.sql
```

Or in the Neon web console, copy and paste the contents of `schema.sql`.

## Database Structure

### Clients Table
- Stores all client/family information
- Uses JSONB for flexible assessment tracking
- Automatically tracks created_at and updated_at timestamps

### Assessments Format (JSONB)
```json
{
  "base_intake": "2025-04-10T00:00:00.000Z",
  "base_sniff": "2025-04-27T00:00:00.000Z",
  "6mo_asq3": "2025-09-30T00:00:00.000Z",
  ...
}
```

## Indexes
- Optimized for date-based queries
- GIN index on JSONB for assessment searches
- Foreign key index for linked siblings
