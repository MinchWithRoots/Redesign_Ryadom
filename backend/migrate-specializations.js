/**
 * Migration: Create specializations table and migrate data from string field
 * 
 * This script:
 * 1. Creates the specializations table
 * 2. Creates the companion_specializations junction table
 * 3. Extracts unique specializations from existing companion records
 * 4. Inserts them into the specializations table
 * 5. Migrates existing data to the junction table
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const DEFAULT_SPECIALIZATIONS = [
  'Депрессия',
  'Карьера',
  'Личностный рост',
  'Отношения',
  'Самооценка',
  'Стресс',
  'Травма',
  'Восстановление',
  'Жизненные кризисы',
  'Коммуникация',
  'Мотивация',
  'Поддержка',
  'Семья',
  'Счастье',
  'Тревога',
  'Цели'
]

async function migrate() {
  try {
    console.log('🔄 Starting specializations migration...\n')

    // Step 1: Create tables
    console.log('📋 Creating tables...')
    
    // Create specializations table
    const { error: createSpecError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS specializations (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    }).catch(() => ({ error: null })) // Ignore if RPC doesn't exist

    // Create junction table
    const { error: createJuncError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS companion_specializations (
          id BIGSERIAL PRIMARY KEY,
          companion_id BIGINT NOT NULL,
          specialization_id BIGINT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
          FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE CASCADE,
          UNIQUE(companion_id, specialization_id)
        )
      `
    }).catch(() => ({ error: null }))

    // Step 2: Fetch existing companions
    console.log('📥 Fetching existing companions...')
    const { data: companions, error: fetchError } = await supabase
      .from('companions')
      .select('id, specialization')
    
    if (fetchError) throw fetchError
    
    // Extract unique specializations from existing data (case-insensitive)
    const specializationSet = new Set()
    companions.forEach(c => {
      if (c.specialization) {
        const specs = c.specialization.split(',').map(s => s.trim())
        specs.forEach(spec => {
          if (spec) {
            // Normalize: capitalize first letter
            const normalized = spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase()
            specializationSet.add(normalized)
          }
        })
      }
    })

    // Combine with defaults
    const allSpecializations = Array.from(
      new Set([...DEFAULT_SPECIALIZATIONS, ...specializationSet])
    ).sort()

    console.log(`✏️ Found ${allSpecializations.length} unique specializations:\n`)
    allSpecializations.forEach(s => console.log(`   - ${s}`))

    // Step 3: Insert specializations
    console.log('\n📝 Inserting specializations...')
    const { data: insertedSpecs, error: insertError } = await supabase
      .from('specializations')
      .upsert(
        allSpecializations.map(name => ({ name })),
        { onConflict: 'name' }
      )
      .select()

    if (insertError) throw insertError
    console.log(`✅ Inserted/updated ${insertedSpecs?.length} specializations`)

    // Step 4: Migrate companion specializations
    console.log('\n🔗 Migrating companion specializations to junction table...')
    
    let migratedCount = 0
    
    for (const companion of companions) {
      if (!companion.specialization) continue

      const specs = companion.specialization.split(',').map(s => s.trim()).filter(s => s)
      
      for (const spec of specs) {
        // Normalize and find matching specialization
        const normalized = spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase()
        
        const { data: specData } = await supabase
          .from('specializations')
          .select('id')
          .eq('name', normalized)
          .single()

        if (specData) {
          const { error: linkError } = await supabase
            .from('companion_specializations')
            .upsert({
              companion_id: companion.id,
              specialization_id: specData.id
            })
            .select()

          if (!linkError) migratedCount++
        }
      }
    }

    console.log(`✅ Migrated ${migratedCount} companion-specialization links`)

    // Step 5: Verify migration
    console.log('\n✔️ Verifying migration...')
    const { data: verifyData } = await supabase
      .from('companion_specializations')
      .select('*, specializations(name)')
      .limit(5)

    if (verifyData?.length > 0) {
      console.log('Sample migrated data:')
      verifyData.forEach(item => {
        console.log(`   - Companion ${item.companion_id} → ${item.specializations.name}`)
      })
    }

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
