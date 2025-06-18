// import prisma from "../db/prismaClient.js";

// import { GoogleAuth } from "google-auth-library";
// import axios from "axios";

// const serviceAccount = {
//   type: process.env.FIREBASE_TYPE,
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // unescape
//   client_email: process.env.FIREBASE_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_CLIENT_ID,
//   auth_uri: process.env.FIREBASE_AUTH_URI,
//   token_uri: process.env.FIREBASE_TOKEN_URI,
//   auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
//   client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
// };

// if (!serviceAccount.private_key) {
//   console.error("Firebase private key is missing or invalid");
//   throw new Error("Firebase private key is missing or invalid");
// }

// export async function registeredfcmToken(req, res) {
//   try {
//     const { PR_ID, fcmToken, deviceId } = req.body;

//     if (!PR_ID || !fcmToken || !deviceId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     await prisma.fcmToken.deleteMany({
//       where: { PR_ID },
//     });

//     // Check if this exact user-device-token combination already exists
//     // const existing = await prisma.fcmToken.findFirst({
//     //   where: {
//     //     PR_ID,
//     //     deviceId,
//     //     fcmToken,
//     //   },
//     // });

//     // if (existing) {
//     //   return res.status(200).json({
//     //     message: "FCM Token already registered",
//     //     success: true,
//     //     data: existing,
//     //   });
//     // }

//     // Create new registration
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
//     const { fcmToken, deviceId, PR_ID } = req.body;

//     if (!fcmToken || !deviceId || !PR_ID) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }

//     const result = await prisma.fcmToken.deleteMany({
//       where: {
//         fcmToken,
//         deviceId,
//         PR_ID,
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

//     // Get all registrations for this device
//     const registrations = await prisma.fcmToken.findMany({
//       where: { deviceId },
//     });

//     return res.json({
//       registered: registrations.length > 0,
//       currentUserRegistered: registrations.some((reg) => reg.PR_ID === PR_ID),
//       otherUsersRegistered: registrations.filter((reg) => reg.PR_ID !== PR_ID),
//     });
//   } catch (error) {
//     console.error("Device check failed", error);
//     res.status(500).json({
//       registered: false,
//       currentUserRegistered: false,
//       otherUsersRegistered: [],
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

// // New function to get all FCM tokens for a device
// export async function getDeviceTokens(req, res) {
//   try {
//     const { deviceId } = req.params;

//     const tokens = await prisma.fcmToken.findMany({
//       where: { deviceId },
//       select: {
//         fcmToken: true,
//         PR_ID: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: tokens,
//     });
//   } catch (error) {
//     console.error("Error getting device tokens:", error);
//     return res.status(500).json({
//       message: "Error getting device tokens",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// // export async function getAnnouncement() {
// //   try {
// //     // Create auth client directly
// //     const auth = new GoogleAuth({
// //       credentials: serviceAccount,
// //       scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
// //     });

// //     const client = await auth.getClient();
// //     const accessToken = await client.getAccessToken();

// //     const projectId = serviceAccount.project_id;
// //     const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

// //     const message = {
// //       message: {
// //         token:
// //           "eAUb9VtfTVC1gafrPvzCTT:APA91bHlkQGZU0FsttcTLwsHsbk5-YFfw9oYDs5X69leUvBBGTbHt7zO3JbgPCan-S8mlbXZLcbktoC8dV9si9gcAff1iFNzKMC_VrLsGpufOnja-5eQ-tE",
// //         notification: {
// //           title: "Hello!",
// //           body: "This is an FCM HTTP v1 test message.",
// //         },
// //       },
// //     };

// //     const response = await axios.post(fcmUrl, message, {
// //       headers: {
// //         Authorization: `Bearer ${accessToken.token}`,
// //         "Content-Type": "application/json",
// //       },
// //     });

// //     return {
// //       success: true,
// //       message: "Notification sent successfully",
// //       data: response.data,
// //       status: response.status,
// //     };
// //   } catch (error) {
// //     console.error("FCM error:", error.response?.data || error.message);

// //     // Return detailed error response
// //     return {
// //       success: false,
// //       message: "Failed to send notification",
// //       error: {
// //         code: error.response?.status || 500,
// //         message: error.response?.data?.error?.message || error.message,
// //         details: error.response?.data?.error?.details || null,
// //       },
// //     };
// //   }
// // }

