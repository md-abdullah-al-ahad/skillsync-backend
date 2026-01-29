import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.APP_USER || "",
    pass: process.env.APP_PASS || "",
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const info = await transporter.sendMail({
          from: `"SkillSync" <${process.env.APP_USER}>`,
          to: user.email,
          subject: "Verify your email - SkillSync",
          text: `Hello ${user.name},\n\nPlease verify your email by clicking the link below:\n\n${url}\n\nIf you didn't create an account, please ignore this email.`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to SkillSync!</h2>
            <p>Hello ${user.name},</p>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${url}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
          </div>
        `,
        });

        console.log("Message sent:", info.messageId);
      } catch (error) {
        console.error("Error sending verification email:", error);
      }
    },
  },
});
