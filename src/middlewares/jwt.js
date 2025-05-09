// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

// export const generateToken = (user) => {
//   return jwt.sign(
//     { PR_ID: user.PR_ID, PR_MOBILE_NO: user.PR_MOBILE_NO }, // Payload (User Data)
//     JWT_SECRET,
//     { expiresIn: "7d" }
//     // Token expiration (7 days)
//   );
// };

// export const verifyToken = (req, res, next) => {
//   console.log("Hhhhhjhjbjb", req.header);

//   const tokenHeader = req.header("Authorization");

//   const token = tokenHeader.split(" ")[1];
//   console.log("TOKENNNNN", token);

//   if (!token) {
//     console.log("2122w", token);

//     return res
//       .status(401)
//       .json({ message: "Access denied, no token provided", success: false });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     console.log("TTTTDJHDEKU", decoded);

//     req.userId = decoded.PR_ID; // Attach user data to request
//     console.log("OOOOO", req.userId);

//     next();
//   } catch (error) {
//     return res.status(403).json({ message: "Invalid token", success: false });
//   }
// };

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

export const generateToken = (user) => {
  if (!user || !user.PR_ID || !user.PR_MOBILE_NO) {
    throw new Error("Invalid user data for token generation");
  }

  return jwt.sign(
    {
      PR_ID: user.PR_ID,
      PR_MOBILE_NO: user.PR_MOBILE_NO,
      // You can add more claims here if needed
    },
    JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

export const verifyToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied, no token provided",
      success: false,
    });
  }

  // Check if header has the correct format: Bearer <token>
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Invalid token format",
      success: false,
    });
  }

  const token = parts[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if required fields exist in token
    if (!decoded.PR_ID) {
      return res.status(403).json({
        message: "Invalid token payload",
        success: false,
      });
    }

    // Attach user data to request
    req.userId = decoded.PR_ID;
    req.userMobile = decoded.PR_MOBILE_NO; // Optional: if you need mobile number in routes

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    let message = "Invalid token";
    if (error.name === "TokenExpiredError") {
      message = "Token expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Malformed token";
    }

    return res.status(403).json({
      message,
      success: false,
    });
  }
};
