-- DropIndex (recreate as unique instead of regular index)
DROP INDEX IF EXISTS "bookings_booking_code_idx";

-- CreateIndex (as unique constraint)
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");
