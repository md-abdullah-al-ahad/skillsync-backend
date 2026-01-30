import { prisma } from "../../lib/prisma";

export const studentService = {
  /**
   * Get student profile with booking statistics
   */
  getStudentProfile: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("Student profile not found");
    }

    if (user.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    // Get booking statistics
    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: { studentId: userId } }),
      prisma.booking.count({
        where: {
          studentId: userId,
          status: "CONFIRMED",
          startTime: { gt: new Date() },
        },
      }),
      prisma.booking.count({
        where: { studentId: userId, status: "COMPLETED" },
      }),
      prisma.booking.count({
        where: { studentId: userId, status: "CANCELLED" },
      }),
    ]);

    return {
      ...user,
      stats: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
      },
    };
  },

  /**
   * Update student profile
   */
  updateStudentProfile: async (
    userId: string,
    data: { name?: string; phone?: string },
  ) => {
    // Verify user is a student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "STUDENT") {
      throw new Error("User is not a student");
    }

    // Validate at least one field is provided
    if (!data.name && !data.phone) {
      throw new Error("At least one field (name or phone) is required");
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  /**
   * Get student's bookings with filters
   */
  getStudentBookings: async (
    userId: string,
    filters?: {
      status?: string;
      upcoming?: boolean;
      page?: number;
      limit?: number;
    },
  ) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      studentId: userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.upcoming) {
      where.startTime = { gt: new Date() };
      where.status = "CONFIRMED";
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          tutorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  image: true,
                },
              },
              categories: {
                select: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
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
};
