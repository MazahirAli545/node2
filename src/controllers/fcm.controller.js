import prisma from "../db/prismaClient.js";

export async function registeredfcmToken(req, res) {
  try {
    const { PR_ID, fcmToken, deviceId } = req.body;

    if (!PR_ID || !fcmToken || !deviceId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }
    const result = await prisma.peopleRegistry.upsert({
      where: {
        PR_ID_deviceId: {
          PR_ID,
          deviceId,
        },
      },
      update: {
        fcmToken,
      },
      create: {
        PR_ID,
        fcmToken,
        deviceId,
      },
    });

    return res.status(200).json({
      message: "FCM Token registered successfully",
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    return res.status(500).json({
      message: "Error registering FCM token",
      success: false,
      error: error.message,
    });
  }
}

export async function removeFcmToken(req, res) {
  try {
    const { fcmToken, deviceId } = req.body;

    if (!fcmToken || !deviceId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const result = await prisma.fcmToken.deleteMany({
      where: {
        fcmToken,
        deviceId,
      },
    });

    return res.status(200).json({
      message: "FCM token removed successfully",
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return res.status(500).json({
      message: "Error removing FCM token",
      success: false,
      error: error.message,
    });
  }
}
