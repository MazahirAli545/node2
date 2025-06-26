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
  createProfessionTranslation,
  getProfessionTranslations,
  updateProfessionTranslation,
  deleteProfessionTranslation,
} from "../controllers/Profession.controller.js";
// import contact from '../controllers/contactUs.controller.js'
import {
  getContactForms,
  contactForm,
} from "../controllers/contactUs.controller.js";
import pincodeController from "../controllers/pincode.controller.js";
// import cityController from "../controllers/city.controller.js";
import { updateProfile } from "../controllers/otp.controller.js";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
  getCityTranslations,
  createCityTranslation,
  getCityTranslationByLang,
  updateCityTranslation,
  deleteCityTranslation,
} from "../controllers/city.controller.js";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  createEventTranslation,
  getEventTranslations,
  getEventTranslationByLang,
  updateEventTranslation,
  deleteEventTranslation,
  getEventsWithAllTranslations,
} from "../controllers/events.controller.js";
import DirectoryController from "../controllers/Directory.controller.js";
import upload from "../middlewares/upload.js";
import getUserProfile from "../controllers/profile.controller.js";
import BusinessController, {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessTranslations,
  createBusinessTranslation,
  getBusinessTranslationByLang,
  updateBusinessTranslation,
  deleteBusinessTranslation,
} from "../controllers/Bussiness.controller.js";
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
  createHobbyTranslation,
  updateHobbyTranslation,
  deleteHobbyTranslation,
  getHobbyTranslations,
  getHobbiesWithTranslations,
} from "../controllers/Hobbies.controller.js";
import EditProfile from "../controllers/EditProfile.controller.js";
import { Router } from "express";
import {
  getEducations as getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  createEducationTranslation,
  getEducationTranslations,
  updateEducationTranslation,
  deleteEducationTranslation,
} from "../controllers/Education.controller.js";

import {
  getStreams,
  createStream,
  updateStream,
  deleteStream,
  createStreamTranslation,
  getStreamTranslations,
  updateStreamTranslation,
  deleteStreamTranslation,
} from "../controllers/Stream.controller.js";

import { getAllUsersBasicDetails } from "../controllers/RegisteredUser.controller.js";
import { getFamilyMembersss } from "../controllers/UserFamily.controller.js";
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
import { convertUniqueIdToId } from "../controllers/user.controller.js";
import { getUserByUniqueId } from "../controllers/user.controller.js";
import { UpdateNotification } from "../controllers/UpdateNotification.controller.js";
// import { updateUserLanguage } from "../controllers/UpdateLang.controller.js";
import { updateLanguage, getLanguage } from "../controllers/user.controller.js";
// import { logoutUser } from "../controllers/user.controller.js";

const userRouter = Router();

// userRouter.post("/register", registeredfcmToken);
// userRouter.post("/remove", removeFcmToken);

// userRouter.post("/logout", verifyToken, logoutUser);
userRouter.put("/language", updateLanguage);
userRouter.get("/language", getLanguage);
userRouter.get("/user/check/:uniqueId", getUserByUniqueId);
userRouter.get("/checkPersonById/:id", checkPersonById);
// userRouter.get("/check/:id", checkPersonById);
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
userRouter.post(
  "/professions/:PROF_ID/translations",
  createProfessionTranslation
);
userRouter.get("/professions/:PROF_ID/translations", getProfessionTranslations);
userRouter.put(
  "/professions/:PROF_ID/translations/:lang_code",
  updateProfessionTranslation
);
userRouter.delete(
  "/professions/:PROF_ID/translations/:lang_code",
  deleteProfessionTranslation
);

// contact
userRouter.get("/contactus", getContactForms);
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
userRouter.get("/cities/:CITY_ID/translations", getCityTranslations);
userRouter.post("/cities/:CITY_ID/translations", createCityTranslation);
userRouter.get(
  "/cities/:CITY_ID/translation/:lang_code",
  getCityTranslationByLang
);
userRouter.put(
  "/cities/:CITY_ID/translation/:lang_code",
  updateCityTranslation
);
userRouter.delete(
  "/cities/:CITY_ID/translation/:lang_code",
  deleteCityTranslation
);
userRouter.get("/directory", DirectoryController);
userRouter.get("/profile", verifyToken, getUserProfile);
// Business routes
userRouter.get("/business", getBusinesses);
userRouter.post("/business", createBusiness);
userRouter.put("/business/:BUSS_ID", updateBusiness);
userRouter.delete("/business/:BUSS_ID", deleteBusiness);
userRouter.get("/business/:BUSS_ID/translations", getBusinessTranslations);
userRouter.post("/business/:BUSS_ID/translations", createBusinessTranslation);
userRouter.get(
  "/business/:BUSS_ID/translations/:lang_code",
  getBusinessTranslationByLang
);
userRouter.put(
  "/business/:BUSS_ID/translations/:lang_code",
  updateBusinessTranslation
);
userRouter.delete(
  "/business/:BUSS_ID/translations/:lang_code",
  deleteBusinessTranslation
);