// // export async function sendNotificationToTokens(tokens, title, body) {
// //   console.log("Received tokens in sendNotificationToTokens:", tokens);
// //   console.log("Type of received tokens:", typeof tokens);
// //   console.log("Is received tokens an array?", Array.isArray(tokens));
// //   try {
// //     const auth = new GoogleAuth({
// //       credentials: serviceAccount,
// //       scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
// //     });

// //     const client = await auth.getClient();
// //     const accessToken = await client.getAccessToken();

// //     const projectId = serviceAccount.project_id;
// //     console.log("FCM Project ID used in URL:", projectId);
// //     const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

// //     if (!tokens || tokens.length === 0) {
// //       console.log("No FCM tokens provided to send notifications.");
// //       return {
// //         success: true, // It's still a success if there are no tokens to send to.
// //         message: "No tokens to send notifications to.",
// //         successfulCount: 0,
// //         failedCount: 0,
// //       };
// //     }

// //     const sendPromises = tokens.map(async (token) => {
// //       const message = {
// //         message: {
// //           token: token,
// //           notification: {
// //             title: title,
// //             body: body,
// //           },
// //           data: {
// //             eventType: "newEvent",
// //             // You might want to include the actual event ID here for client-side routing
// //             // eventId: newEvent.ENVT_ID.toString(), // If newEvent is accessible, or pass it as an argument
// //           },
// //         },
// //       };
// //       try {
// //         const response = await axios.post(fcmUrl, message, {
// //           headers: {
// //             Authorization: `Bearer ${accessToken.token}`,
// //             "Content-Type": "application/json",
// //           },
// //         });
// //         return { status: "fulfilled", value: response.data }; // Return data for successful sends
// //       } catch (error) {
// //         // Capture only relevant error info to avoid circular structures
// //         return {
// //           status: "rejected",
// //           reason: {
// //             message: error.message,
// //             code: error.code,
// //             status: error.response?.status,
// //             data: error.response?.data,
// //           },
// //         };
// //       }
// //     });

// //     const responses = await Promise.allSettled(sendPromises);

// //     const successfulSends = responses.filter(
// //       (res) => res.status === "fulfilled"
// //     ).length;
// //     const failedSends = responses.filter((res) => res.status === "rejected");

// //     if (failedSends.length > 0) {
// //       console.error("Some notifications failed to send:", failedSends);
// //     }

// //     return {
// //       success: true,
// //       message: `Sent ${successfulSends} notifications, failed ${failedSends.length}`,
// //       successfulCount: successfulSends,
// //       failedCount: failedSends.length,
// //       detailedResponses: responses,
// //     };
// //   } catch (error) {
// //     console.error("FCM error:", error.response?.data || error.message);
// //     return {
// //       success: false,
// //       message: "Failed to send notification(s)",
// //       error: {
// //         code: error.response?.status || 500,
// //         message: error.response?.data?.error?.message || error.message,
// //         details: error.response?.data?.error?.details || null,
// //       },
// //     };
// //   }
// // }

// export async function sendNotificationToTokens(tokens, title, body) {
//   console.log("Original tokens received:", tokens);

//   try {
//     const auth = new GoogleAuth({
//       credentials: serviceAccount,
//       scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//     });

//     const client = await auth.getClient();
//     const accessToken = await client.getAccessToken();

//     const projectId = serviceAccount.project_id;
//     const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

//     if (!tokens || tokens.length === 0) {
//       console.log("No FCM tokens provided to send notifications.");
//       return {
//         success: true,
//         message: "No tokens to send notifications to.",
//         successfulCount: 0,
//         failedCount: 0,
//       };
//     }

//     // Deduplicate tokens - keep only the last occurrence of each token
//     const uniqueTokensMap = new Map();

//     // Process tokens in reverse order so last occurrence overwrites previous ones
//     [...tokens].reverse().forEach((token) => {
//       uniqueTokensMap.set(token, true);
//     });

//     const uniqueTokens = Array.from(uniqueTokensMap.keys());
//     console.log("Deduplicated tokens to send:", uniqueTokens);

//     const sendPromises = uniqueTokens.map(async (token) => {
//       const message = {
//         message: {
//           token: token,
//           notification: {
//             title: title,
//             body: body,
//           },
//           data: {
//             eventType: "newEvent",
//           },
//         },
//       };

