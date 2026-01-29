import React, { memo, useState, useCallback, useEffect } from 'react';

const MarkerInfoWindow = memo(({ event, onClose, isLoading, isCached, isPositionedBelow = false }) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const handleImageClick = useCallback(() => {
    if (event?.image) {
      setIsImagePreviewOpen(true);
    }
  }, [event?.image]);

  const handleCloseImagePreview = useCallback(() => {
    setIsImagePreviewOpen(false);
  }, []);

  // Close image preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isImagePreviewOpen && e.target.classList.contains('image-preview-backdrop')) {
        handleCloseImagePreview();
      }
    };

    if (isImagePreviewOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isImagePreviewOpen, handleCloseImagePreview]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dayName}, ${datePart} at ${timePart}`;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="relative">
      {/* Dynamic arrow positioning based on info window position */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 z-[10002] ${
          isPositionedBelow ? '-top-2' : '-bottom-2'
        }`}
      >
        <div 
          className={`w-4 h-4 transform ${isPositionedBelow ? 'rotate-45' : 'rotate-[225deg]'}`}
          style={{
            backgroundColor: `hsl(var(--marker-background))`,
            borderLeft: `1px solid hsl(var(--marker-border))`,
            borderTop: `1px solid hsl(var(--marker-border))`
          }}
        />
      </div>
      
      <div 
        className="rounded-lg shadow-2xl relative z-[10001] translate-y-2 marker-info-window"
        style={{
          backgroundColor: `hsl(var(--marker-background))`,
          borderColor: `hsl(var(--marker-border))`,
          borderWidth: '1px',
          minWidth: '280px',
          maxWidth: '600px',
          width: 'clamp(280px, 90vw, 580px)'
        }}
      >
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="text-xl font-bold transition-colors duration-200 hover:scale-110 transform"
            style={{
              color: `hsl(var(--marker-text-muted))`,
              cursor: 'pointer'
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {isLoading && !event ? (
          // Loading state
          <div className="flex items-center justify-center py-8 px-4">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-2 border-solid border-transparent"
              style={{
                borderTopColor: `hsl(var(--marker-accent))`,
                borderRightColor: `hsl(var(--marker-accent))`
              }}
            />
            <span className="ml-2 text-sm" style={{color: `hsl(var(--marker-text-muted))`}}>
              Loading event details...
            </span>
          </div>
        ) : event ? (
          <div className="px-4 pb-4">
            {/* Two column layout: Left (event info), Right (organizer & details) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT COLUMN - Event Name and Location/Date */}
              <div className="space-y-4">
                {/* Event Name Box */}
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: `hsl(var(--marker-surface))`,
                    borderColor: `hsl(var(--marker-border))`
                  }}
                >
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-base leading-tight hover:underline transition-colors"
                      style={{
                        color: `hsl(var(--marker-accent))`,
                        cursor: 'pointer',
                        display: 'block',
                        wordBreak: 'break-word'
                      }}
                      title={event.name}
                    >
                      {event.name}
                    </a>
                  ) : (
                    <h3 
                      className="font-bold text-base leading-tight"
                      style={{
                        color: `hsl(var(--marker-text-primary))`,
                        wordBreak: 'break-word'
                      }}
                      title={event.name}
                    >
                      {event.name}
                    </h3>
                  )}
                </div>

                {/* Location and Date/Day Box */}
                <div 
                  className="p-4 rounded-lg border-2 min-h-[140px] flex flex-col justify-center"
                  style={{
                    backgroundColor: `hsl(var(--marker-surface))`,
                    borderColor: `hsl(var(--marker-border))`
                  }}
                >
                  {/* Location */}
                  {(event.venue || event.address) && (
                    <div className="mb-3">
                      {event.venue && (
                        <p 
                          className="font-semibold text-sm mb-1"
                          style={{
                            color: `hsl(var(--marker-text-primary))`,
                            wordBreak: 'break-word'
                          }}
                        >
                          📍 {event.venue}
                        </p>
                      )}
                      {event.address && (
                        <p 
                          className="text-xs"
                          style={{
                            color: `hsl(var(--marker-text-secondary))`,
                            wordBreak: 'break-word'
                          }}
                        >
                          {event.address}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date and Day */}
                  {event.startDate && (
                    <div>
                      <p 
                        className="text-xs font-medium"
                        style={{
                          color: `hsl(var(--marker-text-secondary))`,
                          wordBreak: 'break-word'
                        }}
                      >
                        📅 {formatDate(event.startDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Organizer & Additional Info */}
              <div className="space-y-4">
                {/* Organizer Details Box */}
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: `hsl(var(--marker-surface))`,
                    borderColor: `hsl(var(--marker-border))`
                  }}
                >
                  <h4 
                    className="font-bold text-sm mb-2"
                    style={{
                      color: `hsl(var(--marker-text-primary))`
                    }}
                  >
                    Organiser deets
                  </h4>
                  {event.organizer ? (
                    <p 
                      className="text-xs"
                      style={{
                        color: `hsl(var(--marker-text-secondary))`,
                        wordBreak: 'break-word'
                      }}
                    >
                      {event.organizer}
                    </p>
                  ) : (
                    <p 
                      className="text-xs italic"
                      style={{
                        color: `hsl(var(--marker-text-muted))`
                      }}
                    >
                      Not provided
                    </p>
                  )}
                </div>

                {/* Additional Information Box */}
                <div 
                  className="p-4 rounded-lg border-2 min-h-[140px] flex flex-col justify-center"
                  style={{
                    backgroundColor: `hsl(var(--marker-surface))`,
                    borderColor: `hsl(var(--marker-border))`
                  }}
                >
                  <h4 
                    className="font-bold text-sm mb-2"
                    style={{
                      color: `hsl(var(--marker-text-primary))`
                    }}
                  >
                    Additional info
                  </h4>
                  {event.description ? (
                    <p 
                      className="text-xs leading-relaxed line-clamp-4"
                      style={{
                        color: `hsl(var(--marker-text-secondary))`,
                        wordBreak: 'break-word'
                      }}
                    >
                      {event.description}
                    </p>
                  ) : (
                    <p 
                      className="text-xs italic"
                      style={{
                        color: `hsl(var(--marker-text-muted))`
                      }}
                    >
                      No additional details available
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Event Image - Full Width if available */}
            {event.image && (
              <div className="mt-4">
                <div 
                  className="rounded-lg overflow-hidden border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative"
                  style={{
                    backgroundColor: `hsl(var(--marker-surface))`,
                    borderColor: `hsl(var(--marker-border))`
                  }}
                  onClick={handleImageClick}
                  title="Click to view larger image"
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity duration-200"
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Overlay icon */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-20"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      <svg 
                        className="w-8 h-8 text-white"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="text-center py-4 px-4"
            style={{
              color: `hsl(0 62.8% 50.6%)`
            }}
          >
            Failed to load event details
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {isImagePreviewOpen && event?.image && (
        <div 
          className="image-preview-backdrop fixed inset-0 z-[20000] flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-80 animate-in fade-in-0 duration-200"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="relative flex items-center justify-center animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={handleCloseImagePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-[20001]"
              style={{ cursor: 'pointer' }}
              title="Close preview"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Properly sized and centered image */}
            <img
              src={event.image}
              alt={event.name}
              className="object-contain rounded-lg shadow-2xl block"
              style={{
                maxWidth: '95vw', // Increased from 45vw to 95vw for mobile
                maxHeight: '70vh', // Increased from 45vh to 70vh for mobile
                width: 'auto',
                height: 'auto'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                handleCloseImagePreview();
              }}
            />
            
            {/* Image caption */}
            {event.name && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4 rounded-b-lg"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <p className="text-sm font-medium truncate">{event.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default MarkerInfoWindow;