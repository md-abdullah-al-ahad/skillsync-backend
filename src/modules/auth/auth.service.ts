import { prisma } from "../../lib/prisma";

export const authService = {
  getUserById: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        tutorProfile: {
          select: {
            id: true,
            bio: true,
            hourlyRate: true,
            experience: true,
            ratingAvg: true,
            ratingCount: true,
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
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
  updateUserProfile: async (
    userId: string,
    data: { name?: string; phone?: string },
  ) => {
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
        role: true,
        phone: true,
        status: true,
        emailVerified: true,
        image: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },
};
