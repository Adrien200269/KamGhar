<div align="center">
  <img src="public/logo.png" alt="KamGhar Logo" width="220" />
  <h1>काम घर (KamGhar)</h1>
  <p><strong>Hyperlocal Gig & Freelancing Platform for Nepal 🇳🇵</strong></p>

  <p>
    Connect with skilled local workers and find nearby gigs effortlessly — just like hailing a ride.
  </p>
</div>

---

## 📌 Overview

In Nepal, finding reliable service professionals (such as electricians, plumbers, painters, carpenters, domestic helpers, or digital freelancers) or finding immediate gigs has largely depended on word-of-mouth or unorganized social media posts.

**KamGhar** bridges this gap by offering a modern, location-based marketplace designed specifically for the Nepali market. Whether you are a homeowner in Kathmandu looking for an emergency electrician, or a skilled technician looking for work nearby, KamGhar provides direct matching with zero middleman friction.

---

## ✨ Key Features

### 👤 Role-Based Profiles
- **Workers**: Create a rich profile highlighting specific trade skills, bio, service location (by district), and hourly rates in NPR.
- **Recruiters / Clients**: Post requirements, manage job listings, and find nearby talent quickly.

### 🧭 Hyperlocal Matching
- Built-in district selection covering all major districts across Nepal (Kathmandu, Lalitpur, Bhaktapur, Pokhara, Chitwan, Butwal, Biratnagar, and beyond).
- Geospatial utility calculations supporting radius-based job search from 1 km to 20 km.

### 🚀 Interactive Multi-Step Onboarding
- Guided 3-step setup after registration to complete profile details, select categorized skills (Trades, Domestic, Delivery, Creative/Digital, Repair, etc.), and set hourly rates.
- Option to complete setup immediately or explore first and finish later.

### 📊 Comprehensive Dashboard
- **Workers**: View recent applications, application statuses (`APPLIED`, `ACCEPTED`, `DECLINED`), profile statistics, and quick action shortcuts.
- **Recruiters**: Track posted jobs, monitor candidate applications, and post new gigs.
- Profile completeness reminders to boost visibility.

### 🔐 Secure Authentication & Recovery
- Complete sign-up and login with rigorous form validation.
- Interactive password strength meter.
- Full forgot password and reset password flow with secure email recovery links.

### 🌓 Modern User Experience
- Light and dark theme toggle with persisted user preference.
- Fluid animations and micro-interactions.
- Branded loading states and feedback toasts.
- Mobile-first, fully responsive design for seamless browsing on any device.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Validation**: [Zod](https://zod.dev/)

---

## 📁 Project Structure

```text
kamghar/
├── prisma/
│   └── schema.prisma               # Database schema & relations
├── public/                         # Static assets, logos, and favicon
├── src/
│   ├── app/
│   │   ├── actions/                # Server Actions (Auth, Profile)
│   │   ├── auth/callback/          # Auth PKCE callback handler
│   │   ├── dashboard/              # Role-aware user dashboard
│   │   ├── forgot-password/        # Password recovery request page
│   │   ├── reset-password/         # New password setup page
│   │   ├── login/                  # User login page & form
│   │   ├── register/               # User registration page & form
│   │   ├── onboarding/             # Interactive profile setup wizard
│   │   ├── layout.tsx              # Root layout with ThemeProvider
│   │   ├── page.tsx                # Homepage
│   │   ├── globals.css             # Global styles & theme definitions
│   │   └── loading.tsx             # Global loading fallback
│   ├── components/                 # UI components (HomeView, ThemeToggle, Loader)
│   ├── lib/                        # Shared utilities, constants, validations, DB client
│   └── proxy.ts                    # Next.js session refresh proxy
├── .env.example                    # Environment variable template
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.18 or later recommended)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- A PostgreSQL database instance

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/shresthasabja0/KamGhar.git
cd KamGhar
npm install
```

### 3. Environment Configuration

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Fill in your connection details in `.env`:
```env
DATABASE_URL="your-postgresql-pooler-url"
DIRECT_URL="your-postgresql-direct-url"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Database Setup

Generate the Prisma client and sync the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see KamGhar in action.

---

## 🗺️ Roadmap

- [ ] **Job Posting Form (`/jobs/new`)**: Direct posting interface for recruiters with district and budget tags.
- [ ] **Job & Worker Browsing**: Filterable search feeds sorted by distance, category, and ratings.
- [ ] **Direct Chat / Messaging**: Real-time communication between recruiters and applicants.
- [ ] **Interactive Maps**: Map-based radius search for nearby gigs.
- [ ] **Nepali Payment Gateways**: Integration with eSewa and Khalti for verified worker badges and boosted postings.
- [ ] **Reviews & Ratings**: Verified customer reviews following completed jobs.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).