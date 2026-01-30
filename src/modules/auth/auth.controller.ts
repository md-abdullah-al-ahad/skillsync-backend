import { Request, Response } from "express";
import { authService } from "./auth.service";

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch user",
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;

    if (!name && !phone) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name or phone) is required",
      });
    }

    if (name && typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name must be a string",
      });
    }

    if (phone && typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Phone must be a string",
      });
    }

    const updatedUser = await authService.updateUserProfile(req.user!.id, {
      name,
      phone,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update profile",
    });
  }
};
