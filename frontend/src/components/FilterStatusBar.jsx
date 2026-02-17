import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Filter, MapPin, Calendar, Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';

export function FilterStatusBar({ filters, eventCount, onClear }) {
  if (!filters) return null;

  const activeFiltersList = [];

  if (filters.search_query) {
    activeFiltersList.push({ icon: Search, label: `"${filters.search_query}"` });
  }

  if (filters.max_distance_km) {
    const distanceValue = Number(filters.max_distance_km);
    const label = Number.isNaN(distanceValue)
      ? `Within ${filters.max_distance_km}km`
      : `Within ${distanceValue} km`;
    activeFiltersList.push({ icon: MapPin, label });
  }

  if (filters.start_date || filters.end_date) {
    const dateLabel = filters.start_date && filters.end_date 
      ? `${filters.start_date} to ${filters.end_date}`
      : filters.start_date 
        ? `From ${filters.start_date}`
        : `Until ${filters.end_date}`;
    activeFiltersList.push({ icon: Calendar, label: dateLabel });
  }

  if (filters.venue) {
    activeFiltersList.push({ icon: MapPin, label: filters.venue });
  }

  if (filters.organizer) {
    activeFiltersList.push({ icon: Filter, label: filters.organizer });
  }

  if (filters.sort_by && filters.sort_by !== 'distance') {
    const friendlySort =
      filters.sort_by === 'date'
        ? 'Soonest first'
        : filters.sort_by === 'name'
          ? 'A → Z'
          : filters.sort_by;
    activeFiltersList.push({ icon: SlidersHorizontal, label: friendlySort });
  }

  const appliedFiltersCount = activeFiltersList.length;

  return (
    <Card className="pointer-events-auto fixed bottom-6 left-1/2 z-[1000] w-[min(92vw,64rem)] -translate-x-1/2 rounded-3xl border border-white/30 bg-white/95 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>
            {appliedFiltersCount} filter{appliedFiltersCount === 1 ? '' : 's'} applied
          </span>
        </div>
        <Badge className="rounded-full bg-slate-900 text-white">
          {eventCount} match{eventCount === 1 ? '' : 'es'}
        </Badge>
        <div className="flex flex-1 flex-wrap gap-2 text-xs font-medium text-slate-600">
          {activeFiltersList.map((filter, index) => {
            const Icon = filter.icon;
            return (
              <Badge key={`${filter.label}-${index}`} variant="secondary" className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                <Icon className="h-3.5 w-3.5" />
                <span>{filter.label}</span>
              </Badge>
            );
          })}
        </div>

        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="ml-auto text-slate-600 hover:text-slate-900"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </Card>
  );
}
