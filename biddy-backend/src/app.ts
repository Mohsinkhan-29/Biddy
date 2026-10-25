import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { requireAiPlan } from "./middleware/requirePlan.js";
import { rateLimiter, authRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./auth/auth.routes.js";
import { analysisRouter } from "./analysis/analysis.routes.js";
import { proposalRouter } from "./proposal/proposal.routes.js";
import { userRouter } from "./users/user.routes.js";
import { healthRouter } from "./routes/health.route.js";
import { billingRouter } from "./billing/billing.routes.js";
import { adminRouter } from "./admin/admin.routes.js";

export function createApp() {
  const app = express();

  // behind Render/any proxy: use the real client IP for rate limiting
  // instead of lumping every user under the proxy's address
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: env.allowedOrigins.length ? env.allowedOrigins : true,
    }),
  );

  app.use("/health", healthRouter);

  // public — login/refresh/logout happen before a valid JWT exists
  app.use("/api/auth", authRateLimiter, authRouter);

  // everything else under /api requires a valid JWT and is rate-limited to
  // protect Gemini quota
  app.use("/api", requireAuth, rateLimiter);
  app.use("/api/analyze", requireAiPlan, analysisRouter);
  app.use("/api/proposal", requireAiPlan, proposalRouter);
  app.use("/api/user", userRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
