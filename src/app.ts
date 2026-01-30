import express from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";
import adminRoutes from "./modules/admin/admin.routes";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [process.env.APP_URL || "http://localhost:3000"],
    credentials: true,
  }),
);

// Better Auth routes
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api/admin", adminRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/student", studentRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/tutors", tutorRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Skillsync API!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

export default app;
