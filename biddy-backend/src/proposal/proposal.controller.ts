import type { Request, Response, NextFunction } from "express";
import { createProposal } from "./proposal.service.js";
import type { ProposalRequestBody } from "../schemas/proposal.schema.js";

export async function proposalController(
  req: Request<unknown, unknown, ProposalRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await createProposal(req.user!.id, req.user!.plan, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}