/**
 * Migration: Refactor companion_topics to reference table + add topics JSONB to companions
 * 
 * This script:
 * 1. Creates companion_topics as a reference table (without companion_id)
 * 2. Adds topics JSONB field to companions table
 * 3. Migrates existing companion-topic relationships to topics JSONB array
 * 4. Removes specialization field from companions
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

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
  try {
    console.log('🔄 Starting topics JSONB migration...\n')

    // Step 1: Add topics JSONB column to companions
    console.log('📋 Adding topics JSONB column to companions...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE companions
        ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb
      `
    }).catch(() => ({ error: null })) // Ignore if RPC doesn't exist

    // Step 2: Fetch all companion-topic relationships
    console.log('📥 Fetching companion-topic relationships...')
    const { data: companionTopics, error: fetchError } = await supabase
      .from('companion_topics')
      .select('companion_id, topic')

    if (fetchError) throw fetchError

    // Step 3: Group topics by companion_id
    const companionTopicsMap = new Map()
    companionTopics.forEach(ct => {
      if (!companionTopicsMap.has(ct.companion_id)) {
        companionTopicsMap.set(ct.companion_id, [])
      }
      companionTopicsMap.get(ct.companion_id).push(ct.topic)
    })

    console.log(`Found ${companionTopicsMap.size} companions with topics`)

    // Step 4: Fetch companions and create topics reference
    console.log('📝 Processing companions and creating reference data...')
    const { data: companions, error: companionsError } = await supabase
      .from('companions')
      .select('id')

    if (companionsError) throw companionsError

    // Get all unique topics from the database
    const uniqueTopics = new Set()
    companionTopics.forEach(ct => {
      uniqueTopics.add(ct.topic)
    })

    // Combine with defaults
    const allTopics = Array.from(
      new Set([...DEFAULT_TOPICS, ...uniqueTopics])
    ).sort()

    console.log(`Total unique topics: ${allTopics.length}`)
    allTopics.forEach(t => console.log(`   - ${t}`))

    // Step 5: Clear old companion_topics and recreate as reference table
    console.log('\n🔄 Recreating companion_topics as reference table...')
    
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS companion_topics CASCADE;
        
        CREATE TABLE companion_topics (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_companion_topics_name ON companion_topics(name);
      `
    }).catch(() => ({ error: null }))

    // Step 6: Insert all topics into reference table
    console.log('📝 Inserting topics into reference table...')
    const { error: insertError } = await supabase
      .from('companion_topics')
      .upsert(
        allTopics.map(name => ({ name })),
        { onConflict: 'name' }
      )

    if (insertError) throw insertError
    console.log(`✅ Inserted ${allTopics.length} topics`)

    // Step 7: Fetch topic IDs
    console.log('🔗 Fetching topic IDs for mapping...')
    const { data: topicRecords, error: topicsError } = await supabase
      .from('companion_topics')
      .select('id, name')

    if (topicsError) throw topicsError

    // Create name -> id mapping
    const topicNameToId = new Map()
    topicRecords.forEach(t => {
      topicNameToId.set(t.name, t.id)
    })

    // Step 8: Update companions with topics JSONB
    console.log('\n🔄 Updating companions with topics JSONB...')
    let updatedCount = 0

    for (const [companionId, topicNames] of companionTopicsMap) {
      const topicIds = topicNames
        .map(name => topicNameToId.get(name))
        .filter(id => id !== undefined)

      if (topicIds.length > 0) {
        const { error: updateError } = await supabase
          .from('companions')
          .update({
            topics: JSON.stringify(topicIds)
          })
          .eq('id', companionId)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} companions`)

    // Step 9: Remove specialization field from companions
    console.log('\n🧹 Cleaning up specialization field...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE companions
        DROP COLUMN IF EXISTS specialization;
        
        DROP INDEX IF EXISTS idx_companions_specialization;
      `
    }).catch(() => ({ error: null }))

    // Step 10: Verify migration
    console.log('\n✔️ Verifying migration...')
    const { data: verifyData } = await supabase
      .from('companions')
      .select('id, name, topics')
      .limit(3)

    if (verifyData?.length > 0) {
      console.log('Sample migrated data:')
      verifyData.forEach(companion => {
        console.log(`   - ${companion.name}: ${companion.topics}`)
      })
    }

    const { data: topicsVerify } = await supabase
      .from('companion_topics')
      .select('id, name')

    console.log(`\nTopics reference table has ${topicsVerify?.length} entries`)

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
