# 🚀 WORKIZO 100% Free Deployment Walkthrough

This guide provides step-by-step instructions to deploy the entire **WORKIZO** platform **completely free of charge** using **Vercel** (Frontend), **Render** (Backend API & WebSockets), **Neon** (PostgreSQL Database), and **Upstash** (Redis Channel Layer).

---

## 🛠️ Infrastructure Overview (100% Free Stack)

| Service | Hosting Provider | Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | **Vercel** | $0 / month | React frontend + Global CDN + SSL |
| **Backend API / ASGI** | **Render.com** | $0 / month | Django REST API + Daphne ASGI WebSockets |
| **Database** | **Neon.tech** | $0 / month | Managed PostgreSQL database |
| **Redis** | **Upstash.com** | $0 / month | Serverless Redis for Django Channels WebSockets |

---

## 📋 Step-by-Step Deployment Instructions

### STEP 1: Create Free PostgreSQL Database on Neon.tech
1. Go to [https://neon.tech](https://neon.tech) and sign up using GitHub.
2. Click **Create Project**, name it `workizo-db`, and select your nearest region.
3. Once created, copy the **Connection String** (PostgreSQL connection URL).
   - *Example format*: `postgres://username:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

### STEP 2: Create Free Serverless Redis on Upstash.com
1. Go to [https://upstash.com](https://upstash.com) and sign up.
2. Click **Create Database**.
   - Name: `workizo-redis`
   - Type: **Regional Redis**
   - Eviction: Enabled
3. Copy the **rediss://** URL from the Upstash details page.
   - *Example format*: `rediss://default:password@sample.upstash.io:6379`

---

### STEP 3: Deploy Django Backend on Render.com
1. Push your repository to GitHub.
2. Go to [https://render.com](https://render.com) and sign up with GitHub.
3. Click **New +** ➔ **Web Service**.
4. Connect your GitHub repository:
   - **Name**: `workizo-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**: 
     ```bash
     daphne -b 0.0.0.0 -p $PORT config.asgi:application
     ```
   - **Instance Type**: `Free` ($0/mo)

5. Under **Environment Variables**, add the following key-value pairs:
   | Key | Value |
   | :--- | :--- |
   | `SECRET_KEY` | *(Generate a 32-char secret string)* |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `*` |
   | `DATABASE_URL` | *(Your Neon.tech Connection String from Step 1)* |
   | `REDIS_URL` | *(Your Upstash rediss:// URL from Step 2)* |
   | `CORS_ALLOWED_ORIGINS` | `https://workizo-frontend.vercel.app` *(update after Step 4)* |

6. Click **Create Web Service**. Wait for the build to finish. Copy your backend URL:
   - *Example*: `https://workizo-backend.onrender.com`

7. *(Optional)* Create Django Superuser via Render Shell:
   In Render dashboard, click **Shell** tab and run:
   ```bash
   python manage.py createsuperuser
   ```

---

### STEP 4: Deploy React Frontend on Vercel
1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository.
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://workizo-backend.onrender.com` |
   | `VITE_WS_BASE_URL` | `wss://workizo-backend.onrender.com` |

6. Click **Deploy**.
7. Copy your deployed frontend URL (e.g. `https://workizo-frontend.vercel.app`).
8. Return to Render Dashboard ➔ Environment Variables and update `CORS_ALLOWED_ORIGINS` to match your Vercel domain.

---

## 🎉 Done!
Your application is live and accessible online:
- **Frontend App**: `https://your-app.vercel.app`
- **Backend REST API**: `https://your-backend.onrender.com/api/`
- **Django Admin Console**: `https://your-backend.onrender.com/admin/`
