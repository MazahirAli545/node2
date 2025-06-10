import express from "express";

import {
  registeredfcmToken,
  removeFcmToken,
  checkDeviceRegistration,
} from "../controllers/fcm.controller.js";

const fcmRoutes = express.Router();

fcmRoutes.post("/register", registeredfcmToken);
fcmRoutes.post("/remove", removeFcmToken);
fcmRoutes.get("/device-status/:deviceId", checkDeviceRegistration);

export { fcmRoutes };
