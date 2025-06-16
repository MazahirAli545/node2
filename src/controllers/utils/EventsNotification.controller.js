// utils/notificationHandler.js
import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import prisma from "../../db/prismaClient.js";

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

export async function sendEventNotification(event) {
  try {
    // Get all registered FCM tokens
    const allTokens = await prisma.fcmToken.findMany({
      select: {
        fcmToken: true,
      },
    });

    if (allTokens.length === 0) {
      console.log("No FCM tokens registered to send notifications");
      return;
    }

    // Create auth client
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const projectId = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Prepare notification message
    const notificationMessage = {
      title: "New Event Available!",
      body: event.ENVT_DESC || "Check out our latest event",
    };

    // Send to each token (consider using multicast for better performance)
    const sendPromises = allTokens.map(async (tokenObj) => {
      const message = {
        message: {
          token: tokenObj.fcmToken,
          notification: notificationMessage,
          data: {
            eventId: event.ENVT_ID.toString(),
            type: "NEW_EVENT",
          },
        },
      };

      try {
        await axios.post(fcmUrl, message, {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error(
          `Error sending to token ${tokenObj.fcmToken}:`,
          error.message
        );
        // Optionally remove invalid tokens
        if (error.response?.data?.error?.status === "NOT_FOUND") {
          await prisma.fcmToken.deleteMany({
            where: { fcmToken: tokenObj.fcmToken },
          });
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`Notifications sent for new event ${event.ENVT_ID}`);
  } catch (error) {
    console.error("Error in sendEventNotification:", error);
  }
}
