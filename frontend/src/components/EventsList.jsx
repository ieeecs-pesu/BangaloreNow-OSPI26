import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Calendar, Navigation } from 'lucide-react';

export function EventsList({ events, onEventClick, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="absolute top-20 right-4 z-[1000] w-96 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 backdrop-blur shadow-lg">
      <div className="sticky top-0 bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Events Found ({events.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No events found matching your filters</p>
            <p className="text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          events.map((event) => (
            <Card
              key={event.id}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer border"
              onClick={() => onEventClick(event.id)}
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
                  {event.name}
                </h3>

                {event.distance_km !== null && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Navigation className="w-3 h-3" />
                    <span>{event.distance_km} km away</span>
                  </div>
                )}

                {event.venue && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                )}

                {event.startDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(event.startDate)}</span>
                    {event.endDate && event.endDate !== event.startDate && (
                      <span> - {formatDate(event.endDate)}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-1 flex-wrap">
                  {event.distance_km !== null && event.distance_km < 5 && (
                    <Badge variant="secondary" className="text-xs">Nearby</Badge>
                  )}
                  {event.startDate && new Date(event.startDate) > new Date() && (
                    <Badge variant="outline" className="text-xs">Upcoming</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}
