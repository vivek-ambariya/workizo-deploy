# 🚀 WORKIZO Real-World Deployment Guide

This workspace is a **production-ready clone** of the WORKIZO platform, complete with Dockerization, Daphne ASGI WebSocket support, Redis channel layer, Nginx reverse proxy, and MySQL 8 database.

---

## 📁 Clone Directory Structure

```
sem 4 project clone/
├── docker-compose.yml           # Production Docker multi-container orchestration
├── deploy.sh                    # One-click deployment script
├── DEPLOYMENT.md                # Deployment manual & production guide
├── nginx/
│   └── nginx.conf               # Nginx routing for React SPA, API, and WebSockets
├── backend/
│   ├── Dockerfile               # Python 3.11 + EasyOCR/OpenCV Linux system dependencies
│   ├── requirements.txt         # Production backend dependencies
│   ├── .env.production.example  # Production environment secrets template
│   └── config/                  # Django DRF + Channels configuration
└── frontend/
    ├── Dockerfile               # Multi-stage build (Node 20 build + Nginx serve)
    ├── nginx.conf               # Standalone static asset server config
    └── .env.production.example  # Frontend environment secrets template
```

---

## ⚡ Quick Start (Local Docker Testing)

1. Navigate to the clone project directory:
   ```bash
   cd "/Users/ambariyavivek/vivek college/sem 4 project clone"
   ```

2. Run the automated deployment script:
   ```bash
   ./deploy.sh
   ```

3. Open your browser:
   - **Frontend App**: [http://localhost](http://localhost)
   - **Backend API**: [http://localhost/api/](http://localhost/api/)
   - **Django Admin**: [http://localhost/admin/](http://localhost/admin/)

---

## 🌐 Deploying to Production Cloud VPS (AWS EC2 / DigitalOcean Droplet)

### Step 1: Server Requirements & Setup
- **Recommended OS**: Ubuntu 22.04 LTS
- **Instance Sizing**: 2 GB RAM minimum (to accommodate EasyOCR PyTorch OCR processing)
- **Install Docker & Docker Compose**:
  ```bash
  sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
  sudo systemctl enable --now docker
  ```

### Step 2: Clone & Configure Environment Variables
Copy `.env.production.example` files to `.env` in `backend/` and update production secrets:
```bash
cp backend/.env.production.example backend/.env
```
Key production configurations to update:
- `SECRET_KEY`: Set to a strong random key (`openssl rand -hex 32`)
- `DEBUG`: Set to `False`
- `ALLOWED_HOSTS`: Set to your domain (e.g. `workizo.com,api.workizo.com`)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Swap to your Live Razorpay Key pair
- `EMAIL_HOST_USER` & `EMAIL_HOST_PASSWORD`: Your production SMTP credentials

### Step 3: Run Containers & Migrations
```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

### Step 4: Setup SSL / HTTPS & WSS with Certbot (Let's Encrypt)
Run Certbot to generate SSL certificates for secure HTTPS and WebSockets (`wss://`):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d workizo.com -d api.workizo.com
```

---

## 📊 Container Services Architecture

| Service Name | Port | Description |
| :--- | :--- | :--- |
| `workizo_nginx` | `80`, `443` | Primary Reverse Proxy serving React frontend, API `/api/`, and WebSockets `/ws/` |
| `workizo_backend` | `8000` | Daphne ASGI server running Django REST Framework + Channels |
| `workizo_mysql` | `3306` | MySQL 8 relational database with persistent storage volume |
| `workizo_redis` | `6379` | Redis server acting as channel layer backend for live WebSocket updates |
