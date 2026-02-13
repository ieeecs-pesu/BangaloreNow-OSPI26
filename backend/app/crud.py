from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_, and_, cast, String
from app.model import Event
from app.schemas import EventBase, EventDetails, EventWithDistance, EventFilterParams
from datetime import datetime, date
from typing import List
import math


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


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


def get_filtered_events(session: Session, filters: EventFilterParams) -> List[EventWithDistance]:
    """
    Get filtered events based on various criteria
    Supports location-based search, date filtering, text search, and sorting
    """
    # Base query
    query = select(
        Event.id,
        Event.name,
        Event.lat,
        Event.long,
        Event.venue,
        Event.startDate,
        Event.endDate,
        Event.description,
        Event.organizer,
        Event.address
    ).where(
        Event.lat.is_not(None),
        Event.long.is_not(None),
        Event.name.is_not(None)
    )
    
    # Date filtering
    if filters.start_date:
        query = query.where(
            or_(
                Event.startDate >= datetime.combine(filters.start_date, datetime.min.time()),
                Event.endDate >= datetime.combine(filters.start_date, datetime.min.time())
            )
        )
    
    if filters.end_date:
        query = query.where(
            or_(
                Event.startDate <= datetime.combine(filters.end_date, datetime.max.time()),
                Event.endDate <= datetime.combine(filters.end_date, datetime.max.time())
            )
        )
    
    # Text search (case-insensitive)
    if filters.search_query:
        search_term = f"%{filters.search_query}%"
        query = query.where(
            or_(
                cast(Event.name, String).ilike(search_term),
                cast(Event.description, String).ilike(search_term),
                cast(Event.venue, String).ilike(search_term),
                cast(Event.organizer, String).ilike(search_term),
                cast(Event.address, String).ilike(search_term)
            )
        )
    
    # Venue filtering
    if filters.venue:
        query = query.where(cast(Event.venue, String).ilike(f"%{filters.venue}%"))
    
    # Organizer filtering
    if filters.organizer:
        query = query.where(cast(Event.organizer, String).ilike(f"%{filters.organizer}%"))
    
    # Execute query
    result = session.execute(query).mappings().all()
    
    # Convert to list of dicts and calculate distances
    events = []
    for row in result:
        event_dict = dict(row)
        
        # Calculate distance if user location provided
        if filters.user_lat is not None and filters.user_lng is not None:
            distance = calculate_distance(
                filters.user_lat,
                filters.user_lng,
                event_dict['lat'],
                event_dict['long']
            )
            event_dict['distance_km'] = round(distance, 2)
        else:
            event_dict['distance_km'] = None
        
        events.append(event_dict)
    
    # Filter by distance if specified
    if filters.max_distance_km is not None and filters.user_lat is not None:
        events = [e for e in events if e['distance_km'] is not None and e['distance_km'] <= filters.max_distance_km]
    
    # Sort events
    if filters.sort_by == "distance" and filters.user_lat is not None:
        events.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))
    elif filters.sort_by == "date":
        events.sort(key=lambda x: x['startDate'] if x['startDate'] else datetime.max)
    elif filters.sort_by == "name":
        events.sort(key=lambda x: x['name'].lower())
    
    # Pagination
    events = events[filters.offset:filters.offset + filters.limit]
    
    return [EventWithDistance(**event) for event in events]


def get_unique_venues(session: Session) -> List[str]:
    """Get list of unique venues for filter dropdown"""
    result = session.execute(
        select(Event.venue)
        .where(Event.venue.is_not(None))
        .distinct()
        .order_by(Event.venue)
    ).scalars().all()
    
    return [v for v in result if v]


def get_unique_organizers(session: Session) -> List[str]:
    """Get list of unique organizers for filter dropdown"""
    result = session.execute(
        select(Event.organizer)
        .where(Event.organizer.is_not(None))
        .distinct()
        .order_by(Event.organizer)
    ).scalars().all()
    
    return [o for o in result if o]
    

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
