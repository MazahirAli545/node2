import { registerUser, LoginUser } from "../controllers/user.controller.js";
import { generateotp } from "../controllers/otp.controller.js";
import { verifyotp } from "../controllers/otp.controller.js";
import { someProtectedRoute } from "../controllers/protected.controllers.js";
import { verifyToken } from "../middlewares/jwt.js";
// import profession from "../controllers/professionSeed.js";
import {
  getProfessions,
  createProfession,
  updateProfession,
  deleteProfession,
} from "../controllers/professionSeed.js";
// import contact from '../controllers/contactUs.controller.js'
import { contactForm } from "../controllers/contactUs.controller.js";
import pincodeController from "../controllers/pincode.controller.js";
// import cityController from "../controllers/city.controller.js";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
} from "../controllers/city.controller.js";
import getEvents from "../controllers/events.contoller.js";
import DirectoryController from "../controllers/Directory.controller.js";
import upload from "../middlewares/upload.js";
import getUserProfile from "../controllers/profile.controller.js";
import BusinessController from "../controllers/Bussiness.controller.js";
// import HobbiesController from "../controllers/Hobbies.controller.js";
import {
  getHobbies,
  createHobby,
  updateHobby,
  deleteHobby,
} from "../controllers/Hobbies.controller.js";
import EditProfile from "../controllers/EditProfile.controller.js";
import { Router } from "express";
import {
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/Education.contoller.js";

import {
  getStreams,
  createStream,
  updateStream,
  deleteStream,
} from "../controllers/Stream.controller.js";

import { get } from "http";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/protected", verifyToken, someProtectedRoute);
userRouter.post("/login", LoginUser);
userRouter.post("/generate-otp", generateotp);
userRouter.post("/verify-otp", verifyotp);
// userRouter.get("/professions", profession);
userRouter.get("/professions", getProfessions);
userRouter.post("/professions", createProfession);
userRouter.put("/professions/:PROF_ID", updateProfession);
userRouter.delete("/professions/:PROF_ID", deleteProfession);
userRouter.post(
  "/contactUs",
  upload.single("CON_ATTACHMENT"),
  verifyToken,
  contactForm
);
userRouter.get("/pincode", pincodeController);
// userRouter.get("/cities", cityController);
userRouter.get("/cities", getCities);
userRouter.post("/cities", createCity);
userRouter.put("/cities/:CITY_ID", updateCity);
userRouter.delete("/cities/:CITY_ID", deleteCity);
userRouter.get("/events", getEvents);
userRouter.get("/directory", DirectoryController);
userRouter.get("/profile", verifyToken, getUserProfile);
userRouter.get("/business", BusinessController);
// userRouter.get("/Hobbies", HobbiesController);
userRouter.get("/hobbies", getHobbies);
userRouter.post("/hobbies", createHobby);
userRouter.put("/hobbies/:HOBBY_ID", updateHobby);
userRouter.delete("/hobbies/:HOBBY_ID", deleteHobby);
userRouter.post("/edit-profile", upload.single("PR_PHOTO_URL"), EditProfile);

userRouter.get("/education", getEducation);
userRouter.post("/education", createEducation);
userRouter.put("/education/:EDUCATION_ID", updateEducation);
userRouter.delete("/education/:EDUCATION_ID", deleteEducation);

userRouter.get("/stream", getStreams);
userRouter.post("/stream", createStream);
userRouter.put("/stream/:STREAM_ID", updateStream);
userRouter.delete("/stream/:STREAM_ID", deleteStream);

export default userRouter;
