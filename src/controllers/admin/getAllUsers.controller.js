import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import dotenv from "dotenv";
import prisma from "../../db/prismaClient.js";

export const getAllUsers = async (req, res) => {
    try {
      const users = await prisma.peopleRegistry.findMany({
        include: {
          Children: true, // includes related children
          City: true,     // includes city name & code
          Profession: true, // includes profession
          BUSSINESS: true,  // includes business details
          Contact: true,    // includes contact info if needed
        },
        orderBy: {
          PR_ID: "desc",
        },
      });
  
      return res.status(200).json({
        success: true,
        message: "All users fetched successfully",
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  };