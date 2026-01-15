# Web Scraping - Event Scraper

This directory contains a web scraping solution built with Scrapy to collect event information from allevents.in for Bangalore. The scraper extracts event details including names, dates, venues, organizers, ticket prices, and more.

## Overview

The event scraper consists of:
- **Scrapy Spider**: Crawls allevents.in to extract event data
- **Merge Script**: Combines newly scraped events with existing master data
- **Shell Script**: Automated runner for the scraping process

## Prerequisites

- **Python 3.8+** (Python 3.12 recommended)
- **pip** (Python package installer)
- **Internet connection** (for scraping and installing packages)

## Installation

### Step 1: Navigate to the Web_Scraping Directory

```bash
cd Web_Scraping
```

### Step 2: Create a Virtual Environment

#### On Linux/macOS:
```bash
python3 -m venv venv
```

#### On Windows:
```cmd
python -m venv venv
```

### Step 3: Activate the Virtual Environment

#### On Linux/macOS:
```bash
source venv/bin/activate
```

#### On Windows (Command Prompt):
```cmd
venv\Scripts\activate.bat
```

#### On Windows (PowerShell):
```powershell
venv\Scripts\Activate.ps1
```

**Note for Windows PowerShell**: If you encounter an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 4: Install Dependencies

Once the virtual environment is activated, install the required packages:

```bash
pip install scrapy itemadapter
```

**Alternative**: If you have a `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### Step 5: Verify Installation

Verify that Scrapy is installed correctly:

```bash
scrapy version
```

You should see the Scrapy version number (e.g., `Scrapy 2.14.1`).

## Project Structure

```
Web_Scraping/
├── event_scraper/              # Main scraper project directory
│   ├── event_scraper/          # Scrapy project package
│   │   ├── spiders/            # Spider definitions
│   │   │   └── allevents.py   # Main spider for allevents.in
│   │   ├── items.py            # Data structure definitions
│   │   ├── pipelines.py        # Data processing pipelines
│   │   ├── middlewares.py      # Request/response middleware
│   │   └── settings.py         # Scrapy configuration
│   ├── data/                   # Output data directory
│   │   ├── allevents_master.json    # Master events database
│   │   └── allevents_temp.json      # Temporary scraped data
│   ├── logs/                   # Execution logs
│   ├── merge_events.py         # Event merging script
│   ├── run_allevents.sh        # Linux/macOS runner script
│   └── scrapy.cfg              # Scrapy project configuration
└── venv/                       # Virtual environment (created during setup)
```

## Running the Scraper

### Method 1: Using the Shell Script (Linux/macOS)

The easiest way to run the scraper on Linux or macOS:

```bash
cd event_scraper
bash run_allevents.sh
```

**Note**: You may need to update the paths in `run_allevents.sh` to match your system.

### Method 2: Manual Execution (All Operating Systems)

#### Step 1: Navigate to the Project Directory

```bash
cd event_scraper
```

#### Step 2: Activate Virtual Environment

**Linux/macOS:**
```bash
source ../venv/bin/activate
```

**Windows:**
```cmd
..\venv\Scripts\activate
```

#### Step 3: Run the Scrapy Spider

```bash
scrapy crawl allevents -O data/allevents_temp.json
```

This command:
- Runs the `allevents` spider
- Outputs results to `data/allevents_temp.json`
- The `-O` flag overwrites the file if it exists

#### Step 4: Merge Events with Master Data

```bash
python merge_events.py
```

This script:
- Reads the temporary scraped data (`data/allevents_temp.json`)
- Merges it with the master events file (`data/allevents_master.json`)
- Updates timestamps and removes duplicates
- Saves the merged data back to `data/allevents_master.json`

### Method 3: Windows Batch Script (Create Your Own)

Create a file `run_allevents.bat` in the `event_scraper` directory:

```batch
@echo off
cd /d "%~dp0"
call ..\venv\Scripts\activate.bat
scrapy crawl allevents -O data/allevents_temp.json
python merge_events.py
pause
```

Then run it:
```cmd
run_allevents.bat
```

## Output Files

### `data/allevents_temp.json`
- Contains the latest scraped events from the current run
- Overwritten on each scraping run
- Format: JSON array of event objects

### `data/allevents_master.json`
- Master database of all events
- Updated by `merge_events.py` after each run
- Contains deduplicated events with `last_updated` timestamps
- Format: JSON array of event objects

### Event Data Structure

Each event object contains:
```json
{
  "event_id": "12345",
  "event_name": "Event Name",
  "event_url": "https://allevents.in/bangalore/...",
  "event_key": "allevents:12345",
  "start_date": "2026-01-20",
  "start_time": "18:00",
  "venue_name": "Venue Name",
  "venue_address": "Full address",
  "organizer_name": "Organizer Name",
  "ticket_price": "₹500",
  "ticket_url": "https://...",
  "description": "Event description",
  "categories": ["Category1", "Category2"],
  "city": "Bangalore",
  "source": "allevents.in",
  "source_url": "https://...",
  "last_updated": "2026-01-15T14:41:19.123456"
}
```

## Configuration

### Scrapy Settings

The scraper behavior can be modified in `event_scraper/settings.py`:

- **DOWNLOAD_DELAY**: Minimum delay between requests (default: 3 seconds)
- **CONCURRENT_REQUESTS**: Number of concurrent requests (default: 4)
- **CLOSESPIDER_PAGECOUNT**: Maximum pages to crawl (default: 200)
- **MAX_DAYS_AHEAD**: Days in the future to scrape (default: 30, set in spider)

### Spider Settings

In `event_scraper/spiders/allevents.py`:
- `MAX_DAYS_AHEAD = 30`: Only scrapes events within 30 days

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError: No module named 'scrapy'**
   - Solution: Ensure virtual environment is activated and Scrapy is installed
   ```bash
   pip install scrapy
   ```

2. **Permission Denied (Linux/macOS)**
   - Solution: Make the shell script executable
   ```bash
   chmod +x run_allevents.sh
   ```

3. **PowerShell Execution Policy Error (Windows)**
   - Solution: Run PowerShell as Administrator and execute:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **FileNotFoundError: data/allevents_temp.json**
   - Solution: Ensure the `data` directory exists
   ```bash
   mkdir -p data
   ```

5. **Scrapy Crawling Too Slowly**
   - Solution: Adjust `DOWNLOAD_DELAY` and `CONCURRENT_REQUESTS` in `settings.py`

6. **No Events Scraped**
   - Check your internet connection
   - Verify that allevents.in is accessible
   - Check the logs in `logs/` directory for errors

## Logs

Execution logs are stored in the `logs/` directory with timestamps:
- Format: `run_YYYY-MM-DD_HH-MM-SS.log`
- Contains scraping progress, errors, and statistics

## Best Practices

1. **Respect robots.txt**: The scraper respects robots.txt by default (see `settings.py`)
2. **Rate Limiting**: Default delays are set to avoid overloading the server
3. **Regular Updates**: Run the scraper periodically to keep data fresh
4. **Backup Data**: Regularly backup `data/allevents_master.json`

## Scheduling (Optional)

### Linux/macOS: Using Cron

To run the scraper automatically, add to crontab:

```bash
crontab -e
```

Add a line to run daily at 2 AM:
```
0 2 * * * /path/to/Web_Scraping/event_scraper/run_allevents.sh >> /path/to/logs/cron.log 2>&1
```

### Windows: Using Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Set action to run: `run_allevents.bat`

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review Scrapy documentation: https://docs.scrapy.org/
3. Verify all dependencies are installed correctly

## License

See the main project LICENSE file for details.

