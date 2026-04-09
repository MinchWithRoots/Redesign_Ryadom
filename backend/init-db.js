import fs from 'fs'
import path from 'path'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

async function initializeDatabase() {
  // First, connect to default postgres database to create our database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  })

  try {
    await adminClient.connect()
    console.log('Connected to PostgreSQL server')

    // Check if database exists
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME || 'ryadom']
    )

    if (result.rows.length === 0) {
      const dbName = process.env.DB_NAME || 'ryadom'
      console.log(`Creating database: ${dbName}...`)
      await adminClient.query(`CREATE DATABASE "${dbName}";`)
      console.log('Database created successfully')
    } else {
      console.log(`Database ${process.env.DB_NAME || 'ryadom'} already exists`)
    }

    await adminClient.end()

    // Now connect to the newly created database and run schema
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ryadom',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    })

    await dbClient.connect()
    console.log(`Connected to database: ${process.env.DB_NAME || 'ryadom'}`)

    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'backend', 'database.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split the schema into individual statements (simple approach)
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      // Skip comments and psql commands
      if (statement.startsWith('--') || statement.startsWith('\\')) {
        continue
      }
      try {
        await dbClient.query(statement)
        console.log('✓ Executed statement')
      } catch (error) {
        // Check if it's a "already exists" error (ignore these)
        if (error.message.includes('already exists')) {
          console.log('⊘ Already exists (skipped)')
        } else {
          console.error('Error executing statement:', error.message)
          throw error
        }
      }
    }

    await dbClient.end()
    console.log('\n✅ Database initialization completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message)
    process.exit(1)
  }
}

initializeDatabase()
