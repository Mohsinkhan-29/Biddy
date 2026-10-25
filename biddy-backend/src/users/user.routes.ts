import { Router } from "express";
import { meController, historyController, usageController } from "./user.controller.js";

export const userRouter = Router();

userRouter.get("/me", meController);
userRouter.get("/history", historyController);
userRouter.get("/usage", usageController);
