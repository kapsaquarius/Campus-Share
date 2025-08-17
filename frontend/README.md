# CampusShare Frontend

The frontend application for CampusShare, a student ride-sharing and roommate-matching platform built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
cd frontend
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check Node.js and npm installation
- ✅ Clean previous installations
- ✅ Install all dependencies
- ✅ Verify build configuration
- ✅ Test backend connectivity
- ✅ Optionally start the development server

### Option 2: Manual Setup

If you prefer to set up manually, follow the detailed instructions below.

## 📋 Prerequisites

### 1. Node.js & npm
- **Node.js Version**: 16 or higher
- **npm Version**: 7 or higher (comes with Node.js)
- **Check versions**:
  ```bash
  node --version  # Should be v16.x.x or higher
  npm --version   # Should be 7.x.x or higher
  ```

### 2. Backend Server
- The backend must be running at `http://localhost:5000`
- See [../backend/README.md](../backend/README.md) for backend setup

## 🛠️ Manual Installation Steps

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd campus-share/frontend
```

### Step 2: Install Dependencies
```bash
# Clean previous installations (optional)
rm -rf node_modules package-lock.json .next

# Install dependencies
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── rides/             # Ride-related pages
│   │   ├── create/        # Create ride page
│   │   ├── my-rides/      # User's rides
│   │   ├── my-interested/ # Rides user is interested in
│   │   └── page.tsx       # Ride search page
│   ├── notifications/     # Notifications page
│   ├── roommates/         # Roommate pages (search, create, my-listings, my-interests)
│   ├── profile/           # User profile page
│   ├── help/              # Help/FAQ page
│   ├── contact/           # Contact page
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
│
├── components/            # Reusable React components
│   ├── common/           # Common components
│   │   ├── header.tsx    # Navigation header
│   │   ├── footer.tsx    # Footer
│   │   └── protected-route.tsx # Route protection
│   ├── ui/               # UI components (Shadcn/ui)
│   │   ├── button.tsx    # Button component
│   │   ├── card.tsx      # Card component
│   │   ├── input.tsx     # Input component
│   │   ├── dialog.tsx    # Modal dialogs
│   │   └── ...           # Other UI components
│   ├── InterestedUsersModal.tsx # Modal for ride interests
│   ├── RideDetailsModal.tsx     # Ride details modal
│   └── theme-provider.tsx       # Theme provider
│
├── contexts/             # React Context providers
│   ├── auth-context.tsx  # Authentication context
│   ├── location-context.tsx # Location search context
│   └── notification-context.tsx # Notification context
│
├── lib/                  # Utility libraries
│   ├── api.ts           # API service layer
│   └── utils.ts         # General utilities
│
├── hooks/                # Custom React hooks
│   ├── use-mobile.tsx   # Mobile detection hook
│   └── use-toast.ts     # Toast notifications hook
│
├── public/               # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-user.jpg
│   └── ...
│
├── styles/              # Additional styles
│   └── globals.css      # Global CSS styles
│
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── next.config.mjs      # Next.js configuration
└── components.json      # Shadcn/ui configuration
```

## 🎨 Tech Stack

### Core Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with hooks and context
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### UI Components
- **Shadcn/ui** - Pre-built accessible components
- **Lucide React** - Beautiful icon library
- **Radix UI** - Headless UI primitives

### State Management
- **React Context** - For global state (auth, notifications)
- **React Hooks** - For component state (useState, useEffect)

### HTTP Client
- **Fetch API** - For API requests to backend
- **Custom API Service** - Centralized API management

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Tailwind IntelliSense** - CSS class suggestions

## 🔌 API Integration

### Backend Connection
The frontend connects to the backend API at `http://localhost:5000`

### API Service (`lib/api.ts`)
Centralized service for all API calls:

