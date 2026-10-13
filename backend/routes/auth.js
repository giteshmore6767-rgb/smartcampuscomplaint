const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
      const { roll_no, email, password } = req.body;

      if ((!roll_no && !email) || !password) {
          return res.status(400).json({
              success: false,
              message: "Login details and password are required"
          });
      }

      let rows;

      if (email) {
          [rows] = await db.query(
              `SELECT id, name, roll_no, email, password_hash, role, department
               FROM users
               WHERE email = ?`,
              [email]
          );
      } else {
          [rows] = await db.query(
              `SELECT id, name, roll_no, email, password_hash, role, department
               FROM users
               WHERE roll_no = ?`,
              [roll_no]
          );
      }

      if (!rows.length) {
          return res.status(401).json({
              success: false,
              message: "Invalid login details or password"
          });
      }

      const user = rows[0];

      const valid = await bcrypt.compare(
          password,
          user.password_hash
      );

      if (!valid) {
          return res.status(401).json({
              success: false,
              message: "Invalid login details or password"
          });
      }

      const token = jwt.sign(
          {
              id: user.id,
              name: user.name,
              roll_no: user.roll_no,
              email: user.email,
              role: user.role,
              department: user.department
          },
          process.env.JWT_SECRET || "change_this_secret",
          {
              expiresIn: "8h"
          }
      );

      res.json({
          success: true,
          token,
          user: {
              id: user.id,
              name: user.name,
              roll_no: user.roll_no,
              email: user.email,
              role: user.role,
              department: user.department
          }
      });

  } catch (error) {
      console.error(error);

      res.status(500).json({
          success: false,
          message: "Login failed"
      });
  }
});


// ================= STUDENT REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      department,
      roll_no,
      password
    } = req.body;

    // Check required fields
    if (!name || !department || !roll_no || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Check if Roll Number already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE roll_no = ?",
      [roll_no]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Roll number already registered"
      });
    }

    // Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create student account
    const [result] = await db.query(
      `INSERT INTO users
      (name, roll_no, password_hash, role, department)
      VALUES (?, ?, ?, 'student', ?)`,
      [
        name,
        roll_no,
        passwordHash,
        department
      ]
    );

    res.status(201).json({
      success: true,
      message: "Student account created successfully",
      userId: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

router.patch("/profile", authenticate, async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name?.trim() || !department?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and department are required"
      });
    }

    const normalizedName = name.trim();
    const normalizedDepartment = department.trim();
    if (normalizedName.length > 100 || normalizedDepartment.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name and department must be 100 characters or fewer"
      });
    }

    await db.query(
      "UPDATE users SET name = ?, department = ? WHERE id = ? AND role = 'student'",
      [normalizedName, normalizedDepartment, req.user.id]
    );

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: normalizedName,
        roll_no: req.user.roll_no,
        email: req.user.email,
        role: req.user.role,
        department: normalizedDepartment
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Could not update profile"
    });
  }
});


// ================= EXPORT ROUTER =================
module.exports = router;