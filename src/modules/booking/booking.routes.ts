import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
} from "./booking.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// Create booking (Students only)
router.post("/", auth(UserRole.STUDENT), createBooking);

// Get user's bookings (Students see their bookings, Tutors see their sessions)
router.get("/", auth(), getUserBookings);

// Get specific booking details
router.get("/:id", auth(), getBookingById);

// Update booking status
router.patch("/:id", auth(), updateBookingStatus);

export default router;
