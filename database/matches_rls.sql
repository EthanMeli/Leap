-- Ensure RLS is enabled on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
DROP POLICY IF EXISTS "Users can insert their matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;
DROP POLICY IF EXISTS "Users can delete their matches" ON public.matches;

-- 1. SELECT policy: Users can view matches they are part of
CREATE POLICY "Users can view their matches"
ON public.matches FOR SELECT
USING (
    auth.uid() = user_id OR auth.uid() = liked_user_id
);

-- 2. INSERT policy: Users can create matches where they are the initiator
CREATE POLICY "Users can insert their matches"
ON public.matches FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- 3. UPDATE policy: Users can update matches they are part of
CREATE POLICY "Users can update their matches"
ON public.matches FOR UPDATE
USING (
    auth.uid() = user_id OR auth.uid() = liked_user_id
);

-- 4. DELETE policy: Users can delete matches they are part of
CREATE POLICY "Users can delete their matches"
ON public.matches FOR DELETE
USING (
    auth.uid() = user_id OR auth.uid() = liked_user_id
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS matches_user_id_idx ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS matches_liked_user_id_idx ON public.matches(liked_user_id);
CREATE INDEX IF NOT EXISTS matches_is_match_idx ON public.matches(is_match);
