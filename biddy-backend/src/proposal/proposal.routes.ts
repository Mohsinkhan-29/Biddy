import { Router } from "express";
import { proposalController } from "./proposal.controller.js";
import { validateBody } from "../middleware/validateRequest.js";
import { proposalRequestSchema } from "../schemas/proposal.schema.js";

export const proposalRouter = Router();

proposalRouter.post("/", validateBody(proposalRequestSchema), proposalController);
