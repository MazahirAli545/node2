import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import dotenv from "dotenv";
import { generateToken } from "../middlewares/jwt.js";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

export const getContactForms = async (req, res) => {
  try {
    const { lang_code = "en" } = req.query;

    // Get main contacts (English)
    const mainContacts = await prisma.contact.findMany({
      orderBy: {
        CON_CREATED_DT: "desc",
      },
    });

    // If English is requested, return main contacts
    if (lang_code === "en") {
      return res.status(200).json({
        message: "Contact forms retrieved successfully",
        success: true,
        data: mainContacts,
      });
    }

    // For non-English, get translations
    const translations = await prisma.contact_lang.findMany({
      where: {
        lang_code,
      },
    });

    // Merge translations with main contacts, falling back to English
    const mergedContacts = mainContacts.map((contact) => {
      const translation = translations.find((t) => t.id === contact.CON_ID);
      return translation || contact;
    });

    return res.status(200).json({
      message: "Contact forms retrieved successfully",
      success: true,
      data: mergedContacts,
    });
  } catch (error) {
    console.error("❌ Failed to fetch contact forms:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const contactForm = async (req, res) => {
  try {
    const schema = Joi.object({
      CON_TYPE: Joi.string().required(),
      CON_NAME: Joi.string().required(),
      CON_MOBILE_NO: Joi.string().required(),
      CON_ATTACHMENT: Joi.string().allow(null, ""),
      CON_MORE_DETAIL: Joi.string().required(),
      CON_RATING: Joi.number().integer().min(1).max(5).default(3),
      CON_ACTIVE_YN: Joi.string().valid("Y", "N").default("Y"),
      CON_UPDATED_BY: Joi.number().allow(null),
      CON_UPDATED_DT: Joi.date().allow(null),
      lang_code: Joi.string().default("en"),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        success: false,
      });
    }

    const {
      CON_TYPE,
      CON_NAME,
      CON_MOBILE_NO,
      CON_ATTACHMENT,
      CON_MORE_DETAIL,
      CON_RATING,
      CON_ACTIVE_YN,
      CON_UPDATED_BY,
      CON_UPDATED_DT,
      lang_code = "en",
    } = value;

    // Create contact in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main contact (English)
      const newContact = await prisma.contact.create({
        data: {
          CON_TYPE,
          CON_NAME,
          CON_MOBILE_NO,
          CON_ATTACHMENT,
          CON_MORE_DETAIL,
          CON_RATING: parseInt(CON_RATING, 10) || 3,
          CON_ACTIVE_YN,
          CON_CREATED_BY: req.userId,
          CON_UPDATED_BY,
          CON_UPDATED_DT,
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.contact_lang.create({
          data: {
            id: newContact.CON_ID,
            CON_TYPE,
            CON_NAME,
            CON_MOBILE_NO,
            CON_ATTACHMENT,
            CON_MORE_DETAIL,
            CON_RATING: parseInt(CON_RATING, 10) || 3,
            CON_ACTIVE_YN,
            CON_CREATED_BY: req.userId,
            CON_CREATED_DT: new Date(),
            CON_UPDATED_BY,
            CON_UPDATED_DT,
            lang_code,
          },
        });
      }

      return newContact;
    });

    console.log("✅ Contact form submitted:", result);

    return res.status(201).json({
      message: "Contact form has been successfully submitted",
      success: true,
      data: result,
    });
  } catch (error) {
    console.log("❌ Error for contact form submission:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { CON_ID } = req.params;
    const { lang_code = "en", ...updateData } = req.body;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { CON_ID: Number(CON_ID) },
    });

    if (!existingContact) {
      return res.status(404).json({
        message: "Contact not found",
        success: false,
      });
    }

    if (lang_code === "en") {
      // Update main contact (English)
      const updatedContact = await prisma.contact.update({
        where: { CON_ID: Number(CON_ID) },
        data: updateData,
      });

      return res.status(200).json({
        message: "Contact updated successfully",
        success: true,
        data: updatedContact,
      });
    } else {
      // Handle non-English update/create
      const translation = await prisma.contact_lang.upsert({
        where: {
          id_lang_code: {
            id: Number(CON_ID),
            lang_code,
          },
        },
        update: updateData,
        create: {
          id: Number(CON_ID),
          ...updateData,
          lang_code,
          CON_CREATED_DT: new Date(),
        },
      });

      return res.status(200).json({
        message: "Contact translation updated successfully",
        success: true,
        data: translation,
      });
    }
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({
      message: "Error updating contact",
      success: false,
      error: error.message,
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { CON_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.contact_lang.delete({
        where: {
          id_lang_code: {
            id: Number(CON_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: "Contact translation deleted successfully",
        success: true,
      });
    }

    // Delete main contact (will cascade delete translations)
    await prisma.contact.delete({
      where: { CON_ID: Number(CON_ID) },
    });

    return res.status(200).json({
      message: "Contact deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).json({
      message: "Error deleting contact",
      success: false,
      error: error.message,
    });
  }
};

export const getContactTranslations = async (req, res) => {
  try {
    const { CON_ID } = req.params;

    // Get main contact (English)
    const mainContact = await prisma.contact.findUnique({
      where: { CON_ID: Number(CON_ID) },
    });

    if (!mainContact) {
      return res.status(404).json({
        message: "Contact not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.contact_lang.findMany({
      where: { id: Number(CON_ID) },
    });

    return res.status(200).json({
      message: "Contact translations fetched successfully",
      data: {
        main: mainContact,
        translations,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching contact translations:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};
