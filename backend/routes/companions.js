import express from 'express'
import pool from '../db.js'

const router = express.Router()

// Get all companions with filters
router.get('/', async (req, res) => {
  try {
    const { ageMin = 18, ageMax = 65, experience, topic } = req.query

    let query = `
      SELECT c.id, c.name, c.age, c.experience, c.image, c.bio, c.topics,
             c.created_at, c.updated_at
      FROM companions c
      WHERE c.age >= $1 AND c.age <= $2
    `
    const params = [ageMin, ageMax]

    if (experience && experience !== 'all') {
      query += ` AND c.experience = $${params.length + 1}`
      params.push(experience)
    }

    if (topic) {
      // Filter by topic name - find topic ID first
      const topicResult = await pool.query('SELECT id FROM companion_topics WHERE name = $1', [topic])
      if (topicResult.rows.length > 0) {
        const topicId = topicResult.rows[0].id
        query += ` AND c.topics @> $${params.length + 1}::jsonb`
        params.push(JSON.stringify([topicId]))
      }
    }

    query += ' ORDER BY c.id DESC'

    const result = await pool.query(query, params)

    // Convert topic IDs to topic names
    const topicsResult = await pool.query('SELECT id, name FROM companion_topics')
    const topicMap = new Map()
    topicsResult.rows.forEach(t => topicMap.set(t.id, t.name))

    // Transform each companion's topics array
    for (let companion of result.rows) {
      const topicIds = companion.topics || []
      companion.topics = topicIds
        .map(id => topicMap.get(id))
        .filter(name => name !== undefined)
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

    // Get topic names from topic IDs
    const topicsResult = await pool.query('SELECT id, name FROM companion_topics')
    const topicMap = new Map()
    topicsResult.rows.forEach(t => topicMap.set(t.id, t.name))

    const topicIds = companion.topics || []
    companion.topics = topicIds
      .map(id => topicMap.get(id))
      .filter(name => name !== undefined)

    res.json(companion)
  } catch (error) {
    console.error('Get companion error:', error)
    res.status(500).json({ error: 'Ошибка при получении собеседника' })
  }
})

export default router
