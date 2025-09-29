# Propply AI MVP

A comprehensive property compliance management system for NYC and Philadelphia, built with React and Supabase.

## 🚀 Features

### ✅ Completed MVP Features

1. **Locale-Aware Compliance Punch List**
   - NYC and Philadelphia specific compliance systems
   - Swipe-to-remove functionality for non-applicable items
   - Ability to revisit and re-add previously removed items

2. **User Authentication**
   - Google OAuth integration
   - Email/password authentication
   - User profiles with subscription management

3. **Property Management**
   - Add and manage properties for both NYC and Philadelphia
   - Property-specific compliance tracking
   - Real-time compliance scoring

4. **Vendor RFP System**
   - Create formal Requests for Proposals
   - Connect with certified vendors
   - Track RFP status and responses

5. **Report Library**
   - Centralized purchased reports
   - 30-day update entitlements
   - 12-month update access with purchase

6. **To-Do Generator**
   - Property-specific action items
   - Portfolio-level roll-up
   - Priority and status tracking

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide React Icons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (Google OAuth + Email)
- **Payments**: Stripe (integration ready)

## 📋 Setup Instructions

### 1. Prerequisites

- Node.js 16+ and npm
- Supabase account
- Stripe account (for payments)

### 2. Supabase Setup

The project is already configured with a new Supabase project:
- **Project ID**: `squmtocfnsgqadkqpbxl`
- **URL**: `https://squmtocfnsgqadkqpbxl.supabase.co`
- **Database**: PostgreSQL with all MVP tables and data

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://squmtocfnsgqadkqpbxl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdW10b2NmbnNncWFka3FwYnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Njc0MDYsImV4cCI6MjA3MzE0MzQwNn0.95Z8JVu40tjXwVFL8kitCmG6ZG0RTi-b2qYbq5-XFGk

# Stripe Configuration (Add your keys)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
REACT_APP_STRIPE_PRICE_ID_SINGLE_REPORT=price_single_report_here
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_enterprise_monthly_here
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_enterprise_yearly_here

# App Configuration
REACT_APP_APP_NAME=Propply AI
REACT_APP_APP_VERSION=1.0.0
REACT_APP_SUPPORTED_CITIES=NYC,Philadelphia
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🗄️ Database Schema

### Key Tables

1. **user_profiles** - User information and subscription status
2. **properties** - Property details and compliance scores
3. **compliance_systems** - Locale-aware compliance requirements
4. **property_compliance_systems** - Property-specific compliance selections
5. **subscriptions** - User subscription management
6. **purchased_reports** - Report library with update entitlements
7. **rfps** - Vendor Request for Proposals
8. **property_todos** - To-do items with portfolio tracking
9. **vendors** - Certified vendor marketplace

### Sample Data Included

- **Compliance Systems**: 20+ systems for NYC and Philadelphia
- **Vendors**: 8 certified vendors across both cities
- **Sample Properties**: 5 properties for testing

## 🎯 MVP Scope Delivered

### ✅ Core Features
- [x] Locale-aware compliance punch list (NYC & Philadelphia)
- [x] Swipe-to-remove functionality for non-applicable items
- [x] Ability to revisit and re-add previously removed items
- [x] User subscriptions (single report purchase & enterprise access)
- [x] Formal RFP preparation to vendors
- [x] Centralized report library with 30-day updates
- [x] Quick To-Do generation per property
- [x] Portfolio-level roll-up roadmap

### 🔄 Payment Integration (Ready for Implementation)
- [ ] Stripe integration for single report purchases
- [ ] Subscription management for enterprise plans
- [ ] Webhook handling for payment events

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## 📱 User Flow

1. **Landing Page**: Users can sign up with Google or email
2. **Dashboard**: Overview of properties and compliance status
3. **Compliance Punch List**: Customize compliance requirements by property
4. **Vendor RFPs**: Create and manage vendor requests
5. **Report Library**: Purchase and manage compliance reports
6. **To-Do Generator**: Create and track property-specific tasks

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- User-specific data access controls
- Secure authentication with Supabase Auth
- Environment variable protection for API keys

## 📊 Analytics & Monitoring

- Real-time compliance scoring
- Property portfolio overview
- To-do completion tracking
- Report update entitlements

## 🎨 Design System

- Modern glassmorphism UI
- Responsive design for all devices
- Consistent color scheme and typography
- Smooth animations and transitions

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── LandingPage.jsx          # Authentication and landing
│   ├── MVPDashboard.jsx         # Main dashboard
│   ├── CompliancePunchList.jsx  # Compliance management
│   ├── VendorRFP.jsx           # Vendor RFP system
│   ├── ReportLibrary.jsx       # Report management
│   └── TodoGenerator.jsx       # To-do management
├── config/
│   └── supabase.js             # Supabase configuration
├── services/
│   └── stripe.js               # Stripe integration
└── App.js                      # Main app component
```

### Key Components

- **LandingPage**: Handles authentication and onboarding
- **MVPDashboard**: Main application interface
- **CompliancePunchList**: Swipe-to-remove compliance items
- **VendorRFP**: Create and manage vendor requests
- **ReportLibrary**: Purchase and manage reports
- **TodoGenerator**: Property-specific task management

## 📈 Next Steps

1. **Stripe Integration**: Complete payment processing
2. **Email Notifications**: Add email alerts for compliance deadlines
3. **Mobile App**: React Native version
4. **Advanced Analytics**: AI-powered insights
5. **API Integration**: Connect with city compliance databases

## 🤝 Support

For technical support or questions about the MVP implementation, please refer to the codebase documentation or contact the development team.

---

**Propply AI MVP** - Streamlining property compliance for NYC and Philadelphia 🏢✨

