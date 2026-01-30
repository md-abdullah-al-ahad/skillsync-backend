import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getStats,
} from "./admin.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

router.get("/users", auth(UserRole.ADMIN), getAllUsers);
router.patch("/users/:id", auth(UserRole.ADMIN), updateUserStatus);
router.get("/bookings", auth(UserRole.ADMIN), getAllBookings);
router.get("/stats", auth(UserRole.ADMIN), getStats);

export default router;
