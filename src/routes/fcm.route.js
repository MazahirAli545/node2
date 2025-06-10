import express from "express";

import {
  registeredfcmToken,
  removeFcmToken,
  checkDeviceRegistration,
  clearDeviceUserAssociation,
} from "../controllers/fcm.controller.js";

const fcmRoutes = express.Router();

fcmRoutes.post("/register", registeredfcmToken);
fcmRoutes.post("/remove", removeFcmToken);
fcmRoutes.post("/clear-association", clearDeviceUserAssociation);
fcmRoutes.get("/device-status/:deviceId:PR_ID", checkDeviceRegistration);

export { fcmRoutes };
