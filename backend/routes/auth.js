import express from 'express'
import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Заполните все поля' })
    }

    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, age, bio, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, age, bio, image',
      [fullName, email, hashedPassword, 25, '', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png']
    )

    const user = result.rows[0]

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ success: true, user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Ошибка при регистрации' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Заполните все поля' })
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' })
    }

    const user = result.rows[0]

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' })
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, age: user.age, bio: user.bio, image: user.image }, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Ошибка при входе' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Токен не найден' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const result = await pool.query('SELECT id, name, email, age, bio, image FROM users WHERE id = $1', [decoded.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Неавторизовано' })
  }
})

export default router
