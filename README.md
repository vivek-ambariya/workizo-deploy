# 🚀 WORKIZO

> **Connecting Skilled Professionals to Every Home.**

WORKIZO is a modern full-stack home service marketplace that connects customers with verified professionals such as electricians, plumbers, carpenters, AC technicians, mechanics, and home cleaning experts through a real-time booking platform.

The platform provides a seamless booking experience with live status updates, secure authentication, professional dashboards, online and offline payments, email notifications, and a complete service lifecycle from booking to completion.

---

# ✨ Features

## 👤 Customer

- Secure Registration & Login
- Google Authentication (Optional)
- Email Verification
- Password Reset via SMTP
- Auto Detect Current Location
- Browse Service Categories
- Instant Service Booking
- Real-Time Booking Status
- Live Captain Tracking
- QR Verification
- View Generated Invoice
- Online Payment (Razorpay Test Mode)
- Cash Payment Option
- Download Receipt
- Booking History
- Profile Management

---

## 👷 Captain

- Secure Registration
- Professional Verification (KYC)
- Aadhaar & PAN OCR Verification
- Dashboard
- Online / Offline Availability
- Receive Live Booking Requests
- Accept / Reject Requests
- Manage Active Jobs
- Upload Spare Part Images
- Generate Itemized Bill
- Cash Payment Confirmation
- Earnings Overview
- Profile Management

---

## 🛠 Admin

- Customer Management
- Captain Management
- Booking Management
- Payment Monitoring
- KYC Approval / Rejection
- Dashboard Analytics
- Revenue Overview
- User Management
- Service Category Management

---

# ⚡ Real-Time Features

- WebSocket Integration
- Live Booking Requests
- Live Status Updates
- Instant Dashboard Synchronization
- Customer & Captain Notifications
- Real-Time Payment Status
- Real-Time Booking Tracking

---

# 💳 Payment Integration

- Razorpay Test Mode
- Online Payment
- Cash Payment
- Secure Backend Verification
- Payment Status Tracking
- Receipt Generation
- Email Receipt

---

# 📧 Email System

SMTP Integration

Supports:

- Email Verification
- Password Reset
- Booking Confirmation
- Captain Assignment
- Invoice Emails
- Payment Confirmation
- Booking Completion

---

# 📄 Bill Generation

- Labour Charges
- Spare Parts
- Quantity
- Unit Price
- Automatic Total Calculation
- Itemized Invoice
- Professional Receipt

---

# 🔐 Authentication

- JWT Authentication
- Protected Routes
- Role-Based Access
- Customer Portal
- Captain Portal
- Admin Portal

---

# 🤖 OCR Verification

Automated document verification using:

- OpenCV
- EasyOCR
- Regex
- Django

Supports:

- Aadhaar Card
- PAN Card

---

# 📊 Tech Stack

## Frontend

- React
- React Router
- Bootstrap
- Framer Motion
- Axios

---

## Backend

- Django
- Django REST Framework
- Django Channels
- WebSockets
- JWT Authentication

---

## Database

- MySQL

---

## Payments

- Razorpay Test Mode

---

## Email

- Gmail SMTP

---

## OCR

- OpenCV
- EasyOCR
- Regex

---

# 📦 Project Structure

```
Frontend (React)

Customer Module

Captain Module

Admin Module

Booking Module

Payment Module

Notification Module

Authentication Module

OCR Verification

Backend (Django)

REST APIs

WebSocket Server

JWT Authentication

Booking Engine

Payment Engine

Email Service

OCR Service

MySQL Database
```

---

# 🔄 Booking Workflow

```
Customer Books Service
        │
        ▼
Booking Created
        │
        ▼
Captain Receives Request
        │
        ▼
Captain Accepts
        │
        ▼
Captain Starts Work
        │
        ▼
Spare Parts Added
        │
        ▼
Invoice Generated
        │
        ▼
Customer Reviews Invoice
        │
        ▼
Choose Payment

 ┌─────────────┐
 │             │
 ▼             ▼

Online      Cash Payment

 │             │
 ▼             ▼

Razorpay   Captain Confirms

 └──────┬──────┘
        ▼

Payment Completed
        │
        ▼
Receipt Generated
        │
        ▼
Email Sent
        │
        ▼
Booking Completed
```

---

# 📸 Screenshots

> Add screenshots of:

- Landing Page
- Customer Dashboard
- Captain Dashboard
- Admin Dashboard
- Booking Flow
- Invoice
- Payment Page

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/vivek-ambariya/Workizo-A_service_company.git
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## Environment Variables

Create a `.env` file:

```env
SECRET_KEY=

DEBUG=True

DB_NAME=

DB_USER=

DB_PASSWORD=

DB_HOST=

DB_PORT=

EMAIL_HOST=

EMAIL_PORT=

EMAIL_HOST_USER=

EMAIL_HOST_PASSWORD=

EMAIL_USE_TLS=True

DEFAULT_FROM_EMAIL=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

JWT_SECRET=
```

---

# 🎯 Future Roadmap

- Google Maps Live Tracking
- Push Notifications
- AI Chat Assistant
- Voice Booking
- Coupons & Offers
- Referral Program
- Customer Reviews & Ratings
- Wallet System
- Subscription Plans
- Multi-language Support
- AI Service Recommendation

---

## Startup Head

**Vivek Ambariya**

LJ University

---

# 📄 License

This project is developed for educational purposes and startup prototyping.

---

# ⭐ Support

If you like this project, don't forget to ⭐ star the repository!

---

## WORKIZO

**Connecting Skilled Professionals to Every Home.**

---

## 👥 Contributors

- **Vivek Ambariya** ([@vivek-ambariya](https://github.com/vivek-ambariya))
- **Antigravity** (AI Coding Assistant by Google DeepMind)
