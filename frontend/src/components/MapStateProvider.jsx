import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getApiUrl, API_ENDPOINTS, buildSearchQuery } from '../lib/api.js';
import { MapStateContext } from './mapStateContext.js';

/**
 * Isolated state management for map interactions
 * Prevents cascading re-renders and prop drilling
 */
export function MapStateProvider({ children }) {
  // Core marker data - only changes on API calls
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [activeFilters, setActiveFilters] = useState(null);
  
  // User location for distance-based filtering
  const [userLocation, setUserLocation] = useState(null);
  
  // Selection state - isolated to prevent marker re-renders
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetailsCache, setEventDetailsCache] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Map movement state - completely isolated
  const [isMapMoving, setIsMapMoving] = useState(false);
  
  // Zoom tracking for clustering
  const [currentZoom, setCurrentZoom] = useState(12);
  
  // UI state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Refs to prevent state dependencies
  const mapBoundsRef = useRef(null);
  const lastRefreshBoundsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const hasInitialLoadRef = useRef(false);
  
  // Stable event processing - CLUSTERING DISABLED
  const processedEvents = useMemo(() => {
    // Use filtered events if filters are active, otherwise use all events
    const eventsToProcess = activeFilters ? filteredEvents : events;
    
    if (!eventsToProcess.length) {
      console.log('⚠️  No events to process');
      return [];
    }
    
    // Always return individual events without clustering
    const processed = eventsToProcess.map(event => ({
      ...event,
      position: { lat: Number(event.lat), lng: Number(event.long) },
      isCluster: false
    }));
    console.log('🎯 Processed events:', processed.length, 'markers', activeFilters ? '(filtered)' : '(all)');
    return processed;
  }, [events, filteredEvents, activeFilters]);
  
  // API functions
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      const url = getApiUrl(API_ENDPOINTS.GET_ALL_EVENTS);
      console.log('📍 Fetching events from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ Events fetched:', data.length, 'events');
      setEvents(data);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  
  const searchEvents = useCallback(async (filters) => {
    try {
      setIsLoadingEvents(true);
      const queryString = buildSearchQuery(filters);
      const url = `${getApiUrl(API_ENDPOINTS.SEARCH_EVENTS)}?${queryString}`;
      console.log('🔍 Searching events:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Filtered events:', data.length, 'events');
       setFilteredEvents(data);
       setActiveFilters(filters);
    } catch (error) {
      console.error('❌ Error searching events:', error);
      setFilteredEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  
  const clearFilters = useCallback(() => {
    setActiveFilters(null);
    setFilteredEvents([]);
  }, []);
  
  const fetchEventDetails = useCallback(async (eventId) => {
    if (eventDetailsCache[eventId]) {
      return eventDetailsCache[eventId];
    }
    
    try {
      setIsLoadingDetails(true);
      const apiUrl = getApiUrl(API_ENDPOINTS.GET_EVENT_DETAILS(eventId));
      console.log('🔍 Fetching event details from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Event details fetched successfully:', data);
      
      setEventDetailsCache(prev => ({ ...prev, [eventId]: data }));
      return data;
    } catch (error) {
      console.error('❌ Error fetching event details:', error);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  }, [eventDetailsCache]);
  
  // Marker interaction handlers - no state cascade
  const handleMarkerClick = useCallback(async (eventId, clusterData = null) => {
    console.log('🖱️ Marker clicked:', eventId, clusterData);
    
    setSelectedEventId(eventId);
    setIsLoadingDetails(true);
    
    // Fetch event details when marker is clicked
    try {
      console.log('📡 Fetching details for event:', eventId);
      await fetchEventDetails(eventId);
    } catch (error) {
      console.error('❌ Error loading event details:', error);
      setIsLoadingDetails(false);
    }
  }, [fetchEventDetails]);
  
  const handleInfoClose = useCallback(() => {
    setSelectedEventId(null);
    setIsLoadingDetails(false);
  }, []);
  
  // Bounds management without triggering marker updates
  const updateBounds = useCallback((bounds) => {
    mapBoundsRef.current = bounds;
    
    // Only refresh if this isn't the initial load
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      return;
    }
    
    // Debounced refresh check
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const lastBounds = lastRefreshBoundsRef.current;
      if (!lastBounds) {
        lastRefreshBoundsRef.current = bounds;
        return;
      }
      
      // Check if significant movement
      const latDiff = Math.abs(bounds.north - lastBounds.north);
      const lngDiff = Math.abs(bounds.east - lastBounds.east);
      
      if (latDiff > 0.02 || lngDiff > 0.02) {
        lastRefreshBoundsRef.current = bounds;
        if (!activeFilters) {
          fetchEvents();
        }
      }
    }, 3000); // 3 second debounce
  }, [fetchEvents, activeFilters]);

  // Zoom tracking for clustering
  const updateZoom = useCallback((zoom) => {
    setCurrentZoom(zoom);
  }, []);
  
  // Initialize data on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const value = {
    // Data
    events: processedEvents,
    isLoadingEvents,
    selectedEventId,
    selectedEventDetails: selectedEventId ? eventDetailsCache[selectedEventId] : null,
    isLoadingDetails,
    currentZoom,
    userLocation,
    setUserLocation,
    activeFilters,
    filteredEvents,
    
    // UI State
    showFilterPanel,
    setShowFilterPanel,
    
    // Actions
    fetchEvents,
    searchEvents,
    clearFilters,
    handleMarkerClick,
    handleInfoClose,
    updateBounds,
    setIsMapMoving,
    updateZoom,
    
    // State
    isMapMoving
  };
  
  return (
    <MapStateContext.Provider value={value}>
      {children}
    </MapStateContext.Provider>
  );
}
