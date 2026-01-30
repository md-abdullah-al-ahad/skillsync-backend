import { Request, Response } from "express";
import { bookingService } from "./booking.service";

/**
 * Create a new booking
 * @route POST /api/bookings
 * @access Private (Students only)
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { tutorProfileId, startTime, endTime, price } = req.body;

    // Validate required fields
    if (!tutorProfileId || !startTime || !endTime || !price) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: tutorProfileId, startTime, endTime, price",
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    const booking = await bookingService.createBooking({
      studentId: req.user!.id,
      tutorProfileId,
      startTime: start,
      endTime: end,
      price: priceNum,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create booking",
    });
  }
};

/**
 * Get user's bookings
 * @route GET /api/bookings
 * @access Private
 */
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await bookingService.getUserBookings(
      req.user!.id,
      req.user!.role,
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

/**
 * Get booking by ID
 * @route GET /api/bookings/:id
 * @access Private
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId || typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid booking ID is required",
      });
    }

    const booking = await bookingService.getBookingById(
      bookingId,
      req.user!.id,
      req.user!.role,
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch booking",
    });
  }
};

/**
 * Update booking status
 * @route PATCH /api/bookings/:id
 * @access Private
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;

    if (!bookingId || typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid booking ID is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updatedBooking = await bookingService.updateBookingStatus(
      bookingId,
      req.user!.id,
      req.user!.role,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update booking status",
    });
  }
};
