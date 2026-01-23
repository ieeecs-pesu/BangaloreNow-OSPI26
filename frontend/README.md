# Bengaluru Map (Leaflet)

Leaflet replaces Google Maps for all map rendering. The map is fully bounded to Bengaluru district and uses OpenStreetMap tiles.

## Key behaviors
- Library: `react-leaflet` + `leaflet`; CSS loaded in `src/leaflet-custom.css`.
- Bounds: `bangaloreBounds` (SW `[12.75, 77.35]`, NE `[13.15, 77.85]`) set on `MapContainer.maxBounds` with `maxBoundsViscosity=1.0`, so panning/zoom stays inside the district. `minZoom=12` prevents zooming out beyond the city.
- Tiles: `TileLayer` uses `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with OSM attribution.
- Geolocation: On load, tries `navigator.geolocation`; if granted, the map recenters once with `map.flyTo(..., 14)`. If denied/unavailable, it stays on the default Bangalore center `[12.9716, 77.5946]`.
- User marker: A custom blue dot (`user-location-marker`) shows when a real user location is available.
- Events/markers: `MapStateProvider` fetches events and feeds them to `OptimizedMarker` (Leaflet `Marker` + `Popup` with the existing `MarkerInfoWindow`).

## How to adjust
- Change bounds: edit `bangaloreBounds` in `src/components/OptimizedMapComponent.jsx`.
- Allow wider zoom out: lower `minZoom` on `MapContainer`.
- Move away from Bengaluru-only: remove or relax `maxBounds`/`maxBoundsViscosity`.
- Use a different tile source: swap the `TileLayer.url` and attribution.

## Key files
- `src/components/OptimizedMapComponent.jsx` – Map container, bounds, geolocation, tile layer.
- `src/components/OptimizedMarker.jsx` – Leaflet markers and popups.
- `src/leaflet-custom.css` – Leaflet and marker styling.

## Component details
- OptimizedMapComponent: owns map center state, geolocation fetch, Bengaluru bounds, and renders `MapContainer` with `TileLayer`, `MapContent`, and `Navbar`. Applies `maxBounds` and `minZoom` to keep the view inside the city.

- MapContent: hooks into the Leaflet map, listens to drag/zoom via `useMapEvents`, updates shared bounds/zoom in `MapStateProvider`, draws the user location marker, and passes events to `OptimizedMarker`. Recenters once on user location via `flyTo` when permission is granted.

- MapStateProvider: central store for events, selection, loading flags, bounds, zoom, and fetch helpers (`fetchEvents`, `fetchEventDetails`). Exposes callbacks used by markers and the map to avoid prop drilling.

- OptimizedMarker: Leaflet `Marker` with custom HTML div icons. Shows a popup with `MarkerInfoWindow` when selected; supports cluster styling (currently clustering disabled upstream).

- MarkerInfoWindow: presentational popup for event details, including image preview, formatted date, and close button.

- leaflet-custom.css: imports Leaflet base CSS, sets dark background, tunes tile appearance, and styles user and event markers/popups.
