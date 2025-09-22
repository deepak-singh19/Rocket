import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Design } from '../models/Design.js'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio'

// Sample design data with text, image, and rectangle elements
const sampleDesigns = [
  {
    name: 'Sample Design - Marketing Banner',
    width: 1200,
    height: 600,
    createdBy: 'john_doe',
    elements: {
      canvas: {
        width: 1200,
        height: 600,
        backgroundColor: '#f8f9fa'
      },
      objects: [
        {
          id: 'rect_1',
          type: 'rect',
          left: 100,
          top: 100,
          width: 300,
          height: 200,
          fill: '#4f46e5',
          stroke: '#3730a3',
          strokeWidth: 2,
          opacity: 0.9,
          rx: 10,
          ry: 10
        },
        {
          id: 'text_1',
          type: 'text',
          left: 150,
          top: 180,
          text: 'Welcome to Canvas Studio',
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          fill: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center'
        },
        {
          id: 'image_1',
          type: 'image',
          left: 500,
          top: 150,
          width: 200,
          height: 150,
          src: 'https://via.placeholder.com/200x150/6366f1/ffffff?text=Sample+Image',
          opacity: 0.8
        },
        {
          id: 'text_2',
          type: 'text',
          left: 750,
          top: 200,
          text: 'Create amazing designs\nwith our powerful editor',
          fontSize: 18,
          fontFamily: 'Arial, sans-serif',
          fill: '#374151',
          lineHeight: 1.4
        }
      ]
    },
    layers: [
      { name: 'Background', order: 0 },
      { name: 'Shapes', order: 1 },
      { name: 'Text', order: 2 },
      { name: 'Images', order: 3 }
    ],
    comments: [
      {
        author: 'john_doe',
        text: 'This is a great starting template for marketing banners!',
        mentions: ['@design_team'],
        createdAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        author: 'jane_smith',
        text: 'Love the color scheme. Maybe we can add some icons?',
        mentions: ['@john_doe'],
        createdAt: new Date('2024-01-15T14:20:00Z')
      }
    ],
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  {
    name: 'Sample Design - Social Media Post',
    width: 1080,
    height: 1080,
    createdBy: 'jane_smith',
    elements: {
      canvas: {
        width: 1080,
        height: 1080,
        backgroundColor: '#1f2937'
      },
      objects: [
        {
          id: 'rect_1',
          type: 'rect',
          left: 50,
          top: 50,
          width: 980,
          height: 980,
          fill: 'transparent',
          stroke: '#6366f1',
          strokeWidth: 4,
          rx: 20,
          ry: 20
        },
        {
          id: 'circle_1',
          type: 'circle',
          left: 540,
          top: 300,
          radius: 100,
          fill: '#f59e0b',
          stroke: '#d97706',
          strokeWidth: 3
        },
        {
          id: 'text_1',
          type: 'text',
          left: 540,
          top: 450,
          text: 'Canvas Studio',
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
          fill: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center'
        },
        {
          id: 'text_2',
          type: 'text',
          left: 540,
          top: 550,
          text: 'Design. Create. Share.',
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          fill: '#9ca3af',
          textAlign: 'center'
        },
        {
          id: 'image_1',
          type: 'image',
          left: 340,
          top: 650,
          width: 400,
          height: 300,
          src: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Your+Design+Here',
          opacity: 0.9
        }
      ]
    },
    layers: [
      { name: 'Background', order: 0 },
      { name: 'Border', order: 1 },
      { name: 'Shapes', order: 2 },
      { name: 'Text', order: 3 },
      { name: 'Images', order: 4 }
    ],
    comments: [
      {
        author: 'jane_smith',
        text: 'Perfect for Instagram posts! Square format works great.',
        mentions: [],
        createdAt: new Date('2024-01-16T09:15:00Z')
      }
    ],
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  {
    name: 'Sample Design - Business Card',
    width: 400,
    height: 250,
    createdBy: 'mike_wilson',
    elements: {
      canvas: {
        width: 400,
        height: 250,
        backgroundColor: '#ffffff'
      },
      objects: [
        {
          id: 'rect_1',
          type: 'rect',
          left: 0,
          top: 0,
          width: 400,
          height: 250,
          fill: '#ffffff',
          stroke: '#e5e7eb',
          strokeWidth: 1
        },
        {
          id: 'rect_2',
          type: 'rect',
          left: 20,
          top: 20,
          width: 360,
          height: 210,
          fill: '#f3f4f6',
          stroke: '#d1d5db',
          strokeWidth: 1,
          rx: 8,
          ry: 8
        },
        {
          id: 'text_1',
          type: 'text',
          left: 50,
          top: 60,
          text: 'John Doe',
          fontSize: 28,
          fontFamily: 'Arial, sans-serif',
          fill: '#1f2937',
          fontWeight: 'bold'
        },
        {
          id: 'text_2',
          type: 'text',
          left: 50,
          top: 100,
          text: 'Senior Designer',
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fill: '#6b7280'
        },
        {
          id: 'text_3',
          type: 'text',
          left: 50,
          top: 130,
          text: 'john.doe@company.com',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#374151'
        },
        {
          id: 'text_4',
          type: 'text',
          left: 50,
          top: 155,
          text: '+1 (555) 123-4567',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#374151'
        },
        {
          id: 'image_1',
          type: 'image',
          left: 280,
          top: 50,
          width: 80,
          height: 80,
          src: 'https://via.placeholder.com/80x80/6366f1/ffffff?text=JD',
          opacity: 1
        }
      ]
    },
    layers: [
      { name: 'Background', order: 0 },
      { name: 'Card', order: 1 },
      { name: 'Text', order: 2 },
      { name: 'Avatar', order: 3 }
    ],
    comments: [
      {
        author: 'mike_wilson',
        text: 'Clean and professional design. Easy to customize for different people.',
        mentions: ['@hr_team'],
        createdAt: new Date('2024-01-17T11:45:00Z')
      }
    ],
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing designs
    await Design.deleteMany({})
    console.log('🗑️  Cleared existing designs')

    // Insert sample designs
    const insertedDesigns = await Design.insertMany(sampleDesigns)
    console.log(`✅ Inserted ${insertedDesigns.length} sample designs`)

    // Display summary
    console.log('\n📊 Seeded Designs Summary:')
    insertedDesigns.forEach((design, index) => {
      console.log(`${index + 1}. ${design.name}`)
      console.log(`   ID: ${design._id}`)
      console.log(`   Created by: ${design.createdBy}`)
      console.log(`   Size: ${design.width}x${design.height}`)
      console.log(`   Elements: ${design.elements.objects?.length || 0}`)
      console.log(`   Comments: ${design.comments.length}`)
      console.log('')
    })

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📝 You can now test the API with the provided cURL examples.')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run the seed function
seedDatabase()
