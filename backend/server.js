const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Smart Campus API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Smart Campus backend running on http://localhost:${PORT}`);
});
