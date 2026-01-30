import { Request, Response } from "express";
import { studentService } from "./student.service";

/**
 * Get student profile
 * @route GET /api/student/profile
 * @access Private (Students only)
 */
export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const profile = await studentService.getStudentProfile(req.user!.id);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

/**
 * Update student profile
 * @route PUT /api/student/profile
 * @access Private (Students only)
 */
export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;

    // Validate input
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

    const updatedProfile = await studentService.updateStudentProfile(
      req.user!.id,
      { name, phone },
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update profile",
    });
  }
};

/**
 * Get student's bookings
 * @route GET /api/student/bookings
 * @access Private (Students only)
 */
export const getStudentBookings = async (req: Request, res: Response) => {
  try {
    const { status, upcoming, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (upcoming) filters.upcoming = upcoming === "true";
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await studentService.getStudentBookings(
      req.user!.id,
      filters,
    );

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch bookings",
    });
  }
};
