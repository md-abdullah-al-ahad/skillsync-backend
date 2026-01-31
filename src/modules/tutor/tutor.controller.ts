import { Request, Response } from "express";
import { tutorService } from "./tutor.service";

/**
 * Get all tutors with filters
 * @route GET /api/tutors
 * @access Public
 */
export const getAllTutors = async (req: Request, res: Response) => {
  try {
    const { category, minRating, maxPrice, search, page, limit } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (minRating) filters.minRating = parseFloat(minRating as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    if (search) filters.search = search as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await tutorService.getAllTutors(filters);

    res.status(200).json({
      success: true,
      data: result.tutors,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch tutors",
    });
  }
};

/**
 * Get tutor by ID
 * @route GET /api/tutors/:id
 * @access Public
 */
export const getTutorById = async (req: Request, res: Response) => {
  try {
    const tutorProfileId = req.params.id;

    if (!tutorProfileId || typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid tutor ID is required",
      });
    }

    const tutor = await tutorService.getTutorById(tutorProfileId);

    res.status(200).json({
      success: true,
      data: tutor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch tutor",
    });
  }
};

/**
 * Get my tutor profile (for tutor dashboard)
 * @route GET /api/tutor/profile
 * @access Private (Tutors only)
 */
export const getMyTutorProfile = async (req: Request, res: Response) => {
  try {
    const profile = await tutorService.getMyTutorProfile(req.user!.id);

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
 * Update tutor profile
 * @route PUT /api/tutor/profile
 * @access Private (Tutors only)
 */
export const updateTutorProfile = async (req: Request, res: Response) => {
  try {
    const { bio, hourlyRate, experience, categoryIds } = req.body;

    // Validate hourly rate
    if (hourlyRate !== undefined) {
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({
          success: false,
          message: "Hourly rate must be a positive number",
        });
      }
    }

    // Validate experience
    if (experience !== undefined) {
      const exp = parseInt(experience);
      if (isNaN(exp) || exp < 0) {
        return res.status(400).json({
          success: false,
          message: "Experience must be a positive number",
        });
      }
    }

    // Validate categoryIds
    if (categoryIds !== undefined) {
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({
          success: false,
          message: "Category IDs must be an array",
        });
      }
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (hourlyRate !== undefined)
      updateData.hourlyRate = parseFloat(hourlyRate);
    if (experience !== undefined) updateData.experience = parseInt(experience);
    if (categoryIds !== undefined) updateData.categoryIds = categoryIds;

    const updatedProfile = await tutorService.updateTutorProfile(
      req.user!.id,
      updateData,
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
 * Update tutor availability
 * @route PUT /api/tutor/availability
 * @access Private (Tutors only)
 */
export const updateTutorAvailability = async (req: Request, res: Response) => {
  try {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be an array",
      });
    }

    // Validate each slot
    for (const slot of availability) {
      if (!slot.dayOfWeek || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message:
            "Each availability slot must have dayOfWeek, startTime, and endTime",
        });
      }
    }

    const updatedAvailability = await tutorService.updateTutorAvailability(
      req.user!.id,
      availability,
    );

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: updatedAvailability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update availability",
    });
  }
};
