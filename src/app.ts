import express, { Express } from "express";
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
const app: Express = express();

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
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SkillSync API</title>
      <style>
        :root {
          --primary: #2563eb;
          --surface: #ffffff;
          --background: #f8fafc;
          --text: #0f172a;
          --text-secondary: #64748b;
          --border: #e2e8f0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: var(--background);
          color: var(--text);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          line-height: 1.5;
        }
        .container {
          background: var(--surface);
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          text-align: center;
          max-width: 480px;
          width: 90%;
          border: 1px solid var(--border);
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #dcfce7;
          color: #166534;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }
        p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .links {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .button {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .primary {
          background-color: var(--primary);
          color: white;
        }
        .primary:hover {
          background-color: #1d4ed8;
        }
        .secondary {
          background-color: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }
        .secondary:hover {
          background-color: var(--background);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-badge">
          <div class="status-dot"></div>
          <div>System Operational</div>
        </div>
        <h1>SkillSync API</h1>
        <p>The backend services are running smoothly. Access resources via the endpoints.</p>
        <div class="links">
          <a href="/health" class="button secondary">Health Check</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Health Status</title>
      <style>
        :root { --success: #22c55e; --surface: #ffffff; --background: #f8fafc; --text-secondary: #64748b; --border: #e2e8f0; --primary: #2563eb; }
        body { font-family: -apple-system, system-ui, sans-serif; background-color: var(--background); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: var(--surface); padding: 2rem 3rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid var(--border); text-align: center; }
        .icon { width: 48px; height: 48px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        h1 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; }
        p { color: var(--text-secondary); margin: 0 0 1.5rem; }
        .link { color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
        .link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1>System Operational</h1>
        <p>Status: 200 OK<br><span style="font-size: 0.75rem">Timestamp: ${new Date().toISOString()}</span></p>
        <a href="/" class="link">Return to Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

export default app;
