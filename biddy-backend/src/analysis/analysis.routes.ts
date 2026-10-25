import { Router } from "express";
import { analyzeController } from "./analysis.controller.js";
import { validateBody } from "../middleware/validateRequest.js";
import { analyzeRequestSchema } from "../schemas/analyze.schema.js";

export const analysisRouter = Router();

analysisRouter.post("/", validateBody(analyzeRequestSchema), analyzeController);
