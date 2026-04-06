import express from 'express'
import pool from '../db.js'

const router = express.Router()

// Get all companions with filters
router.get('/', async (req, res) => {
  try {
    const { ageMin = 18, ageMax = 65, experience, topic } = req.query

    let query = `
      SELECT DISTINCT c.id, c.name, c.age, c.specialization, c.experience, c.image, c.rating, c.reviews, c.bio
      FROM companions c
      LEFT JOIN companion_topics ct ON c.id = ct.companion_id
      WHERE c.age >= $1 AND c.age <= $2
    `
    const params = [ageMin, ageMax]

    if (experience && experience !== 'all') {
      const isExperienced = experience === 'experienced' ? 'Опытный специалист' : 'Начинающий'
      query += ` AND c.experience = $${params.length + 1}`
      params.push(isExperienced)
    }

    if (topic) {
      query += ` AND ct.topic = $${params.length + 1}`
      params.push(topic)
    }

    query += ' ORDER BY c.rating DESC'

    const result = await pool.query(query, params)

    // Get topics for each companion
    for (let companion of result.rows) {
      const topicsResult = await pool.query('SELECT topic FROM companion_topics WHERE companion_id = $1', [companion.id])
      companion.topics = topicsResult.rows.map(row => row.topic)
    }

    res.json(result.rows)
  } catch (error) {
    console.error('Get companions error:', error)
    res.status(500).json({ error: 'Ошибка при получении собеседников' })
  }
})

// Get single companion
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM companions WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Собеседник не найден' })
    }

    const companion = result.rows[0]
    const topicsResult = await pool.query('SELECT topic FROM companion_topics WHERE companion_id = $1', [id])
    companion.topics = topicsResult.rows.map(row => row.topic)

    res.json(companion)
  } catch (error) {
    console.error('Get companion error:', error)
    res.status(500).json({ error: 'Ошибка при получении собеседника' })
  }
})

export default router
