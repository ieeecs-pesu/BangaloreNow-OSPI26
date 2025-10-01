import React, { useEffect, useCallback, useRef, useState } from 'react';
import { APIProvider, Map, Marker, useMap, useApiLoadingStatus, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { MapStateProvider, useMapState } from './MapStateProvider.jsx';
import OptimizedMarker from './OptimizedMarker.jsx';
import MapErrorBoundary from './MapErrorBoundary.jsx';
import Navbar from './Navbar.jsx';
import { ENV } from '../lib/api.js';

// Loading component
const LoadingOverlay = ({ isGettingLocation, locationPermissionDenied }) => {
  const apiLoadingStatus = useApiLoadingStatus();
  const apiIsLoaded = useApiIsLoaded();

  if (apiIsLoaded && !isGettingLocation) return null;

  const getLoadingMessage = () => {
    if (isGettingLocation) {
      return locationPermissionDenied 
        ? 'Using default location (Bangalore)'
        : 'Getting your location...';
    }
    
    switch (apiLoadingStatus) {
      case 'LOADING':
        return 'Loading Google Maps...';
      case 'LOADED':
        return 'Maps loaded, initializing...';
      case 'FAILED':
        return 'Failed to load Maps - Check API key';
      default:
        return 'Initializing...';
    }
  };

  const getSubMessage = () => {
    if (isGettingLocation && !locationPermissionDenied) {
      return 'Please allow location access to center the map around you';
    }
    if (isGettingLocation && locationPermissionDenied) {
      return 'Location access denied - showing Bangalore';
    }
    if (apiLoadingStatus === 'LOADING') {
      return 'Please wait while we load the map...';
    }
    if (apiLoadingStatus === 'FAILED') {
      return 'Please check your internet connection and API key';
    }
    return null;
  };

  return (
    <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-50" style={{ pointerEvents: 'all' }}>
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-foreground font-medium">{getLoadingMessage()}</p>
        {getSubMessage() && (
          <p className={`text-sm ${locationPermissionDenied ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {getSubMessage()}
          </p>
        )}
        {apiLoadingStatus === 'FAILED' && (
          <p className="text-red-500 text-sm">Please check your internet connection and API key</p>
        )}
      </div>
    </div>
  );
};

// Inner map component with access to map instance
const MapContent = ({ userLocation, showUserMarker }) => {
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

  // Handle cluster expansion with proper centering - COMMENTED OUT TO DISABLE CLUSTERING
  // const handleClusterExpansion = useCallback(async (eventId, clusterData) => {
  //   const result = await handleMarkerClick(eventId, clusterData);
  //   
  //   if (result?.action === 'expandCluster' && map) {
  //     const cluster = result.data;
  //     
  //     if (!cluster.events || cluster.events.length === 0) {
  //       console.error('❌ No events in cluster');
  //       return;
  //     }
  //     
  //     // Create bounds from cluster events
  //     const bounds = new window.google.maps.LatLngBounds();
  //     let validEvents = 0;
  //     
  //     cluster.events.forEach(event => {
  //       const lat = Number(event.lat);
  //       const lng = Number(event.long);
  //       if (!isNaN(lat) && !isNaN(lng)) {
  //         bounds.extend(new window.google.maps.LatLng(lat, lng));
  //         validEvents++;
  //       }
  //     });
  //     
  //     if (validEvents === 0) {
  //       console.error('❌ No valid coordinates in cluster');
  //       return;
  //     }
  //     
  //     // Calculate center of cluster
  //     const center = bounds.getCenter();
  //     
  //     // Zoom aggressively to break clusters apart
  //     const currentZoom = map.getZoom();
  //     const targetZoom = Math.max(14, currentZoom + 3); // Ensure we reach zoom 14+ to disable clustering
  //     
  //     map.setCenter(center);
  //     map.setZoom(targetZoom);
  //   }
  // }, [handleMarkerClick, map]);

  // Optimized bounds handling - no marker refresh triggers
  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    
    const bounds = map.getBounds();
    if (bounds) {
      const boundsObj = {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      };
      
      updateBounds(boundsObj);
    }
  }, [map, updateBounds]);

  // Movement handlers that don't affect markers
  const handleDragStart = useCallback(() => {
    setIsMapMoving(true);
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, [setIsMapMoving]);

  const handleDragEnd = useCallback(() => {
    dragTimeoutRef.current = setTimeout(() => {
      setIsMapMoving(false);
      handleBoundsChanged();
    }, 500);
  }, [setIsMapMoving, handleBoundsChanged]);

  const handleZoomChanged = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    zoomTimeoutRef.current = setTimeout(() => {
      const newZoom = map.getZoom();
      updateZoom(newZoom);
      handleBoundsChanged();
    }, 300);
  }, [map, updateZoom, handleBoundsChanged]);

  // Add click handler for testing
  const handleMapClick = useCallback((event) => {
    // Map click handler
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!map) return;
    
    const dragStartListener = map.addListener('dragstart', handleDragStart);
    const dragEndListener = map.addListener('dragend', handleDragEnd);
    const zoomChangedListener = map.addListener('zoom_changed', handleZoomChanged);
    const clickListener = map.addListener('click', handleMapClick);
    
    // Initial bounds setup
    const idleListener = map.addListener('idle', () => {
      google.maps.event.removeListener(idleListener);
      handleBoundsChanged();
    });
    
    return () => {
      google.maps.event.removeListener(dragStartListener);
      google.maps.event.removeListener(dragEndListener);
      google.maps.event.removeListener(zoomChangedListener);
      google.maps.event.removeListener(clickListener);
      
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [map, handleDragStart, handleDragEnd, handleZoomChanged, handleMapClick, handleBoundsChanged]);

  return (
    <>
      {/* User location marker */}
      {showUserMarker && userLocation && window.google?.maps && (
        <Marker
          position={userLocation}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285f4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 8
          }}
          title="Your Location"
          zIndex={999}
        />
      )}
      
      {/* Render markers - completely isolated from state changes */}
      {!isLoadingEvents && events.map((event) => (
        <OptimizedMarker
          key={event.id}
          position={event.position}
          eventId={event.id}
          isSelected={selectedEventId === event.id}
          eventDetails={selectedEventDetails}
          isLoadingDetails={isLoadingDetails}
          onMarkerClick={handleMarkerClick} // Direct marker click without clustering
          onInfoClose={handleInfoClose}
          // Clustering disabled - commented out cluster props
          // isCluster={event.isCluster}
          // clusterCount={event.count}
          // clusterData={event}
        />
      ))}
    </>
  );
};

// Main component
const OptimizedMapComponent = () => {
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Default to Bangalore
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  // Get user's current location on initial load
  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        setIsGettingLocation(false);
        return;
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMapCenter(userLocation);
          setIsGettingLocation(false);
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
        },
        options
      );
    };

    getUserLocation();
  }, []);
  
  // Bangalore city boundaries - adjust based on user location
  const isUserInBangalore = mapCenter.lat >= 12.75 && mapCenter.lat <= 13.15 && 
                           mapCenter.lng >= 77.35 && mapCenter.lng <= 77.85;
                           
  const bangaloreBounds = {
    north: 13.15,
    south: 12.75,
    east: 77.85,
    west: 77.35
  };
  
  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
    },
    gestureHandling: 'greedy', // This should allow drag and zoom
    backgroundColor: 'rgb(17, 24, 39)',
    // Removed styles property - not compatible with mapId
    tilt: 0, // Disable 3D tilt for faster rendering
    // Only restrict to Bangalore if user is in Bangalore or location was denied
    restriction: (isUserInBangalore || locationPermissionDenied) ? {
      latLngBounds: bangaloreBounds,
      strictBounds: false
    } : undefined,
    renderingType: 'RASTER', // Use raster tiles for faster loading
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    draggable: true,  // Explicitly enable dragging
    scrollwheel: true, // Explicitly enable scroll wheel zoom
    doubleClickZoom: true, // Enable double click zoom
    minZoom: 8,  // Reduced from 10 to allow more zoom out
    maxZoom: 20
  };

  return (
    <MapStateProvider>
      <div className="w-full h-screen bg-gray-900 relative" style={{ pointerEvents: 'auto' }}>
        <APIProvider 
          apiKey={ENV.GOOGLE_MAPS_API_KEY}
          libraries={['marker', 'geometry']}
        >
          <MapErrorBoundary>
            <LoadingOverlay 
              isGettingLocation={isGettingLocation}
              locationPermissionDenied={locationPermissionDenied}
            />
            <Map
              defaultCenter={mapCenter}
              defaultZoom={14}
              options={mapOptions}
              className="w-full h-full"
              mapId={ENV.GOOGLE_MAPS_MAP_ID}
              colorScheme="DARK"
              style={{ pointerEvents: 'auto' }}
            >
              <MapContent 
                userLocation={mapCenter}
                showUserMarker={!isGettingLocation && !locationPermissionDenied && (mapCenter.lat !== 12.9716 || mapCenter.lng !== 77.5946)}
              />
            </Map>
            <Navbar />
          </MapErrorBoundary>
        </APIProvider>
      </div>
    </MapStateProvider>
  );
};

export default OptimizedMapComponent;