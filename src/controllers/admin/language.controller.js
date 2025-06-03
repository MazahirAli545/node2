// import prisma from '../../db/prismaClient.js'; // your Prisma client instance

// export const getTranslations = async (req, res) => {
//   const { locale } = req.params;

//   if (!["en", "hi"].includes(locale)) {
//     return res.status(400).json({ success: false, message: "Unsupported locale" });
//   }

//   try {
//     const content = await prisma.languageContent.findMany();

//     const translations = content.reduce((acc, item) => {
//       acc[item.key] = item[locale];
//       return acc;
//     }, {});

//     return res.status(200).json({
//       success: true,
//       message: "Translations fetched successfully",
//       data: translations
//     });
//   } catch (error) {
//     console.error("Error fetching translations:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
