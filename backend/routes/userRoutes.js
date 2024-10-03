const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const router = express.Router();

router.post('/register', (req, res) => {
    const { firstName, lastName, email, password, userType } = req.body;

    console.log('Received data:', req.body);

    if (!firstName || !lastName || !email || !password || !userType) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Error hashing password' });
        }

        const sql = 'INSERT INTO users (firstName, lastName, email, password, registerAs) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [firstName, lastName, email, hashedPassword, userType], (err, result) => {
            if (err) {
                console.error('Error saving user:', err);
                return res.status(500).json({ error: 'Error saving user' });
            }
            console.log('User registered with ID:', result.insertId);
            return res.status(201).json({ message: 'User registered successfully!' });
        });
    });
});

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Server error" });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        registerAs: user.registerAs,
      });
    });
  });

router.post("/forget-password", async (req, res) => {
    const { email, newPassword } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Email does not exist" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Server error" });
            }

            res.status(200).json({ message: "Password updated successfully" });
        });
    });
});

module.exports = router;