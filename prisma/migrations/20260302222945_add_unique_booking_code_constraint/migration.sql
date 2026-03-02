-- CreateIndex
-- Add unique constraint on booking_code column to prevent duplicate booking codes
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");
