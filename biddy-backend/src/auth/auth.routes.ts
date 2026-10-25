import { Router } from "express";
import {
  googleLoginController,
  googleWebLoginController,
  refreshController,
  logoutController,
} from "./auth.controller.js";

export const authRouter = Router();

// public — these run BEFORE the JWT middleware in app.ts
authRouter.post("/google", googleLoginController);
authRouter.post("/google-web", googleWebLoginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
