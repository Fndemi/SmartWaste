# 🗑️ SmartWaste - AI-Powered Waste Management System


## 🌟 Overview

SmartWaste revolutionizes waste management by combining cutting-edge AI technology with user-friendly interfaces. The system automatically detects contamination levels in waste, sends real-time alerts to drivers, and provides intelligent recommendations for optimal waste disposal.

### 🎯 Key Features

- **🤖 AI-Powered Contamination Detection** - Automatically analyzes waste images to detect contamination levels
- **📱 Multi-Role User System** - Support for households, businesses, drivers, recyclers, councils, and admins
- **🚛 Smart Pickup Management** - GPS-enabled pickup requests with real-time tracking
- **🏭 Facility Management** - Comprehensive recycling facility management system
- **📧 Intelligent Notifications** - Real-time email alerts for contamination detection
- **🗺️ Interactive Maps** - Google Maps integration for location-based services
- **💬 AI Assistant** - Gemini AI-powered chat assistant for waste management advice
- **📊 Analytics Dashboard** - Role-based dashboards with comprehensive statistics

## 🏗️ System Architecture

```
SmartWaste/
├── 🎨 Frontend (React + TypeScript)
│   ├── User Interface & Authentication
│   ├── Pickup Management System
│   ├── Facility Management
│   ├── AI Chat Assistant
│   └── Analytics Dashboard
├── ⚙️ Backend (NestJS + MongoDB)
│   ├── RESTful API Services
│   ├── User Management & Authentication
│   ├── Pickup & Facility Management
│   ├── Notification System
│   └── File Upload & Cloudinary Integration
└── 🧠 AI Classifier (Python + Flask)
    ├── Contamination Detection Model
    ├── Image Processing Pipeline
    └── Machine Learning Scoring
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **MongoDB** 4.4+
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartWaste
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend/waste-management
   npm install
   
   # Install frontend dependencies
   cd ../../frontend
   npm install
   
   # Install AI classifier dependencies
   cd ../backend/classifier
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   
   **Backend (.env)**:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/smartwaste
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (EmailJS)
   EMAILJS_SERVICE_ID=your_service_id
   EMAILJS_TEMPLATE_ID=your_template_id
   EMAILJS_PUBLIC_KEY=your_public_key
   EMAILJS_PRIVATE_KEY=your_private_key
   MAIL_FROM=noreply@smartwaste.com
   MAIL_FROM_NAME=SmartWaste Team
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # AI Classifier
   CONTAMINATION_API_URL=http://localhost:8001
   
   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # Server
   PORT=3000
   NODE_ENV=development
   ```

   **Frontend (.env)**:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the services**
   ```bash
   # Terminal 1: Start MongoDB
   mongod
   
   # Terminal 2: Start AI Classifier
   cd backend/classifier
   python model.py
   
   # Terminal 3: Start Backend
   cd backend/waste-management
   npm run start:dev
   
   # Terminal 4: Start Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **API Documentation**: http://localhost:3000/api
   - **AI Classifier**: http://localhost:8001/apidocs

## 👥 User Roles & Features

### 🏠 Household Users
- **Request Pickups** - Schedule waste collection with photo uploads
- **Track Status** - Monitor pickup request status in real-time
- **Location Services** - Automatic GPS location detection

### 🏢 Small Business (SME)
- **Request Pickups** - Schedule waste collection with photo uploads
- **Track Status** - Monitor pickup request status in real-time
- **Location Services** - Automatic GPS location detection

### 🚛 Drivers
- **Claim Pickups** - Browse and claim available pickup assignments
- **Contamination Alerts** - Real-time notifications for contaminated waste
- **Status Updates** - Update pickup completion status

### ♻️ Recyclers
- **Facility Management** - Manage recycling facility operations
- **Capacity Tracking** - Monitor facility capacity and load
- **Waste Type Configuration** - Configure accepted waste types
- **Inventory Management** - Track incoming waste materials

### 🏛️ Council
- **Municipal Oversight** - Monitor city-wide waste management
- **Analytics Dashboard** - Comprehensive waste management statistics


### 👨‍💼 Admin
- **System Administration** - Full system control and configuration
- **User Management** - Manage all user accounts and permissions

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with full IntelliSense
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router** - Declarative routing for single-page applications
- **React Hook Form** - Performant forms with easy validation
- **Yup** - Schema validation for form inputs
- **Axios** - HTTP client with request/response interceptors
- **Lucide React** - Beautiful, customizable SVG icons
- **React Hot Toast** - Elegant toast notifications

### Backend
- **NestJS 11** - Progressive Node.js framework for scalable server-side applications
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - Elegant MongoDB object modeling for Node.js
- **JWT** - JSON Web Tokens for secure authentication
- **Passport** - Authentication middleware for Node.js
- **Bcrypt** - Password hashing for security
- **Cloudinary** - Cloud-based image and video management
- **Nodemailer** - Email sending capabilities
- **Handlebars** - Template engine for email templates
- **Swagger** - API documentation and testing interface

### AI & Machine Learning
- **Python 3.8+** - Core AI development language
- **Flask** - Lightweight web framework for AI services
- **NumPy** - Numerical computing for image processing
- **PIL (Pillow)** - Python Imaging Library for image manipulation
- **OpenCV** - Computer vision and image processing
- **Scikit-learn** - Machine learning algorithms
- **Google Gemini AI** - Advanced AI for chat assistance

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting for consistency
- **Jest** - Testing framework for JavaScript
- **TypeScript** - Static type checking
- **Git** - Version control and collaboration

## 📁 Project Structure

```
SmartWaste/
├── 📱 frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/               # Basic UI components
│   │   │   ├── layout/           # Layout components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── auth/            # Authentication pages
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── pickups/         # Pickup management
│   │   │   ├── facilities/      # Facility management
│   │   │   ├── notifications/   # Notification center
│   │   │   └── profile/         # User profile
│   │   ├── contexts/             # React contexts
│   │   │   ├── AuthContext.tsx  # Authentication state
│   │   │   ├── LocationContext.tsx # Location services
│   │   │   └── ThemeContext.tsx # Theme management
│   │   ├── services/             # API services
│   │   │   └── api.ts           # Axios configuration
│   │   ├── types/                # TypeScript definitions
│   │   ├── hooks/                # Custom React hooks
│   │   └── utils/                # Utility functions
│   ├── public/                   # Static assets
│   ├── package.json
│   └── vite.config.ts
├── ⚙️ backend/                    # NestJS backend services
│   ├── waste-management/         # Main backend application
│   │   ├── src/
│   │   │   ├── admin/           # Admin management
│   │   │   ├── auth/            # Authentication & authorization
│   │   │   ├── cloudinary/      # Image upload service
│   │   │   ├── common/          # Shared utilities
│   │   │   ├── council/         # Council management
│   │   │   ├── facility/        # Facility management
│   │   │   ├── mail/            # Email services
│   │   │   ├── notifications/   # Notification system
│   │   │   ├── pickup/          # Pickup management
│   │   │   ├── uploads/         # File upload handling
│   │   │   └── users/           # User management
│   │   ├── scripts/             # Database scripts
│   │   ├── test/                # Test files
│   │   └── package.json
│   └── classifier/               # AI contamination detection
│       ├── model.py             # Main AI model
│       ├── requirements.txt     # Python dependencies
│       └── ReadMe.md            # AI setup instructions
└── 📄 README.md                  # This file
```

## 🤖 AI Contamination Detection

The SmartWaste system includes a sophisticated AI model that analyzes waste images to detect contamination levels:

### Features
- **Real-time Analysis** - Instant contamination scoring
- **Multi-class Classification** - Clean, Low, Medium, High contamination levels
- **Feature Extraction** - Saturation, color analysis, edge detection, entropy
- **Confidence Scoring** - Probability distribution across contamination levels
- **RESTful API** - Easy integration with web applications

### API Endpoints
```bash
# Health check
GET http://localhost:8001/health

