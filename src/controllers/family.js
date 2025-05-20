// // routes/family.js
// import express from "express";
// import { getNextFamilyNumber } from "../utils/getNextFamilyNumber.js";

// const router = express.Router();

// router.get("/family-number", async (req, res) => {
//   try {
//     const { state, district, city } = req.query;

//     if (!state || !district || !city) {
//       return res.status(400).json({
//         success: false,
//         message: "State, district, and city are required.",
//       });
//     }

//     const nextFamilyNumber = await getNextFamilyNumber(
//       state,
//       district,
//       parseInt(city)
//     );
//     res.status(200).json({
//       success: true,
//       familyNumber: nextFamilyNumber,
//     });
//   } catch (error) {
//     console.error("Error fetching next family number:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// export default router;
