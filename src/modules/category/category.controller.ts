import { Request, Response } from "express";
import { categoryService } from "./category.service";

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
    });
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id;

    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
      });
    }

    const category = await categoryService.getCategoryById(categoryId);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch category",
    });
  }
};

/**
 * Create new category
 * @route POST /api/categories
 * @access Admin only
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    if (typeof name !== "string" || typeof slug !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name and slug must be strings",
      });
    }

    // Validate slug format (lowercase, alphanumeric with hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        message:
          "Slug must be lowercase alphanumeric with hyphens (e.g., web-development)",
      });
    }

    const category = await categoryService.createCategory({ name, slug });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create category",
    });
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Admin only
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id;
    const { name, slug } = req.body;

    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
      });
    }

    if (!name && !slug) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name or slug) is required",
      });
    }

    if (name && typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name must be a string",
      });
    }

    if (slug) {
      if (typeof slug !== "string") {
        return res.status(400).json({
          success: false,
          message: "Slug must be a string",
        });
      }

      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({
          success: false,
          message:
            "Slug must be lowercase alphanumeric with hyphens (e.g., web-development)",
        });
      }
    }

    const updatedCategory = await categoryService.updateCategory(categoryId, {
      name,
      slug,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update category",
    });
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Admin only
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id;

    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
      });
    }

    const result = await categoryService.deleteCategory(categoryId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete category",
    });
  }
};
