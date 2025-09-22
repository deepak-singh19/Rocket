# Canvas Studio 🎨

A powerful, collaborative design editor built with React, TypeScript, and Node.js. Create, edit, and share beautiful designs with real-time collaboration, advanced canvas tools, and comprehensive commenting system.

![Canvas Studio](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![React](https://img.shields.io/badge/React-18.2.0-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg) ![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)

## ✨ Features

### 🎨 **Design Tools**
- **Shape Tools**: Rectangles, circles, and custom shapes with full styling control
- **Text Elements**: Rich text editing with customizable fonts, sizes, and colors
- **Image Support**: Import and manipulate images with resize and positioning
- **Drawing Tools**: Freehand drawing with pencil and pen tools
- **Color Picker**: Advanced color selection with preset palettes

### 🤝 **Real-time Collaboration**
- **Live Editing**: Multiple users can edit designs simultaneously
- **User Presence**: See who's online and where they're working
- **Cursor Tracking**: Real-time cursor positions of all collaborators
- **Conflict Resolution**: Smart handling of concurrent edits

### 💬 **Advanced Commenting System**
- **Contextual Comments**: Pin comments to specific elements or canvas positions
- **Threaded Discussions**: Reply to comments and create discussion threads
- **@Mentions**: Tag team members with autocomplete suggestions
- **Comment Resolution**: Mark comments as resolved/unresolved
- **Visual Indicators**: Blinking comment icons for unresolved feedback

### 🔧 **Professional Features**
- **Layer Management**: Full layer control with reordering and visibility
- **Undo/Redo**: Complete history management with keyboard shortcuts
- **Autosave**: Intelligent auto-saving with customizable intervals
- **Export Options**: Download as PNG with preview and quality settings
- **Keyboard Shortcuts**: Professional hotkeys for efficient workflow
- **Performance Monitoring**: Built-in performance tracking and optimization

### 🚀 **Development & Deployment**
- **Docker Support**: Complete containerization for easy deployment
- **Testing Suite**: Unit, integration, and E2E tests with Playwright
- **Security**: Enterprise-grade security with rate limiting and sanitization
- **Monitoring**: Performance tracking and error handling

## 🏗️ Architecture

```
canvas-studio/
├── client/                     # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── CanvasStage.tsx # Main canvas component (React Konva)
│   │   │   ├── TopBar.tsx      # Tool bar and navigation
│   │   │   ├── LeftLayers.tsx  # Layer management panel
│   │   │   ├── RightProperties.tsx # Properties editor
│   │   │   ├── CommentsPanel.tsx   # Commenting system
│   │   │   └── ...             # Other components
│   │   ├── pages/              # Application pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Redux Toolkit state management
│   │   ├── services/           # API client services
│   │   └── types/              # TypeScript type definitions
│   ├── e2e/                    # End-to-end tests (Playwright)
│   └── public/                 # Static assets
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── models/             # MongoDB models (Mongoose)
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Express middleware
│   │   ├── socket/             # WebSocket handlers
│   │   ├── validators/         # Input validation (Zod)
│   │   ├── services/           # Business logic
│   │   └── tests/              # Test suites
│   └── scripts/                # Database seeding scripts
└── docker-compose.yml          # Container orchestration
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management with RTK Query
- **React Konva** - High-performance 2D canvas rendering
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool
- **Socket.IO Client** - Real-time communication

### Backend  
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - Authentication and authorization
- **Zod** - Schema validation
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

### DevOps & Testing
- **Docker** - Containerization
- **Playwright** - End-to-end testing
- **Vitest** - Unit and integration testing
- **ESLint** - Code linting
- **GitHub Actions** - CI/CD (configurable)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB** (local or cloud instance)
- **Docker** (optional, for containerized development)

### 1. Clone & Install

```bash
git clone <repository-url>
cd canvas-studio
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp server/env.example server/.env

# Edit server/.env with your configuration
# Required: MONGODB_URI, JWT_SECRET
```

### 3. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# Seed the database with sample data
npm run seed:users  # Create test users
npm run seed        # Create sample designs
```

### 4. Development

**Option A: Start everything simultaneously**
```bash
npm run dev
```

**Option B: Start services individually**
```bash
# Terminal 1 - Backend API
npm run dev:server

# Terminal 2 - Frontend App  
npm run dev:client
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

## 🐳 Docker Development

### Quick Start with Docker
```bash
# Development environment
npm run docker:up:dev

# Production environment
npm run docker:up

# View logs
npm run docker:logs

# Clean up
npm run docker:down
```

### Docker Services
- **Frontend**: Nginx + React app (port 3000)
- **Backend**: Node.js API server (port 4000)
- **Database**: MongoDB (port 27017)

## 📝 Available Scripts

### Root Commands
```bash
npm run dev              # Start both client and server
npm run build            # Build for production
npm run test             # Run all tests
npm run test:e2e         # Run end-to-end tests
npm run lint             # Lint all code
npm run clean            # Clean build artifacts
```

### Client Commands
```bash
npm run dev:client       # Start development server (5173)
npm run build:client     # Build for production
npm run test:client      # Run unit tests
npm run test:e2e         # Run E2E tests with Playwright
npm run lint:client      # Lint frontend code
```

### Server Commands
```bash
npm run dev:server       # Start development server (4000)
npm run build:server     # Compile TypeScript
npm run start            # Start production server
npm run test:server      # Run server tests
npm run seed            # Seed database with sample data
npm run seed:users      # Create test users
```

## 🧪 Testing

### Unit Tests
```bash
npm run test              # All unit tests
npm run test:client       # Frontend tests only
npm run test:server       # Backend tests only
npm run test:watch       # Watch mode
```

### End-to-End Tests
```bash
npm run test:e2e         # Headless E2E tests
npm run test:e2e:headed  # Headed browser tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Debug mode
```

### Test Coverage
```bash
npm run test:coverage    # Generate coverage reports
```

## 🔐 Authentication & Security

### User Authentication
- **JWT-based authentication** with refresh tokens
- **Secure password hashing** with bcrypt
- **Rate limiting** on auth endpoints
- **Input validation** and sanitization

### API Security
- **CORS protection** with configurable origins
- **Helmet.js** for security headers
- **MongoDB injection protection**
- **XSS protection** with input sanitization
- **Rate limiting** for API endpoints

### Test Users (Development)
```
Admin User:
- Email: admin@canvasstudio.com
- Password: Admin123!

Designer User:
- Email: designer@canvasstudio.com  
- Password: Designer123!

Regular User:
- Email: user@canvasstudio.com
- Password: User123!
```

## 🎮 Usage Guide

### Basic Operations
1. **Create Account**: Register or use test credentials
2. **Create Design**: Click "New Design" to start
3. **Add Elements**: Use toolbar to add shapes, text, images
4. **Edit Properties**: Select elements and modify in right panel
5. **Collaborate**: Share design URL for real-time collaboration
6. **Comment**: Click anywhere to add comments and feedback
7. **Export**: Download your design as PNG

### Keyboard Shortcuts
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo  
- **Ctrl/Cmd + C**: Copy element
- **Ctrl/Cmd + V**: Paste element
- **Delete/Backspace**: Delete selected element
- **Arrow Keys**: Nudge element (hold Shift for 10px)
- **Ctrl/Cmd + ]**: Bring forward
- **Ctrl/Cmd + [**: Send backward
- **?**: Show keyboard shortcuts help

### Collaboration Features
- **Real-time editing**: Changes appear instantly for all users
- **User cursors**: See where others are working
- **Comments**: Pin feedback to specific locations
- **@Mentions**: Tag users in comments for notifications
- **Presence indicators**: See who's online

## 🔧 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # User login
POST   /api/auth/refresh      # Refresh access token
POST   /api/auth/logout       # User logout
GET    /api/auth/profile      # Get user profile
```

### Design Management
```
GET    /api/designs           # List user's designs
GET    /api/designs/:id       # Get specific design
POST   /api/designs           # Create new design
PUT    /api/designs/:id       # Update design
DELETE /api/designs/:id       # Delete design
PUT    /api/designs/:id/save  # Save design elements
```

### Comments System
```
GET    /api/comments/design/:id      # Get design comments
POST   /api/comments                 # Create comment
PUT    /api/comments/:id             # Update comment
DELETE /api/comments/:id             # Delete comment
PATCH  /api/comments/:id/resolve     # Resolve/unresolve comment
GET    /api/comments/:id/replies     # Get comment replies
```

### Real-time Events (WebSocket)
```
join_design          # Join design room
leave_design         # Leave design room
canvas_update        # Broadcast canvas changes
user_cursor          # Share cursor position
comment_created      # New comment notification
comment_updated      # Comment modification
comment_resolved     # Comment resolution status
```

## 🚀 Deployment

### Production Build
```bash
# Build both client and server
npm run build

# Or build separately
npm run build:client
npm run build:server
```

### Environment Variables
```bash
# Production environment (server/.env)
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://your-mongo-server/canvas-studio
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Production Deployment
```bash
# Build production images
npm run docker:build

# Start production containers
npm run docker:up

# Monitor logs
npm run docker:logs
```

### Manual Deployment
```bash
# Server deployment
cd server
npm run build
npm start

# Frontend deployment (serve dist/ folder)
cd client
npm run build
# Deploy dist/ to your web server (Nginx, Apache, etc.)
```

## 🔧 Configuration

### Frontend Configuration
```typescript
// client/vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
```

### Backend Configuration
```typescript
// server/src/index.ts
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-studio'
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`npm install`)
4. Make your changes
5. Add tests for new functionality
6. Run tests (`npm test`)
7. Commit changes (`git commit -m 'Add amazing feature'`)
8. Push to branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Style
- **ESLint**: Enforced code style with auto-fixing
- **TypeScript**: Strict type checking enabled
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Use conventional commit messages

### Testing Requirements
- Unit tests for new functionality
- Integration tests for API endpoints  
- E2E tests for user workflows
- Minimum 80% code coverage

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 4000 (macOS/Linux)
lsof -ti:4000 | xargs kill -9

# Kill process on port 5173  
lsof -ti:5173 | xargs kill -9
```

**MongoDB connection failed**
```bash
# Check MongoDB status
mongod --version

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
# or
sudo systemctl start mongod
```

**TypeScript compilation errors**
```bash
# Clean and reinstall dependencies
npm run clean
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

**Canvas not rendering**
- Check browser console for errors
- Ensure hardware acceleration is enabled
- Try disabling browser extensions
- Verify Konva.js compatibility

**Real-time collaboration not working**
- Check WebSocket connection in Network tab
- Verify CORS configuration  
- Ensure firewall allows WebSocket connections
- Check server logs for Socket.IO errors

### Performance Optimization

**Frontend Performance**
- Enable React Strict Mode for development
- Use React Developer Tools Profiler
- Monitor bundle size with `npm run build`
- Implement code splitting for large components

**Backend Performance**
- Monitor API response times
- Use MongoDB indexes for query optimization
- Implement caching for frequently accessed data
- Use compression middleware for API responses


## 🙏 Acknowledgments

- **React Konva** - Excellent 2D canvas library
- **Socket.IO** - Reliable real-time communication
- **MongoDB** - Flexible document database
- **TailwindCSS** - Beautiful utility-first CSS framework
- **Vite** - Lightning-fast build tool

---

**Happy Designing! 🎨✨**

Built with ❤️ using React, TypeScript, and Node.js