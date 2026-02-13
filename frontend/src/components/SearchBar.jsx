import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Calendar, Navigation } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export function SearchBar({ onSearch, onEventSelect, userLocation }) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search_query: searchQuery,
        limit: 10,
        sort_by: 'name'
      });

      if (userLocation) {
        params.append('user_lat', userLocation.lat);
        params.append('user_lng', userLocation.lng);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/search-events?${params}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!isExpanded) setIsExpanded(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  const handleEventClick = (event) => {
    onEventSelect(event.id);
    setQuery(event.name);
    setIsExpanded(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsExpanded(true)}
          placeholder="Search events, venues, organizers..."
          className="w-full pl-10 pr-10 py-3 bg-white/95 backdrop-blur border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all text-gray-900 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isExpanded && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-white/95 backdrop-blur shadow-xl border z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No events found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full px-3 py-3 hover:bg-gray-100 transition-colors text-left border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm line-clamp-1 text-gray-900">
                      {event.name}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {event.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      )}
                      
                      {event.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                      )}
                      
                      {event.distance_km !== null && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Navigation className="w-3 h-3" />
                          <span>{event.distance_km} km</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {event.distance_km !== null && event.distance_km < 5 && (
                        <Badge variant="secondary" className="text-xs">Nearby</Badge>
                      )}
                      {event.startDate && new Date(event.startDate) > new Date() && (
                        <Badge variant="outline" className="text-xs">Upcoming</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