//       try {
//         const response = await axios.post(fcmUrl, message, {
//           headers: {
//             Authorization: `Bearer ${accessToken.token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         return { status: "fulfilled", value: response.data };
//       } catch (error) {
//         return {
//           status: "rejected",
//           reason: {
//             message: error.message,
//             code: error.code,
//             status: error.response?.status,
//             data: error.response?.data,
//           },
//         };
//       }
//     });

//     const responses = await Promise.allSettled(sendPromises);

//     const successfulSends = responses.filter(
//       (res) => res.status === "fulfilled"
//     ).length;
//     const failedSends = responses.filter((res) => res.status === "rejected");

//     if (failedSends.length > 0) {
//       console.error("Some notifications failed to send:", failedSends);
//     }

//     return {
//       success: true,
//       message: `Sent ${successfulSends} notifications (${uniqueTokens.length} unique tokens), failed ${failedSends.length}`,
//       successfulCount: successfulSends,
//       failedCount: failedSends.length,
//       totalUniqueTokens: uniqueTokens.length,
//       detailedResponses: responses,
//     };
//   } catch (error) {
//     console.error("FCM error:", error.response?.data || error.message);
//     return {
//       success: false,
//       message: "Failed to send notification(s)",
//       error: {
//         code: error.response?.status || 500,
//         message: error.response?.data?.error?.message || error.message,
//         details: error.response?.data?.error?.details || null,
//       },
//     };
//   }
// }

// export async function getAllAdminFcmTokens(req, res) {
//   try {
//     // First, get all admin users from the peopleRegistry table
//     const adminUsers = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_ROLE: "Admin", // Assuming you have a field to identify admin users
//       },
//       select: {
//         PR_ID: true,
//         // You can add other admin user details here if needed,
//         // but for getting *their tokens*, PR_ID is sufficient.
//       },
//     });

//     if (!adminUsers || adminUsers.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No admin users found",
//         data: [],
//       });
//     }

//     // Get all FCM tokens for these admin users
//     const adminUserIds = adminUsers.map((user) => user.PR_ID);
//     const fcmTokens = await prisma.fcmToken.findMany({
//       where: {
//         PR_ID: {
//           in: adminUserIds,
//         },
//       },
//       select: {
//         fcmToken: true,
//         PR_ID: true, // Includes the PR_ID so you know which token belongs to which admin
//         deviceId: true, // Includes deviceId to distinguish tokens from the same admin on different devices
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Admin FCM tokens retrieved successfully",
//       data: fcmTokens,
//     });
//   } catch (error) {
//     console.error("Error getting admin FCM tokens:", error);
//     return res.status(500).json({
//       message: "Error getting admin FCM tokens",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// export async function sendNotificationToAdmins(req, res) {
//   try {
//     const { title, body } = req.body;
//     console.log("Received request to send admin notification:", {
//       title,
//       body,
//     });

//     if (!title || !body) {
//       return res.status(400).json({
//         message: "Missing required fields: title and body for the notification",
//         success: false,
//       });
//     }

//     // 1. Get all admin FCM tokens
//     const adminUsers = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_ROLE: "Admin",
//       },
//       select: {
//         PR_ID: true,
//       },
//     });
//     console.log(`Found ${adminUsers.length} admin users.`);

//     if (!adminUsers || adminUsers.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No admin users found to send notifications to.",
//         notificationResult: {
//           successfulCount: 0,
//           failedCount: 0,
//         },
//       });
//     }

//     const adminUserIds = adminUsers.map((user) => user.PR_ID);
//     console.log("Admin User IDs for token lookup:", adminUserIds);

//     const adminFcmTokensResult = await prisma.fcmToken.findMany({
//       where: {
//         PR_ID: {
//           in: adminUserIds,
//         },
//       },
//       select: {
//         fcmToken: true,
//       },
//     });
//     console.log(
//       `Found ${adminFcmTokensResult.length} FCM tokens for admin users.`
//     );

//     const adminTokens = adminFcmTokensResult.map((item) => item.fcmToken);
//     console.log("Extracted Admin FCM Tokens:", adminTokens);

//     if (adminTokens.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No FCM tokens found for admin users.",
//         notificationResult: {
//           successfulCount: 0,
//           failedCount: 0,
//         },
//       });
//     }

//     // 2. Directly send notifications to these tokens (logic moved from sendNotificationToTokens)
//     const tokensToSend = adminTokens; // Renamed for clarity within this scope
//     console.log(
//       "Original tokens received by sendNotificationToAdmins for sending:",
//       tokensToSend
//     );

