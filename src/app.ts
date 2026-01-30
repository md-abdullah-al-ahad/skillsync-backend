import express, { NextFunction, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
const app = express();
import { auth } from "./lib/auth";
app.use(express.json());
import cors from "cors";

app.use(
  cors({
    origin: [process.env.APP_URL || "http://localhost:3000"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.send("Welcome to the Skillsync API!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

export default app;
