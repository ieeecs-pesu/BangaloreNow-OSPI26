# API Response Examples

## Overview
This document shows example API responses for the event endpoints used by the map.

## 1. GET /api/get-all-events

### Endpoint
```
GET http://localhost:8000/api/get-all-events
```

### Purpose
Fetches all events with coordinates to display as markers on the map.

### Response Schema
```python
list[EventBase]
# Where EventBase contains:
{
  "id": int,
  "lat": float,
  "long": float
}
```

### Example Response
```json
[
  {
    "id": 1,
    "lat": 12.9716,
    "long": 77.5946
  },
  {
    "id": 2,
    "lat": 12.9789,
    "long": 77.6890
  },
  {
    "id": 3,
    "lat": 12.9352,
    "long": 77.6245
  },
  {
    "id": 4,
    "lat": 13.0827,
    "long": 80.2707
  }
]
```

### Response Details
- **Status**: 200 OK
- **Content-Type**: application/json
- **Count**: Varies based on database (filters: events with non-null name, lat, long)
- **Cached**: No
- **Time**: ~50-200ms depending on database size

### Filtering
Events are filtered to include only:
- Non-null `name`
- Non-null `lat` 
- Non-null `long`
- Within date range (optional, based on EVENT_DAYS_DELTA setting)

## 2. GET /api/get-event-details/{event_id}

### Endpoint
```
GET http://localhost:8000/api/get-event-details/1
```

### Purpose
Fetches complete event details to display in the popup when user clicks a marker.

### Response Schema
```python
EventDetails
{
  "id": int,
  "name": str,
  "description": str | None,
  "url": str | None,
  "image": str | None,
  "startDate": datetime | None,
  "endDate": datetime | None,
  "venue": str | None,
  "address": str | None,
  "lat": float,
  "long": float,
  "organizer": str | None
}
```

### Example Response
```json
{
  "id": 1,
  "lat": 12.9716,
  "long": 77.5946,
  "name": "TechConf 2025",
  "description": "A comprehensive conference covering the latest trends in technology, innovation, and digital transformation.",
  "startDate": "2025-02-15T09:00:00+00:00",
  "endDate": "2025-02-15T17:00:00+00:00",
  "url": "https://techconf2025.example.com",
  "image": "https://images.example.com/techconf.jpg",
  "venue": "Bangalore Convention Centre",
  "address": "123 Tech Park Road, Bangalore, Karnataka 560001",
  "organizer": "Tech Events India Pvt Ltd"
}
```

### Response Details
- **Status**: 200 OK
- **Content-Type**: application/json
- **Cached**: Yes (on frontend after first fetch for same event_id)
- **Time**: ~100-300ms

### With Missing Fields
Not all fields are required. Example with minimal data:

```json
{
  "id": 2,
  "lat": 12.9789,
  "long": 77.6890,
  "name": "Community Meetup",
  "description": null,
  "startDate": null,
  "endDate": null,
  "url": null,
  "image": null,
  "venue": null,
  "address": null,
  "organizer": null
}
```

In this case, the popup will show:
- Event name: "Community Meetup"
- Location: "Not provided"
- Organizer: "Not provided"
- Additional Info: "No additional details available"

## Error Responses

### 404 Not Found
```json
{
  "detail": "Event with ID 999 not found or missing required fields (name, lat, long)"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error retrieving event details: database connection failed"
}
```

## Complete Example Workflow

### Step 1: Load Map
Frontend calls:
```
GET /api/get-all-events
```
Response:
```json
[
  {"id": 1, "lat": 12.9716, "long": 77.5946},
  {"id": 2, "lat": 12.9789, "long": 77.6890},
  {"id": 3, "lat": 12.9352, "long": 77.6245}
]
```

Frontend renders 3 markers on the map.

### Step 2: User Clicks Marker #1
Frontend calls:
```
GET /api/get-event-details/1
```

Response:
```json
{
  "id": 1,
  "name": "TechConf 2025",
  "lat": 12.9716,
  "long": 77.5946,
  "description": "A comprehensive conference...",
  "startDate": "2025-02-15T09:00:00+00:00",
  "url": "https://techconf2025.example.com",
  "image": "https://images.example.com/techconf.jpg",
  "venue": "Bangalore Convention Centre",
  "address": "123 Tech Park Road, Bangalore, Karnataka 560001",
  "organizer": "Tech Events India Pvt Ltd"
}
```

Frontend displays popup with all this information.

### Step 3: User Clicks Marker #1 Again
Frontend uses cached data (no new API call).

### Step 4: User Clicks Marker #2
Frontend calls:
```
GET /api/get-event-details/2
```

Response:
```json
{
  "id": 2,
  "name": "Community Meetup",
  "lat": 12.9789,
  "long": 77.6890,
  "description": null,
  "startDate": null,
  "url": null,
  "image": null,
  "venue": null,
  "address": null,
  "organizer": null
}
```

Frontend displays popup with available data, showing fallback text for missing fields.

## Date/Time Format

### Input (from API)
ISO 8601 with timezone:
```
"2025-02-15T09:00:00+00:00"
```

### Output (in Popup)
User-friendly format:
```
Saturday, Feb 15, 2025 at 09:00 AM
```

### Formatting Code
```javascript
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${dayName}, ${datePart} at ${timePart}`;
};
```

## Response Headers

### Success (200)
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 256
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Date: Thu, 28 Jan 2025 12:30:45 GMT
```

### Error (404)
```
HTTP/1.1 404 Not Found
Content-Type: application/json
Content-Length: 95
Date: Thu, 28 Jan 2025 12:30:46 GMT
```

### Error (500)
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
Content-Length: 102
Date: Thu, 28 Jan 2025 12:30:47 GMT
```

## CORS Configuration

Frontend can make requests from:
```
http://localhost:3000
http://localhost:5173
http://localhost:8000
http://127.0.0.1:8000
```

(Configured in backend settings)

## Performance Notes

- **Get All Events**: O(n) - all events are returned regardless of visible map area
  - Possible optimization: Implement geohashing to return only events in visible bounds
  
- **Get Event Details**: O(1) - single event lookup by ID
  - Frontend caches results to avoid duplicate requests
  - Currently no expiration on cache (stays for session)

- **Response Size**: 
  - All events: ~20-100 bytes per event
  - Single event: ~500-2000 bytes depending on description length

## Testing with curl

### Get all events
```bash
curl http://localhost:8000/api/get-all-events
```

### Get event details
```bash
curl http://localhost:8000/api/get-event-details/1
```

### Pretty print JSON
```bash
curl http://localhost:8000/api/get-all-events | python -m json.tool
```

### With verbose output
```bash
curl -v http://localhost:8000/api/get-event-details/1
```

## Database Query Examples

To verify what data is available:

### Count events with coordinates
```sql
SELECT COUNT(*) FROM events 
WHERE lat IS NOT NULL 
AND long IS NOT NULL 
AND name IS NOT NULL;
```

### See sample events
```sql
SELECT id, name, lat, long, venue, organizer 
FROM events 
WHERE lat IS NOT NULL 
AND long IS NOT NULL 
LIMIT 5;
```

### Check date range
```sql
SELECT id, name, "startDate", "endDate"
FROM events 
WHERE lat IS NOT NULL 
AND long IS NOT NULL 
ORDER BY "startDate" DESC
LIMIT 5;
```
