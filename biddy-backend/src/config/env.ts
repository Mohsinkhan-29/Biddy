import "dotenv/config";

/** Env values trimmed of whitespace and wrapping quotes — dashboards make those easy to paste in. */
function clean(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

function required(name: string): string {
  const value = clean(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),

  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  // Premium plan's higher-tier model; falls back to the standard one
  geminiModelPremium:
    process.env.GEMINI_MODEL_PREMIUM || process.env.GEMINI_MODEL || "gemini-2.0-flash",

  // legacy static-token list — no longer used to protect /api (JWT does that
  // now), kept only so old deployments don't crash on a missing env var.
  apiTokens: (process.env.API_TOKENS ?? "").split(",").filter(Boolean),

  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 30),

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),

  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // Website sign-in uses a separate "Web application" OAuth client
  googleWebClientId: clean("GOOGLE_WEB_CLIENT_ID"),

  // Google accounts allowed into /api/admin, comma-separated
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};
