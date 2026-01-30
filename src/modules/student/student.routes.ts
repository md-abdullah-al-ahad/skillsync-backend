import { Router } from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  getStudentBookings,
} from "./student.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// All routes are for students only
router.get("/profile", auth(UserRole.STUDENT), getStudentProfile);
router.put("/profile", auth(UserRole.STUDENT), updateStudentProfile);
router.get("/bookings", auth(UserRole.STUDENT), getStudentBookings);

export default router;
