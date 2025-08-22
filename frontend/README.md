# CampusShare Frontend

The frontend web application for CampusShare, a student ride-sharing and roommate-matching platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Setup Steps

### Prerequisites
- Node.js 16.0+
- npm 7.0+
- Backend server running at `http://localhost:5000`

### 1. Clone and Navigate
```bash
git clone https://github.com/kapsaquarius/Campus-Share.git
cd Campus-Share/frontend
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── app/                   # Next.js 13+ App Router pages
│   ├── auth/             # Authentication pages (login, register, etc.)
│   ├── rides/            # Ride sharing pages
│   ├── roommates/        # Roommate matching pages
│   ├── profile/          # User profile pages
│   └── notifications/    # Notification pages
│
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, inputs, etc.)
│   ├── common/          # Shared components (header, footer, etc.)
│   └── roommates/       # Roommate-specific components
│
├── contexts/            # React Context providers
│   ├── auth-context.tsx      # Authentication state
│   ├── location-context.tsx  # Location services
│   └── notification-context.tsx # Notification system
│
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── api.ts          # API client functions
│   └── utils.ts        # Common utility functions
│
├── public/             # Static assets
└── styles/             # Global styles and Tailwind config
```

---

Your CampusShare frontend is now ready and running at `http://localhost:3000`