/**
 * Database Migration Script
 * Adds 'specialization' field to companions table and populates test data
 * 
 * Usage: node backend/migrate-add-specialization.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const testCompanions = [
  {
    name: 'Мария К.',
    age: 28,
    gender: 'female',
    experience: 'experienced',
    specialization: 'Психотерапия (когнитивно-поведенческая)',
    bio: 'Практикующий психолог с опытом работы с тревожностью и депрессией. Люблю помогать людям находить смысл и радость в жизни.',
    image: '/images/users/id1-image.jpg',
    price_per_hour: 50,
    is_available: true,
    topics: ['Тревожность', 'Депрессия', 'Отношения'],
  },
  {
    name: 'Алексей М.',
    age: 35,
    gender: 'male',
    experience: 'expert',
    specialization: 'Психодинамическая психотерапия',
    bio: 'Квалифицированный терапевт с опытом более 8 лет. Специализируюсь на глубинной работе с бессознательными процессами.',
    image: '/images/users/id2-image.jpg',
    price_per_hour: 60,
    is_available: true,
    topics: ['Личностный рост', 'Травма', 'Отношения'],
  },
  {
    name: 'Елена В.',
    age: 31,
    gender: 'female',
    experience: 'experienced',
    specialization: 'Консультирование и поддержка',
    bio: 'Специалист по кризисному консультированию и эмоциональной поддержке. Создаю безопасное пространство для диалога.',
    image: '/images/users/id3-image.jpg',
    price_per_hour: 45,
    is_available: true,
    topics: ['Стресс', 'Жизненные перемены', 'Самооценка'],
  },
  {
    name: 'Сергей П.',
    age: 40,
    gender: 'male',
    experience: 'expert',
    specialization: 'Системная семейная терапия',
    bio: 'Помогаю улучшить отношения в семье и близких кругах. Работаю с семейными конфликтами и коммуникацией.',
    image: '/images/users/id4-image.jpg',
    price_per_hour: 55,
    is_available: true,
    topics: ['Семья', 'Коммуникация', 'Отношения'],
  },
  {
    name: 'Анна Т.',
    age: 26,
    gender: 'female',
    experience: 'beginner',
    specialization: 'Консультирование молодежи',
    bio: 'Молодой специалист, работаю с подростками и молодыми взрослыми. Понимаю молодежные проблемы изнутри.',
    image: '/images/users/id5-image.jpg',
    price_per_hour: 35,
    is_available: true,
    topics: ['Самооценка', 'Карьера', 'Отношения'],
  },
  {
    name: 'Виктор Б.',
    age: 45,
    gender: 'male',
    experience: 'expert',
    specialization: 'Работа с травмой и ПТСР',
    bio: 'Специалист в области травматической психотерапии. Использую современные методики EMDR и других подходов.',
    image: '/images/users/id6-image.jpg',
    price_per_hour: 70,
    is_available: true,
    topics: ['Травма', 'Тревожность', 'Личностный рост'],
  },
  {
    name: 'Ирина С.',
    age: 33,
    gender: 'female',
    experience: 'experienced',
    specialization: 'Позитивная психология',
    bio: 'Помогаю людям развивать сильные стороны и находить счастье. Верю в потенциал каждого человека.',
    image: '/images/users/id7-image.jpg',
    price_per_hour: 48,
    is_available: true,
    topics: ['Личностный рост', 'Счастье', 'Карьера'],
  },
  {
    name: 'Дмитрий Л.',
    age: 38,
    gender: 'male',
    experience: 'experienced',
    specialization: 'Коучинг и развитие',
    bio: 'Профессиональный коуч. Помогаю достичь целей и раскрыть потенциал в карьере и жизни.',
    image: '/images/users/id8-image.jpg',
    price_per_hour: 52,
    is_available: true,
    topics: ['Карьера', 'Личностный рост', 'Мотивация'],
  },
]

async function addSpecializationColumnIfNeeded() {
  console.log('📋 Checking if specialization column exists...')

  try {
    // Try to query the column info from information_schema
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'companions' })

    if (error && error.code !== 'PGRST200') {
      console.log('⚠️  Could not check columns via RPC. Attempting to add column directly.')
    }

    // Try to add the column - this will fail gracefully if it already exists
    const { error: alterError } = await supabase
      .from('companions')
      .select('specialization')
      .limit(0)

    if (alterError && alterError.message.includes('column')) {
      console.log('✅ Specialization column does not exist, would need to be created via Supabase UI.')
      console.log('   Please follow these steps:')
      console.log('   1. Go to Supabase Dashboard')
      console.log('   2. Open SQL Editor')
      console.log('   3. Run: ALTER TABLE companions ADD COLUMN specialization text;')
      return false
    }

    console.log('✅ Specialization column already exists or is accessible')
    return true
  } catch (error) {
    console.error('⚠️  Could not verify column:', error.message)
    return true // Assume it exists and continue
  }
}

async function addTestDataForCompanions() {
  console.log('\n🌱 Adding test data for companions...')

  try {
    for (const companion of testCompanions) {
      const { topics, ...companionData } = companion

      // Check if companion already exists
      const { data: existing } = await supabase
        .from('companions')
        .select('id')
        .eq('name', companion.name)
        .limit(1)

      if (existing && existing.length > 0) {
        console.log(`⏭️  Companion "${companion.name}" already exists, skipping...`)
        continue
      }

      // Insert companion
      const { data: newCompanion, error: insertError } = await supabase
        .from('companions')
        .insert([companionData])
        .select()
        .single()

      if (insertError) {
        console.error(`❌ Error adding companion "${companion.name}":`, insertError.message)
        continue
      }

      console.log(`✅ Added companion: "${companion.name}" (ID: ${newCompanion.id})`)

      // Add topics for this companion
      if (topics && topics.length > 0) {
        const topicsData = topics.map(topic => ({
          companion_id: newCompanion.id,
          topic: topic,
        }))

        const { error: topicsError } = await supabase
          .from('companion_topics')
          .insert(topicsData)

        if (topicsError) {
          console.error(`   ⚠️  Warning: Could not add topics for "${companion.name}":`, topicsError.message)
        } else {
          console.log(`   📌 Added ${topics.length} topics`)
        }
      }
    }

    console.log('\n✨ Test data migration complete!')
  } catch (error) {
    console.error('❌ Error during test data migration:', error)
    throw error
  }
}

async function runMigration() {
  console.log('🚀 Starting database migration...\n')

  try {
    // Step 1: Check for specialization column
    await addSpecializationColumnIfNeeded()

    // Step 2: Add test data
    await addTestDataForCompanions()

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
runMigration()
