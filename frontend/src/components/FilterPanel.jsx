import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { X, Search, MapPin, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export function FilterPanel({ onFilterChange, onClose, userLocation }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ venues: [], organizers: [] });
  
  const [filters, setFilters] = useState({
    searchQuery: '',
    maxDistanceKm: '',
    startDate: '',
    endDate: '',
    venue: '',
    organizer: '',
    sortBy: 'distance'
  });

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/filter-options`);
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    const activeFilters = {
      ...filters,
      user_lat: userLocation?.lat,
      user_lng: userLocation?.lng,
      maxDistanceKm: filters.maxDistanceKm ? parseFloat(filters.maxDistanceKm) : undefined
    };
    
    // Remove empty values
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key] === '' || activeFilters[key] === undefined) {
        delete activeFilters[key];
      }
    });
    
    console.log('🔍 Applying filters:', activeFilters);
    onFilterChange(activeFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchQuery: '',
      maxDistanceKm: '',
      startDate: '',
      endDate: '',
      venue: '',
      organizer: '',
      sortBy: 'distance'
    };
    setFilters(clearedFilters);
    onFilterChange({
      user_lat: userLocation?.lat,
      user_lng: userLocation?.lng,
      sortBy: 'distance'
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'distance').length;

  return (
    <Card className="absolute top-20 left-4 z-[1000] w-96 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 backdrop-blur shadow-lg rounded-lg">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{activeFilterCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-gray-100 text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 text-gray-700">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Search className="w-4 h-4 text-blue-600" />
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search name, venue, organizer..."
              value={filters.searchQuery}
              onChange={(e) => handleInputChange('searchQuery', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm"
            />
          </div>

          <Separator className="bg-gray-200" />

          {/* Location-based */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-blue-600" />
              Distance Filter
            </label>
            {userLocation ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="Max distance (km)"
                  value={filters.maxDistanceKm}
                  onChange={(e) => handleInputChange('maxDistanceKm', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm"
                  min="0"
                  step="0.5"
                />
                <div className="flex gap-2 flex-wrap">
                  {[1, 5, 10, 25, 50].map(dist => (
                    <Button
                      key={dist}
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('maxDistanceKm', dist.toString())}
                      className="flex-1 min-w-[60px] hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                    >
                      {dist} km
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  📍 Enable location to filter by distance
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-gray-200" />

          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              Date Range
            </label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          {/* Venue */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Venue</label>
            <select
              value={filters.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm bg-white"
            >
              <option value="">All Venues</option>
              {filterOptions.venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
          </div>

          {/* Organizer */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Organizer</label>
            <select
              value={filters.organizer}
              onChange={(e) => handleInputChange('organizer', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm bg-white"
            >
              <option value="">All Organizers</option>
              {filterOptions.organizers.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          <Separator className="bg-gray-200" />

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleInputChange('sortBy', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm bg-white"
            >
              <option value="distance">Distance (Near to Far)</option>
              <option value="date">Date (Upcoming First)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleApplyFilters} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            >
              Apply Filters
            </Button>
            <Button 
              onClick={handleClearFilters} 
              variant="outline"
              className="px-6 border-gray-300 hover:bg-gray-100 font-medium"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
