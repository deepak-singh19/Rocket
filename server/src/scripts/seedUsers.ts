import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../models/User.js'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio'

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing users
    await User.deleteMany({})
    console.log('Cleared existing users')

    // Create test users
    const testUsers = [
      {
        email: 'admin@canvasstudio.com',
        password: 'Admin123!',
        name: 'Admin User',
        avatar: 'https://via.placeholder.com/150/007bff/ffffff?text=A'
      },
      {
        email: 'designer@canvasstudio.com',
        password: 'Designer123!',
        name: 'Designer User',
        avatar: 'https://via.placeholder.com/150/28a745/ffffff?text=D'
      },
      {
        email: 'user@canvasstudio.com',
        password: 'User123!',
        name: 'Regular User',
        avatar: 'https://via.placeholder.com/150/ffc107/ffffff?text=U'
      }
    ]

    // Create users
    const createdUsers = []
    for (const userData of testUsers) {
      const user = new User(userData)
      await user.save()
      createdUsers.push({
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      })
      console.log(`Created user: ${user.email}`)
    }

    console.log('\n✅ Users seeded successfully!')
    console.log('\nTest Users Created:')
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`)
    })

    console.log('\n🔐 Login Credentials:')
    console.log('Admin: admin@canvasstudio.com / Admin123!')
    console.log('Designer: designer@canvasstudio.com / Designer123!')
    console.log('User: user@canvasstudio.com / User123!')

  } catch (error) {
    console.error('❌ Error seeding users:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

// Run the seed function
seedUsers()
