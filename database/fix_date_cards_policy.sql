-- Script to add missing insert policy for date_cards table
-- Run this on your Supabase instance to fix the row-level security error

-- Drop any existing policy with the same name
DROP POLICY IF EXISTS "Match participants can insert date cards" ON public.date_cards;

-- Create the insert policy
CREATE POLICY "Match participants can insert date cards" ON public.date_cards 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = match_id
        AND (auth.uid() = matches.user_id OR auth.uid() = matches.liked_user_id)
    )
);

-- The policy has now been created
BEGIN
    RAISE NOTICE 'INSERT policy has been created for date_cards table';
END $$;
