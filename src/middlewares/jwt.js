import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret";

export const generateToken = (user) => {
  return jwt.sign(
    { PR_ID: user.PR_ID, PR_MOBILE_NO: user.PR_MOBILE_NO }, // Payload (User Data)
    JWT_SECRET,
    { expiresIn: "7d" }
    // Token expiration (7 days)
  );
};

export const verifyToken = (req, res, next) => {
  console.log("Hhhhhjhjbjb", req.header);

  const tokenHeader = req.header("Authorization");

  const token = tokenHeader.split(" ")[1];
  console.log("TOKENNNNN", token);

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
