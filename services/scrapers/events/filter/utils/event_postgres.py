import os
import sqlite3
import pandas as pd
import numpy as np
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

class Logger:
    def __init__(self, name: str, level=logging.INFO):
        logging.basicConfig(
            level=level,
            format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
        )
        self.logger = logging.getLogger(name)

    def debug(self, message: str):
        self.logger.debug(message)

    def info(self, message: str):
        self.logger.info(message)

    def warning(self, message: str):
        self.logger.warning(message)

    def error(self, message: str):
        self.logger.error(message)

    def critical(self, message: str):
        self.logger.critical(message)

logger = Logger("blrnow : filter")

def push_events_to_supabase():
    """
    Reads events from a local SQLite database and pushes them to a Supabase table.
    """
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    sqlite_file = "events.db"
    table_name = "events"

    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return

    try:
        # Connect to SQLite and read data
        sqlite_conn = sqlite3.connect(sqlite_file)
        df = pd.read_sql_query(f"SELECT * FROM {table_name}", sqlite_conn)
        sqlite_conn.close()
        logger.info(f"Fetched {len(df)} rows from SQLite table '{table_name}'")

        # Replace NaN and Infinity with None for JSON compatibility
        df.replace([np.inf, -np.inf, np.nan], None, inplace=True)

        # Ensure we have an idempotent conflict key for upserts.
        # The DB schema created in dbconfig/create.sql uses source_url as a UNIQUE key.
        # Older data sources may only have `url`, so we use that as a fallback.
        if "source_url" not in df.columns:
            if "url" in df.columns:
                df["source_url"] = df["url"]
            else:
                df["source_url"] = None

        # Convert DataFrame to list of dictionaries
        events_data = df.to_dict(orient='records')

        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("Connected to Supabase successfully")

        # Upsert data to Supabase (idempotent on source_url)
        response = (
            supabase.table(table_name)
            .upsert(events_data, on_conflict="source_url")
            .execute()
        )


        # Check for errors in the response
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error pushing data to Supabase: {response.error}")
        else:
            logger.info(f"Pushed {len(events_data)} rows to Supabase table '{table_name}' successfully")

    except Exception as e:
        logger.error(f"An error occurred: {e}")

if __name__ == "__main__":
    push_events_to_supabase()