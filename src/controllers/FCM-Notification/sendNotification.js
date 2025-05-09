const admin = require("firebase-admin");
// const serviceAccount = require('./serviceAccountKey.json'); // Adjust path if needed
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const registrationToken = "DEVICE_FCM_TOKEN_HERE"; // You’ll get this from the app

const message = {
  notification: {
    title: "Test Title",
    body: "This is a test push notification",
  },
  token: registrationToken,
};

admin
  .messaging()
  .send(message)
  .then((response) => {
    console.log("✅ Successfully sent:", response);
  })
  .catch((error) => {
    console.error("❌ Error sending:", error);
  });
