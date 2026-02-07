import { Router } from "express";
import {
  addTutorAvailability,
  deleteTutorAvailability,
  getAllTutors,
  getTutorById,
  getTutorAvailability,
  getMyTutorProfile,
  updateTutorProfile,
  updateTutorAvailability,
} from "./tutor.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// Tutor management routes (Tutors only)
router.get("/profile/me", auth(UserRole.TUTOR), getMyTutorProfile);
router.put("/profile", auth(UserRole.TUTOR), updateTutorProfile);
router.get("/availability", auth(UserRole.TUTOR), getTutorAvailability);
router.post("/availability", auth(UserRole.TUTOR), addTutorAvailability);
router.delete(
  "/availability/:id",
  auth(UserRole.TUTOR),
  deleteTutorAvailability,
);
router.put("/availability", auth(UserRole.TUTOR), updateTutorAvailability);

// Public routes - Browse tutors
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

export default router;
