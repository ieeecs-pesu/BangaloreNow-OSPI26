create table if not exists public.events (
  id bigserial primary key,
  name text not null,
  description text,
  url text,
  image text,
  "startDate" timestamptz,
  "endDate" timestamptz,
  venue text,
  address text,
  lat double precision not null,
  long double precision not null,
  organizer text,
  category VARCHAR
);

create index if not exists events_startdate_idx on public.events ("startDate");
create index if not exists events_lat_long_idx on public.events (lat, long);
create index events_category on public.events (category)

-- Use url as the unique identity key for upserts.
create unique index if not exists events_url_uidx
  on public.events (url);