import scrapy
import re
import json
from event_scraper.items import EventItem
from datetime import date, datetime, timedelta


class AlleventsSpider(scrapy.Spider):
    name = "allevents"
    allowed_domains = ["allevents.in"]
    start_urls = ["https://allevents.in/bangalore/all"]

    MAX_DAYS_AHEAD = 30

    custom_settings = {
        "CLOSESPIDER_PAGECOUNT": 200,
        "DOWNLOAD_DELAY": 1,
        "CONCURRENT_REQUESTS": 4,
    }

    def parse(self, response):
        today = datetime.utcnow().date()
        cutoff_date = today + timedelta(days=self.MAX_DAYS_AHEAD)

        event_cards = response.css("a[href^='https://allevents.in/bangalore/']")

        stop_pagination = False

        for card in event_cards:
            link = card.attrib.get("href")

            if not link or not re.search(r"/\d+$", link):
                continue

            # Try extracting date from listing text (fast filter)
            date_text = " ".join(card.css("::text").getall())
            date_text = re.sub(r"\s+", " ", date_text).strip()

            extracted_date = None
            for fmt in ("%d %b", "%b %d"):
                try:
                    extracted_date = datetime.strptime(
                        f"{date_text} {today.year}", fmt + " %Y"
                    ).date()
                    break
                except Exception:
                    continue

            if extracted_date and extracted_date > cutoff_date:
                self.logger.info("Reached date cutoff. Stopping pagination.")
                stop_pagination = True
                break

            yield response.follow(link, callback=self.parse_event)

        if not stop_pagination:
            page_match = re.search(r"page=(\d+)", response.url)
            next_page = (
                f"https://allevents.in/bangalore/all?page={int(page_match.group(1)) + 1}"
                if page_match
                else "https://allevents.in/bangalore/all?page=2"
            )
            yield response.follow(next_page, callback=self.parse)

    def parse_event(self, response):
        json_ld = response.xpath(
            '//script[@type="application/ld+json"]/text()'
        ).get()

        event_schema = {}

        if json_ld:
            try:
                data = json.loads(json_ld)

                if isinstance(data, list):
                    for block in data:
                        if block.get("@type") == "Event":
                            event_schema = block
                            break
                elif data.get("@type") == "Event":
                    event_schema = data
            except Exception:
                pass

        # ---------------- JSON-LD FIELDS ONLY ----------------
        event_id = None
        start_date = None
        start_time = None
        venue_name = None
        venue_address = None
        organizer_name = None
        ticket_price = None
        ticket_url = None
        categories = None
        event_key = None

        if event_schema:
            # ---------- EVENT ID ----------
            event_id_match = re.search(r"/(\d+)$", response.url)
            event_id = event_id_match.group(1) if event_id_match else None

            # ---------- EVENT KEY ----------
            if event_id:
                event_key = f"allevents:{event_id}"
            else:
                # fallback: URL-based key (rare but safe)
                event_key = f"allevents:url:{hash(response.url)}"

            # Date & time
            start_dt = event_schema.get("startDate")
            if start_dt:
                if "T" in start_dt:
                    date_part, time_part = start_dt.split("T", 1)
                    start_date = date_part
                    start_time = time_part[:5]
                else:
                    start_date = start_dt

            # Venue
            location = event_schema.get("location", {})
            if isinstance(location, dict):
                venue_name = location.get("name")

                address = location.get("address", {})
                if isinstance(address, dict):
                    venue_address = ", ".join(filter(None, [
                        address.get("streetAddress"),
                        address.get("addressLocality"),
                        address.get("addressRegion"),
                        address.get("postalCode"),
                        address.get("addressCountry"),
                    ]))

            # Organizer (JSON-LD ONLY)
            # ---------- ORGANIZER ----------
            organizer_name = None

            # 1️⃣ JSON-LD (highest priority)
            organizer = event_schema.get("organizer") if event_schema else None
            if isinstance(organizer, dict):
                organizer_name = organizer.get("name")

            # 2️⃣ Text fallback: Hosted by / Curated by / By
            if not organizer_name:
                organizer_text = response.xpath(
                    '//*[contains(text(),"Hosted by") or contains(text(),"Curated by") or contains(text(),"By ")]/text()'
                ).get()

                if organizer_text:
                    organizer_name = re.sub(
                        r'^(Hosted by|Curated by|By)\s+',
                        '',
                        organizer_text.strip(),
                        flags=re.I
                    )

            # Normalize empty strings
            organizer_name = organizer_name or None


            # ---------- TICKET PRICE (NORMALIZED) ----------
            # 1️⃣ JSON-LD price (most reliable)
            offers = event_schema.get("offers") if event_schema else None
            if isinstance(offers, dict):
                price = offers.get("price")
                if price:
                    ticket_price = f"₹{price}"

            # 2️⃣ Explicit FREE detection
            if not ticket_price:
                page_text = " ".join(response.xpath("//body//text()").getall()).lower()
                if "free entry" in page_text or "free event" in page_text:
                    ticket_price = "Free"

            # 3️⃣ ₹ price extraction fallback
            if not ticket_price:
                price_match = re.search(r'₹\s?\d+(?:\s?-\s?₹?\d+)?', page_text)
                if price_match:
                    ticket_price = price_match.group(0).replace(" ", "")

            # ---------- TICKET URL (NORMALIZED) ----------
            # 1️⃣ JSON-LD ticket URL (most reliable)
            if event_schema:
                offers = event_schema.get("offers")
                if isinstance(offers, dict):
                    ticket_url = offers.get("url")

            # 2️⃣ Fallback: link containing BOTH "tickets" and event_id
            if not ticket_url and event_id:
                ticket_links = response.css('a[href*="tickets"]::attr(href)').getall()
                for link in ticket_links:
                    if event_id in link:
                        ticket_url = response.urljoin(link)
                        break

            # 3️⃣ Final sanity check
            if ticket_url and not ticket_url.startswith("http"):
                ticket_url = response.urljoin(ticket_url)
            

            # 4️⃣ If the event page itself is a ticket page, use it
            if not ticket_url and "tickets" in response.url:
                ticket_url = response.url




            # ---------- CATEGORIES (STRICT & CLEAN) ----------
            categories = []

            description_text = " ".join(
                response.xpath('//div[contains(@class,"description")]//text()').getall()
            )

            if description_text:
                matches = re.findall(
                    r'other\s+([A-Za-z &]+?)\s+events\s+in\s+Bangalore',
                    description_text,
                    flags=re.I
                )
                for m in matches:
                    cleaned = m.strip().title()
                    if cleaned and len(cleaned) <= 40:
                        categories.append(cleaned)

            categories = list(set(categories)) or None


        # ---------------- HTML SAFE FIELDS ----------------
        title = response.css("h1::text").get()
        title = title.strip() if title else None

        description_block = response.xpath(
            '//div[contains(@class,"description")]//text()'
        ).getall()

        description = (
            re.sub(r"\s+", " ", " ".join(description_block)).strip()
            if description_block else None
        )

        # ---------------- FINAL ITEM ----------------
        item = EventItem()
        item["event_id"] = event_id
        item["event_name"] = title
        item["event_url"] = response.url
        item["start_date"] = start_date
        item["start_time"] = start_time
        item["venue_name"] = venue_name
        item["venue_address"] = venue_address
        item["organizer_name"] = organizer_name
        item["ticket_price"] = ticket_price
        item["ticket_url"] = ticket_url
        item["description"] = description
        item["categories"] = categories
        item["city"] = "Bangalore"
        item["source"] = "allevents.in"
        item["source_url"] = response.url
        item["last_updated"] = datetime.utcnow().isoformat()
        item["event_key"] = event_key


        
        # ---------- DATE FILTER (STEP 4) ----------
        if start_date:
            event_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            today = date.today()
            cutoff = today + timedelta(days=self.MAX_DAYS_AHEAD)

            if event_date < today or event_date > cutoff:
                return
        else:
            return


        yield item