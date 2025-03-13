import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

export const generateToken = (user) => {
  return jwt.sign(
    { PR_ID: user.PR_ID, PR_MOBILE_NO: user.PR_MOBILE_NO }, // Payload (User Data)
    JWT_SECRET
    // Token expiration (7 days)
  );
};

export const verifyToken = (req, res, next) => {
  // const token = req.header("Authorization");
  // console.log("TOKENNNNN", token);
  console.log("🔹 Request Headers:", req.headers); // Debugging
  const authHeader = req.header("Authorization"); // ✅ Retrieve the Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied, no token provided", success: false });
  }

  const token = authHeader.split(" ")[1]; // ✅ Extract token after "Bearer"
  console.log("🔹 Extracted Token:", token); // Debugging

  if (!token) {
    console.log("2122w", token);

    return res
      .status(401)
      .json({ message: "Access denied, no token provided", success: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("TTTTDJHDEKU", decoded);

    req.userId = decoded.PR_ID; // Attach user data to request
    console.log("OOOOO", req.userId);

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token", success: false });
  }
};
