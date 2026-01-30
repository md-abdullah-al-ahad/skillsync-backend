import { prisma } from "../../lib/prisma";

export const categoryService = {
  /**
   * Get all categories
   */
  getAllCategories: async () => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            tutors: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (categoryId: string) => {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            tutors: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  },

  /**
   * Create a new category
   */
  createCategory: async (data: { name: string; slug: string }) => {
    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });

    if (existingCategory) {
      if (existingCategory.name === data.name) {
        throw new Error("Category with this name already exists");
      }
      if (existingCategory.slug === data.slug) {
        throw new Error("Category with this slug already exists");
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    return category;
  },

  /**
   * Update a category
   */
  updateCategory: async (
    categoryId: string,
    data: { name?: string; slug?: string },
  ) => {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    // Check if new name or slug conflicts with other categories
    if (data.name || data.slug) {
      const conflict = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: categoryId } },
            {
              OR: [
                data.name ? { name: data.name } : {},
                data.slug ? { slug: data.slug } : {},
              ].filter((obj) => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (conflict) {
        if (conflict.name === data.name) {
          throw new Error("Category with this name already exists");
        }
        if (conflict.slug === data.slug) {
          throw new Error("Category with this slug already exists");
        }
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = data.slug;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    return updatedCategory;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (categoryId: string) => {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            tutors: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has tutors
    if (category._count.tutors > 0) {
      throw new Error(
        "Cannot delete category with active tutors. Please reassign tutors first.",
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: "Category deleted successfully" };
  },
};
