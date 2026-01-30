import { Router } from "express";
import {
  createReview,
  getTutorReviews,
  getReviewById,
} from "./review.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// Create review (Students only, for completed bookings)
router.post("/", auth(UserRole.STUDENT), createReview);

// Get reviews for a tutor (Public)
router.get("/tutor/:tutorProfileId", getTutorReviews);

// Get review by ID (Public)
router.get("/:id", getReviewById);

export default router;
