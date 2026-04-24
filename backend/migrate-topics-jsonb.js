/**
 * Migration: Refactor companion_topics to reference table + add topics JSONB to companions
 * 
 * This script:
 * 1. Creates companion_topics as a reference table (without companion_id)
 * 2. Adds topics JSONB field to companions table
 * 3. Migrates existing companion-topic relationships to topics JSONB array
 * 4. Removes specialization field from companions
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

const DEFAULT_TOPICS = [
  'Отношения',
  'Стресс',
  'Тревожность',
  'Карьера',
  'Горе',
  'Потеря',
  'Восстановление',
  'Мотивация',
  'Развитие'
]

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Starting topics JSONB migration...\n')

    await client.query('BEGIN')

    // Step 1: Add topics JSONB column to companions if not exists
    console.log('📋 Adding topics JSONB column to companions...')
    await client.query(`
      ALTER TABLE companions
      ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb
    `)
    console.log('✅ Column added')

    // Step 2: Fetch all companion-topic relationships
    console.log('📥 Fetching companion-topic relationships...')
    const { rows: companionTopics } = await client.query(`
      SELECT DISTINCT companion_id, topic FROM companion_topics
      ORDER BY companion_id
    `)

    console.log(`Found ${companionTopics.length} companion-topic entries`)

    // Step 3: Get unique topics and create mapping
    const topicSet = new Set()
    const companionTopicsMap = new Map()
    
    companionTopics.forEach(ct => {
      topicSet.add(ct.topic)
      if (!companionTopicsMap.has(ct.companion_id)) {
        companionTopicsMap.set(ct.companion_id, [])
      }
      companionTopicsMap.get(ct.companion_id).push(ct.topic)
    })

    // Combine with defaults
    const allTopics = Array.from(
      new Set([...DEFAULT_TOPICS, ...topicSet])
    ).sort()

    console.log(`\nTotal unique topics: ${allTopics.length}`)
    allTopics.forEach(t => console.log(`   - ${t}`))

    // Step 4: Drop old companion_topics table
    console.log('\n🔄 Recreating companion_topics as reference table...')
    await client.query(`DROP TABLE IF EXISTS companion_topics CASCADE`)
    console.log('✅ Old table dropped')

    // Step 5: Create new companion_topics as reference table
    console.log('📝 Creating new companion_topics reference table...')
    await client.query(`
      CREATE TABLE companion_topics (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_companion_topics_name ON companion_topics(name);
    `)
    console.log('✅ New reference table created')

    // Step 6: Insert all topics
    console.log('📝 Inserting topics into reference table...')
    for (const topicName of allTopics) {
      await client.query(
        `INSERT INTO companion_topics (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [topicName]
      )
    }
    console.log(`✅ Inserted ${allTopics.length} topics`)

    // Step 7: Fetch topic IDs for mapping
    console.log('🔗 Fetching topic IDs...')
    const { rows: topicRecords } = await client.query(`
      SELECT id, name FROM companion_topics
    `)

    const topicNameToId = new Map()
    topicRecords.forEach(t => {
      topicNameToId.set(t.name, t.id)
    })
    console.log(`✅ Loaded ${topicRecords.length} topic IDs`)

    // Step 8: Update companions with topics JSONB
    console.log('\n🔄 Updating companions with topics JSONB...')
    let updatedCount = 0

    for (const [companionId, topicNames] of companionTopicsMap) {
      const topicIds = topicNames
        .map(name => topicNameToId.get(name))
        .filter(id => id !== undefined)

      if (topicIds.length > 0) {
        await client.query(
          `UPDATE companions SET topics = $1 WHERE id = $2`,
          [JSON.stringify(topicIds), companionId]
        )
        updatedCount++
      }
    }
    console.log(`✅ Updated ${updatedCount} companions`)

    // Step 9: Remove specialization field from companions
    console.log('\n🧹 Cleaning up...')
    await client.query(`
      ALTER TABLE companions DROP COLUMN IF EXISTS specialization;
      DROP INDEX IF EXISTS idx_companions_specialization;
    `)
    console.log('✅ Specialization field removed')

    // Step 10: Verify migration
    console.log('\n✔️ Verifying migration...')
    const { rows: verifyData } = await client.query(`
      SELECT id, name, topics FROM companions LIMIT 3
    `)

    if (verifyData.length > 0) {
      console.log('Sample migrated data:')
      verifyData.forEach(companion => {
        console.log(`   - ${companion.name}: ${companion.topics}`)
      })
    }

    const { rows: topicsVerify } = await client.query(`
      SELECT COUNT(*) as count FROM companion_topics
    `)
    console.log(`\nTopics reference table has ${topicsVerify[0].count} entries`)

    await client.query('COMMIT')
    console.log('\n✅ Migration completed successfully!')
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
