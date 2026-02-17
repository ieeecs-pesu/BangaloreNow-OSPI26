import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  X,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Building2,
  UserCircle,
  SlidersHorizontal,
} from 'lucide-react';

const defaultFilters = {
  search_query: '',
  max_distance_km: '',
  start_date: '',
  end_date: '',
  venue: '',
  organizer: '',
  sort_by: 'distance'
};

export function FilterPanel({ onFilterChange, onClose, userLocation, activeFilters }) {
  const [filterOptions, setFilterOptions] = useState({ venues: [], organizers: [] });
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (!activeFilters) {
      setFilters({ ...defaultFilters });
      return;
    }

    setFilters({
      ...defaultFilters,
      ...activeFilters,
      search_query: activeFilters.search_query ?? activeFilters.searchQuery ?? '',
      max_distance_km: activeFilters.max_distance_km ?? activeFilters.maxDistanceKm ?? '',
      start_date: activeFilters.start_date ?? activeFilters.startDate ?? '',
      end_date: activeFilters.end_date ?? activeFilters.endDate ?? '',
      venue: activeFilters.venue ?? '',
      organizer: activeFilters.organizer ?? '',
      sort_by: activeFilters.sort_by ?? activeFilters.sortBy ?? 'distance'
    });
  }, [activeFilters]);

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
    const payload = {
      ...filters,
      user_lat: userLocation?.lat,
      user_lng: userLocation?.lng,
    };

    if (payload.max_distance_km) {
      const numericDistance = parseFloat(payload.max_distance_km);
      if (!Number.isNaN(numericDistance)) {
        payload.max_distance_km = numericDistance;
      } else {
        delete payload.max_distance_km;
      }
    }

    Object.keys(payload).forEach((key) => {
      if (['sort_by'].includes(key)) {
        return;
      }

      if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    console.log('🔍 Applying filters:', payload);
    onFilterChange(payload);
  };

  const handleClearFilters = () => {
    setFilters({ ...defaultFilters });
    onFilterChange({
      user_lat: userLocation?.lat,
      user_lng: userLocation?.lng,
      sort_by: 'distance'
    });
  };

  const activeFilterCount = Object.entries(filters).reduce((total, [key, value]) => {
    if (key === 'sort_by') {
      return value && value !== 'distance' ? total + 1 : total;
    }

    return value ? total + 1 : total;
  }, 0);

  const sortOptions = [
    { id: 'distance', label: 'Nearest first', blurb: 'Perfect when you want something close by.' },
    { id: 'date', label: 'Soonest dates', blurb: 'Line up your week with upcoming events.' },
    { id: 'name', label: 'A → Z', blurb: 'Browse alphabetically like a catalogue.' }
  ];

  return (
    <Card className="fixed top-20 left-1/2 z-[1100] w-[min(92vw,42rem)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-white/30 bg-white/95 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 px-6 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Filters</p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Fine-tune your feed</h2>
              {activeFilterCount > 0 && (
                <Badge className="rounded-full bg-slate-900 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">Refine the visible events by text, proximity, dates, and hosts.</p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="rounded-full border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-slate-900">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[52vh] space-y-6 overflow-y-auto px-6 pb-16 pt-5">
        {/* Search */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Search className="h-4 w-4" />
            Search everything
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search_query}
              onChange={(e) => handleInputChange('search_query', e.target.value)}
              placeholder="Artists, venues, organisers..."
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 pl-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </section>

        {/* Distance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <MapPin className="h-4 w-4" />
            Distance mood
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            {userLocation ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                📍 You’re filtering from {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                📍 Share your location to surface nearby options
              </div>
            )}

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-500">Max distance (km)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 10"
                value={filters.max_distance_km}
                onChange={(e) => handleInputChange('max_distance_km', e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>
        </section>

        {/* Dates */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Calendar className="h-4 w-4" />
            Date window
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">From</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">To</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>
        </section>

        {/* Venue + Organizer */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Building2 className="h-4 w-4" />
            Venue & organisers
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">Venue</label>
              <select
                value={filters.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">All venues</option>
                {filterOptions.venues.map((venue) => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Organizer</label>
              <select
                value={filters.organizer}
                onChange={(e) => handleInputChange('organizer', e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">All organizers</option>
                {filterOptions.organizers.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Sort */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Sparkles className="h-4 w-4" />
            Sort palette
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleInputChange('sort_by', option.id)}
                className={`rounded-3xl border px-4 py-3 text-left text-sm transition ${
                  filters.sort_by === option.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                    : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="h-4 w-4" />
                  {option.label}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {option.blurb}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Action bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/60 bg-white/95 px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Button className="flex-1 rounded-2xl bg-slate-900 text-white shadow-md hover:bg-slate-800" onClick={handleApplyFilters}>
            Show {activeFilterCount > 0 ? 'refined' : 'all'} events
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="rounded-2xl border-slate-300 text-slate-600 hover:border-slate-900 hover:text-slate-900"
          >
            Clear all
          </Button>
        </div>
      </div>
    </Card>
  );
}
