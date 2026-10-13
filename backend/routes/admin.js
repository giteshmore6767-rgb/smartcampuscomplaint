const router = require("express").Router();
const db = require("../db");
const { authenticate, adminOnly } = require("../middleware/auth");
const { getUploadKey } = require("../photo-key");

router.get("/dashboard", authenticate, adminOnly, async (req, res) => {
  try {
    const query = db.isPostgres ? `
      SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'Submitted')::int AS submitted,
      COUNT(*) FILTER (WHERE status = 'Processing')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'Resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected
      FROM complaints
    ` : `
      SELECT
      COUNT(*) AS total,
      COALESCE(SUM(status = 'Submitted'), 0) AS submitted,
      COALESCE(SUM(status = 'Processing'), 0) AS processing,
      COALESCE(SUM(status = 'Resolved'), 0) AS resolved,
      COALESCE(SUM(status = 'Rejected'), 0) AS rejected
      FROM complaints
    `;
    const { rows } = await db.query(query);
    res.json({ success:true, stats: rows[0] });
  } catch (e) {
    res.status(500).json({ success:false, message:"Could not load dashboard" });
  }
});

router.get("/complaints", authenticate, adminOnly, async (req, res) => {
  try {
    const { rows } = await db.query(`
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

    const result = await db.query(
      "UPDATE complaints SET status=$1, admin_note=$2, updated_at=NOW() WHERE complaint_code=$3",
      [status, admin_note?.trim() || null, req.params.code]
    );

    if (!result.rowCount) {
      const existing = await db.query(
        "SELECT id FROM complaints WHERE complaint_code = $1",
        [req.params.code]
      );
      if (!existing.rows.length) return res.status(404).json({ success:false, message:"Complaint not found" });
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
    const complaints = await db.query(
      "SELECT photo FROM complaints WHERE id = $1",
      [id]
    );
    if (!complaints.rows.length) return res.status(404).json({ success:false, message:"Complaint not found" });

    const result = await db.query(
      "DELETE FROM complaints WHERE id = $1",
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ success:false, message:"Complaint not found" });

    let photoCleanupFailed = false;
    const photo = complaints.rows[0].photo;
    const photoKey = getUploadKey(photo);
    if (photoKey) {
      try {
        const otherReferences = await db.query(
          "SELECT id FROM complaints WHERE photo = $1 LIMIT 1",
          [photo]
        );
        if (!otherReferences.rows.length) {
          await db.query("DELETE FROM complaint_photos WHERE photo_key = $1", [photoKey]);
        }
      } catch (error) {
        photoCleanupFailed = true;
        console.error("Could not remove deleted complaint photo:", error);
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

module.exports = router;
