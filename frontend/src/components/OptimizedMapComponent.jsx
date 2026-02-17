import React, { useEffect, useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapStateProvider } from './MapStateProvider.jsx';
import { useMapState } from './mapStateContext.js';
import OptimizedMarker from './OptimizedMarker.jsx';
import MapErrorBoundary from './MapErrorBoundary.jsx';
import Navbar from './Navbar.jsx';
import { FilterPanel } from './FilterPanel.jsx';
import { FilterStatusBar } from './FilterStatusBar.jsx';
import '../leaflet-custom.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Loading component
const LoadingOverlay = ({ isGettingLocation, locationPermissionDenied, isMapLoaded }) => {
  if (isMapLoaded && !isGettingLocation) return null;

  const getLoadingMessage = () => {
    if (isGettingLocation) {
      return locationPermissionDenied 
        ? 'Using default location (Bangalore)'
        : 'Getting your location...';
    }
    return 'Loading map...';
  };

  const getSubMessage = () => {
    if (isGettingLocation && !locationPermissionDenied) {
      return 'Please allow location access to center the map around you';
    }
    if (isGettingLocation && locationPermissionDenied) {
      return 'Location access denied - showing Bangalore';
    }
    return 'Please wait...';
  };

  return (
    <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-50" style={{ pointerEvents: 'all' }}>
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-foreground font-medium">{getLoadingMessage()}</p>
        <p className={`text-sm ${locationPermissionDenied ? 'text-yellow-500' : 'text-muted-foreground'}`}>
          {getSubMessage()}
        </p>
      </div>
    </div>
  );
};

// Inner map component with access to map instance and events
const MapContent = ({ userLocation, showUserMarker, shouldCenterOnUser }) => {
  const map = useMap();
  const {
    events,
    isLoadingEvents,
    selectedEventId,
    selectedEventDetails,
    isLoadingDetails,
    currentZoom,
    handleMarkerClick,
    handleInfoClose,
    updateBounds,
    setIsMapMoving,
    updateZoom
  } = useMapState();

  const dragTimeoutRef = useRef(null);
  const zoomTimeoutRef = useRef(null);
  const hasRecenteredRef = useRef(false);

  // Center map on user location when it's obtained
  useEffect(() => {
    if (map && shouldCenterOnUser && !hasRecenteredRef.current) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, {
        duration: 1.5
      });
      hasRecenteredRef.current = true;
    }
  }, [map, userLocation, shouldCenterOnUser]);

  // Handle bounds changes
  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    
    const bounds = map.getBounds();
    if (bounds) {
      const boundsObj = {
        // ai: getNorth(), getSouth(), etc.
        north: bounds.getNorthEast().lat,
        south: bounds.getSouthWest().lat,
        east: bounds.getNorthEast().lng,
        west: bounds.getSouthWest().lng
      };
      
      updateBounds(boundsObj);
    }
  }, [map, updateBounds]);

  // Map event handlers
  useMapEvents({
    dragstart: () => {
      setIsMapMoving(true);
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    },
    dragend: () => {
      dragTimeoutRef.current = setTimeout(() => {
        setIsMapMoving(false);
        handleBoundsChanged();
      }, 500);
    },
    zoomstart: () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    },
    zoomend: () => {
      zoomTimeoutRef.current = setTimeout(() => {
        const newZoom = map.getZoom();
        updateZoom(newZoom);
        handleBoundsChanged();
      }, 300);
    },
  });

  // Initial bounds setup
  useEffect(() => {
    if (map) {
      handleBoundsChanged();
    }
    
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [map, handleBoundsChanged]);

  // Create custom user location icon
  const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <>
      {/* User location marker */}
      {showUserMarker && userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          title="Your Location"
          zIndexOffset={999}
        />
      )}
      
      {/* Render event markers */}
      {!isLoadingEvents && events.map((event) => (
        <OptimizedMarker
          key={event.id}
          position={event.position}
          eventId={event.id}
          isSelected={selectedEventId === event.id}
          eventDetails={selectedEventDetails}
          isLoadingDetails={isLoadingDetails}
          onMarkerClick={handleMarkerClick}
          onInfoClose={handleInfoClose}
        />
      ))}
    </>
  );
};

