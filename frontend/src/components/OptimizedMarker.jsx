import React, { useCallback, useState, memo, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import MarkerInfoWindow from "./MarkerInfoWindow.jsx";

/**
 * Highly optimized marker component for Leaflet
 */
const OptimizedMarker = memo(({ 
  position, 
  eventId, 
  isSelected, 
  eventDetails, 
  isLoadingDetails, 
  onMarkerClick, 
  onInfoClose,
  isCluster = false,
  clusterCount = 0,
  clusterData = null,
  currentZoom = 8
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (onMarkerClick) {
      onMarkerClick(eventId, clusterData);
    }
  }, [eventId, onMarkerClick, clusterData]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Create custom marker icon
  const markerIcon = useMemo(() => {
    if (isCluster) {
      // Cluster marker
      return L.divIcon({
        className: 'cluster-marker',
        html: `
          <div style="
            width: ${Math.min(40 + clusterCount * 2, 60)}px;
            height: ${Math.min(40 + clusterCount * 2, 60)}px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            font-weight: bold;
            color: white;
            font-size: 16px;
          ">
            ${clusterCount}
          </div>
        `,
        iconSize: [Math.min(40 + clusterCount * 2, 60), Math.min(40 + clusterCount * 2, 60)],
        iconAnchor: [Math.min(20 + clusterCount, 30), Math.min(20 + clusterCount, 30)],
      });
    } else {
      // Single event marker
      const scale = isSelected ? 1.2 : (isHovered ? 1.1 : 1);
      const baseSize = 36;
      const size = baseSize * scale;
      
      return L.divIcon({
        className: 'event-marker',
        html: `
          <div class="event-marker-pin" style="
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          ">
            <div class="event-marker-inner" style="color: white; font-size: 16px;">
              📍
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    }
  }, [isCluster, clusterCount, isSelected, isHovered]);

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={markerIcon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseEnter,
        mouseout: handleMouseLeave,
      }}
      zIndexOffset={isSelected ? 1000 : 100}
    >
      {isSelected && (
        <Popup
          closeButton={false}
          autoClose={false}
          closeOnClick={false}
          className="custom-popup"
          maxWidth={500}
          minWidth={280}
        >
          <MarkerInfoWindow
            event={eventDetails}
            onClose={onInfoClose}
            isLoading={isLoadingDetails}
            isCached={false}
          />
        </Popup>
      )}
    </Marker>
  );
});

// Strict equality check for memoization - only re-render when absolutely necessary
OptimizedMarker.displayName = 'OptimizedMarker';

export default OptimizedMarker;