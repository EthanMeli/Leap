import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Note: needs service role key for auth admin actions
)

const femaleNames = [
  "Emma", "Olivia", "Ava", "Isabella", "Sophia", 
  "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
  "Abigail", "Emily", "Elizabeth", "Sofia", "Avery",
  "Ella", "Scarlett", "Grace", "Victoria", "Riley"
]

const maleNames = [
  "Liam", "Noah", "William", "James", "Oliver",
  "Benjamin", "Elijah", "Lucas", "Mason", "Logan",
  "Alexander", "Ethan", "Jacob", "Michael", "Daniel",
  "Henry", "Jackson", "Sebastian", "Jack", "Aiden"
]

const interests = [
  "Travel", "Photography", "Cooking", "Music", "Art",
  "Reading", "Gaming", "Fitness", "Movies", "Sports",
  "Dancing", "Hiking", "Technology", "Fashion", "Food",
  "Yoga", "Coffee", "Wine", "Pets", "Camping"
]

const bios = [
  "Living life to the fullest",
  "Adventure seeker and coffee lover",
  "Looking for genuine connections",
  "Love exploring new places and meeting new people",
  "Passionate about life and learning",
  "Here for a good time, not a long time",
  "Just trying to find my person",
  "Lover of good food and better company",
  "Life is short, smile while you still have teeth",
  "Looking for someone to share adventures with"
]

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = arr => arr[Math.floor(Math.random() * arr.length)]
const getRandomInterests = () => {
  const count = getRandomInt(3, 6)
  const shuffled = [...interests].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const createTestUser = async (name, gender) => {
  const email = `${name.toLowerCase()}${getRandomInt(1, 999)}@test.com`
  const password = 'password123'
  const age = getRandomInt(18, 45)
  const genderPreference = getRandomItem(['male', 'female', 'both'])
  
  try {
    // Create auth user with sign up
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, age, gender, gender_preference: genderPreference }
      }
    })

    if (authError) throw authError

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        name,
        email,
        age,
        gender,
        gender_preference: genderPreference,
        bio: getRandomItem(bios),
        interests: getRandomInterests(),
        image: [] // Remove image for now to simplify testing
      }])

    if (profileError) throw profileError
    
    console.log(`Created user: ${name} (${gender}) with email: ${email}`)
  } catch (error) {
    console.error(`Error creating user ${name}:`, error.message)
  }
}

const seedDatabase = async () => {
  console.log('Starting database seed...')

  // Create female test accounts
  for (const name of femaleNames) {
    await createTestUser(name, 'female')
  }

  // Create male test accounts
  for (const name of maleNames) {
    await createTestUser(name, 'male')
  }

  console.log('Database seed completed!')
  process.exit(0)
}

seedDatabase()
