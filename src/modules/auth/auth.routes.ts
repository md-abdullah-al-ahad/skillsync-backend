import { Router } from "express";
import { getCurrentUser, updateUserProfile } from "./auth.controller";
import auth from "../../middleware/auth";

const router = Router();

router.get("/me", auth(), getCurrentUser);

router.put("/profile", auth(), updateUserProfile);

export default router;
