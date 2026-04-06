import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import companionsRoutes from './routes/companions.js'
import chatsRoutes from './routes/chats.js'
import usersRoutes from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/companions', companionsRoutes)
app.use('/api/chats', chatsRoutes)
app.use('/api/users', usersRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
