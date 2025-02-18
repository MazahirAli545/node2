import { PrismaClient } from "@prisma/client/extension";
import otpGenerator from "otp-generator";
import prisma from "../db/prismaClient.js";
import { z } from "zod";
import { log } from "console";
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();



const twillo_Phone_Number=+16203019559;

const twilioClient = twilio(process.env.Twillo_Account_SID, process.env.Twillo_Auth_Token);


export const generateotp = async(req, res) => {
  try{
    const {PR_MOBILE_NO} = req.body;

        const existinguser = await prisma.peopleRegistry.findFirst({
      where: { PR_MOBILE_NO },
    });


    if(existinguser){
        return res.status(400).json({message: "this mobile Number is already registered" , success : false})
    }

  
    
    const mobileNumberSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number");


    const validateResult = mobileNumberSchema.safeParse(PR_MOBILE_NO);

    if(!validateResult.success){
      return res.status(400).json({message : "Invalid Mobile Number", success: false});
    }



    const otp = otpGenerator.generate(4, { digits: true, specialChars: false, upperCaseAlphabets: false, lowerCaseAlphabets: false });

    const otpRecord = await prisma.otp.upsert({
      where: { PR_MOBILE_NO },
      update: { otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
      create: { PR_MOBILE_NO, otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
    });

  


   


    console.log(`OTP for ${PR_MOBILE_NO}: ${otp}`); // You should replace this with an SMS service
    
    await twilioClient.messages.create({
      body: `Your Rangrez App Verification Otp is : ${otp}. It is valid for 2 minutes.`,
      from: twillo_Phone_Number,
      to: `+91${PR_MOBILE_NO}`, // Assuming Indian numbers, modify as needed
    });

    console.log(`OTP for ${PR_MOBILE_NO}: ${otp}`);

    // return res.status(200).json({ message: "OTP sent successfully", success: true });

    return res.status(200).json({ message: "OTP sent successfully", success: true });

   
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res.status(500).json({ message: "Something went wrong", success: false });
  }


};



export const verifyotp = async(req, res) => {
    try {
        
        const { PR_MOBILE_NO, otp } = req.body

       const success =await  verifyFunc(PR_MOBILE_NO,otp);
       console.log(PR_MOBILE_NO, otp)
       if(success) {
       res.status(200).json({ message: "OTP verified successfully", success: true });
        } else{
          res.status(400).json({ message: "OTP is expired or Invalid", success: false});
        } 
      } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Something went wrong", success: false });
      }
}

export async function verifyFunc(PR_MOBILE_NO,otp) {
try {
  const otpRecord = await prisma.otp.findFirst({
    where: { PR_MOBILE_NO, otp},
  });

  if (!otpRecord) {
    console.log('hell1');
    
   return false
  }

  if (new Date() > otpRecord.expiresAt) {
    console.log('hell2');
    
      return false
  }

  // Delete OTP after successful verification
  // await prisma.otp.delete({
  //   where: { PR_MOBILE_NO, otp },
  // });

return true;
} catch (error) {
  console.log(error);
  return false;
}
}