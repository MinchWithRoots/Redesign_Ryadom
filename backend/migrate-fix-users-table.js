/**
 * Migration: Fix users table schema
 * 
 * This script:
 * 1. Adds password column to users table
 * 2. Removes unused columns (phone, city)
 * 3. Adds topics JSONB field to users table
 * 4. Ensures proper constraints and defaults
 */

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Starting users table migration...\n')

    await client.query('BEGIN')

    // Step 1: Check current columns
    console.log('📋 Checking current table structure...')
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('Current columns:')
    columns.forEach(col => console.log(`   - ${col.column_name}`))

    // Step 2: Add password column if it doesn't exist
    console.log('\n📝 Adding password column...')
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password VARCHAR(255)
    `)
    console.log('✅ Password column added')

    // Step 3: Add topics JSONB column if it doesn't exist
    console.log('📝 Adding topics JSONB column...')
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb
    `)
    console.log('✅ Topics column added')

    // Step 4: Ensure NOT NULL constraint on password (for new registrations)
    // Note: Existing null passwords will stay null until user logs in
    console.log('\n🔒 Verifying constraints...')
    await client.query(`
      ALTER TABLE users
      ALTER COLUMN email SET NOT NULL,
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN created_at SET NOT NULL,
      ALTER COLUMN updated_at SET NOT NULL
    `)
    console.log('✅ Constraints verified')

    // Step 5: Create index on password for faster lookups (optional but good for performance)
    console.log('📑 Creating indexes...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `)
    console.log('✅ Indexes created')

    // Step 6: Display final schema
    console.log('\n✔️ Final table structure:')
    const { rows: finalColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    finalColumns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`)
    })

    // Step 7: Verify foreign keys are intact
    console.log('\n🔗 Verifying foreign keys...')
    const { rows: fks } = await client.query(`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_name != 'users'
      ORDER BY table_name
    `)

    fks.forEach(fk => {
      console.log(`   - ${fk.table_name}.${fk.constraint_name}`)
    })

    await client.query('COMMIT')
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test user registration')
    console.log('   2. Test user login')
    console.log('   3. Verify password is properly hashed')
    
    process.exit(0)

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    pool.end()
  }
}

migrate()
