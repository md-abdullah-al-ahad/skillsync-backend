import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export enum UserRole {
  ADMIN = "ADMIN",
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        emailVerified: boolean;
        status: string;
      };
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get user session
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verify your email!",
        });
      }

      // Fetch user from database to get role and status
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found!",
        });
      }

      // Check if user is banned
      if (user.status === "BANNED") {
        return res.status(403).json({
          success: false,
          message: "Your account has been banned. Please contact support!",
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        emailVerified: user.emailVerified,
        status: user.status,
      };

      // Check role-based access
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden! You don't have permission to access these resources!",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
