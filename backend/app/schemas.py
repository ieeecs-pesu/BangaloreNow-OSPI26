from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from sqlalchemy import Integer, String, DateTime, Float, ForeignKey, URL , Text
from typing import Optional


class EventBase(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    
    id:int
    lat:float 
    long:float 

class EventDetails(EventBase):
    model_config=ConfigDict(from_attributes=True)
    
    name:str
    description:str |None
    startDate:datetime|None
    endDate:datetime | None
    url:str |None 
    image:str | None
    venue:str |None
    address:str | None
    organizer:str | None  
    
    # keyword_names:list[str]


class EventWithDistance(EventBase):
    """Event with calculated distance from user location"""
    model_config=ConfigDict(from_attributes=True)
    
    name: str
    venue: str | None
    startDate: datetime | None
    endDate: datetime | None
    distance_km: float | None = None


class EventFilterParams(BaseModel):
    """Query parameters for filtering events"""
    # Location-based filtering
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    max_distance_km: Optional[float] = Field(None, description="Maximum distance in kilometers")
    
    # Date filtering
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    # Text search
    search_query: Optional[str] = Field(None, description="Search in name, description, venue, organizer")
    
    # Venue/Location filtering
    venue: Optional[str] = None
    
    # Organizer filtering
    organizer: Optional[str] = None
    
    # Sorting
    sort_by: Optional[str] = Field("distance", description="Sort by: distance, date, name")
    
    # Pagination
    limit: Optional[int] = Field(100, ge=1, le=500)
    offset: Optional[int] = Field(0, ge=0)

