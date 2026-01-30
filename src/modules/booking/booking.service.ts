import { prisma } from "../../lib/prisma";

export const bookingService = {
  /**
   * Create a new booking
   */
  createBooking: async (data: {
    studentId: string;
    tutorProfileId: string;
    startTime: Date;
    endTime: Date;
    price: number;
  }) => {
    // Validate tutor profile exists
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: data.tutorProfileId },
      include: { user: true },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    // Check if student is trying to book themselves
    if (tutorProfile.userId === data.studentId) {
      throw new Error("You cannot book a session with yourself");
    }

    // Validate time
    if (data.startTime >= data.endTime) {
      throw new Error("End time must be after start time");
    }

    if (data.startTime < new Date()) {
      throw new Error("Cannot book sessions in the past");
    }

    // Check for conflicts with existing bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        tutorProfileId: data.tutorProfileId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new Error(
        "This time slot is already booked. Please choose a different time.",
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId: data.studentId,
        tutorProfileId: data.tutorProfileId,
        startTime: data.startTime,
        endTime: data.endTime,
        price: data.price,
        status: "CONFIRMED",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return booking;
  },

  /**
   * Get user's bookings (as student or tutor)
   */
  getUserBookings: async (
    userId: string,
    role: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    // Get bookings based on role
    if (role === "STUDENT") {
      where.studentId = userId;
    } else if (role === "TUTOR") {
      // Get tutor profile first
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId },
      });

      if (!tutorProfile) {
        throw new Error("Tutor profile not found");
      }

      where.tutorProfileId = tutorProfile.id;
    } else {
      throw new Error("Invalid role for booking access");
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          tutorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          review: role === "STUDENT",
        },
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId: string, userId: string, role: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check authorization
    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutorProfile.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isStudent && !isTutor && !isAdmin) {
      throw new Error("You don't have permission to view this booking");
    }

    return booking;
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (
    bookingId: string,
    userId: string,
    role: string,
    status: string,
  ) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutorProfile: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Validate status
    if (!["CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      throw new Error("Invalid booking status");
    }

    // Authorization checks
    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutorProfile.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isStudent && !isTutor && !isAdmin) {
      throw new Error("You don't have permission to update this booking");
    }

    // Business logic for status changes
    if (status === "COMPLETED") {
      // Only tutors can mark as completed
      if (!isTutor && !isAdmin) {
        throw new Error("Only tutors can mark bookings as completed");
      }

      // Can only complete confirmed bookings
      if (booking.status !== "CONFIRMED") {
        throw new Error("Only confirmed bookings can be marked as completed");
      }

      // Check if session time has passed
      if (booking.endTime > new Date()) {
        throw new Error("Cannot mark future bookings as completed");
      }
    }

    if (status === "CANCELLED") {
      // Cannot cancel completed bookings
      if (booking.status === "COMPLETED") {
        throw new Error("Cannot cancel completed bookings");
      }

      // Cannot cancel already cancelled bookings
      if (booking.status === "CANCELLED") {
        throw new Error("Booking is already cancelled");
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as any },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedBooking;
  },
};
