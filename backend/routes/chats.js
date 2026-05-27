import express from 'express'
import pool from '../db.js'
import jwt from 'jsonwebtoken'
import * as encryptionService from '../services/encryptionService.js'

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

// Initialize encryption for a chat
router.post('/:chatId/init-encryption', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const { user_id, master_key_encrypted } = req.body

    if (!user_id || !master_key_encrypted) {
      return res.status(400).json({ error: 'Missing user_id or master_key_encrypted' })
    }

    // Store encrypted master key for this user
    const result = await pool.query(
      `INSERT INTO chat_encryption_keys (chat_id, user_id, encrypted_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (chat_id, user_id) DO UPDATE
       SET encrypted_key = $3, updated_at = NOW()
       RETURNING id, chat_id, user_id`,
      [chatId, user_id, master_key_encrypted]
    )

    console.log(`Encryption initialized for chat ${chatId}, user ${user_id}`)
    res.json({ success: true, encryption_key: result.rows[0] })
  } catch (error) {
    console.error('Init encryption error:', error)
    res.status(500).json({ error: 'Ошибка при инициализации шифрования' })
  }
})

// Get chat messages
router.get('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const { decrypt_key } = req.query // Optional decryption key from frontend

    const result = await pool.query(`
      SELECT m.id, m.sender_id, m.text, m.encrypted_text, m.is_encrypted, m.created_at,
             u.name as author,
             CASE WHEN m.sender_id = $2 THEN true ELSE false END as isMine
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `, [chatId, req.userId])

    // Decrypt messages if needed and key is provided
    const messages = result.rows.map(msg => {
      let text = msg.text
      if (msg.is_encrypted && decrypt_key && msg.encrypted_text) {
        try {
          const decrypted = encryptionService.decryptData(msg.encrypted_text, decrypt_key)
          if (decrypted) {
            text = decrypted
          }
        } catch (err) {
          console.error('Failed to decrypt message:', err)
        }
      }

      return {
        id: msg.id,
        sender_id: msg.sender_id,
        text,
        created_at: msg.created_at,
        author: msg.author,
        isMine: msg.isMine,
      }
    })

    // Mark as read
    await pool.query(
      'UPDATE chat_read_status SET unread_count = 0, last_read_at = NOW() WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.userId]
    )

    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Ошибка при получении сообщений' })
  }
})

// Send message
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const { text, encrypted_text, encryption_key } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    let isEncrypted = false
    let encryptedText = null

    // If encryption key is provided, encrypt the message
    if (encryption_key && encrypted_text) {
      try {
        isEncrypted = true
        encryptedText = encrypted_text
        console.log(`Message encrypted for chat ${chatId}`)
      } catch (err) {
        console.error('Encryption error:', err)
        // Fall back to plaintext
        isEncrypted = false
      }
    }

    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, text, encrypted_text, is_encrypted)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, chat_id, sender_id, text, encrypted_text, is_encrypted, created_at`,
      [chatId, req.userId, text, encryptedText, isEncrypted]
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