# Contamination prediction
POST http://localhost:8001/predict
Content-Type: multipart/form-data
Body: file (image file)
```

### Response Format
```json
{
  "label": "medium",
  "score": 0.58,
  "probs": {
    "clean": 0.05,
    "low": 0.22,
    "medium": 0.48,
    "high": 0.25
  },
  "features": {
    "sat": 0.31,
    "brown": 0.18,
    "dark": 0.09,
    "entropy": 0.54,
    "edge": 0.27
  }
}
```

## 📧 Email Notification System

SmartWaste includes a comprehensive email notification system powered by EmailJS:

### Features
- **Template-based Emails** - Customizable email templates
- **Multi-recipient Support** - Different emails for different waste types
- **Real-time Alerts** - Instant notifications for contamination
- **Professional Templates** - Branded email designs
- **Delivery Tracking** - Monitor email delivery status

### Email Types
- **Email Verification** - User account verification
- **Password Reset** - Secure password recovery
- **Contamination Alerts** - Driver notifications for contaminated waste
- **Pickup Confirmations** - Pickup request confirmations
- **System Notifications** - General system alerts

## 🗺️ Location Services

### GPS Integration
- **Automatic Location Detection** - Browser-based GPS location
- **Address Validation** - Google Maps address verification
- **Route Optimization** - Optimal pickup routes for drivers
- **Geofencing** - Location-based service areas

### Map Features
- **Interactive Maps** - Google Maps integration
- **Pickup Locations** - Visual pickup request locations
- **Facility Locations** - Recycling facility mapping
- **Route Planning** - Driver route optimization

## 📊 Analytics & Reporting

### Dashboard Features
- **Role-based Analytics** - Customized metrics for each user type
- **Real-time Updates** - Live data synchronization
- **Performance Metrics** - System performance monitoring
- **Trend Analysis** - Historical data analysis

### Available Reports
- **Pickup Statistics** - Pickup request analytics
- **Contamination Reports** - Contamination level analysis
- **User Activity** - User engagement metrics
- **Facility Performance** - Recycling facility statistics

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **Role-based Access Control** - Granular permission system
- **Password Hashing** - Bcrypt password encryption
- **Session Management** - Secure session handling

### Data Protection
- **Input Validation** - Comprehensive input sanitization
- **XSS Protection** - Cross-site scripting prevention
- **CSRF Protection** - Cross-site request forgery prevention
- **Secure Headers** - Security headers implementation

### API Security
- **Rate Limiting** - API rate limiting
- **CORS Configuration** - Cross-origin resource sharing
- **Request Validation** - Input validation middleware
- **Error Handling** - Secure error responses

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test          # Run unit tests
npm run test:coverage # Run tests with coverage
npm run lint          # Run ESLint
```

