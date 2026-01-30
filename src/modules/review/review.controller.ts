import { Request, Response } from "express";
import { reviewService } from "./review.service";

/**
 * Create a review for a completed booking
 * @route POST /api/reviews
 * @access Private (Students only)
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and rating are required",
      });
    }

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    // Validate comment if provided
    if (comment && typeof comment !== "string") {
      return res.status(400).json({
        success: false,
        message: "Comment must be a string",
      });
    }

    const review = await reviewService.createReview({
      bookingId,
      studentId: req.user!.id,
      rating: ratingNum,
      comment: comment || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create review",
    });
  }
};

/**
 * Get reviews for a tutor
 * @route GET /api/reviews/tutor/:tutorProfileId
 * @access Public
 */
export const getTutorReviews = async (req: Request, res: Response) => {
  try {
    const tutorProfileId = req.params.tutorProfileId;
    const { page, limit, minRating } = req.query;

    if (!tutorProfileId || typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid tutor profile ID is required",
      });
    }

    const filters: any = {};
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (minRating) filters.minRating = parseInt(minRating as string);

    const result = await reviewService.getTutorReviews(tutorProfileId, filters);

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch reviews",
    });
  }
};

/**
 * Get review by ID
 * @route GET /api/reviews/:id
 * @access Public
 */
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;

    if (!reviewId || typeof reviewId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid review ID is required",
      });
    }

    const review = await reviewService.getReviewById(reviewId);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch review",
    });
  }
};
