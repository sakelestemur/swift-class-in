# Project Documentation

## 3.5.2 Tools and Technologies

To ensure consistency while reflecting enhancements in system scalability, the project used the following tools and technologies:

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | Core UI library for building component-based user interfaces |
| TypeScript | 5.x | Static typing for improved code quality and developer experience |
| Vite | 6.x | Fast build tool and development server with hot module replacement |
| Tailwind CSS | 3.x | Utility-first CSS framework for responsive styling |
| shadcn/ui | Latest | Pre-built accessible UI component library based on Radix UI |

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Cloud-hosted relational database with real-time capabilities |
| Supabase Auth | User authentication and session management |
| Row Level Security (RLS) | Database-level access control policies |
| Edge Functions | Serverless backend logic execution |

### State Management & Data Fetching

| Library | Version | Purpose |
|---------|---------|---------|
| TanStack React Query | 5.83.0 | Server state management, caching, and synchronization |
| React Context API | Built-in | Global state management for authentication |
| React Hook Form | 7.61.1 | Form state management with validation |
| Zod | 3.25.76 | Schema validation for forms and data |

### QR Code Technologies

| Library | Version | Purpose |
|---------|---------|---------|
| html5-qrcode | 2.3.8 | QR code scanning via device camera |
| qrcode.react | 4.2.0 | QR code generation and display |
| crypto-js | 4.2.0 | Encryption/decryption of QR code payloads |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| React Router DOM | Client-side routing and navigation |
| Lucide React | Icon library for UI elements |
| Recharts | Data visualization and charts |
| date-fns | Date manipulation and formatting |
| xlsx | Excel file export functionality |
| jspdf-autotable | PDF report generation |
| Sonner | Toast notifications |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting and style enforcement |
| PostCSS | CSS processing and optimization |
| Git/GitHub | Version control and collaboration |
| Lovable | AI-powered development platform |

---

## 3.6 System Architecture and Experimental Setup

### 3.6.1 System Architecture Overview

The QR-Based Attendance Tracking System follows a modern three-tier architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Student   │  │   Teacher   │  │    Admin    │              │
│  │   Portal    │  │   Portal    │  │   Portal    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                    React + TypeScript                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Query (Server State)  │  Context API (Auth State) │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Custom Hooks: useAttendance, useCourses, useRoleGuard   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐   │
│  │   PostgreSQL    │  │  Supabase Auth  │  │  Edge Functions│   │
│  │   Database      │  │                 │  │  (Serverless)  │   │
│  └─────────────────┘  └─────────────────┘  └────────────────┘   │
│                     Row Level Security (RLS)                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.6.2 Component Architecture

The frontend follows a modular component-based architecture:

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (buttons, cards, etc.)
│   ├── auth/            # Authentication components (ProtectedRoute)
│   ├── layout/          # Layout components (AppLayout, navigation)
│   └── qr/              # QR-specific components (Scanner, Display)
├── contexts/
│   └── AuthContext      # Global authentication state
├── hooks/
│   ├── useAttendance    # Attendance operations
│   ├── useCourses       # Course management
│   ├── useDepartments   # Department operations
│   └── useRoleGuard     # Role-based access control
├── pages/
│   ├── student/         # Student-specific pages
│   ├── teacher/         # Teacher-specific pages
│   └── admin/           # Admin-specific pages
└── integrations/
    └── supabase/        # Database client and types
```

### 3.6.3 Database Schema

The system uses a relational database with the following entity relationships:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ institutions │──────<│  departments │──────<│   profiles   │
└──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                              ▼                      ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
                       │  user_roles  │       │   courses    │       │ notifications│
                       └──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                              ▼                      ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
                       │  course_     │       │  attendance_ │──────<│  attendance_ │
                       │  enrollments │       │  sessions    │       │  records     │
                       └──────────────┘       └──────────────┘       └──────────────┘
```

**Key Tables:**
- **profiles**: User information linked to authentication
- **user_roles**: Role assignments (student, teacher, admin)
- **courses**: Course definitions with teacher assignments
- **course_enrollments**: Student-course relationships
- **attendance_sessions**: Active/ended attendance sessions with QR data
- **attendance_records**: Individual attendance marks with timestamps

### 3.6.4 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  User    │────>│  Auth Page   │────>│ Supabase Auth│────>│ Profile  │
│  Login   │     │  (Email/PWD) │     │  Validation  │     │  Lookup  │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
                                                                  │
                                                                  ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Role-    │<────│ AuthContext  │<────│  Role Query  │<────│user_roles│
│ Based UI │     │   Update     │     │              │     │  Table   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
```

### 3.6.5 QR Code Attendance Flow

```
TEACHER SIDE:                          STUDENT SIDE:
┌─────────────────┐                    ┌─────────────────┐
│ Start Session   │                    │  Open Scanner   │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ Generate QR     │                    │ Scan QR Code    │
│ (Encrypted Data)│                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ Display QR      │─────────────────── │ Decrypt & Parse │
│ (Auto-refresh)  │    Camera Scan     │ QR Payload      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│ Monitor         │                    │ Validate Session│
│ Attendance      │<───────────────────│ & Mark Present  │
└─────────────────┘   Database Update  └─────────────────┘
```

### 3.6.6 Security Architecture

The system implements multiple layers of security:

1. **Authentication Layer**: Supabase Auth with email/password authentication
2. **Authorization Layer**: 
   - Client-side: React Router guards and role-based UI filtering
   - Component-level: useRoleGuard hook for runtime role verification
   - Database-level: Row Level Security (RLS) policies
3. **Data Protection**: 
   - QR code payload encryption using AES (crypto-js)
   - Session expiration timestamps
   - Late threshold enforcement

### 3.6.7 Experimental Setup

**Development Environment:**
- Node.js runtime environment
- npm/bun package manager
- Local development server via Vite (port 8080)
- Hot Module Replacement (HMR) for rapid iteration

**Testing Approach:**
- Manual testing across user roles (student, teacher, admin)
- Cross-browser compatibility testing
- Mobile responsiveness validation
- QR scanning functionality testing on various devices

**Deployment:**
- Lovable platform hosting
- Automatic SSL/TLS encryption
- CDN distribution for static assets
- Supabase cloud infrastructure for backend services

### 3.6.8 Performance Considerations

- **React Query caching**: Reduces redundant API calls
- **Lazy loading**: Routes loaded on demand
- **PWA support**: Offline capabilities and installability
- **Optimistic updates**: Immediate UI feedback for better UX
- **Connection pooling**: Efficient database connections via Supabase
