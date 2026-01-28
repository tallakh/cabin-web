-- Add RLS policy to allow all authenticated users to read approved and pending bookings
-- This is needed for the calendar view where all users should see all pending and approved bookings

-- Policy: All authenticated users can read approved and pending bookings (for calendar view)
CREATE POLICY "Users can read approved and pending bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (status = 'approved' OR status = 'pending')
  );
