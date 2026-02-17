import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Filter, MapPin, Calendar, Search, X } from 'lucide-react';
import { Button } from './ui/button';

export function FilterStatusBar({ filters, eventCount, onClear }) {
  if (!filters) return null;

  const activeFiltersList = [];

  if (filters.search_query) {
    activeFiltersList.push({ icon: Search, label: `"${filters.search_query}"` });
  }

  if (filters.max_distance_km) {
    activeFiltersList.push({ icon: MapPin, label: `Within ${filters.max_distance_km}km` });
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

  return (
    <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur shadow-lg px-4 py-3 max-w-4xl">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-gray-900">
            {eventCount} event{eventCount !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeFiltersList.map((filter, index) => {
            const Icon = filter.icon;
            return (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                <span className="text-xs">{filter.label}</span>
              </Badge>
            );
          })}
        </div>

        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="ml-auto"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </Card>
  );
}
