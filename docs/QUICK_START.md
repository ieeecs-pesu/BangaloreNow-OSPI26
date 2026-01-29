# Quick Start Guide - Event Map with Popups

## 🎯 What You Now Have

Your event map now displays all events with latitude and longitude coordinates from the database as interactive markers. When users click on a marker, a beautiful popup shows:
- Event name
- Location (venue + address)
- Date and time
- Organizer details
- Event description/additional info
- Event image (if available)

All laid out exactly as your mockup specified.

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd /home/sairishi/Sai_Rishi/GitClonedRepos/BangaloreNow-OSPI26/backend

# Install dependencies (if not done)
pip install -r requirements.txt

# Run the backend
python -m uvicorn app.main:app --reload
```

Backend will be available at: `http://127.0.0.1:8000`

### 2. Start the Frontend
```bash
cd /home/sairishi/Sai_Rishi/GitClonedRepos/BangaloreNow-OSPI26/frontend

# Install dependencies (if not done)
npm install

# Run the frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173` (or similar)

### 3. View the Map
1. Open your browser to `http://localhost:5173`
2. You should see a map centered on Bangalore
3. Blue markers (📍) will show event locations
4. Click any marker to see the event popup

## 📋 What Happens Step-by-Step

### When the page loads:
1. Map initializes and requests your location (with permission)
2. Frontend fetches all events from `GET /api/get-all-events`
3. Each event becomes a marker on the map at its lat/long
4. Map centers on your location or defaults to Bangalore

### When you click a marker:
1. The marker highlights and scales up
2. A popup appears with a loading spinner
3. Frontend fetches event details from `GET /api/get-event-details/{eventId}`
4. Popup fills in with all the event information
5. Event image (if any) is clickable to expand

### When you click the X button:
1. Popup closes
2. Marker returns to normal size
3. Map is ready for another click

## 🎨 The Popup Layout

The popup has 4 main sections (plus optional image):

```
┌─────────────┬──────────────┐
│ Event Name  │   Organizer  │
├─────────────┼──────────────┤
│  Location   │   More Info  │
│  & Date     │ (Description)│
└─────────────┴──────────────┘
      Full Width Image (below)
```

**On mobile:** These stack vertically instead of side-by-side.

## 🔍 Testing Your Data

### Check if your database has events:
```bash
cd backend
python -c "
from app.core.db import SessionLocal
from app.model import Event

db = SessionLocal()
events = db.query(Event).filter(Event.lat.isnot(None), Event.long.isnot(None)).limit(5).all()
for e in events:
    print(f'{e.id}: {e.name} ({e.lat}, {e.long})')
"
```

### Test the API directly:
```bash
# Get all events
curl http://localhost:8000/api/get-all-events

# Get details of event #1
curl http://localhost:8000/api/get-event-details/1
```

You should see JSON with event data including lat/long coordinates.

## 🛠️ Customization

### Change the Default Map Center
File: `frontend/src/components/OptimizedMapComponent.jsx` (line ~240)
```javascript
const bangaloreBounds = [
  [12.75, 77.35], // Southwest
  [13.15, 77.85]  // Northeast
];
```

### Change the Marker Color
File: `frontend/src/components/OptimizedMarker.jsx` (line ~40)
```javascript
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);  // Blue
// Change to: #10b981 (green), #ef4444 (red), etc.
```

### Change Popup Styling
File: `frontend/src/components/MarkerInfoWindow.jsx`
- Search for CSS variables like `--marker-background`, `--marker-accent`
- These are defined in your theme/CSS

### Add More Fields to Popup
The popup displays these fields from the Event model:
- name, description, venue, address, organizer
- startDate, endDate
- image, url

To add more:
1. Add field to backend `EventDetails` schema
2. Update database model if needed
3. Update popup JSX to display the field

## 🐛 Troubleshooting

### No markers appearing?
1. Check backend is running: `curl http://localhost:8000/api/get-all-events`
2. Check if events have lat/long values in database
3. Check browser console for errors (F12 → Console tab)
4. Check backend console for errors

### Popup shows error "Failed to load event details"?
1. Check network tab in browser dev tools (F12 → Network)
2. See if `GET /api/get-event-details/{id}` request is failing
3. Check backend console for SQL errors
4. Ensure event with that ID exists in database

### Markers visible but not clickable?
1. Try zooming in/out
2. Check if map is responding to clicks elsewhere
3. Verify JavaScript is enabled in browser
4. Check browser console for errors

### Popup won't close?
- Click the × button (should be top right of popup)
- Click elsewhere on the map to deselect

### Image not showing in popup?
1. Check if URL is valid: open it in new tab
2. Check browser console for CORS errors
3. Ensure image URL is complete (not relative path)
4. Some image hosts might block inline loading

## 📚 Files You Modified

Only this file was updated for the new design:
- `frontend/src/components/MarkerInfoWindow.jsx` - Complete redesign of the event popup

All other components already existed and didn't need changes.

## 🔗 Related Documentation

See these files for more details:
- `IMPLEMENTATION_GUIDE.md` - Complete architecture and how everything works
- `POPUP_DESIGN_GUIDE.md` - Visual design details and responsive behavior
- `frontend/src/components/MapStateProvider.jsx` - State management
- `frontend/src/components/OptimizedMapComponent.jsx` - Map initialization
- `backend/app/api/routes/events.py` - API endpoints

## ✅ Checklist

- [ ] Backend is running on http://localhost:8000
- [ ] Frontend is running on http://localhost:5173 (or similar)
- [ ] Database has events with lat/long values
- [ ] Map loads without errors
- [ ] Markers appear on map
- [ ] Clicking marker shows popup
- [ ] Popup displays all event information
- [ ] Closing popup works properly
- [ ] Image is clickable (if event has image)

## 🎉 You're All Set!

Your event map is now fully functional! Users can:
✓ See all events on a map
✓ Click markers to view event details
✓ See location, time, organizer info
✓ View event images
✓ Click event name to visit event URL (if provided)

Enjoy! 🗺️📍
