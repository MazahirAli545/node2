import prisma from "../db/prismaClient.js";

import { GoogleAuth } from "google-auth-library";
import axios from "axios";

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // unescape
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

export async function registeredfcmToken(req, res) {
  try {
    const { PR_ID, fcmToken, deviceId } = req.body;

    if (!PR_ID || !fcmToken || !deviceId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    await prisma.fcmToken.deleteMany({
      where: { PR_ID },
    });

    // Create new registration
    const result = await prisma.fcmToken.create({
      data: {
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
    const { fcmToken, deviceId, PR_ID } = req.body;

    if (!fcmToken || !deviceId || !PR_ID) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const result = await prisma.fcmToken.deleteMany({
      where: {
        fcmToken,
        deviceId,
        PR_ID,
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

export async function checkDeviceRegistration(req, res) {
  try {
    const { deviceId, PR_ID } = req.params;

    // Get all registrations for this device
    const registrations = await prisma.fcmToken.findMany({
      where: { deviceId },
    });

    return res.json({
      registered: registrations.length > 0,
      currentUserRegistered: registrations.some((reg) => reg.PR_ID === PR_ID),
      otherUsersRegistered: registrations.filter((reg) => reg.PR_ID !== PR_ID),
    });
  } catch (error) {
    console.error("Device check failed", error);
    res.status(500).json({
      registered: false,
      currentUserRegistered: false,
      otherUsersRegistered: [],
      error: "Server error",
    });
  }
}

export async function clearDeviceUserAssociation(req, res) {
  try {
    const { PR_ID, deviceId } = req.body;

    if (!PR_ID || !deviceId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const result = await prisma.fcmToken.deleteMany({
      where: {
        PR_ID,
        deviceId,
      },
    });

    return res.status(200).json({
      message: "Device-user association cleared successfully",
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error clearing device association:", error);
    return res.status(500).json({
      message: "Error clearing device association",
      success: false,
      error: error.message,
    });
  }
}

// New function to get all FCM tokens for a device
export async function getDeviceTokens(req, res) {
  try {
    const { deviceId } = req.params;

    const tokens = await prisma.fcmToken.findMany({
      where: { deviceId },
      select: {
        fcmToken: true,
        PR_ID: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error("Error getting device tokens:", error);
    return res.status(500).json({
      message: "Error getting device tokens",
      success: false,
      error: error.message,
    });
  }
}
export async function getAnnouncement() {
  try {
    // Create auth client directly
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const projectId = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message = {
      message: {
        token:
          "eAUb9VtfTVC1gafrPvzCTT:APA91bHlkQGZU0FsttcTLwsHsbk5-YFfw9oYDs5X69leUvBBGTbHt7zO3JbgPCan-S8mlbXZLcbktoC8dV9si9gcAff1iFNzKMC_VrLsGpufOnja-5eQ-tE",
        notification: {
          title: "Hello!",
          body: "This is an FCM HTTP v1 test message.",
        },
      },
    };

    const response = await axios.post(fcmUrl, message, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      message: "Notification sent successfully",
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error("FCM error:", error.response?.data || error.message);

    // Return detailed error response
    return {
      success: false,
      message: "Failed to send notification",
      error: {
        code: error.response?.status || 500,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data?.error?.details || null,
      },
    };
  }
}
