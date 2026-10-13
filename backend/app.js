const express = require("express");
const cors = require("cors");
const db = require("./db");
const { getUploadKey } = require("./photo-key");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, message: "Smart Campus API is running" });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

app.post("/api/_migration/upload/:filename", express.raw({
  type: "application/octet-stream",
  limit: "5mb"
}), async (req, res) => {
  const connectionString = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;
  if (!connectionString || req.get("authorization") !== `Bearer ${connectionString}`) {
    return res.status(404).end();
  }

  const key = getUploadKey(`/uploads/${req.params.filename}`);
  const contentType = req.get("content-type");
  if (!key || !Buffer.isBuffer(req.body) || !req.body.length ||
      !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(contentType)) {
    return res.status(400).json({ success: false, message: "Invalid upload" });
  }

  try {
    await db.query(
      `INSERT INTO complaint_photos (key, content_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET content_type = EXCLUDED.content_type, data = EXCLUDED.data`,
      [key, contentType, req.body]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Could not migrate complaint photo:", error);
    res.status(500).json({ success: false, message: "Could not store photo" });
  }
});

app.get("/uploads/:filename", async (req, res) => {
  const key = getUploadKey(`/uploads/${req.params.filename}`);
  if (!key) return res.status(404).end();

  try {
    const { rows } = await db.query(
      "SELECT content_type, data FROM complaint_photos WHERE key = $1",
      [key]
    );
    if (!rows.length) return res.status(404).end();

    res
      .set("Content-Type", rows[0].content_type)
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .send(rows[0].data);
  } catch (error) {
    console.error("Could not load complaint photo:", error);
    res.status(500).end();
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ success: false, message: "Server error" });
});

module.exports = app;