import { verifyToken } from "./jwt.js";
import { prisma } from "../prisma/client.js";

export const authenticateUser = async (req, res, next) => {
  try {
    // Get and validate authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing or invalid authorization header",
        success: false,
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: decoded.PR_ID },
      select: {
        PR_ID: true,
        PR_MOBILE_NO: true,
        PR_FULL_NAME: true,
        PR_EMAIL: true,
        // Include other non-sensitive fields you need
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    const response = {
      success: false,
      message: "Authentication failed",
    };

    if (error.name === "TokenExpiredError") {
      response.message = "Token expired";
      return res.status(401).json(response);
    }

    if (error.name === "JsonWebTokenError") {
      response.message = "Invalid token";
      return res.status(403).json(response);
    }

    return res.status(500).json({
      ...response,
      message: "Internal server error",
      error: error.message,
    });
  }
};
