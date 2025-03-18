-- Enable PostGIS extension
create extension if not exists postgis;

-- Add location columns to existing users table
alter table public.users 
add column if not exists latitude numeric(10,8),
add column if not exists longitude numeric(11,8),
add column if not exists location_name text;
