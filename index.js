const express = require('express');
const cors = require('cors');
const db = require('./db');
const authenticateToken = require('./middleware/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({
  origin: 'https://tracking-expenses-100.netlify.app/login',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Expense Tracker!');
});

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Get one expense
app.get('/api/v1/expenses/:id', authenticateToken, async (req, res) => {
  console.log('Get one expense');
  try {
    const { id } = req.params;
    const results = await db.query("SELECT * FROM expenses WHERE id = $1;", [id]);
    res.status(200).json({
      'status': 'success',
      'data': {
        Expense: results.rows,
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 'status': 'error', 'message': 'Server error' });
  }
});

// Get all expenses
app.get('/api/v1/expenses', authenticateToken, async (req, res) => {
  console.log('Get all expenses');
  const userId = req.user.userId;
  try {
    const results = await db.query("SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC;", [userId]);
    res.status(200).json({
      'status': 'success',
      'results': results.rows.length,
      'data': {
        Expenses: results.rows,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 'status': 'error', 'message': 'Server error' });
  }
});

// Add an expense
app.post('/api/v1/expenses', authenticateToken, async (req, res) => {
  console.log('Add an expense');
  const userId = req.user.userId;
  try {
    const { category, description, amount, date } = req.body;
    const results = await db.query("INSERT INTO expenses (category, description, amount, date, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *;", [category, description, amount, date, userId]);
    res.status(200).json({
      'status': 'success',
      'results': results.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 'status': 'error', 'message': 'Server error' });
  }
});

// Update an expense
app.put('/api/v1/expenses/:id', authenticateToken, async (req, res) => {
  console.log('Update an expense');
  try {
    const { id } = req.params;
    const { category, description, amount, date } = req.body;
    const results = await db.query("UPDATE expenses SET category = $5, description = $1, amount = $2, date = $3 WHERE id = $4 RETURNING *;", [description, amount, date, id, category]);
    res.status(200).json({
      'status': 'success',
      'results': results.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 'status': 'error', 'message': 'Server error' });
  }
});

// Delete an expense
app.delete('/api/v1/expenses/:id', authenticateToken, async (req, res) => {
  console.log('Delete an expense');
  const { id } = req.params;
  try {
    await db.query("DELETE FROM expenses WHERE id = $1;", [id]);
    res.status(200).json({
      'status': 'success',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 'status': 'error', 'message': 'Server error' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
