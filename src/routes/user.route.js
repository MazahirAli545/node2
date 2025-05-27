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
import { getContactForms, contactForm } from "../controllers/contactUs.controller.js";
import pincodeController from "../controllers/pincode.controller.js";
// import cityController from "../controllers/city.controller.js";
import { updateProfile } from "../controllers/otp.controller.js";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
} from "../controllers/city.controller.js";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/events.contoller.js";
import DirectoryController from "../controllers/Directory.controller.js";
import upload from "../middlewares/upload.js";
import getUserProfile from "../controllers/profile.controller.js";
import BusinessController from "../controllers/Bussiness.controller.js";
import {
  createChild,
  getChildById,
  getChildrenByUser,
  updateChild,
  deleteChild,
} from "../controllers/Child.controller.js";
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

import { getAllUsersBasicDetails } from "../controllers/RegisteredUser.controller.js";
import { getUsersByMobileNumber } from "../controllers/UserFamily.controller.js";
import { get } from "http";
import {
  capturePayment,
  getDonationsByDonor,
  // createOrder,
} from "../controllers/Payment.controller.js";
import { getAllDonationPayments } from "../controllers/UsersPaymentDetails.js";
import { getUserStats } from "../controllers/PopulationCount.js";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
// import { familyRoutes } from "../controllers/family.js";

import { getFamiliesByLocation } from "../controllers/user.controller.js";
import { getFamilyMembers } from "../controllers/user.controller.js";

import { checkPersonById } from "../controllers/user.controller.js";
const userRouter = Router();

userRouter.get("/checkPersonById/:id", checkPersonById);
userRouter.get("/families/:districtCode/:cityCode", getFamiliesByLocation);
userRouter.get("/families/:districtCode/:cityCode/:familyNo", getFamilyMembers);
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


// contact
userRouter.get("/contactus", getContactForms)
userRouter.post(
  "/contactus",
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
userRouter.get("/directory", DirectoryController);
userRouter.get("/profile", verifyToken, getUserProfile);
userRouter.get("/business", BusinessController);

// Events
userRouter.get("/events", getEvents);
userRouter.post("/events", createEvent);
userRouter.put("/events/:ENVT_ID", updateEvent);
userRouter.delete("/events/:ENVT_ID", deleteEvent);

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

userRouter.get("/streams", getStreams);
userRouter.post("/streams", createStream);
userRouter.put("/streams/:STREAM_ID", updateStream);
userRouter.delete("/streams/:STREAM_ID", deleteStream);

userRouter.get("/registerUser", getAllUsersBasicDetails);

userRouter.post("/child", createChild);

// Get all children for a user
userRouter.get("/child/user/:userId", getChildrenByUser);

// Get a single child
userRouter.get("/child/:id", getChildById);

// Update a child
userRouter.put("/child/:id", updateChild);

// Delete a child
userRouter.delete("/child/:id", deleteChild);

userRouter.post("/updateMobNam", updateProfile);

userRouter.get("/by-mobile/:mobileNumber", getUsersByMobileNumber);
userRouter.post("/capture-payment", capturePayment);
userRouter.get("/getDonationByDonar/:PR_ID", getDonationsByDonor);

// userRouter.post("/create-order", createOrder);
userRouter.get("/allDonationPayments", getAllDonationPayments);
userRouter.get("/getStats", getUserStats);

// userRouter.get("/getDetailsLast", getNextFamilyNumber);
// userRouter.get("/getDetailsss", familyRoutes);
export default userRouter;
