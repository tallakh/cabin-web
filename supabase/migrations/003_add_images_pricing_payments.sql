-- Add image and pricing fields to cabins table
ALTER TABLE cabins 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS nightly_fee DECIMAL(10,2) DEFAULT 0;

-- Add payment fields to bookings table
-- Check if payment_status type exists, create if not
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS vipps_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Update RLS policies to allow reading payment status (users can see their own booking payment status)
-- Existing policies should cover this, but we ensure payment fields are accessible

-- Note: Supabase Storage bucket 'cabin-images' needs to be created manually in the dashboard
-- Storage policies will be set up through Supabase Dashboard or via API
