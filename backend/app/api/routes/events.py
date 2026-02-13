from fastapi import APIRouter, Request, Depends, HTTPException, status, Query
from app.crud import get_all_events, get_event_detail, get_filtered_events, get_unique_venues, get_unique_organizers
from sqlalchemy.orm import Session
from app.api.dependecies import get_db
from app.model import Event
from app.schemas import EventBase, EventDetails, EventFilterParams, EventWithDistance
from app.core.config import settings
from typing import Optional, List
from datetime import date

router=APIRouter()


#1. endpoint for gettign all markers (no sorting initially by geohashing)
#2. getting detailed info about the event through the eventid
#3. 

@router.get("/get-all-events", response_model=list[EventBase])
async def retrieve_all_events(session:Session=Depends(get_db)):
    """Get all events with coordinates. Includes events with null fields as long as name, lat, long exist."""
    print(settings.all_cors_origins, settings.BACKEND_CORS_ORIGINS)
    try:
        payload = get_all_events(session)  # type:ignore
        return payload
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving events: {str(e)}"
        )


@router.get("/search-events", response_model=List[EventWithDistance])
async def search_events(
    session: Session = Depends(get_db),
    user_lat: Optional[float] = Query(None, description="User's latitude"),
    user_lng: Optional[float] = Query(None, description="User's longitude"),
    max_distance_km: Optional[float] = Query(None, description="Maximum distance in km"),
    start_date: Optional[date] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[date] = Query(None, description="Filter events ending before this date"),
    search_query: Optional[str] = Query(None, description="Search in name, description, venue, organizer"),
    venue: Optional[str] = Query(None, description="Filter by venue"),
    organizer: Optional[str] = Query(None, description="Filter by organizer"),
    sort_by: Optional[str] = Query("distance", description="Sort by: distance, date, name"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Search and filter events with multiple criteria:
    - Location-based: Find events near user's location
    - Date range: Filter by start/end dates
    - Text search: Search across name, description, venue, organizer
    - Venue/Organizer: Filter by specific venue or organizer
    - Sorting: By distance, date, or name
    """
    try:
        filters = EventFilterParams(
            user_lat=user_lat,
            user_lng=user_lng,
            max_distance_km=max_distance_km,
            start_date=start_date,
            end_date=end_date,
            search_query=search_query,
            venue=venue,
            organizer=organizer,
            sort_by=sort_by,
            limit=limit,
            offset=offset
        )
        
        events = get_filtered_events(session, filters)
        return events
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching events: {str(e)}"
        )


@router.get("/filter-options")
async def get_filter_options(session: Session = Depends(get_db)):
    """Get available filter options (venues, organizers) for dropdowns"""
    try:
        venues = get_unique_venues(session)
        organizers = get_unique_organizers(session)
        
        return {
            "venues": venues,
            "organizers": organizers
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving filter options: {str(e)}"
        )


@router.get("/get-event-details/{event_id}", response_model=EventDetails)
async def retrieve_event_detail(event_id:int, session:Session=Depends(get_db) ):
    """Get event details by ID. Returns events with null fields as long as name, lat, long exist."""
    try:
        payload = get_event_detail(session=session, event_id=event_id)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Event with ID {event_id} not found or missing required fields (name, lat, long)"
            )
        
        return payload
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving event details: {str(e)}"
        )