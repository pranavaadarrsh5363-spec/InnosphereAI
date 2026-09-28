# 🌐 InnoSphere AI – Production Deployment Guide

This guide provides step-by-step instructions for deploying the **InnoSphere AI** platform to production environments using **Vercel** for the frontend and **Render / Railway / AWS** with **PostgreSQL** for the backend.

---

## 1. Architecture Overview

* **Frontend:** Next.js 14 (App Router) on Vercel Edge Network.
* **Backend:** FastAPI (Python 3.11+) container on Render / Railway / AWS App Runner.
* **Database:** Managed PostgreSQL (Supabase / Neon / AWS RDS).
* **AI Provider:** Google Gemini API (`gemini-2.5-flash`).

---

## 2. PostgreSQL Database Setup

1. Create a managed PostgreSQL database instance on [Neon](https://neon.tech), [Supabase](https://supabase.com), or AWS RDS.
2. Note your database connection string, for example:
   ```env
   DATABASE_URL=postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/innosphere_db?sslmode=require
   ```
3. The SQLAlchemy models in `backend/app/models/` will automatically create all tables and populate seed data upon first startup.

---

## 3. Backend Deployment (Render.com)

1. Sign in to [Render](https://render.com) and create a **New Web Service**.
2. Connect your Git repository.
3. Configure the service:
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   * `PROJECT_NAME`: `InnoSphere AI`
   * `DATABASE_URL`: Your PostgreSQL connection string.
   * `SECRET_KEY`: A cryptographically random 64-character string (`openssl rand -hex 32`).
   * `GEMINI_API_KEY`: Your Google Gemini API Key.
   * `GEMINI_MODEL`: `gemini-2.5-flash`
   * `CORS_ORIGINS`: `["https://your-frontend-app.vercel.app"]`
5. Click **Create Web Service**. Your backend will be live at `https://your-backend-api.onrender.com`.

---

## 4. Frontend Deployment (Vercel)

1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. In Project Configuration:
   * **Framework Preset:** Next.js
   * **Root Directory:** `frontend`
4. Add Environment Variable:
   * `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api/v1`
5. Click **Deploy**. Vercel will build and distribute your Next.js application across global edge nodes.

---

## 5. Production Health Verification

Once deployed, verify your live services:

```bash
# 1. Check Backend Health
curl https://your-backend-api.onrender.com/health

# Response:
# {"status":"healthy","database":"connected","ai_engine":"ready"}

# 2. Check OpenAPI Docs
# Visit https://your-backend-api.onrender.com/docs
```
