function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NETLIFY || process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in the deployment environment");
  }
  return "change_this_secret";
}

module.exports = { getJwtSecret };