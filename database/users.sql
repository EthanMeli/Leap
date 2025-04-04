-- This is a partial update to ensure the users table has a location_name field

-- Add location_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN location_name TEXT;
    END IF;
END $$;

-- Ensure the RLS policies on users are correct
DO $$
BEGIN
    -- Create a policy to ensure users can see and update their own location
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update their own data'
    ) THEN
        CREATE POLICY "Users can update their own data" ON public.users 
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
