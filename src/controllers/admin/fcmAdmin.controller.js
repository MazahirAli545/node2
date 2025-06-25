import prisma from "../../db/prismaClient.js";

// Register FCM token without PR_ID
export async function adminRegisterFcmToken(req, res) {
  try {
    const { fcmToken, deviceId } = req.body;
    if (!fcmToken || !deviceId) {
      return res
        .status(400)
        .json({ message: "Missing required fields", success: false });
    }
    await prisma.fcmToken.deleteMany({ where: { deviceId, fcmToken } });
    const result = await prisma.fcmToken.create({
      data: { fcmToken, deviceId },
    });
    return res.status(200).json({
      message: "FCM Token registered successfully",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error registering FCM token",
      success: false,
      error: error.message,
    });
  }
}

// Remove FCM token without PR_ID
export async function adminRemoveFcmToken(req, res) {
  try {
    const { fcmToken, deviceId } = req.body;
    if (!fcmToken || !deviceId) {
      return res
        .status(400)
        .json({ message: "Missing required fields", success: false });
    }
    const result = await prisma.fcmToken.deleteMany({
      where: { fcmToken, deviceId },
    });
    return res.status(200).json({
      message: "FCM token removed successfully",
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error removing FCM token",
      success: false,
      error: error.message,
    });
  }
}