// Events
userRouter.get("/events", getEvents);
userRouter.post("/events", createEvent);
userRouter.put("/events/:ENVT_ID", updateEvent);
userRouter.delete("/events/:ENVT_ID", deleteEvent);
userRouter.get("/events/:ENVT_ID", getEventById);

// Event Translations
userRouter.post("/events/:ENVT_ID/translations", createEventTranslation);
userRouter.get("/events/:ENVT_ID/translations", getEventTranslations);
userRouter.get(
  "/events/:ENVT_ID/translations/:lang_code",
  getEventTranslationByLang
);
userRouter.put(
  "/events/:ENVT_ID/translations/:lang_code",
  updateEventTranslation
);
userRouter.delete(
  "/events/:ENVT_ID/translations/:lang_code",
  deleteEventTranslation
);
userRouter.get("/events-with-translations", getEventsWithAllTranslations);

// userRouter.get("/Hobbies", HobbiesController);
userRouter.get("/hobbies", getHobbies);
userRouter.post("/hobbies", createHobby);
userRouter.put("/hobbies/:HOBBY_ID", updateHobby);
userRouter.delete("/hobbies/:HOBBY_ID", deleteHobby);

// Hobby translation routes
userRouter.post("/hobbies/:HOBBY_ID/translations", createHobbyTranslation);
userRouter.get("/hobbies/:HOBBY_ID/translations", getHobbyTranslations);
userRouter.put(
  "/hobbies/:HOBBY_ID/translations/:lang_code",
  updateHobbyTranslation
);
userRouter.delete(
  "/hobbies/:HOBBY_ID/translations/:lang_code",
  deleteHobbyTranslation
);
userRouter.get("/hobbies-with-translations", getHobbiesWithTranslations);

userRouter.post("/edit-profile", upload.single("PR_PHOTO_URL"), EditProfile);

userRouter.get("/education", getEducation);
userRouter.post("/education", createEducation);
userRouter.put("/education/:EDUCATION_ID", updateEducation);
userRouter.delete("/education/:EDUCATION_ID", deleteEducation);
userRouter.post(
  "/education/:EDUCATION_ID/translations",
  createEducationTranslation
);
userRouter.get(
  "/education/:EDUCATION_ID/translations",
  getEducationTranslations
);
userRouter.put(
  "/education/:EDUCATION_ID/translations/:lang_code",
  updateEducationTranslation
);
userRouter.delete(
  "/education/:EDUCATION_ID/translations/:lang_code",
  deleteEducationTranslation
);

userRouter.get("/streams", getStreams);
userRouter.post("/streams", createStream);
userRouter.put("/streams/:STREAM_ID", updateStream);
userRouter.delete("/streams/:STREAM_ID", deleteStream);
userRouter.post("/streams/:STREAM_ID/translations", createStreamTranslation);
userRouter.get("/streams/:STREAM_ID/translations", getStreamTranslations);
userRouter.put(
  "/streams/:STREAM_ID/translations/:lang_code",
  updateStreamTranslation
);
userRouter.delete(
  "/streams/:STREAM_ID/translations/:lang_code",
  deleteStreamTranslation
);

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

// userRouter.get("/by-mobile/:mobileNumber", getUsersByMobileNumber);
userRouter.get("/users/family-members", getFamilyMembersss);
userRouter.get("/person/convert/:uniqueId", convertUniqueIdToId);

userRouter.post("/capture-payment", capturePayment);
userRouter.get("/getDonationByDonar/:PR_ID", getDonationsByDonor);

// userRouter.post("/create-order", createOrder);
userRouter.get("/allDonationPayments", getAllDonationPayments);
userRouter.get("/getStats", getUserStats);

userRouter.post("/update-notification", UpdateNotification);

// userRouter.get("/getDetailsLast", getNextFamilyNumber);
// userRouter.get("/getDetailsss", familyRoutes);

export default userRouter;