//     try {
//       const auth = new GoogleAuth({
//         credentials: serviceAccount,
//         scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//       });

//       const client = await auth.getClient();
//       const accessToken = await client.getAccessToken();
//       console.log("FCM Access Token acquired.");

//       const projectId = serviceAccount.project_id;
//       const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
//       console.log("FCM URL:", fcmUrl);

//       if (!tokensToSend || tokensToSend.length === 0) {
//         console.log(
//           "No FCM tokens provided to send notifications (after admin lookup)."
//         );
//         return res.status(200).json({
//           success: true,
//           message: "No tokens to send notifications to.",
//           notificationResult: {
//             successfulCount: 0,
//             failedCount: 0,
//           },
//         });
//       }

//       // Deduplicate tokens - keep only the last occurrence of each token
//       const uniqueTokensMap = new Map();
//       [...tokensToSend].reverse().forEach((token) => {
//         uniqueTokensMap.set(token, true);
//       });
//       const uniqueTokens = Array.from(uniqueTokensMap.keys());
//       console.log("Deduplicated tokens to send:", uniqueTokens);

//       const sendPromises = uniqueTokens.map(async (token) => {
//         const message = {
//           message: {
//             token: token,
//             notification: {
//               title: title,
//               body: body,
//             },
//             data: {
//               eventType: "newEvent",
//             },
//           },
//         };

//         try {
//           const response = await axios.post(fcmUrl, message, {
//             headers: {
//               Authorization: `Bearer ${accessToken.token}`,
//               "Content-Type": "application/json",
//             },
//           });
//           return { status: "fulfilled", value: response.data };
//         } catch (error) {
//           console.error(
//             `Error sending notification to token ${token}:`,
//             error.response?.data || error.message
//           );
//           return {
//             status: "rejected",
//             reason: {
//               message: error.message,
//               code: error.code,
//               status: error.response?.status,
//               data: error.response?.data,
//             },
//           };
//         }
//       });

//       const responses = await Promise.allSettled(sendPromises);
//       console.log("All notification send promises settled.");

//       const successfulSends = responses.filter(
//         (res) => res.status === "fulfilled"
//       ).length;
//       const failedSends = responses.filter((res) => res.status === "rejected");

//       if (failedSends.length > 0) {
//         console.error("Some notifications failed to send:", failedSends);
//       }

//       // Respond to the client with the result of sending notifications
//       return res.status(200).json({
//         success: true,
//         message: `Notifications sent to admins successfully`,
//         notificationResult: {
//           successfulCount: successfulSends,
//           failedCount: failedSends.length,
//           totalUniqueTokens: uniqueTokens.length,
//           detailedResponses: responses,
//         },
//       });
//     } catch (firebaseError) {
//       console.error(
//         "FCM error during notification sending in sendNotificationToAdmins:",
//         firebaseError.response?.data || firebaseError.message
//       );
//       console.error(
//         "FCM error stack (sendNotificationToAdmins inner catch):",
//         firebaseError.stack
//       );
//       return res.status(500).json({
//         success: false,
//         message: "Failed to send notification(s) to admins due to FCM error",
//         error: {
//           code: firebaseError.response?.status || 500,
//           message:
//             firebaseError.response?.data?.error?.message ||
//             firebaseError.message,
//           details: firebaseError.response?.data?.error?.details || null,
//         },
//       });
//     }
//   } catch (error) {
//     console.error(
//       "Critical error in sendNotificationToAdmins (outer catch):",
//       error
//     );
//     console.error(
//       "Error stack (sendNotificationToAdmins outer catch):",
//       error.stack
//     );
//     return res.status(500).json({
//       message: "Error processing admin notification request",
//       success: false,
//       error: error.message,
//     });
//   }
// }

import prisma from "../db/prismaClient.js";
import { GoogleAuth } from "google-auth-library";
import axios from "axios";

// Initialize Firebase Admin once at module level
let fcmInitialized = false;
let authClient;

const initializeFCM = async () => {
  if (fcmInitialized) return;

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  if (!serviceAccount.private_key) {
    throw new Error("Firebase private key is missing or invalid");
  }

  try {
    authClient = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    fcmInitialized = true;
  } catch (error) {
    console.error("FCM initialization failed:", error);
    throw error;
  }
};

