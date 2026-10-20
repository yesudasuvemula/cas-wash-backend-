# Elite Car Wash & Care - Premium Management System

A full-stack, owner-only Car Wash & Society Subscription Management System engineered with React (Vite), Node.js, Express, MongoDB, and WhatsApp notification integration.

---

## 🌟 Key Features

1. **Owner-Only Authentication & Security**:
   - Immediate login screen for the business owner. No public self-registration.
   - JWT sessions with bcryptjs password hashing.
   - Protected API routes and CORS authentication guards.

2. **Apartment Block & Flat Management**:
   - Every customer profile includes **Apartment Community**, **Block Number**, and **Flat Number**.
   - Universal search filtering across customer name, mobile number, vehicle registration number, block, and flat.
   - Apartment details automatically displayed on daily wash records and reminder logs.

3. **Prepaid Monthly Subscription Billing**:
   - Subscriptions run on a monthly prepaid cycle due between the **1st and 5th** of each month.
   - Tiered pricing per vehicle size category:
     - Small Car: **₹1,000 / month**
     - Medium Car: **₹1,150 / month**
     - Large Car: **₹1,230 / month**
     - Extra Large Car: **₹1,350 / month**
   - Configurable price matrix from system settings.
   - Full and partial payment tracking with UPI reference / transaction receipt logs.
   - Strict cash-in accounting: only recorded payments are calculated as business income.

4. **Daily Wash Operations Bay**:
   - Check-in arriving vehicles into the bay with timestamp tracking.
   - Progress tracking (`In Progress` -> `Completed`).
   - Duplicate prevention alerts if the vehicle arrives multiple times on the same date.

5. **WhatsApp Notifications & Automated Reminders**:
   - **Wash Completion Message**:
     > *"Hello [Customer Name], your vehicle [Vehicle Number] (Flat [Flat Number], Block [Block Number]) has been washed successfully today. Thank you for choosing our car wash service!"*
   - **Payment Reminder Message**:
     > *"Hello [Customer Name], this is a friendly reminder that your monthly car wash subscription payment of ₹[Amount Due] for vehicle [Vehicle Number] (Flat [Flat Number], Block [Block Number]) is pending for [Billing Month]. Please complete your payment by the 5th. Thank you!"*
   - Official Meta WhatsApp Business Cloud API integration with automatic fallback to prefilled WhatsApp Web / WhatsApp App manual launchers.
   - Delivery / Link opened tracking history logs.
   - Automated backend cron scheduler for daily reminder audits.

6. **Executive Dashboard & Real-Time Statistics**:
   - Real-time MongoDB aggregations for today's cars washed, completed, pending, payments received, and active subscriptions.
   - Interactive charts for 7-day wash activity and vehicle size distribution.
   - Tabular CSV reporting exports for customers, payments, and daily wash logs.

---

## 🚀 Running the Application Locally

### Prerequisites
- Node.js (v18+ or v24+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Server Setup
```bash
cd server
npm install
npm run dev
# or: node src/index.js
```
The server will start on `http://localhost:5000` and automatically seed initial society vehicles and default settings into MongoDB.

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5174/` (or `http://localhost:5173/`).

---

