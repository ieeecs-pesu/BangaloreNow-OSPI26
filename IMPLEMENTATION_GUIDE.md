# Event Map Implementation Guide

## Overview
Events with latitude and longitude coordinates are now rendered on the Leaflet map. When users click on event markers, a detailed popup displays event information in a structured layout matching your design mockup.

## Architecture

### Data Flow
```
Backend Database → API Endpoints → Frontend State → Map Markers → Popup on Click
```

## Components

### 1. Backend (FastAPI)

#### API Endpoints
- **GET `/api/get-all-events`**: Returns all events with coordinates
  - Response: `EventBase[]` containing `id`, `lat`, `long`
  - Filters: Only includes events with non-null lat/long and name
  - File: [backend/app/api/routes/events.py](backend/app/api/routes/events.py)

- **GET `/api/get-event-details/{event_id}`**: Returns full event details
  - Response: `EventDetails` with all fields (name, description, venue, address, organizer, etc.)
  - File: [backend/app/api/routes/events.py](backend/app/api/routes/events.py)

#### Database Model
- File: [backend/app/model.py](backend/app/model.py)
- Required fields: `id`, `name`, `lat`, `long`
- Optional fields: `description`, `url`, `image`, `startDate`, `endDate`, `venue`, `address`, `organizer`

### 2. Frontend (React + Leaflet)

#### Map Component: OptimizedMapComponent.jsx
- [frontend/src/components/OptimizedMapComponent.jsx](frontend/src/components/OptimizedMapComponent.jsx)
- Initializes the Leaflet map centered on Bangalore
- Gets user's current location (with fallback to Bangalore)
- Renders map container with event markers

**Key Features:**
- User location detection with geolocation API
- Default Bangalore bounds (12.75-13.15 lat, 77.35-77.85 lng)
- Interactive map with zoom and pan capabilities
- Loading overlay while fetching location/events

#### State Management: MapStateProvider.jsx
- [frontend/src/components/MapStateProvider.jsx](frontend/src/components/MapStateProvider.jsx)
- Manages: events data, selected event, loading states, map bounds
- Handles: API calls, marker clicks, popup toggling
- Caches event details after first fetch

**Key Functions:**
- `fetchEvents()`: Retrieves all events with coordinates from backend
- `fetchEventDetails(eventId)`: Gets detailed info for selected event (with caching)
- `handleMarkerClick()`: Called when user clicks a marker
- `handleInfoClose()`: Closes the popup

#### Marker Component: OptimizedMarker.jsx
- [frontend/src/components/OptimizedMarker.jsx](frontend/src/components/OptimizedMarker.jsx)
- Individual event marker with custom icon
- Shows popup on click
- Scales on hover/selection

**Features:**
- Custom blue event marker icon (36px)
- Selected marker scales to 1.2x
- Hovered marker scales to 1.1x
- High z-index when selected (1000) for visibility

#### Popup Component: MarkerInfoWindow.jsx
- [frontend/src/components/MarkerInfoWindow.jsx](frontend/src/components/MarkerInfoWindow.jsx)
- **NEW**: Completely redesigned layout matching your mockup
- Two-column layout on desktop, stacked on mobile

**Layout Structure:**

```
┌─────────────────────────────────────┐
│            Close Button             │
├────────────────┬────────────────────┤
│  EVENT NAME    │ ORGANIZER DETAILS  │
│  (Box)         │ (Box)              │
├────────────────┼────────────────────┤
│ LOCATION &     │ ADDITIONAL INFO    │
│ DATE/DAY       │ (Description)      │
│ (Box)          │ (Box)              │
├────────────────────────────────────┤
│         EVENT IMAGE (Optional)      │
│         Full Width, Clickable       │
└────────────────────────────────────┘
```

**Fields Displayed:**
- **Event Name**: Clickable if URL exists
- **Location**: Venue name + address with 📍 icon
- **Date/Day**: Formatted as "Thursday, Jan 28, 2025 at 02:30 PM" with 📅 icon
- **Organizer Details**: Organizer name or "Not provided"
- **Additional Info**: Event description or "No additional details available"
- **Image**: Clickable to expand in full-screen modal

### 3. API Layer

#### API Configuration: lib/api.js
- [frontend/src/lib/api.js](frontend/src/lib/api.js)
- Base URL: `http://127.0.0.1:8000` (configurable via `VITE_API_BASE_URL`)
- Endpoints:
  - `GET_ALL_EVENTS`: `/api/get-all-events`
  - `GET_EVENT_DETAILS(eventId)`: `/api/get-event-details/{eventId}`

