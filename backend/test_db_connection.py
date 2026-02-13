#!/usr/bin/env python3
"""Test database connection"""
import sys
from app.core.config import settings
from app.core.db import engine
from sqlalchemy import text

print("=" * 60)
print("Testing Database Connection")
print("=" * 60)

print(f"\n📋 Configuration:")
print(f"   POSTGRES_SERVER: {settings.POSTGRES_SERVER}")
print(f"   POSTGRES_PORT: {settings.POSTGRES_PORT}")
print(f"   POSTGRES_USER: {settings.POSTGRES_USER}")
print(f"   POSTGRES_DB: {settings.POSTGRES_DB}")
print(f"   Connection String: {settings.SQL_ALCHEMY_URI}")

print(f"\n🔌 Attempting to connect to database...")

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        
        # Try to query the events table
        result = connection.execute(text("SELECT COUNT(*) FROM events"))
        count = result.scalar()
        print(f"✅ Events table accessible! Found {count} events")
        
except Exception as e:
    print(f"❌ Database connection failed!")
    print(f"   Error type: {type(e).__name__}")
    print(f"   Error message: {str(e)}")
    sys.exit(1)

print("\n" + "=" * 60)
print("All checks passed!")
print("=" * 60)
