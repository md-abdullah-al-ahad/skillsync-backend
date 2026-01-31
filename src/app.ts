import express from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";
import adminRoutes from "./modules/admin/admin.routes";
import authRoutes from "./modules/auth/auth.routes";
import bookingRoutes from "./modules/booking/booking.routes";
import categoryRoutes from "./modules/category/category.routes";
import reviewRoutes from "./modules/review/review.routes";
import studentRoutes from "./modules/student/student.routes";
import tutorRoutes from "./modules/tutor/tutor.routes";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [process.env.APP_URL || "http://localhost:3000"],
    credentials: true,
  }),
);

// Better Auth routes (handles sign-up, sign-in, OAuth, etc.)
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/tutors", tutorRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Skillsync API!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

export default app;
