# 🏗️ Propply MVP Dashboard Structure & Database Connections

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION LAYER                          │
│  Supabase Auth (Google OAuth + Email/Password) → User Session       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                           APP.JS (ROOT)                              │
│  • Manages auth state (useEffect + onAuthStateChange)               │
│  • Loads user profile from user_profiles table                      │
│  • Routes between LandingPage ↔ MVPDashboard                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        MVPDASHBOARD.JSX                              │
│  Main container with 5 tabs (see tab structure below)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE TABLES (Supabase/PostgreSQL)

### **Core Tables**

#### 1. **user_profiles** (Authentication & Subscription)
```sql
Columns:
  - id (UUID) → auth.users FK
  - email, full_name, company, phone
  - subscription_tier (free/single_location_one_time/single_location_monthly/multiple_locations_ongoing/enterprise_yearly)
  - subscription_status (active/cancelled/past_due/incomplete)
  - subscription_id, customer_id (Stripe)
  - reports_used, reports_limit
  - properties_count
  - last_login, created_at, updated_at

Connected to:
  ✅ App.js → Loads on auth
  ✅ MVPDashboard → Displays subscription info in sidebar
  ✅ Auth service → Creates/updates profile
```

#### 2. **properties** (Main Property Data)
```sql
Columns:
  - id (UUID), user_id (FK to user_profiles)
  - address, city (NYC/Philadelphia), state, zip_code
  - bin_number (NYC), opa_account (Philadelphia)
  - property_type, units, year_built, square_footage
  - contact_name, contact_email, contact_phone
  - management_company, owner_name, owner_email
  - compliance_systems (JSONB)
  - compliance_score, violations, next_inspection
  - status (Active/Inactive/Under Review)
  - created_at, updated_at

  Philadelphia-specific fields:
  - bin, opa_account, market_value, assessed_value
  - land_area, building_area, zoning, use_code
  - bedrooms, bathrooms, heating, fuel, sewer, water
  - last_sale_date, last_sale_price

Connected to:
  ✅ MVPDashboard → Main properties table display
  ✅ CompliancePunchList → Filter by property
  ✅ VendorRFP → Select property for RFP
  ✅ ReportLibrary → Filter reports by property
  ✅ TodoGenerator → Generate todos for property
```

#### 3. **compliance_reports** (AI-Generated Reports)
```sql
Columns:
  - id (UUID), user_id, property_id
  - report_type (full_compliance/single_system/violation_check)
  - status (pending/processing/completed/failed)
  - ai_analysis (JSONB)
  - compliance_score, risk_level (LOW/MEDIUM/HIGH/CRITICAL)
  - violations (JSONB), recommendations (JSONB)
  - cost_estimates (JSONB)
  - generated_at, expires_at, download_count
  - payment_id, amount_paid

Connected to:
  ✅ ReportLibrary → Display and download reports
  ✅ ComplianceAnalytics → Trend analysis
  🔄 Backend AI service → Generates reports
```

#### 4. **vendors** (Vendor Marketplace)
```sql
Columns:
  - id (UUID), name, company, email, phone, website
  - services (JSONB array)
  - cities (JSONB array)
  - specializations (JSONB array)
  - rating, review_count, verified
  - license_numbers (JSONB)
  - active

Connected to:
  ✅ VendorRFP → Browse and select vendors
  ✅ VendorIntegration → Marketplace display
```

#### 5. **vendor_quotes** (RFP Responses)
```sql
Columns:
  - id (UUID), user_id, vendor_id, property_id, report_id
  - service_type, description
  - estimated_cost, timeline
  - status (pending/accepted/declined/expired)
  - notes

Connected to:
  ✅ VendorRFP → Create and track RFPs
```

#### 6. **payments** (Stripe Transactions)
```sql
Columns:
  - id (UUID), user_id
  - stripe_payment_id, stripe_session_id
  - amount, currency, status
  - payment_type (one_time/subscription)
  - subscription_tier
  - property_id, report_id
  - metadata (JSONB)

Connected to:
  ✅ BillingDashboard → Transaction history
  🔄 Stripe webhook → Updates payment status
```

---

### **Philadelphia Data Tables** (OpenData Integration)

