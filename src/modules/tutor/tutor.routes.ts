import { Router } from "express";
import {
  getAllTutors,
  getTutorById,
  getMyTutorProfile,
  updateTutorProfile,
  updateTutorAvailability,
} from "./tutor.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// Public routes - Browse tutors
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

// Tutor management routes (Tutors only)
router.get("/profile/me", auth(UserRole.TUTOR), getMyTutorProfile);
router.put("/profile", auth(UserRole.TUTOR), updateTutorProfile);
router.put("/availability", auth(UserRole.TUTOR), updateTutorAvailability);

export default router;
