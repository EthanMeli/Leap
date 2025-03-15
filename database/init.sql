-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
    id uuid references auth.users on delete cascade not null primary key,
    email text unique not null,
    name text not null,
    age integer not null check (age >= 18),
    gender text not null check (gender in ('male', 'female')),
    gender_preference text not null check (gender_preference in ('male', 'female', 'both')),
    bio text,
    image text[] default array[]::text[],
    interests text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Matches/Likes table
create table public.matches (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    liked_user_id uuid references public.users(id) on delete cascade,
    is_match boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, liked_user_id)
);

-- Messages table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references public.users(id) on delete cascade,
    receiver_id uuid references public.users(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage bucket for profile images
insert into storage.buckets (id, name, public) 
values ('profile-images', 'profile-images', true);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- Users policies
create policy "Users can view own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "Enable insert for authenticated users"
on public.users for insert
with check (auth.uid() = id);

-- Add view policy for potential matches
create policy "Users can view potential matches"
on public.users for select
using (
  true  -- Temporarily allow all reads for debugging
);

-- Matches policies
create policy "Users can view own matches"
on public.matches for select
using (auth.uid() = user_id or auth.uid() = liked_user_id);

create policy "Users can create matches"
on public.matches for insert
with check (auth.uid() = user_id);

create policy "Users can update own matches"
on public.matches for update
using (auth.uid() = user_id or auth.uid() = liked_user_id);

-- Messages policies
create policy "Users can view their messages"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
on public.messages for insert
with check (auth.uid() = sender_id);

-- Storage policies
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'profile-images');

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
    bucket_id = 'profile-images' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_users_updated_at
    before update on users
    for each row
    execute procedure update_updated_at_column();