#### 7. **philly_li_permits** (L&I Building Permits)
```sql
Columns:
  - property_id, permit_number, permit_type
  - permit_issued_date, application_date
  - work_type, contractor, contractor_license
  - status, address, bin, opa_account
  - raw_data (JSONB)

Connected to:
  🔄 Philadelphia OpenData API → Syncs permits
  ✅ ComplianceAnalytics → Show permit history
```

#### 8. **philly_li_violations** (L&I Code Violations)
```sql
Columns:
  - property_id, violation_id, violation_date
  - violation_type, violation_code, violation_description
  - status (open/corrected/complied/vacated)
  - risk_category, risk_weight
  - estimated_cost_min, estimated_cost_max
  - inspector, address, bin, opa_account

Connected to:
  🔄 Philadelphia OpenData API → Syncs violations
  ✅ CompliancePunchList → Display violations
  ✅ Compliance scoring → Calculate risk
```

#### 9. **philly_building_certifications** (Fire/Safety Certs)
```sql
Columns:
  - property_id, certification_number, certification_type
  - last_inspection_date, inspection_result
  - expiration_date, inspector_company
  - address, bin, raw_data (JSONB)

Connected to:
  🔄 Philadelphia OpenData API → Syncs certifications
  ✅ CompliancePunchList → Show expired certs
```

#### 10. **philly_building_certification_summary** (System Status)
```sql
Columns:
  - property_id, structure_id (bin)
  - sprinkler_status, fire_alarm_status, standpipe_status
  - facade_status, fire_escape_status
  - emer_stdby_pwr_sys_status, damper_status
  - special_hazards_status

Connected to:
  🔄 Philadelphia OpenData API → Real-time status
  ✅ CompliancePunchList → System compliance checklist
```

#### 11-14. Additional Philadelphia Tables
- **philly_case_investigations** → Investigation records
- **philly_unsafe_buildings** → Unsafe building designations
- **philly_imminently_dangerous_buildings** → Emergency status
- **compliance_risk_assessments** → AI risk scoring
- **compliance_action_plans** → Action items
- **compliance_analytics** → Historical tracking

---

## 🎯 DASHBOARD TAB STRUCTURE

### **Tab 1: Dashboard** (Main Overview)
**Component:** `MVPDashboard.jsx` (lines 311-541)

**Data Sources:**
```javascript
✅ properties table → List all user properties
   - Fetched on mount: fetchProperties()
   - Query: SELECT * FROM properties WHERE user_id = {user.id}
   - Displays: address, city, type, compliance_score, violations

✅ user_profiles table → User subscription info
   - Fetched on mount: fetchUserProfile()
   - Displays in sidebar: subscription_tier, properties_count
```

**Features:**
- Stats cards (Total Properties, Compliance Rate, Violations, Inspections)
- Properties table with search/filter
- Add Property form (inserts into `properties` table)

---

### **Tab 2: Compliance Punch List**
**Component:** `CompliancePunchList.jsx`

**Data Sources:**
```javascript
✅ properties table → Select property
✅ philly_li_violations table → Active violations
✅ philly_building_certifications table → Certification status
✅ philly_building_certification_summary → System checklist
✅ compliance_systems table → Compliance items by locale

Expected queries:
  - SELECT * FROM philly_li_violations WHERE property_id = {id} AND status = 'open'
  - SELECT * FROM philly_building_certifications WHERE property_id = {id} AND expiration_date < NOW()
```

**Features:**
- City-specific compliance checklist (NYC vs Philadelphia)
- Violation tracking
- Certification expiration alerts
- Priority scoring

---

### **Tab 3: Vendor RFPs**
**Component:** `VendorRFP.jsx`

**Data Sources:**
```javascript
✅ vendors table → Browse vendors
✅ vendor_quotes table → Track RFPs
✅ properties table → Select property for RFP

Expected queries:
  - SELECT * FROM vendors WHERE active = true AND cities @> ['NYC'] OR cities @> ['Philadelphia']
  - INSERT INTO vendor_quotes (user_id, vendor_id, property_id, service_type, ...)
  - SELECT * FROM vendor_quotes WHERE user_id = {user.id}
```

**Features:**
- Vendor marketplace
- Create RFP for selected property
- Track quote responses
- Vendor ratings and certifications

---

### **Tab 4: Report Library**
**Component:** `ReportLibrary.jsx`

