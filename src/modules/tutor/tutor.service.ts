import { prisma } from "../../lib/prisma";

export const tutorService = {
  /**
   * Get all tutors with filters and search
   */
  getAllTutors: async (filters?: {
    category?: string;
    minPrice?: number;
    minRating?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      user: {
        status: "ACTIVE",
        role: "TUTOR",
      },
    };

    // Filter by category
    if (filters?.category) {
      where.categories = {
        some: {
          category: {
            slug: filters.category,
          },
        },
      };
    }

    // Filter by minimum rating
    if (filters?.minRating !== undefined) {
      where.ratingAvg = { gte: filters.minRating };
    }

    // Filter by price range
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.hourlyRate = {
        ...(filters?.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters?.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      };
    }

    // Search by tutor name or category
    if (filters?.search) {
      const search = filters.search;
      where.OR = [
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          categories: {
            some: {
              category: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
        {
          categories: {
            some: {
              category: {
                slug: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { ratingAvg: "desc" },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    return {
      tutors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get tutor by ID with detailed information
   */
  getTutorById: async (tutorProfileId: string) => {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
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
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: "asc" },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!tutor) {
      throw new Error("Tutor not found");
    }

    if (tutor.user.status !== "ACTIVE") {
      throw new Error("Tutor profile is not active");
    }

    return tutor;
  },

  /**
   * Update tutor profile
   */
  updateTutorProfile: async (
    userId: string,
    data: {
      bio?: string;
      hourlyRate?: number;
      experience?: number;
      categoryIds?: string[];
    },
  ) => {
    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    // Validate hourly rate
    if (data.hourlyRate !== undefined && data.hourlyRate < 0) {
      throw new Error("Hourly rate must be a positive number");
    }

    // Validate experience
    if (data.experience !== undefined && data.experience < 0) {
      throw new Error("Experience must be a positive number");
    }

    // Update profile
    const updateData: any = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.experience !== undefined) updateData.experience = data.experience;

    const updatedProfile = await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    // Update categories if provided
    if (data.categoryIds && data.categoryIds.length > 0) {
      // Validate categories exist
      const categories = await prisma.category.findMany({
        where: { id: { in: data.categoryIds } },
      });

      if (categories.length !== data.categoryIds.length) {
        throw new Error("One or more categories not found");
      }

      // Delete existing categories
      await prisma.tutorCategory.deleteMany({
        where: { tutorProfileId: tutorProfile.id },
      });

      // Add new categories
      await prisma.tutorCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({
          tutorProfileId: tutorProfile.id,
          categoryId,
        })),
      });

      // Fetch updated profile with new categories
      return prisma.tutorProfile.findUnique({
        where: { id: tutorProfile.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
      });
    }

    return updatedProfile;
  },

  /**
   * Update tutor availability
   */
  updateTutorAvailability: async (
    userId: string,
    availability: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>,
  ) => {
    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    // Validate day of week
    const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    for (const slot of availability) {
      if (!validDays.includes(slot.dayOfWeek)) {
        throw new Error(`Invalid day of week: ${slot.dayOfWeek}`);
      }
    }

    // Delete existing availability
    await prisma.availabilitySlot.deleteMany({
      where: { tutorProfileId: tutorProfile.id },
    });

    // Create new availability slots
    await prisma.availabilitySlot.createMany({
      data: availability.map((slot) => ({
        tutorProfileId: tutorProfile.id,
        dayOfWeek: slot.dayOfWeek as any,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      })),
    });

    // Fetch updated availability
    const updatedAvailability = await prisma.availabilitySlot.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return updatedAvailability;
  },

  /**
   * Get tutor availability for the authenticated tutor
   */
  getTutorAvailability: async (userId: string) => {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    return prisma.availabilitySlot.findMany({
      where: { tutorProfileId: tutorProfile.id },
      orderBy: { dayOfWeek: "asc" },
    });
  },

  /**
   * Add a single availability slot
   */
  addTutorAvailability: async (
    userId: string,
    slot: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      isActive?: boolean;
    },
  ) => {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    return prisma.availabilitySlot.create({
      data: {
        tutorProfileId: tutorProfile.id,
        dayOfWeek: slot.dayOfWeek as any,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive ?? true,
      },
    });
  },

  /**
   * Delete an availability slot by id
   */
  deleteTutorAvailability: async (userId: string, slotId: string) => {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    const slot = await prisma.availabilitySlot.findFirst({
      where: { id: slotId, tutorProfileId: tutorProfile.id },
    });

    if (!slot) {
      throw new Error("Availability slot not found");
    }

    await prisma.availabilitySlot.delete({
      where: { id: slotId },
    });

    return slot;
  },

  /**
   * Get tutor's own profile (for tutor dashboard)
   */
  getMyTutorProfile: async (userId: string) => {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            status: true,
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
        availability: {
          orderBy: { dayOfWeek: "asc" },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found");
    }

    // Get booking statistics
    const [upcomingSessions, completedSessions, totalEarnings] =
      await Promise.all([
        prisma.booking.count({
          where: {
            tutorProfileId: tutorProfile.id,
            status: "CONFIRMED",
            startTime: { gt: new Date() },
          },
        }),
        prisma.booking.count({
          where: {
            tutorProfileId: tutorProfile.id,
            status: "COMPLETED",
          },
        }),
        prisma.booking.aggregate({
          where: {
            tutorProfileId: tutorProfile.id,
            status: "COMPLETED",
          },
          _sum: { price: true },
        }),
      ]);

    return {
      ...tutorProfile,
      stats: {
        upcomingSessions,
        completedSessions,
        totalEarnings: totalEarnings._sum.price || 0,
      },
    };
  },
};