// Token Management Functions
export async function registeredfcmToken(req, res) {
  try {
    const { PR_ID, fcmToken, deviceId } = req.body;

    if (!PR_ID || !fcmToken || !deviceId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // Upsert operation - delete existing tokens for this device and user
    await prisma.fcmToken.deleteMany({
      where: { PR_ID, deviceId },
    });

    const result = await prisma.fcmToken.create({
      data: { PR_ID, fcmToken, deviceId },
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

// Notification Sending Core Function
async function sendFCMMessages(messages) {
  await initializeFCM();

  const client = await authClient.getClient();
  const accessToken = await client.getAccessToken();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const sendPromises = messages.map(async (message) => {
    try {
      const response = await axios.post(fcmUrl, message, {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
          timeout: 10000, // 10 second timeout
        },
      });
      return { status: "fulfilled", value: response.data };
    } catch (error) {
      return {
        status: "rejected",
        reason: {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          token: message.message.token, // Include failing token for debugging
        },
      };
    }
  });

  return await Promise.allSettled(sendPromises);
}

// Improved sendNotificationToTokens
export async function sendNotificationToTokens(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    return {
      success: true,
      message: "No tokens to send notifications to",
      successfulCount: 0,
      failedCount: 0,
    };
  }

  // Deduplicate tokens while preserving order
  const uniqueTokens = [...new Set(tokens)];

  const messages = uniqueTokens.map((token) => ({
    message: {
      token,
      notification: { title, body },
      data: {
        ...data,
        eventType: data.eventType || "notification",
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    },
  }));

  try {
    const responses = await sendFCMMessages(messages);

    const successfulSends = responses.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failedSends = responses.filter((r) => r.status === "rejected");

    return {
      success: true,
      message: `Sent ${successfulSends} notifications`,
      successfulCount: successfulSends,
      failedCount: failedSends.length,
      failedDetails: failedSends.map((f) => f.reason),
      totalTokens: uniqueTokens.length,
    };
  } catch (error) {
    console.error("FCM send error:", error);
    return {
      success: false,
      message: "Failed to send notifications",
      error: {
        code: error.response?.status || 500,
        message: error.message,
        details: error.response?.data,
      },
    };
  }
}

// Improved sendNotificationToAdmins
export async function sendNotificationToAdmins(req, res) {
  try {
    const { title, body, data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required",
      });
    }

    // Get admin tokens in single query
    const adminTokens = await prisma.fcmToken.findMany({
      where: {
        PR_ID: {
          in: await prisma.peopleRegistry
            .findMany({
              where: { PR_ROLE: "Admin" },
              select: { PR_ID: true },
            })
            .then((admins) => admins.map((a) => a.PR_ID)),
        },
      },
      select: { fcmToken: true },
    });

    if (adminTokens.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No admin tokens found",
      });
    }

    const result = await sendNotificationToTokens(
      adminTokens.map((t) => t.fcmToken),
      title,
      body,
      { ...data, notificationType: "admin" }
    );

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Admin notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send admin notifications",
      error: error.message,
    });
  }
}

// Keep other existing functions (removeFcmToken, checkDeviceRegistration, etc.) as is
// but add similar error handling improvements

export async function getAllAdminFcmTokens(req, res) {
  try {
    // First, get all admin users from the peopleRegistry table
    const adminUsers = await prisma.peopleRegistry.findMany({
      where: {
        PR_ROLE: "Admin", // Assuming you have a field to identify admin users
      },
      select: {
        PR_ID: true,
        // You can add other admin user details here if needed,
        // but for getting *their tokens*, PR_ID is sufficient.
      },
    });

    if (!adminUsers || adminUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No admin users found",
        data: [],
      });
    }

    // Get all FCM tokens for these admin users
    const adminUserIds = adminUsers.map((user) => user.PR_ID);
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        PR_ID: {
          in: adminUserIds,
        },
      },
      select: {
        fcmToken: true,
        PR_ID: true, // Includes the PR_ID so you know which token belongs to which admin
        deviceId: true, // Includes deviceId to distinguish tokens from the same admin on different devices
      },
    });

    return res.status(200).json({
      success: true,
      message: "Admin FCM tokens retrieved successfully",
      data: fcmTokens,
    });
  } catch (error) {
    console.error("Error getting admin FCM tokens:", error);
    return res.status(500).json({
      message: "Error getting admin FCM tokens",
      success: false,
      error: error.message,
    });
  }
}
