import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

export async function getProfessions(req, res) {
  try {
    const professions = await prisma.profession.findMany();
    return res.status(200).json({
      message: "Professions fetched successfully",
      success: true,
      professions,
    });
  } catch (error) {
    console.error("Error fetching professions:", error);
    return res.status(500).json({
      message: "Error fetching professions",
      success: false,
      error: error.message,
    });
  }
}

export async function createProfession(req, res) {
  try {
    const { PROF_NAME, PROF_DESC, PROF_ACTIVE_YN, PROF_CREATED_BY } = req.body;
    const newProfession = await prisma.profession.create({
      data: {
        PROF_NAME,
        PROF_DESC,
        PROF_ACTIVE_YN,
        PROF_CREATED_BY,
      },
    });

    return res.status(201).json({
      message: "Profession created successfully",
      success: true,
      profession: newProfession,
    });
  } catch (error) {
    console.error("Error creating profession:", error);
    return res.status(500).json({
      message: "Error creating profession",
      success: false,
      error: error.message,
    });
  }
}

export async function updateProfession(req, res) {
  try {
    const { PROF_ID } = req.params;
    const updateData = req.body;

    const updatedProfession = await prisma.profession.update({
      where: { PROF_ID: Number(PROF_ID) },
      data: updateData,
    });
    return res.status(200).json({
      message: "Profession updated successfully",
      success: true,
      profession: updatedProfession,
    });
  } catch (error) {
    console.error("Error updating profession:", error);
    return res.status(500).json({
      message: "Error updating profession",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteProfession(req, res) {
  try {
    const { PROF_ID } = req.params;

    await prisma.profession.delete({
      where: { PROF_ID: Number(PROF_ID) },
    });

    return res.status(200).json({
      message: "Profession deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting profession:", error);
    return res.status(500).json({
      message: "Error deleting profession",
      success: false,
      error: error.message,
    });
  }
}

// import { PrismaClient } from "@prisma/client";
// import express from "express";
// import cookieParser from "cookie-parser";

// const app = express();
// const prisma = new PrismaClient();

// app.use(express.json());
// app.use(cookieParser());

// // 🔥 Helper function to update professions cookie
// async function setProfessionsCookie(res) {
//   const professions = await prisma.profession.findMany();
//   res.cookie("professionsData", JSON.stringify(professions), {
//     httpOnly: false, // allow frontend to access
//     maxAge: 24 * 60 * 60 * 1000, // 1 day
//     sameSite: "Lax",
//     secure: false, // true if HTTPS
//   });
// }

// // 🛠 Get Professions
// export async function getProfessions(req, res) {
//   try {
//     const professions = await prisma.profession.findMany();

//     // ✅ Set cookie with current professions list
//     res.cookie("professionsData", JSON.stringify(professions), {
//       httpOnly: false,
//       maxAge: 24 * 60 * 60 * 1000,
//       sameSite: "Lax",
//       secure: false,
//     });

//     return res.status(200).json({
//       message: "Professions fetched successfully",
//       success: true,
//       professions,
//     });
//   } catch (error) {
//     console.error("Error fetching professions:", error);
//     return res.status(500).json({
//       message: "Error fetching professions",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// // 🛠 Create Profession
// export async function createProfession(req, res) {
//   try {
//     const { PROF_NAME, PROF_DESC, PROF_ACTIVE_YN, PROF_CREATED_BY } = req.body;

//     const newProfession = await prisma.profession.create({
//       data: {
//         PROF_NAME,
//         PROF_DESC,
//         PROF_ACTIVE_YN,
//         PROF_CREATED_BY,
//       },
//     });

//     // ✅ Update cookie after creating
//     await setProfessionsCookie(res);

//     return res.status(201).json({
//       message: "Profession created successfully",
//       success: true,
//       profession: newProfession,
//     });
//   } catch (error) {
//     console.error("Error creating profession:", error);
//     return res.status(500).json({
//       message: "Error creating profession",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// // 🛠 Update Profession
// export async function updateProfession(req, res) {
//   try {
//     const { PROF_ID } = req.params;
//     const updateData = req.body;

//     const updatedProfession = await prisma.profession.update({
//       where: { PROF_ID: Number(PROF_ID) },
//       data: updateData,
//     });

//     // ✅ Update cookie after updating
//     await setProfessionsCookie(res);

//     return res.status(200).json({
//       message: "Profession updated successfully",
//       success: true,
//       profession: updatedProfession,
//     });
//   } catch (error) {
//     console.error("Error updating profession:", error);
//     return res.status(500).json({
//       message: "Error updating profession",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// // 🛠 Delete Profession
// export async function deleteProfession(req, res) {
//   try {
//     const { PROF_ID } = req.params;

//     await prisma.profession.delete({
//       where: { PROF_ID: Number(PROF_ID) },
//     });

//     // ✅ Update cookie after deleting
//     await setProfessionsCookie(res);

//     return res.status(200).json({
//       message: "Profession deleted successfully",
//       success: true,
//     });
//   } catch (error) {
//     console.error("Error deleting profession:", error);
//     return res.status(500).json({
//       message: "Error deleting profession",
//       success: false,
//       error: error.message,
//     });
//   }
// }
