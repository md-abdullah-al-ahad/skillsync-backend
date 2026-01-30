import { Request, Response } from "express";
import { adminService } from "./admin.service";
import type { UserStatus } from "../../../generated/prisma";

/**
 * Get all users with optional filters
 * @route GET /api/admin/users
 * @access Admin only
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, page, limit } = req.query;

    const filters: any = {};
    if (role) filters.role = role as string;
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await adminService.getAllUsers(filters);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
};

/**
 * Update user status (ban/unban)
 * @route PATCH /api/admin/users/:id
 * @access Admin only
 */
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    if (!status || (status !== "ACTIVE" && status !== "BANNED")) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (ACTIVE or BANNED)",
      });
    }

    const validStatus = status as UserStatus;
    const updatedUser = await adminService.updateUserStatus(
      userId,
      validStatus,
    );

    res.status(200).json({
      success: true,
      message: `User ${status === "BANNED" ? "banned" : "activated"} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update user status",
    });
  }
};

/**
 * Get all bookings with filters
 * @route GET /api/admin/bookings
 * @access Admin only
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await adminService.getAllBookings(filters);

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
 * Get platform statistics
 * @route GET /api/admin/stats
 * @access Admin only
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch statistics",
    });
  }
};