```typescript
// Authentication
apiService.login(credentials)
apiService.register(userData)
apiService.getProfile(token)
apiService.updateProfile(token, profileData)

// Rides
apiService.searchRides(token, searchParams)
apiService.createRide(token, rideData)
apiService.getMyRides(token)
apiService.expressInterest(token, rideId)
apiService.removeInterest(token, rideId)

// Roommates
apiService.searchRoommates(token, searchParams)
apiService.createRoommate(token, listingData)
apiService.getMyRoommateListings(token)
apiService.getMyRoommateMatches(token)
apiService.getMyInterestedRoommates(token)
apiService.expressRoommateInterest(token, listingId)
apiService.removeRoommateInterest(token, listingId)

// Locations
apiService.getLocations(query)

// Notifications
apiService.getNotifications(token)
apiService.markNotificationAsRead(token, notificationId)
```

### Authentication Flow
1. User registers/logs in → receives JWT token (30-minute expiry)
2. Token stored in localStorage and AuthContext
3. Protected routes check authentication status
4. API requests include Authorization header

## 🛡️ Features

### 🔐 Authentication
- **User Registration** - Create new account with email validation and required field indicators
- **Login/Logout** - Secure authentication with JWT tokens (auto logout on expiry)
- **Profile Management** - Update user information and contact details with real-time validation
- **Protected Routes** - Enhanced route protection with improved loading states

### 🚗 Ride Sharing
- **Ride Search** - Find rides by route, date, and time with smart validation
- **Create Rides** - Post new ride offers with flexible time ranges and additional details
- **Express Interest** - Join rides as a passenger with smooth loading feedback
- **My Rides** - Manage your ride offers with real-time interest updates
- **My Interested Rides** - Track rides you want to join with driver contact details
- **Additional Details** - Optional ride descriptions displayed across all ride views

### 🗺️ Location Search
- **Smart Autocomplete** - Search 39k+ US cities and ZIP codes
- **Real-time Suggestions** - Instant location matching
- **State/City Display** - Clear location identification

### 🔔 Notifications
- **Real-time Updates** - Ride interest notifications with email integration
- **Interest Management** - Track passenger requests
- **Ride Updates** - Get notified of ride changes
- **Email Notifications** - Comprehensive email alerts for all ride activities

### 📱 User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Intuitive Navigation** - Clear menu structure and breadcrumbs
- **Loading States** - Consistent loading indicators across all components
- **Error Handling** - User-friendly error messages with field-level validation
- **Toast Notifications** - Auto-dismissing success and error feedback (6 seconds)
- **WhatsApp Integration** - Authentic WhatsApp contact with official branding
- **Form Validation** - Real-time validation with disabled buttons for invalid forms

## ✨ Recent Improvements

### 🎨 UI/UX Enhancements
- **Toast Auto-Dismiss** - Messages automatically disappear after 6 seconds
- **Loader Consistency** - Standardized loading spinners across all components
- **WhatsApp Branding** - Authentic WhatsApp logo and official green styling
- **Button States** - Smart button disabling with validation feedback
- **Error Messages** - Field-level error display with real-time updates

### 🔧 Form Improvements
- **Required Field Indicators** - Red asterisks (*) on all required fields
- **Real-time Validation** - Instant feedback as users type
- **Time Validation** - Smart validation for time ranges in search and edit forms
- **Additional Details** - Optional textarea for ride descriptions with character limits
- **Delete Confirmation** - Enhanced delete dialogs with loading states

### 🛡️ Route Protection
- **Enhanced Security** - All routes except public pages require authentication
- **Better Loading States** - Context-aware loading messages
- **Smooth Redirects** - Improved unauthenticated user experience
- **Public Pages** - Help, terms, privacy, and contact remain accessible

### 🔄 Real-time Features
- **Live Updates** - My Rides page updates when users express/remove interest
- **Interest Count** - Real-time interest counter updates
- **Email Integration** - Coordinated with backend email notifications

