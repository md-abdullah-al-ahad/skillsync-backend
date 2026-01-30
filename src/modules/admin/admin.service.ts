import { prisma } from "../../lib/prisma";
import type { UserStatus } from "../../../generated/prisma";

export const adminService = {
  getAllUsers: async (filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          emailVerified: true,
          createdAt: true,
          tutorProfile: {
            select: {
              id: true,
              ratingAvg: true,
              ratingCount: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  updateUserStatus: async (userId: string, status: UserStatus) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "ADMIN") {
      throw new Error("Cannot modify admin user status");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return updatedUser;
  },

  getAllBookings: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          price: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tutorProfile: {
            select: {
              id: true,
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
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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

  getStats: async () => {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalBookings,
      completedBookings,
      totalRevenue,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { price: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        tutors: totalTutors,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: totalBookings - completedBookings,
      },
      revenue: {
        total: totalRevenue._sum.price || 0,
      },
      recentUsers,
    };
  },
};
