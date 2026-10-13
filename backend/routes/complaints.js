const router = require("express").Router();
const multer = require("multer");
const { randomUUID } = require("crypto");
const path = require("path");
const db = require("../db");
const { authenticate } = require("../middleware/auth");
const { getUploadStore } = require("../upload-store");

const imageTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp"
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname) return cb(null, false);
    const extension = path.extname(file.originalname).toLowerCase();
    if (!imageTypes[extension] || imageTypes[extension] !== file.mimetype) {
      return cb(new Error("Upload a JPEG, PNG, GIF, or WebP image"));
    }
    cb(null, true);
  }
});

function receivePhoto(req, res, next) {
  upload.single("photo")(req, res, error => {
    if (!error) return next();
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Photo must be 4 MB or smaller"
      : error.message || "Could not upload photo";
    return res.status(400).json({ success: false, message });
  });
}

function hasValidImageSignature(buffer, mimetype) {
  const bytes = buffer.subarray(0, 12);
  if (mimetype === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimetype === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === "image/gif") return bytes.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/) !== null;
  if (mimetype === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

async function removeUploadedBlob(key) {
  if (!key) return;
  try {
    await getUploadStore().delete(key);
  } catch (error) {
    console.error("Could not remove failed complaint upload:", error);
  }
}

router.post("/", authenticate, receivePhoto, async (req, res) => {
  let saved = false;
  let photoKey = null;
  try {
    const { category, description, department, location } = req.body;
    if (![category, description, department, location].every(value => typeof value === "string" && value.trim())) {
      return res.status(400).json({ success: false, message: "Please fill in category, department, location, and description" });
    }

    if (req.file && !hasValidImageSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ success: false, message: "The uploaded file is not a valid image" });
    }

    photoKey = req.file ? `${randomUUID()}${path.extname(req.file.originalname).toLowerCase()}` : null;
    const photo = photoKey ? `/uploads/${photoKey}` : null;
    const complaintCode = `CMP-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    if (req.file) {
      await getUploadStore().set(photoKey, req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });
    }

    const result = await db.query(
      `INSERT INTO complaints
      (complaint_code, student_id, category, description, department, location, photo, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Submitted')
      RETURNING id`,
      [complaintCode, req.user.id, category.trim(), description.trim(), department.trim(), location.trim(), photo]
    );
    saved = true;

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      id: result.rows[0].id,
      complaint_code: complaintCode,
      photo
    });
  } catch (e) {
    console.error(e);
    if (!saved) await removeUploadedBlob(photoKey);
    res.status(500).json({ success: false, message: "Could not save complaint. Please try again." });
  }
});

router.get("/mine", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, complaint_code, category, description, department, location, photo, status, admin_note, created_at, updated_at
       FROM complaints WHERE student_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, complaints: rows.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Could not load your complaints" });
  }
});

module.exports = router;