### Backend Testing
```bash
cd backend/waste-management
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Run tests with coverage
npm run lint          # Run ESLint
```

### AI Classifier Testing
```bash
cd backend/classifier
python -m pytest     # Run Python tests
```

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
npx vercel --prod
```

### Backend Deployment (Render/Railway)
```bash
cd backend/waste-management
npm run build
# Deploy to your preferred platform
```

### AI Classifier Deployment (Railway/Heroku)
```bash
cd backend/classifier
# Deploy Python Flask app
```

### Environment Variables for Production
```env
# Database
MONGODB_URI=your_production_mongodb_uri

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=7d

# Email
EMAILJS_SERVICE_ID=your_production_service_id
EMAILJS_TEMPLATE_ID=your_production_template_id
EMAILJS_PUBLIC_KEY=your_production_public_key
EMAILJS_PRIVATE_KEY=your_production_private_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_production_cloud_name
CLOUDINARY_API_KEY=your_production_api_key
CLOUDINARY_API_SECRET=your_production_api_secret

# AI
CONTAMINATION_API_URL=your_production_ai_url
GEMINI_API_KEY=your_production_gemini_key

# Server
PORT=3000
NODE_ENV=production
```

## 📚 API Documentation

### Authentication Endpoints
```bash
POST /auth/register     # User registration
POST /auth/login        # User login
POST /auth/refresh      # Token refresh
POST /auth/logout       # User logout
POST /auth/forgot-password # Password reset
```

### Pickup Management
```bash
GET    /pickups         # Get all pickups
POST   /pickups         # Create pickup request
GET    /pickups/:id     # Get pickup details
PUT    /pickups/:id     # Update pickup
DELETE /pickups/:id     # Delete pickup
POST   /pickups/:id/claim # Claim pickup
```

### Facility Management
```bash
GET    /facilities      # Get all facilities
POST   /facilities      # Create facility
GET    /facilities/:id  # Get facility details
PUT    /facilities/:id  # Update facility
DELETE /facilities/:id # Delete facility
```

### User Management
```bash
GET    /users           # Get all users
GET    /users/:id       # Get user details
PUT    /users/:id       # Update user
DELETE /users/:id       # Delete user
```

## 🤝 Contributing

We welcome contributions to SmartWaste! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests
- Document new features
- Follow conventional commit messages

### Pull Request Guidelines
- Provide a clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation as needed
- Request reviews from maintainers



## 🆘 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions
- **Email**: Contact support@smartwaste.com

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Environment Variables**: Verify all required environment variables are set
3. **Port Conflicts**: Check that ports 3000, 5173, and 8001 are available
4. **CORS Issues**: Verify frontend and backend URLs are correctly configured

## 🔮 Roadmap

### Upcoming Features
- [ ] **Mobile App** - React Native mobile application
- [ ] **Real-time Notifications** - WebSocket-based real-time updates
- [ ] **Advanced Analytics** - Machine learning-powered insights
- [ ] **IoT Integration** - Smart waste bin sensors
- [ ] **Blockchain Integration** - Waste tracking on blockchain
- [ ] **Multi-language Support** - Internationalization
- [ ] **Dark Mode** - Theme customization
- [ ] **Offline Support** - Progressive Web App features
- [ ] **Advanced AI Features** - Enhanced contamination detection
- [ ] **API Rate Limiting** - Advanced API protection

