import express from "express";

import {
  registeredfcmToken,
  removeFcmToken,
} from "../controllers/fcm.controller.js";

const fcmRoutes = express.Router();

fcmRoutes.post("/register", registeredfcmToken);
fcmRoutes.post("/remove", removeFcmToken);

export { fcmRoutes };
