-- Add number_of_guests field to bookings table
-- This allows multiple bookings for the same cabin and dates as long as total guests don't exceed capacity

ALTER TABLE bookings 
ADD COLUMN number_of_guests INTEGER NOT NULL DEFAULT 1;

-- Add constraint to ensure number_of_guests is positive
ALTER TABLE bookings
ADD CONSTRAINT positive_guests CHECK (number_of_guests > 0);

-- Add comment
COMMENT ON COLUMN bookings.number_of_guests IS 'Number of guests for this booking. Used to check capacity when multiple bookings share the same dates.';