// Main component
const OptimizedMapComponent = () => {
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default to Bangalore [lat, lng]
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);

  // Get user's current location on initial load
  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        setIsGettingLocation(false);
        setIsMapLoaded(true);
        return;
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 300000, // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          setMapCenter(userLocation);
          setUserCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsGettingLocation(false);
          setIsMapLoaded(true);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermissionDenied(true);
              break;
            case error.POSITION_UNAVAILABLE:
              break;
            case error.TIMEOUT:
              break;
            default:
              break;
          }
          
          // Fall back to default Bangalore location
          setIsGettingLocation(false);
          setIsMapLoaded(true);
        },
        options
      );
    };

    getUserLocation();
  }, []);
  
  // Bangalore city boundaries
  const bangaloreBounds = [
    [12.75, 77.35], // Southwest
    [13.15, 77.85]  // Northeast
  ];

  return (
    <MapStateProvider>
      <MapContentWrapper 
        mapCenter={mapCenter}
        bangaloreBounds={bangaloreBounds}
        isGettingLocation={isGettingLocation}
        locationPermissionDenied={locationPermissionDenied}
        isMapLoaded={isMapLoaded}
        setIsMapLoaded={setIsMapLoaded}
        userCoordinates={userCoordinates}
      />
    </MapStateProvider>
  );
}

// Wrapper to access MapState context
const MapContentWrapper = ({ 
  mapCenter, 
  bangaloreBounds, 
  isGettingLocation, 
  locationPermissionDenied, 
  isMapLoaded,
  setIsMapLoaded,
  userCoordinates
}) => {
  const {
    showFilterPanel,
    setShowFilterPanel,
    searchEvents,
    clearFilters,
    userLocation,
    filteredEvents,
    activeFilters,
    handleMarkerClick,
    setUserLocation
  } = useMapState();

  useEffect(() => {
    if (userCoordinates?.lat && userCoordinates?.lng) {
      setUserLocation(userCoordinates);
    }
  }, [userCoordinates, setUserLocation]);

  const handleFilterChange = (filters) => {
    console.log('🔍 Filter change requested:', filters);
    searchEvents(filters);
  };

  const handleClearFilters = () => {
    console.log('🧹 Clearing filters');
    clearFilters();
    setShowFilterPanel(false);
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative" style={{ pointerEvents: 'auto' }}>
      <MapErrorBoundary>
        <LoadingOverlay 
          isGettingLocation={isGettingLocation}
          locationPermissionDenied={locationPermissionDenied}
          isMapLoaded={isMapLoaded}
        />
        <MapContainer
          center={mapCenter}
          zoom={14}
          minZoom={11}
          maxZoom={20}
          zoomControl={true}
          className="w-full h-full"
          style={{ pointerEvents: 'auto' }}
          maxBounds={bangaloreBounds}
          maxBoundsViscosity={1.0}
          whenReady={() => setIsMapLoaded(true)}
        >
          {/* OpenStreetMap tiles - dark theme */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapContent 
            userLocation={{ lat: mapCenter[0], lng: mapCenter[1] }}
            showUserMarker={!isGettingLocation && !locationPermissionDenied && (mapCenter[0] !== 12.9716 || mapCenter[1] !== 77.5946)}
            shouldCenterOnUser={!isGettingLocation && !locationPermissionDenied && (mapCenter[0] !== 12.9716 || mapCenter[1] !== 77.5946)}
          />
        </MapContainer>
        
        {/* Filter Panel */}
        {showFilterPanel && (
          <FilterPanel
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilterPanel(false)}
            userLocation={userLocation}
            activeFilters={activeFilters}
          />
        )}

        {/* Filter Status Bar */}
        {activeFilters && (
          <FilterStatusBar
            filters={activeFilters}
            eventCount={filteredEvents.length}
            onClear={handleClearFilters}
          />
        )}
        
        <Navbar />
      </MapErrorBoundary>
    </div>
  );
}

export default OptimizedMapComponent;
