import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Note: needs service role key for auth admin actions
);

const maleNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas"];

const femaleNames = [
  "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa"
];

const genderPreferences = ["male", "female", "both"];

const bioDescriptors = [
  "Coffee addict", "Cat lover", "Dog person", "Foodie", "Gym rat", "Bookworm", "Movie buff", "Music lover",
  "Travel junkie", "Beach bum", "City slicker", "Outdoor enthusiast", "Netflix binger", "Yoga enthusiast",
  "Craft beer connoisseur", "Sushi fanatic", "Adventure seeker", "Night owl", "Early bird", "Aspiring chef"
];

const generateBio = () => {
  const descriptors = bioDescriptors.sort(() => 0.5 - Math.random()).slice(0, 3);
  return descriptors.join(" | ");
};

const generateRandomUser = (name, gender) => {
  const age = Math.floor(Math.random() * (45 - 21 + 1) + 21);
  return {
    name,
    email: `${name.toLowerCase()}${age}@example.com`,
    password: 'password123',
    age,
    gender,
    genderPreference: genderPreferences[Math.floor(Math.random() * genderPreferences.length)],
    bio: generateBio(),
    image: []
  };
};

const seedUsers = async () => {
  try {
    console.log('Starting database seed...');

    // Create male test accounts
    for (const name of maleNames) {
      const user = generateRandomUser(name, 'male');
      await createTestUser(user);
    }

    // Create female test accounts
    for (const name of femaleNames) {
      const user = generateRandomUser(name, 'female');
      await createTestUser(user);
    }

    console.log('Database seed completed!');
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

const createTestUser = async (user) => {
  try {
    // Create auth user with sign up
    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { name: user.name, age: user.age, gender: user.gender, gender_preference: user.genderPreference }
      }
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authUser.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        gender_preference: user.genderPreference,
        bio: user.bio,
        interests: user.interests,
        image: user.image
      }]);

    if (profileError) throw profileError;

    console.log(`Created user: ${user.name} (${user.gender}) with email: ${user.email}`);
  } catch (error) {
    console.error(`Error creating user ${user.name}:`, error.message);
  }
};

seedUsers();