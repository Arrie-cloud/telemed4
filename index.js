const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const dbConfig = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const port = 5006;

// Database Connection (in database.js)
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use('/auth', authRoutes);
app.use('/patients', authMiddleware, patientRoutes); // Protected routes
app.use('/doctors', authMiddleware, doctorRoutes); // Protected routes
app.use('/appointments', authMiddleware, appointmentRoutes); // Protected routes

// user registration
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [rows] = await pool.execute('INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM `users` WHERE `email` = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        req.session.userId = user.id;
        req.session.role = user.role;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// ... other routes for CRUD operations on patients, doctors, and appointments ...

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});