### 🏠 Roommate Matching (New)
- Search roommate listings with filters (budget range, lifestyle preferences)
- Create listings (offer/seek) with exact address (offer only)
- Express/remove interest with in-app and email notifications
- Manage My Listings with edit/delete and interested users modal
- View My Roommate Interests with poster contact details

## ⚙️ Configuration

### Environment Variables
Create a `.env.local` file in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# App Configuration
NEXT_PUBLIC_APP_NAME=CampusShare
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Endpoints
The frontend connects to these backend endpoints:

```
Authentication:
- POST /api/auth/register
- POST /api/auth/login  
- GET /api/auth/profile
- PUT /api/auth/profile

Rides:
- GET /api/rides
- POST /api/rides
- GET /api/rides/my-rides
- POST /api/rides/{id}/interest
- DELETE /api/rides/{id}/interest
- GET /api/rides/my-interested

Roommates:
- GET /api/roommates/search
- POST /api/roommates
- GET /api/roommates/my-listings
- GET /api/roommates/my-interested
- POST /api/roommates/{id}/interest
- DELETE /api/roommates/{id}/interest
- PUT /api/roommates/{id}
- DELETE /api/roommates/{id}

Locations:
- GET /api/locations/search

Notifications:
- GET /api/notifications
- PUT /api/notifications/{id}/read
```

## 🧪 Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Clean build files
rm -rf .next
```

## 🔧 Customization

### Styling
- **Tailwind Classes** - Use utility classes for styling
- **CSS Variables** - Defined in `globals.css`
- **Dark Mode** - Built-in support (can be enabled)

### Components
- **Shadcn/ui** - Pre-built accessible components
- **Custom Components** - Add to `components/` directory
- **Responsive Design** - Use Tailwind responsive prefixes

### Pages
- **App Router** - Add pages in `app/` directory
- **Layouts** - Define layouts for page groups
- **Loading/Error** - Add loading.tsx and error.tsx

## 🚨 Troubleshooting

### Common Issues

#### Backend Connection Failed
```bash
# Check if backend is running
curl http://localhost:5000/

# Start backend (from backend directory)
cd ../backend
./setup.sh
```

#### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npm run type-check

# Fix common issues
npx next lint --fix
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Check for type errors
npm run type-check

# Rebuild
npm run build
```

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or start on different port
npm run dev -- -p 3001
```

## 📱 Mobile Responsiveness

The app is fully responsive and works on:
- **Desktop** - Full feature set with sidebar navigation
- **Tablet** - Adapted layout with touch-friendly interfaces
- **Mobile** - Optimized for small screens with mobile menu

### Responsive Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

## 🎯 Performance

### Optimizations
- **Next.js 14** - Latest performance improvements
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Built-in Next.js image optimization
- **API Caching** - Efficient data fetching strategies

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

## 🔄 Data Flow

### Authentication Flow
```
User → Login Form → API Request → JWT Token → LocalStorage + Context → Protected Routes
```

### Ride Search Flow
```
User → Search Form → Location API → Ride API → Results Display → Interest Actions
```

### Notification Flow
```
Backend Event → Notification Creation → User Login → Notification Fetch → UI Display
```

## 📞 Support

### Development Tools
- **React DevTools** - Debug React components
- **Browser DevTools** - Network, console, and performance
- **TypeScript** - Type checking and IntelliSense

### Useful Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check types
npm run type-check

# Clear all caches
rm -rf node_modules package-lock.json .next && npm install
```

### Documentation
- [Next.js Docs](https://nextjs.org/docs) - Framework documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling utilities
- [Shadcn/ui](https://ui.shadcn.com/) - Component library
- [Backend API](../backend/README.md) - Backend integration guide

---

## 🎯 Ready to Go!

After setup, your frontend will be running at:
- **Frontend URL**: `http://localhost:3000`
- **API Connection**: `http://localhost:5000`
- **Mobile Responsive**: ✅ Works on all devices

The frontend is now ready to connect with the CampusShare backend! 🚀

For backend setup, see [../backend/README.md](../backend/README.md)