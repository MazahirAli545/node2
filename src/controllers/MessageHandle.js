// const { google } = require('google-auth-library');
import { google } from "google-auth-library";
import axios from "axios";
import serviceAccount from "../service-account.json" assert { type: "json" };

async function sendNotification() {
  const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

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
}

sendNotification().catch(console.error);
