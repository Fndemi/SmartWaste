# WasteVortex AI - Frontend

A modern React frontend for the WasteVortex AI waste management system, built with TypeScript, Tailwind CSS, and Vite.

## 🚀 Features

### 🔐 Authentication System
- **User Registration & Login** - Complete authentication flow with email verification
- **Role-Based Access Control** - Different interfaces for different user types
- **Password Reset** - Secure password recovery system
- **JWT Token Management** - Automatic token refresh and secure storage

### 👥 User Roles
- **Household** - Request waste pickups, get AI advice
- **SME (Small Business)** - Business waste management
- **Driver** - Claim and manage pickup assignments
- **Recycler** - Manage facilities and receive waste
- **Council** - Oversee municipal waste management
- **Admin** - System administration

### 🗑️ Pickup Management
- **Create Pickup Requests** - Upload waste photos, specify location and details
- **Track Pickup Status** - Real-time status updates (Pending → Assigned → Claimed → Completed)
- **GPS Integration** - Automatic location detection for accurate pickup addresses
- **Image Upload** - Photo evidence of waste for proper classification

### 🏭 Facility Management
- **Facility CRUD Operations** - Create, read, update, delete recycling facilities
- **Capacity Management** - Track facility capacity and current load
- **Waste Type Configuration** - Specify which waste types each facility accepts
- **Contact Information** - Phone and email contact details

### 🤖 AI Assistant
- **Interactive Chat Interface** - Real-time conversation with AI
- **Quick Tips** - Pre-built prompts for common waste management questions
- **Personalized Advice** - Tailored recommendations based on user needs
- **Gemini AI Integration** - Powered by Google's Gemini AI model

### 📊 Dashboard
- **Role-Based Statistics** - Different metrics for different user types
- **Quick Actions** - Direct links to common tasks
- **Recent Activity** - Timeline of recent actions
- **Real-Time Updates** - Live data from the backend

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management with validation
- **Yup** - Schema validation
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── layout/         # Layout components (DashboardLayout)
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   ├── pickups/        # Pickup management pages
│   ├── facilities/     # Facility management pages
│   └── ai/             # AI assistant page
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── services/           # API services
│   └── api.ts         # Axios configuration and API calls
├── types/              # TypeScript type definitions
│   └── index.ts       # All type definitions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── App.tsx            # Main app component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Waste-vortex-AI/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors
- **Primary**: Blue tones for main actions
- **Success**: Green for completed actions
- **Warning**: Yellow for pending states
- **Error**: Red for errors and rejections
- **Secondary**: Gray tones for neutral elements

### Components
- **Button**: Multiple variants (primary, secondary, success, warning, error, outline)
- **Input**: Text inputs with validation states
- **Card**: Consistent card layouts
- **Loading Spinner**: Reusable loading states

## 🔌 API Integration

The frontend integrates with the NestJS backend through:

- **Authentication endpoints** (`/auth/*`)
- **User management** (`/users/*`)
- **Pickup management** (`/pickups/*`)
- **Facility management** (`/facilities/*`)
- **AI integration** (`/pickups/ai/*`)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security Features

- **JWT Token Management** - Secure token storage and refresh
- **Route Protection** - Protected routes require authentication
- **Role-Based Access** - Different features for different user roles
- **Input Validation** - Client-side validation with Yup schemas
- **XSS Protection** - React's built-in XSS protection

## 🧪 Testing

The application includes:
- TypeScript for compile-time error checking
- ESLint for code quality
- Form validation with Yup schemas
- Error boundaries for graceful error handling

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npx vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@wastevortex.ai or join our Slack channel.

## 🔮 Future Features

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline support
- [ ] Push notifications
- [ ] Advanced AI features
- [ ] Integration with IoT devices
- [ ] Blockchain integration for waste tracking