// import prisma from "../db/prismaClient.js";

// // export async function registeredfcmToken(req, res) {
// //   try {
// //     const { PR_ID, fcmToken, deviceId } = req.body;

// //     if (!PR_ID || !fcmToken || !deviceId) {
// //       return res.status(400).json({
// //         message: "Missing required fields",
// //         success: false,
// //       });
// //     }
// //     const result = await prisma.fcmToken.upsert({
// //       where: {
// //         PR_ID_deviceId: {
// //           PR_ID,
// //           deviceId,
// //         },
// //       },
// //       update: {
// //         fcmToken,
// //       },
// //       create: {
// //         PR_ID,
// //         fcmToken,
// //         deviceId,
// //       },
// //     });

// //     return res.status(200).json({
// //       message: "FCM Token registered successfully",
// //       success: true,
// //       data: result,
// //     });
// //   } catch (error) {
// //     console.error("Error registering FCM token:", error);
// //     return res.status(500).json({
// //       message: "Error registering FCM token",
// //       success: false,
// //       error: error.message,
// //     });
// //   }
// // }
// export async function registeredfcmToken(req, res) {
//   try {
//     const { PR_ID, fcmToken, deviceId } = req.body;

//     if (!PR_ID || !fcmToken || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     // First, remove any existing token for this user-device combination
//     await prisma.fcmToken.deleteMany({
//       where: {
//         PR_ID,
//         deviceId,
//       },
//     });

//     // Then create/update the new token
//     const result = await prisma.fcmToken.create({
//       data: {
//         PR_ID,
//         fcmToken,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "FCM Token registered successfully",
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error registering FCM token:", error);
//     return res.status(500).json({
//       message: "Error registering FCM token",
//       success: false,
//       error: error.message,
//     });
//   }
// }
// export async function removeFcmToken(req, res) {
//   try {
//     const { fcmToken, deviceId } = req.body;

//     if (!fcmToken || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     const result = await prisma.fcmToken.deleteMany({
//       where: {
//         fcmToken,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "FCM token removed successfully",
//       success: true,
//       deletedCount: result.count,
//     });
//   } catch (error) {
//     console.error("Error removing FCM token:", error);
//     return res.status(500).json({
//       message: "Error removing FCM token",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// export async function checkDeviceRegistration(req, res) {
//   try {
//     const { deviceId, PR_ID } = req.params;

//     // Check if this specific user-device combination exists
//     const existing = await prisma.fcmToken.findFirst({
//       where: {
//         deviceId,
//         PR_ID,
//       },
//     });

//     return res.json({
//       registered: !!existing,
//       isRegisteredToOtherUser: existing && existing.PR_ID !== PR_ID,
//     });
//   } catch (error) {
//     console.error("Device check failed", error);
//     res.status(500).json({
//       registered: false,
//       isRegisteredToOtherUser: false,
//       error: "Server error",
//     });
//   }
// }

// export async function clearDeviceUserAssociation(req, res) {
//   try {
//     const { PR_ID, deviceId } = req.body;

//     const result = await prisma.fcmToken.deleteMany({
//       where: {
//         PR_ID,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "Device-user association cleared successfully",
//       success: true,
//       deletedCount: result.count,
//     });
//   } catch (error) {
//     console.error("Error clearing device association:", error);
//     return res.status(500).json({
//       message: "Error clearing device association",
//       success: false,
//       error: error.message,
//     });
//   }
// }

///////////////////////////////////////////////////////////////////////
// import prisma from "../db/prismaClient.js";

// export async function registeredfcmToken(req, res) {
//   try {
//     const { PR_ID, fcmToken, deviceId } = req.body;

//     if (!PR_ID || !fcmToken || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     // Check if device is already registered to another user
//     const existingRegistration = await prisma.fcmToken.findFirst({
//       where: {
//         deviceId,
//         NOT: {
//           PR_ID: PR_ID,
//         },
//       },
//     });

//     if (existingRegistration) {
//       return res.status(400).json({
//         message: "Device already registered to another user",
//         success: false,
//         existingPR_ID: existingRegistration.PR_ID,
//       });
//     }

//     // Atomic operation to update or create
//     const result = await prisma.fcmToken.upsert({
//       where: {
//         PR_ID_deviceId: {
//           PR_ID,
//           deviceId,
//         },
//       },
//       update: {
//         fcmToken,
//       },
//       create: {
//         PR_ID,
//         fcmToken,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "FCM Token registered successfully",
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error registering FCM token:", error);
//     return res.status(500).json({
//       message: "Error registering FCM token",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// export async function removeFcmToken(req, res) {
//   try {
//     const { fcmToken, deviceId } = req.body;

//     if (!fcmToken || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     const result = await prisma.fcmToken.deleteMany({
//       where: {
//         fcmToken,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "FCM token removed successfully",
//       success: true,
//       deletedCount: result.count,
//     });
//   } catch (error) {
//     console.error("Error removing FCM token:", error);
//     return res.status(500).json({
//       message: "Error removing FCM token",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// export async function checkDeviceRegistration(req, res) {
//   try {
//     const { deviceId, PR_ID } = req.params;

//     // Check all registrations for this device
//     const registrations = await prisma.fcmToken.findMany({
//       where: { deviceId },
//     });

//     const isRegisteredToCurrentUser = registrations.some(
//       (reg) => reg.PR_ID === PR_ID
//     );
//     const isRegisteredToOtherUser = registrations.some(
//       (reg) => reg.PR_ID !== PR_ID
//     );

//     return res.json({
//       registered: registrations.length > 0,
//       isRegisteredToCurrentUser,
//       isRegisteredToOtherUser,
//       existingRegistrations: registrations,
//     });
//   } catch (error) {
//     console.error("Device check failed", error);
//     res.status(500).json({
//       registered: false,
//       isRegisteredToCurrentUser: false,
//       isRegisteredToOtherUser: false,
//       error: "Server error",
//     });
//   }
// }

// export async function clearDeviceUserAssociation(req, res) {
//   try {
//     const { PR_ID, deviceId } = req.body;

//     if (!PR_ID || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     const result = await prisma.fcmToken.deleteMany({
//       where: {
//         PR_ID,
//         deviceId,
//       },
//     });

//     return res.status(200).json({
//       message: "Device-user association cleared successfully",
//       success: true,
//       deletedCount: result.count,
//     });
//   } catch (error) {
//     console.error("Error clearing device association:", error);
//     return res.status(500).json({
//       message: "Error clearing device association",
//       success: false,
//       error: error.message,
//     });
//   }
// }
import prisma from "../db/prismaClient.js";

import { google } from "google-auth-library";
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

    // Check if this exact user-device-token combination already exists
    // const existing = await prisma.fcmToken.findFirst({
    //   where: {
    //     PR_ID,
    //     deviceId,
    //     fcmToken,
    //   },
    // });

    // if (existing) {
    //   return res.status(200).json({
    //     message: "FCM Token already registered",
    //     success: true,
    //     data: existing,
    //   });
    // }

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
    const SCOPES = ["https://www.googleapis.com/auth/firebase.messagingc"];

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: SCOPES,
    });

    const accessToken = await auth.getAccessToken();

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
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("FCM response:", response.data);
  } catch (error) {
    console.error("Error sending announcement:", error);
    throw new Error("Failed to send announcement");
  }
}
