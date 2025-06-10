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

    // Check if device is already registered to another user
    const existingRegistration = await prisma.fcmToken.findFirst({
      where: {
        deviceId,
        NOT: {
          PR_ID: PR_ID,
        },
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "Device already registered to another user",
        success: false,
        existingPR_ID: existingRegistration.PR_ID,
      });
    }

    // Atomic operation to update or create
    const result = await prisma.fcmToken.upsert({
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

export async function checkDeviceRegistration(req, res) {
  try {
    const { deviceId, PR_ID } = req.params;

    // Check all registrations for this device
    const registrations = await prisma.fcmToken.findMany({
      where: { deviceId },
    });

    const isRegisteredToCurrentUser = registrations.some(
      (reg) => reg.PR_ID === PR_ID
    );
    const isRegisteredToOtherUser = registrations.some(
      (reg) => reg.PR_ID !== PR_ID
    );

    return res.json({
      registered: registrations.length > 0,
      isRegisteredToCurrentUser,
      isRegisteredToOtherUser,
      existingRegistrations: registrations,
    });
  } catch (error) {
    console.error("Device check failed", error);
    res.status(500).json({
      registered: false,
      isRegisteredToCurrentUser: false,
      isRegisteredToOtherUser: false,
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
