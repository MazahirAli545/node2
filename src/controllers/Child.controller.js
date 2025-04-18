import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create a new child
export const createChild = async (req, res) => {
  try {
    const { name, dob, userId } = req.body;

    if (!name || !dob || !userId) {
      return res.status(400).json({
        message: "Name, dob, and userId are required",
        success: false,
      });
    }

    const parent = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: Number(userId) },
    });

    if (!parent) {
      return res.status(404).json({
        message: "Parent not found",
        success: false,
      });
    }

    const newChild = await prisma.child.create({
      data: {
        name,
        dob: new Date(dob),
        userId: Number(userId),
      },
    });

    return res.status(201).json({
      message: "Child created successfully",
      child: newChild,
      success: true,
    });
  } catch (error) {
    console.error("Error creating child:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Get all children for a user
export const getChildrenByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const children = await prisma.child.findMany({
      where: { userId: Number(userId) },
      orderBy: { dob: "asc" },
    });

    return res.status(200).json({
      message: "Children fetched successfully",
      children,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Get a single child by ID
export const getChildById = async (req, res) => {
  try {
    const childId = req.params.id;

    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return res.status(404).json({
        message: "Child not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Child fetched successfully",
      child,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching child:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Update a child
export const updateChild = async (req, res) => {
  try {
    const childId = req.params.id;
    const { name, dob } = req.body;

    if (!name && !dob) {
      return res.status(400).json({
        message: "At least one field (name or dob) is required for update",
        success: false,
      });
    }

    const existingChild = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!existingChild) {
      return res.status(404).json({
        message: "Child not found",
        success: false,
      });
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        name: name || existingChild.name,
        dob: dob ? new Date(dob) : existingChild.dob,
      },
    });

    return res.status(200).json({
      message: "Child updated successfully",
      child: updatedChild,
      success: true,
    });
  } catch (error) {
    console.error("Error updating child:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Delete a child
export const deleteChild = async (req, res) => {
  try {
    const childId = req.params.id;

    const existingChild = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!existingChild) {
      return res.status(404).json({
        message: "Child not found",
        success: false,
      });
    }

    await prisma.child.delete({
      where: { id: childId },
    });

    return res.status(200).json({
      message: "Child deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting child:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export default {
  createChild,
  getChildrenByUser,
  getChildById,
  updateChild,
  deleteChild,
};
