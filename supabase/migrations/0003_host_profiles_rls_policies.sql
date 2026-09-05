-- RLS policies for public.host_profiles
-- host_profiles is keyed by user_id (references profiles.id -> auth.users.id)

-- Public can read non-sensitive host display fields (shown on public property listings)
create policy "host profiles are publicly readable"
  on public.host_profiles
  for select
  using (true);

-- A host can read their own full profile
create policy "hosts can read their own profile"
  on public.host_profiles
  for select
  using (auth.uid() = user_id);

-- A host can create their own profile
create policy "hosts can insert their own profile"
  on public.host_profiles
  for insert
  with check (auth.uid() = user_id);

-- A host can update their own profile
create policy "hosts can update their own profile"
  on public.host_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A host can delete their own profile
create policy "hosts can delete their own profile"
  on public.host_profiles
  for delete
  using (auth.uid() = user_id);
