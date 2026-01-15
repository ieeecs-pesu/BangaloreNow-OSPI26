#!/bin/bash

PROJECT_DIR="/home/kaushik/Documents/Projects/BangaloreNow/Web_Scraping/event_scraper"
VENV_DIR="/home/kaushik/Documents/Projects/BangaloreNow/Web_Scraping/venv"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/run_$TIMESTAMP.log"

cd "$PROJECT_DIR" || exit 1

echo "===== RUN START: $(date) =====" >> "$LOG_FILE"

source "$VENV_DIR/bin/activate"

scrapy crawl allevents -O data/allevents_temp.json >> "$LOG_FILE" 2>&1

python3 merge_events.py >> "$LOG_FILE" 2>&1

echo "===== RUN END: $(date) =====" >> "$LOG_FILE"
