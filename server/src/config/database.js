import dns from 'node:dns';

dns.setServers([
  '8.8.8.8',
  '8.8.4.4',
]);

import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    // console.log(process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}