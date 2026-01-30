import { prisma } from "../../lib/prisma";

export const reviewService = {
  /**
   * Create a review for a completed booking
   */
  createReview: async (data: {
    bookingId: string;
    studentId: string;
    rating: number;
    comment?: string;
  }) => {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        review: true,
        tutorProfile: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Verify student owns this booking
    if (booking.studentId !== data.studentId) {
      throw new Error("You can only review your own bookings");
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      throw new Error("You can only review completed bookings");
    }

    // Check if review already exists
    if (booking.review) {
      throw new Error("You have already reviewed this booking");
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        studentId: data.studentId,
        tutorProfileId: booking.tutorProfileId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update tutor's rating average
    await updateTutorRating(booking.tutorProfileId);

    return review;
  },

  /**
   * Get reviews for a tutor
   */
  getTutorReviews: async (
    tutorProfileId: string,
    filters?: {
      page?: number;
      limit?: number;
      minRating?: number;
    },
  ) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tutorProfileId,
    };

    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get review by ID
   */
  getReviewById: async (reviewId: string) => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    return review;
  },
};

/**
 * Helper function to update tutor's rating average
 */
async function updateTutorRating(tutorProfileId: string) {
  // Calculate average rating
  const result = await prisma.review.aggregate({
    where: { tutorProfileId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingAvg = result._avg.rating || 0;
  const ratingCount = result._count.rating || 0;

  // Update tutor profile
  await prisma.tutorProfile.update({
    where: { id: tutorProfileId },
    data: {
      ratingAvg,
      ratingCount,
    },
  });
}
