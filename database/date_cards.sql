-- Date cards table with all necessary policies
-- Complete script for dropping and recreating the table with proper security

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.date_cards CASCADE;

-- Create the date_cards table
CREATE TABLE public.date_cards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    location_name text NOT NULL,
    location_address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    scheduled_date timestamp with time zone NOT NULL,
    image_url text,
    interest_category text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add trigger for updated_at column
CREATE TRIGGER update_date_cards_updated_at
    BEFORE UPDATE ON public.date_cards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable row level security
ALTER TABLE public.date_cards ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- 1. SELECT policy: Users can view date cards for matches they are part of
CREATE POLICY "Users can view their date cards"
ON public.date_cards FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = date_cards.match_id
        AND (auth.uid() = matches.user_id OR auth.uid() = matches.liked_user_id)
    )
);

-- 2. INSERT policy: Users can create date cards for matches they are part of
CREATE POLICY "Match participants can insert date cards"
ON public.date_cards FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = match_id
        AND (auth.uid() = matches.user_id OR auth.uid() = matches.liked_user_id)
    )
);

-- 3. UPDATE policy: Users can update date cards for matches they are part of
CREATE POLICY "Match participants can update date cards"
ON public.date_cards FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = date_cards.match_id
        AND (auth.uid() = matches.user_id OR auth.uid() = matches.liked_user_id)
    )
);

-- 4. DELETE policy: Users can delete date cards for matches they are part of
CREATE POLICY "Match participants can delete date cards"
ON public.date_cards FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = date_cards.match_id
        AND (auth.uid() = matches.user_id OR auth.uid() = matches.liked_user_id)
    )
);

-- Create an index for fast lookups by match_id
CREATE INDEX IF NOT EXISTS date_cards_match_id_idx ON public.date_cards(match_id);

-- Add a comment to explain the table's purpose
COMMENT ON TABLE public.date_cards IS 'Stores date suggestions for matched users';
