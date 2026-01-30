import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin only routes
router.post("/", auth(UserRole.ADMIN), createCategory);
router.put("/:id", auth(UserRole.ADMIN), updateCategory);
router.delete("/:id", auth(UserRole.ADMIN), deleteCategory);

export default router;
