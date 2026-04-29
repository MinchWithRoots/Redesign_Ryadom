import express from 'express'
import pool from '../db.js'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

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

// Admin: Update user email in Supabase Auth (requires admin token)
router.put('/admin/update-email', verifyToken, async (req, res) => {
  try {
    const { userId, newEmail } = req.body

    if (!userId || !newEmail) {
      return res.status(400).json({ error: 'userId и newEmail обязательны' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase service role не сконфигурирован' })
    }

    console.log('🔄 Updating user email in Supabase Auth:', { userId, newEmail })

    // Update email in Supabase Auth using admin client
    const { data, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    )

    if (updateAuthError) {
      console.error('❌ Error updating Supabase Auth email:', {
        message: updateAuthError.message,
        code: updateAuthError.code,
        userId,
        newEmail
      })
      return res.status(400).json({
        error: 'Ошибка при обновлении email в Supabase Auth',
        details: updateAuthError.message
      })
    }

    // Update email in database too
    const dbResult = await pool.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, age, bio, image',
      [newEmail, userId]
    )

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден в базе данных' })
    }

    console.log('✅ User email updated successfully:', { userId, newEmail })

    res.json({
      message: 'Email пользователя обновлен в Supabase Auth и базе данных',
      user: dbResult.rows[0],
      supabaseUser: data.user
    })
  } catch (error) {
    console.error('Update email error:', error)
    res.status(500).json({ error: 'Ошибка при обновлении email' })
  }
})

export default router
