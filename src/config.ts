import dotenv from "dotenv";

dotenv.config();

export const JWT_PASSWORD = process.env.JWT_SECRET || "default_secret";