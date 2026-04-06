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

// Get all chats for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.companion_id, c.status, c.created_at, c.updated_at,
             comp.name, comp.image,
             m.text as lastMessage,
             MAX(m.created_at) as time,
             crs.unread_count
      FROM chats c
      JOIN companions comp ON c.companion_id = comp.id
      LEFT JOIN messages m ON c.id = m.chat_id
      LEFT JOIN chat_read_status crs ON c.id = crs.chat_id AND crs.user_id = $1
      WHERE c.user_id = $1
      GROUP BY c.id, comp.id, crs.id
      ORDER BY MAX(m.created_at) DESC NULLS LAST
    `, [req.userId])

    res.json(result.rows)
  } catch (error) {
    console.error('Get chats error:', error)
    res.status(500).json({ error: 'Ошибка при получении чатов' })
  }
})

// Create or get chat
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { companionId } = req.body

    if (!companionId) {
      return res.status(400).json({ error: 'Укажите ID собеседника' })
    }

    // Check if chat exists
    let result = await pool.query(
      'SELECT * FROM chats WHERE user_id = $1 AND companion_id = $2',
      [req.userId, companionId]
    )

    if (result.rows.length > 0) {
      return res.json({ chat: result.rows[0] })
    }

    // Create new chat
    result = await pool.query(
      'INSERT INTO chats (user_id, companion_id) VALUES ($1, $2) RETURNING *',
      [req.userId, companionId]
    )

    // Initialize read status
    await pool.query(
      'INSERT INTO chat_read_status (chat_id, user_id, unread_count) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.userId, 0]
    )

    res.json({ chat: result.rows[0] })
  } catch (error) {
    console.error('Create chat error:', error)
    res.status(500).json({ error: 'Ошибка при создании чата' })
  }
})

// Get chat messages
router.get('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params

    const result = await pool.query(`
      SELECT m.id, m.sender_id, m.text, m.created_at,
             u.name as author,
             CASE WHEN m.sender_id = $2 THEN true ELSE false END as isMine
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `, [chatId, req.userId])

    // Mark as read
    await pool.query(
      'UPDATE chat_read_status SET unread_count = 0, last_read_at = NOW() WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Ошибка при получении сообщений' })
  }
})

// Send message
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    const result = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
      [chatId, req.userId, text]
    )

    // Update chat updated_at
    await pool.query(
      'UPDATE chats SET updated_at = NOW() WHERE id = $1',
      [chatId]
    )

    res.json({ message: result.rows[0] })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Ошибка при отправке сообщения' })
  }
})

// Delete chat
router.delete('/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params

    const result = await pool.query(
      'DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id',
      [chatId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' })
    }

    res.json({ success: true, deletedChatId: result.rows[0].id })
  } catch (error) {
    console.error('Delete chat error:', error)
    res.status(500).json({ error: 'Ошибка при удалении чата' })
  }
})

// End session
router.post('/:chatId/end-session', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params

    const result = await pool.query(
      'UPDATE chats SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['offline', chatId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' })
    }

    // Add system message
    await pool.query(
      'INSERT INTO messages (chat_id, sender_id, text) VALUES ($1, $2, $3)',
      [chatId, req.userId, 'Сессия завершена. Спасибо за использование нашего сервиса!']
    )

    res.json({ success: true })
  } catch (error) {
    console.error('End session error:', error)
    res.status(500).json({ error: 'Ошибка при завершении сессии' })
  }
})

export default router
