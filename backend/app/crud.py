from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from app.model import Event
from app.schemas import EventBase, EventDetails

def get_all_events(session: Session) -> list[EventBase]:
    """Get all events with their coordinates - only requires name, lat, long to be non-null"""
    
    # Get all events with non-null coordinates, regardless of date
    result = session.execute(
        select(Event.id, Event.lat, Event.long)
        .where(
            Event.lat.is_not(None),
            Event.long.is_not(None),
            Event.name.is_not(None)
        )
    ).mappings().all()
    
    return [EventBase(**row) for row in result]
    

def get_event_detail(session: Session, event_id: int) -> EventDetails | None:
    """Get detailed event information by ID, with better null value handling"""
    
    result = session.execute(
        select(
            Event.id,
            Event.name,
            Event.description,
            Event.url,
            Event.image,
            Event.startDate,
            Event.endDate,
            Event.venue,
            Event.address,
            Event.lat,
            Event.long,
            Event.organizer,
        )
        .where(
            Event.id == event_id,
            # Only require that the event has coordinates and name
            Event.lat.is_not(None),
            Event.long.is_not(None),
            Event.name.is_not(None)
            # Removed date filtering - let frontend handle display of past events
        )
    ).mappings().first()
    
    if result is None:
        return None
    
    # Convert result to dict and handle potential None values gracefully
    event_data = dict(result)
    
    # Ensure essential fields exist, set others to None if missing
    if not all([event_data.get('id'), event_data.get('lat'), event_data.get('long'), event_data.get('name')]):
        return None
    
    return EventDetails(**event_data)

# def get_filtered_events(session: Session, keyword_filter: str = "festival"):
#     """Get events filtered by keyword"""
#     result = session.execute(
#         select(Event)
#         .join(Event.keywords)
#         .filter(Keyword.name == keyword_filter)
#         .options(joinedload(Event.keywords))
#     )
#     return result.scalars().unique().all()
