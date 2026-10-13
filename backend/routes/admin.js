const router = require("express").Router();
const fs = require("fs/promises");
const path = require("path");
const db = require("../db");
const { authenticate, adminOnly } = require("../middleware/auth");
const uploadDirectory = path.resolve(__dirname, "..", "uploads");

router.get("/dashboard", authenticate, adminOnly, async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
      COUNT(*) AS total,
      SUM(status='Submitted') AS submitted,
      SUM(status='Processing') AS processing,
      SUM(status='Resolved') AS resolved,
      SUM(status='Rejected') AS rejected
      FROM complaints
    `);
    res.json({ success:true, stats });
  } catch (e) {
    res.status(500).json({ success:false, message:"Could not load dashboard" });
  }
});

router.get("/complaints", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT c.*, u.name AS student_name, u.roll_no AS student_roll_no,
              u.department AS student_department, u.email AS student_email
      FROM complaints c
      JOIN users u ON u.id = c.student_id
      ORDER BY c.created_at DESC
    `);
    res.json({ success:true, complaints:rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:"Could not load complaints" });
  }
});

router.patch("/complaints/:code", authenticate, adminOnly, async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const allowed = ["Submitted", "Processing", "Resolved", "Rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });
    if (admin_note !== undefined && admin_note !== null && typeof admin_note !== "string") {
      return res.status(400).json({ success:false, message:"Admin note must be text" });
    }

    const [result] = await db.query(
      "UPDATE complaints SET status=?, admin_note=?, updated_at=CURRENT_TIMESTAMP WHERE complaint_code=?",
      [status, admin_note?.trim() || null, req.params.code]
    );

    if (!result.affectedRows) {
      const [existing] = await db.query(
        "SELECT id FROM complaints WHERE complaint_code = ?",
        [req.params.code]
      );
      if (!existing.length) return res.status(404).json({ success:false, message:"Complaint not found" });
    }
    res.json({
      success:true,
      message:"Complaint updated successfully",
      complaint_code:req.params.code,
      status,
      admin_note:admin_note?.trim() || null
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:"Could not update complaint" });
  }
});

router.delete("/complaints/:id", authenticate, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success:false, message:"Invalid complaint ID" });
  }

  try {
    const [complaints] = await db.query(
      "SELECT photo FROM complaints WHERE id = ?",
      [id]
    );
    if (!complaints.length) return res.status(404).json({ success:false, message:"Complaint not found" });

    const [result] = await db.query(
      "DELETE FROM complaints WHERE id = ?",
      [id]
    );
    if (!result.affectedRows) return res.status(404).json({ success:false, message:"Complaint not found" });

    let photoCleanupFailed = false;
    const photoPath = getComplaintPhotoPath(complaints[0].photo);
    if (photoPath) {
      try {
        const [otherReferences] = await db.query(
          "SELECT id FROM complaints WHERE photo = ? LIMIT 1",
          [complaints[0].photo]
        );
        if (!otherReferences.length) await fs.unlink(photoPath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          photoCleanupFailed = true;
          console.error("Could not remove deleted complaint photo:", error);
        }
      }
    }

    res.json({
      success:true,
      complaint_id:id,
      message:photoCleanupFailed
        ? "Complaint deleted successfully, but its photo could not be removed."
        : "Complaint deleted successfully"
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:"Could not delete complaint" });
  }
});

function getComplaintPhotoPath(photo) {
  if (typeof photo !== "string" || !photo.startsWith("/uploads/")) return null;
  const filename = photo.slice("/uploads/".length);
  if (!filename || filename !== path.basename(filename)) return null;

  const filePath = path.resolve(uploadDirectory, filename);
  const relativePath = path.relative(uploadDirectory, filePath);
  if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) return null;
  return filePath;
}

module.exports = router;
