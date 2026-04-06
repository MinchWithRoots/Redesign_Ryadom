import express from 'express'
import pool from '../db.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Токен не найден' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (error) {
    res.status(401).json({ error: 'Неавторизовано' })
  }
}

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, age, bio, image FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Ошибка при получении профиля' })
  }
})

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { bio, image } = req.body

    const result = await pool.query(
      'UPDATE users SET bio = COALESCE($1, bio), image = COALESCE($2, image), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, age, bio, image',
      [bio || null, image || null, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({ user: result.rows[0], message: 'Профиль обновлен' })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Ошибка при обновлении профиля' })
  }
})

export default router