**Data Sources:**
```javascript
✅ compliance_reports table → All generated reports
✅ properties table → Filter by property
✅ payments table → Payment history

Expected queries:
  - SELECT * FROM compliance_reports WHERE user_id = {user.id} ORDER BY generated_at DESC
  - SELECT * FROM compliance_reports WHERE property_id = {id}
```

**Features:**
- List all compliance reports
- Download PDF/JSON reports
- Filter by property, date, risk level
- View AI analysis and recommendations

---

### **Tab 5: To-Do Generator**
**Component:** `TodoGenerator.jsx`

**Data Sources:**
```javascript
✅ property_todos table → Task management
✅ properties table → Select property
✅ compliance_reports table → Auto-generate from violations

Expected queries:
  - SELECT * FROM property_todos WHERE property_id = {id}
  - INSERT INTO property_todos (property_id, title, description, priority, due_date, ...)
  - UPDATE property_todos SET status = 'completed' WHERE id = {id}
```

**Features:**
- Generate todos from compliance reports
- Manual todo creation
- Priority and status tracking
- Due date management

---

## 🔌 SERVICE LAYER

### **Authentication Service** (`src/services/auth.js`)
```javascript
Functions:
  - signUp() → Creates auth.users + user_profiles
  - signIn() → Email/password login
  - signInWithGoogle() → OAuth with Google
  - signOut() → Clears session
  - getUserProfile() → SELECT FROM user_profiles
  - updateSubscription() → UPDATE user_profiles subscription fields
  - canGenerateReport() → Check subscription limits
  - consumeReportCredit() → Increment reports_used
```

### **Supabase Config** (`src/config/supabase.js`)
```javascript
Exports:
  - supabase → Supabase client instance
  - APP_CONFIG → Subscription tiers, pricing, Stripe keys
```

---

## 🔄 DATA FLOW DIAGRAMS

### **User Login Flow**
```
User clicks "Sign In"
    ↓
LandingPage → authService.signIn(email, password)
    ↓
Supabase Auth → Returns session
    ↓
App.js onAuthStateChange → Detects session
    ↓
authService.getUserProfile(user.id)
    ↓
Query: SELECT * FROM user_profiles WHERE id = {user.id}
    ↓
Set user state with profile data
    ↓
Render MVPDashboard with user prop
```

### **Add Property Flow**
```
User fills Add Property form
    ↓
MVPDashboard.handleAddProperty()
    ↓
Query: INSERT INTO properties (user_id, address, city, type, units, ...)
    ↓
Supabase RLS: Verify auth.uid() = user_id
    ↓
Trigger: update_property_count_insert
    ↓
Auto-increment user_profiles.properties_count
    ↓
Fetch updated properties list
    ↓
Update UI with new property
```

### **Generate Compliance Report Flow**
```
User clicks "Generate Report"
    ↓
Check: authService.canGenerateReport(user.id)
    ↓
Query: SELECT subscription_tier, reports_used, reports_limit FROM user_profiles
    ↓
If allowed → POST to backend AI service
    ↓
Backend: Fetch property data, violations, permits
    ↓
AI Analysis (GPT-4/Claude) → Generate recommendations
    ↓
Query: INSERT INTO compliance_reports (user_id, property_id, ai_analysis, ...)
    ↓
Query: UPDATE user_profiles SET reports_used = reports_used + 1
    ↓
Return report to frontend
    ↓
Display in ReportLibrary
```

---

## 🛡️ ROW LEVEL SECURITY (RLS) POLICIES

