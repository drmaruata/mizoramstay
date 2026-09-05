create extension if not exists "uuid-ossp";

create type public.user_role as enum ('TOURIST', 'HOST', 'GUIDE', 'DRIVER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN');
create type public.property_status as enum ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED');
create type public.property_type as enum ('HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'LODGE', 'RESORT', 'VILLAGE_STAY', 'OTHER');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REFUND_PENDING', 'REFUNDED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'TOURIST',
  first_name text,
  last_name text,
  phone text,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.host_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text,
  profile_photo_url text,
  identity_status text not null default 'PENDING',
  bank_account_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null references public.host_profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  property_type public.property_type not null default 'HOMESTAY',
  description text,
  address text,
  village text,
  town text,
  district text,
  pincode text,
  latitude double precision,
  longitude double precision,
  check_in_time time,
  check_out_time time,
  status public.property_status not null default 'DRAFT',
  verification_level smallint not null default 0 check (verification_level between 0 and 4),
  tourism_registration_number text,
  tourism_registration_status text not null default 'PENDING',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  description text,
  max_guests smallint not null check (max_guests > 0),
  base_price numeric(12,2) not null check (base_price >= 0),
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_inventory (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  date date not null,
  available_units smallint not null default 1 check (available_units >= 0),
  blocked_units smallint not null default 0 check (blocked_units >= 0),
  unique (room_id, date)
);

create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_reference text not null unique,
  user_id uuid not null references public.profiles(id),
  property_id uuid not null references public.properties(id),
  check_in date not null,
  check_out date not null,
  guests smallint not null check (guests > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  currency text not null default 'INR',
  status public.booking_status not null default 'PENDING',
  cancellation_policy text,
  created_at timestamptz not null default now(),
  constraint valid_booking_dates check (check_out > check_in)
);

create index properties_published_idx on public.properties(status, district, town);
create index bookings_user_idx on public.bookings(user_id, created_at desc);
create index bookings_property_idx on public.bookings(property_id, check_in, check_out);

alter table public.profiles enable row level security;
alter table public.host_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.room_inventory enable row level security;
alter table public.bookings enable row level security;

create policy "published properties are public" on public.properties for select using (status = 'PUBLISHED');
create policy "published rooms are public" on public.rooms for select using (exists (select 1 from public.properties where properties.id = rooms.property_id and properties.status = 'PUBLISHED'));
create policy "published inventory is public" on public.room_inventory for select using (exists (select 1 from public.rooms join public.properties on properties.id = rooms.property_id where rooms.id = room_inventory.room_id and properties.status = 'PUBLISHED'));
create policy "users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "users can update their profile" on public.profiles for update using (auth.uid() = id);
create policy "tourists can read their bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "hosts can read property bookings" on public.bookings for select using (exists (select 1 from public.properties join public.host_profiles on host_profiles.id = properties.host_id where properties.id = bookings.property_id and host_profiles.user_id = auth.uid()));
