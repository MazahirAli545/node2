// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

// export const generateToken = (user) => {
//   if (!user || !user.PR_ID || !user.PR_MOBILE_NO) {
//     throw new Error("Invalid user data for token generation");
//   }

//   return jwt.sign(
//     {
//       PR_ID: user.PR_ID,
//       PR_MOBILE_NO: user.PR_MOBILE_NO,
//       // You can add more claims here if needed
//     },
//     JWT_SECRET,
//     { expiresIn: "7d" } // Token expires in 7 days
//   );
// };

// export const verifyToken = (req, res, next) => {
//   // Get token from header
//   const authHeader = req.header("Authorization");

//   if (!authHeader) {
//     return res.status(401).json({
//       message: "Access denied, no token provided",
//       success: false,
//     });
//   }

//   // Check if header has the correct format: Bearer <token>
//   const parts = authHeader.split(" ");
//   if (parts.length !== 2 || parts[0] !== "Bearer") {
//     return res.status(401).json({
//       message: "Invalid token format",
//       success: false,
//     });
//   }

//   const token = parts[1];

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET);

//     // Check if required fields exist in token
//     if (!decoded.PR_ID) {
//       return res.status(403).json({
//         message: "Invalid token payload",
//         success: false,
//       });
//     }

//     // Attach user data to request
//     req.userId = decoded.PR_ID;
//     req.userMobile = decoded.PR_MOBILE_NO; // Optional: if you need mobile number in routes

//     next();
//   } catch (error) {
//     console.error("Token verification error:", error.message);

//     let message = "Invalid token";
//     if (error.name === "TokenExpiredError") {
//       message = "Token expired";
//     } else if (error.name === "JsonWebTokenError") {
//       message = "Malformed token";
//     }

//     return res.status(403).json({
//       message,
//       success: false,
//     });
//   }
// };

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = "7d"; // Long-lived refresh token

// Session store (use Redis in production)
const activeSessions = new Map();

const generateTokens = (user, deviceId) => {
  if (!user?.PR_ID || !user?.PR_MOBILE_NO) {
    throw new Error("Invalid user data for token generation");
  }

  // Invalidate any existing session
  if (activeSessions.has(user.PR_ID)) {
    const oldSession = activeSessions.get(user.PR_ID);
    oldSession.valid = false; // Mark old session as invalid
  }

  // Generate session ID
  const sessionId = uuidv4();

  // Access Token (short-lived)
  const accessToken = jwt.sign(
    {
      PR_ID: user.PR_ID,
      PR_MOBILE_NO: user.PR_MOBILE_NO,
      deviceId,
      sessionId,
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Refresh Token (long-lived)
  const refreshToken = jwt.sign(
    {
      PR_ID: user.PR_ID,
      sessionId,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  // Store active session
  activeSessions.set(user.PR_ID, {
    sessionId,
    deviceId,
    valid: true,
    refreshToken,
    lastActive: new Date(),
  });

  return { accessToken, refreshToken };
};

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied, no token provided",
      success: false,
      code: "NO_TOKEN",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Invalid token format",
      success: false,
      code: "INVALID_FORMAT",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate session
    const session = activeSessions.get(decoded.PR_ID);
    if (
      !session ||
      !session.valid ||
      session.sessionId !== decoded.sessionId ||
      session.deviceId !== decoded.deviceId
    ) {
      // Add device check
      return res.status(401).json({
        code: "SESSION_EXPIRED",
        message: "Logged in on another device",
      });
    }

    // Attach user data to request
    req.userId = decoded.PR_ID;
    req.userMobile = decoded.PR_MOBILE_NO;
    req.sessionId = decoded.sessionId;
    req.deviceId = decoded.deviceId;

    // Update last active time
    session.lastActive = new Date();

    next();
  } catch (error) {
    let message = "Invalid token";
    let code = "INVALID_TOKEN";

    if (error.name === "TokenExpiredError") {
      message = "Token expired";
      code = "TOKEN_EXPIRED";
    } else if (error.name === "JsonWebTokenError") {
      message = "Malformed token";
      code = "MALFORMED_TOKEN";
    }

    return res.status(403).json({
      message,
      code,
      success: false,
    });
  }
};

const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Get current session
    const session = activeSessions.get(decoded.PR_ID);

    // Validate session
    if (
      !session ||
      !session.valid ||
      session.sessionId !== decoded.sessionId ||
      session.refreshToken !== refreshToken
    ) {
      // Add refresh token match check
      throw new Error("Invalid session");
    }

    // Generate new access token with deviceId
    return {
      accessToken: jwt.sign(
        {
          PR_ID: decoded.PR_ID,
          PR_MOBILE_NO: session.userMobile, // Include mobile if needed
          deviceId: session.deviceId, // Critical for device validation
          sessionId: decoded.sessionId,
          type: "access",
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      ),
      refreshToken, // Return same refresh token (or generate new one if rotating)
    };
  } catch (error) {
    console.error("Refresh token error:", error.message);
    throw new Error("Token refresh failed");
  }
};

const invalidateSession = (userId) => {
  if (activeSessions.has(userId)) {
    activeSessions.get(userId).valid = false;
    activeSessions.delete(userId);
  }
};

export { generateTokens, verifyToken, refreshAccessToken, invalidateSession };
