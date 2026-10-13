const express = require("express");
const cors = require("cors");
const db = require("./db");
const { getUploadKey, getUploadStore } = require("./upload-store");

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

app.get("/uploads/:filename", async (req, res) => {
  const key = getUploadKey(`/uploads/${req.params.filename}`);
  if (!key) return res.status(404).end();

  try {
    const entry = await getUploadStore().getWithMetadata(key, {
      consistency: "strong",
      type: "arrayBuffer"
    });
    if (!entry) return res.status(404).end();

    res
      .set("Content-Type", entry.metadata?.contentType || "application/octet-stream")
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .send(Buffer.from(entry.data));
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