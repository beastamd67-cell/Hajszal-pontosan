-- Futtasd le ezt a Supabase projekt SQL Editor-jaban (Supabase dashboard > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_minutes int not null,
  duration int not null,
  name text not null,
  phone text not null,
  paid boolean default false,
  amount text,
  created_at timestamptz default now(),
  unique (date, start_minutes)
);

create table if not exists closures (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now()
);

-- A tablakhoz csak a szerver (service role kulcs) fer hozza,
-- ezert a Row Level Security-t bekapcsoljuk, de policy-t nem adunk hozza --
-- ez azt jelenti, hogy csak a service_role kulccsal (a mi API route-jaink)
-- lehet irni/olvasni, a publikus anon kulccsal senki.
alter table bookings enable row level security;
alter table closures enable row level security;