All tables have RLS enabled with policies:
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar policies for:
✅ user_profiles
✅ properties
✅ compliance_reports
✅ payments
✅ vendor_quotes
✅ property_todos
✅ All Philadelphia data tables (via property_id → properties.user_id)
```

---

## 🔍 MISSING CONNECTIONS (To Implement)

### Currently NOT Connected:
1. ❌ **Backend AI Service** → No Python backend routes connected yet
   - Need to connect `propply_app.py` Flask routes
   - AI compliance analysis not generating real reports

2. ❌ **Philadelphia OpenData Integration** → No automatic syncing
   - Need to run `philly_enhanced_data_client.py` periodically
   - Should add webhook or cron job to sync data

3. ❌ **Stripe Integration** → Not fully wired
   - `BillingDashboard.jsx` exists but not used
   - Need to complete Stripe checkout flow

4. ❌ **Real-time Updates** → No websocket/realtime subscriptions
   - Could add Supabase realtime for live property updates

5. ❌ **Email Notifications** → No email service connected
   - Need to set up Supabase Auth emails or SendGrid

---

## 📈 NEXT STEPS FOR FULL INTEGRATION

### Priority 1: Core Functionality
- [ ] Connect backend AI routes to frontend
- [ ] Test compliance report generation end-to-end
- [ ] Set up Philadelphia data sync cron job

### Priority 2: Payment Flow
- [ ] Complete Stripe checkout integration
- [ ] Add BillingDashboard to MVPDashboard tabs
- [ ] Test subscription upgrades

### Priority 3: Data Enrichment
- [ ] Add NYC DOB data integration (similar to Philadelphia)
- [ ] Connect AI recommendations to vendor marketplace
- [ ] Auto-generate todos from compliance reports

### Priority 4: UX Enhancements
- [ ] Add real-time notifications
- [ ] Implement search across all data
- [ ] Add export/download features

---

## 🎨 COMPONENT HIERARCHY

```
App.js (Root)
│
├─ LandingPage.jsx (Not logged in)
│   ├─ PricingSection.jsx
│   └─ AuthCallback.jsx (OAuth redirect)
│
└─ MVPDashboard.jsx (Logged in)
    ├─ Tab 1: Dashboard (built-in)
    ├─ Tab 2: CompliancePunchList.jsx
    ├─ Tab 3: VendorRFP.jsx
    ├─ Tab 4: ReportLibrary.jsx
    └─ Tab 5: TodoGenerator.jsx

Additional Components (not yet integrated):
  - BillingDashboard.jsx
  - ComplianceAnalytics.jsx
  - EnhancedComplianceAnalytics.jsx
  - InspectionCalendar.jsx
  - InspectionDashboard.jsx
  - PropplyAI.jsx
  - VendorIntegration.jsx
```

---

## 🗺️ FILE STRUCTURE SUMMARY

```
/Users/art3a/dev/Propply_MVP/
│
├── src/
│   ├── App.js                    → Main app router
│   ├── config/
│   │   └── supabase.js          → Supabase client + config
│   ├── services/
│   │   ├── auth.js              → Auth service layer
│   │   └── stripe.js            → Stripe service (not fully used)
│   └── components/
│       ├── MVPDashboard.jsx     → Main dashboard container
│       ├── LandingPage.jsx      → Login/signup page
│       ├── CompliancePunchList.jsx
│       ├── VendorRFP.jsx
│       ├── ReportLibrary.jsx
│       └── TodoGenerator.jsx
│
├── database/
│   └── schema.sql               → Old schema (replaced by migrations)
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_philadelphia_support.sql
│       └── 003_philadelphia_enhanced_data.sql
│
├── Backend Python Services (NOT YET CONNECTED TO FRONTEND):
│   ├── propply_app.py                        → Flask app (AI routes)
│   ├── ai_compliance_analyzer.py             → AI analysis service
│   ├── philly_enhanced_data_client.py        → Philadelphia API client
│   └── philadelphia_integration_service.py   → Data sync service
│
└── Documentation:
    ├── AUTHENTICATION_SETUP.md
    ├── DEPLOYMENT_GUIDE.md
    └── PHILADELPHIA_INTEGRATION.md
```

---

## ✅ QUICK REFERENCE: Where Data Lives

| Feature | Frontend Component | Database Table(s) | Connected? |
|---------|-------------------|-------------------|------------|
| User Auth | App.js, LandingPage | user_profiles | ✅ Yes |
| Property List | MVPDashboard | properties | ✅ Yes |
| Compliance Reports | ReportLibrary | compliance_reports | 🔄 Partial |
| Violations | CompliancePunchList | philly_li_violations | 🔄 Partial |
| Certifications | CompliancePunchList | philly_building_certifications | 🔄 Partial |
| Vendors | VendorRFP | vendors, vendor_quotes | ✅ Yes |
| Todos | TodoGenerator | property_todos | 🔄 Partial |
| Payments | BillingDashboard | payments | ❌ Not yet |
| Subscriptions | MVPDashboard sidebar | user_profiles | ✅ Yes |

**Legend:**
- ✅ Fully connected and working
- 🔄 Partially connected (table exists, needs backend)
- ❌ Not connected yet

---

**Generated:** September 30, 2025  
**Last Updated:** After OAuth callback fix commit (66dacc2)
