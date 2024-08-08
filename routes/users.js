const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const userResult = await db.query('SELECT * FROM users WHERE username = $1;', [username]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user into the database
    const newUser = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;',
      [username, hashedPassword]
    );

    res.status(201).json({ status: 'success', data: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE username = $1;', [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    const user = userResult.rows[0];

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ status: 'success', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