## User Interaction Flow

### 1. Map Loads
1. OptimizedMapComponent initializes
2. MapStateProvider fetches all events via `GET /api/get-all-events`
3. Events are processed to convert lat/long to map coordinates
4. Each event is rendered as a marker on the map

### 2. User Sees Markers
- Blue circular markers (📍) appear at event locations
- Marker size: 36px (scales on hover/selection)
- Each marker is clickable

### 3. User Clicks Marker
1. `onMarkerClick` handler is triggered
2. Event is marked as selected
3. `fetchEventDetails(eventId)` is called
4. Loading spinner appears in popup
5. Event details are fetched from backend
6. Popup displays structured information

### 4. User Closes Popup
- Click the × button in top-right
- Click outside the popup (optional)
- `onInfoClose` handler deselects event
- Popup disappears

### 5. User Clicks Event Image
- Image preview modal opens
- Click outside or × button to close
- Full-screen view of event image

## Styling

### CSS Classes
- `.event-marker`: Base marker class
- `.event-marker-pin`: Marker icon container
- `.marker-info-window`: Popup container
- `.image-preview-backdrop`: Full-screen image modal

### CSS Variables (from theme)
- `--marker-background`: Popup background
- `--marker-border`: Border colors
- `--marker-surface`: Box backgrounds
- `--marker-text-primary`: Main text color
- `--marker-text-secondary`: Secondary text color
- `--marker-text-muted`: Muted text color
- `--marker-accent`: Highlight color (blue)

## Responsive Design

### Desktop (lg and above)
- Two-column layout with organized boxes
- Event image below in full width
- Popup max width: 580px

### Mobile (below lg)
- Single column, stacked layout
- Touch-friendly spacing
- Full-width responsive popup
- Image smaller but still visible

## Error Handling

### API Failures
- Events that fail to fetch: Log error, continue
- Event details that fail: Show "Failed to load event details"
- Missing coordinates: Events filtered out at backend

### Missing Data
- Missing name/lat/long: Event excluded
- Missing optional fields: Display "Not provided" or fallback text
- Missing image: Image section hidden
- Missing date: Date section hidden

## Configuration

### Environment Variables (Frontend)
```javascript
VITE_API_BASE_URL=http://127.0.0.1:8000  // Backend API URL
VITE_GOOGLE_MAPS_API_KEY=...              // (Not used, using Leaflet instead)
VITE_GOOGLE_MAPS_MAP_ID=...               // (Not used, using Leaflet instead)
```

### Backend Configuration
- Database connection configured in [backend/app/core/config.py](backend/app/core/config.py)
- Event filtering settings in config
- Date delta for future events

## Testing the Implementation

### 1. Ensure Database has Events
```bash
# Check database has events with lat/long
SELECT id, name, lat, long FROM events LIMIT 5;
```

### 2. Test Backend API
```bash
# Get all events
curl http://127.0.0.1:8000/api/get-all-events

# Get specific event details
curl http://127.0.0.1:8000/api/get-event-details/1
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Verify Functionality
1. Map loads with event markers
2. Markers appear at correct locations
3. Clicking marker shows popup
4. Popup displays all event information
5. Image is clickable and shows in modal
6. Close button hides popup
7. Map remains interactive

## Files Modified/Created

### Modified
- [frontend/src/components/MarkerInfoWindow.jsx](frontend/src/components/MarkerInfoWindow.jsx) - Complete redesign with new layout

### Existing (No changes needed)
- [frontend/src/components/OptimizedMapComponent.jsx](frontend/src/components/OptimizedMapComponent.jsx)
- [frontend/src/components/OptimizedMarker.jsx](frontend/src/components/OptimizedMarker.jsx)
- [frontend/src/components/MapStateProvider.jsx](frontend/src/components/MapStateProvider.jsx)
- [backend/app/api/routes/events.py](backend/app/api/routes/events.py)
- [backend/app/crud.py](backend/app/crud.py)
- [backend/app/schemas.py](backend/app/schemas.py)
- [backend/app/model.py](backend/app/model.py)

## Next Steps (Optional Enhancements)

1. **Marker Clustering**: Cluster nearby markers at lower zoom levels
2. **Search/Filter**: Allow users to filter events by category
3. **Directions**: Add routing to selected event location
4. **Favorites**: Let users save favorite events
5. **Real-time Updates**: WebSocket connection for live event updates
6. **Event Details Page**: Link popup to detailed event page
7. **Share Event**: Add share button in popup
