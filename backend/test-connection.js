import pool from './db.js'
import dotenv from 'dotenv'

dotenv.config()

async function testConnection() {
  console.log('\n🔍 Testing PostgreSQL Connection...\n')

  try {
    // Test 1: Basic connection
    console.log('Test 1: Connecting to PostgreSQL...')
    const client = await pool.connect()
    console.log('✅ Connected successfully\n')

    // Test 2: Check database info
    console.log('Test 2: Database Information...')
    const dbInfo = await client.query(
      "SELECT datname FROM pg_database WHERE datname = current_database();"
    )
    console.log(`✅ Database: ${dbInfo.rows[0].datname}\n`)

    // Test 3: List all tables
    console.log('Test 3: Tables in Database...')
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Run: npm run init-db\n')
    } else {
      console.log(`✅ Found ${tables.rows.length} tables:`)
      tables.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`)
      })
      console.log()
    }

    // Test 4: Check user records
    console.log('Test 4: Sample Data...')
    const users = await client.query('SELECT COUNT(*) as count FROM users;')
    const companions = await client.query('SELECT COUNT(*) as count FROM companions;')
    const chats = await client.query('SELECT COUNT(*) as count FROM chats;')

    console.log(`✅ Users: ${users.rows[0].count}`)
    console.log(`✅ Companions: ${companions.rows[0].count}`)
    console.log(`✅ Chats: ${chats.rows[0].count}\n`)

    // Test 5: Show sample companion
    if (companions.rows[0].count > 0) {
      console.log('Test 5: Sample Companion...')
      const companion = await client.query(`
        SELECT c.id, c.name, c.specialization, c.rating,
               COUNT(ct.id) as topic_count
        FROM companions c
        LEFT JOIN companion_topics ct ON c.id = ct.companion_id
        GROUP BY c.id
        LIMIT 1;
      `)
      const comp = companion.rows[0]
      console.log(`✅ ID: ${comp.id}`)
      console.log(`   Name: ${comp.name}`)
      console.log(`   Specialization: ${comp.specialization}`)
      console.log(`   Rating: ${comp.rating}`)
      console.log(`   Topics: ${comp.topic_count}\n`)
    }

    client.release()

    // Test 6: Final summary
    console.log('=' * 50)
    console.log('✅ All Connection Tests Passed!')
    console.log('=' * 50)
    console.log('\n📝 Next Steps:')
    console.log('1. Start backend: npm run dev')
    console.log('2. Backend will run on http://localhost:5000')
    console.log('3. Test API: curl http://localhost:5000/api/health')
    console.log('\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Connection Test Failed!')
    console.error(`Error: ${error.message}\n`)
    console.error('💡 Troubleshooting:')
    console.error('1. Check if PostgreSQL is running')
    console.error('2. Verify .env file settings')
    console.error('3. Run: npm run init-db')
    console.error('\n')
    process.exit(1)
  }
}

testConnection()
