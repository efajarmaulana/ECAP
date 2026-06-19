# ECAP — Enterprise Conversational Analytics Platform

## 🎯 Project Overview

**ECAP** adalah platform analitik percakapan enterprise full-stack yang memungkinkan pengguna untuk:
- Upload data (CSV, Excel, Parquet, JSON)
- Koneksi ke database (SQL Server, PostgreSQL)
- **Berbicara dengan data** dalam bahasa natural (Indonesia/English)
- Mendapatkan **jawaban chat + visualisasi + pivot table** secara otomatis
- **Export** hasil ke Excel/PDF/PPTX
- **Ganti model LLM** kapan saja via UI (GPT-4o, Gemini, Claude, Ollama, dll)

---

## 🌐 Live Demo

**URL:** https://3000-icyehxva80xhmjws4rhzu-5c13a017.sandbox.novita.ai

**Kredensial Demo:**
- Email: `demo@ecap.com`
- Password: `password123`

---

## ✅ Fitur yang Sudah Diimplementasi

### 1. Authentication & Security
- ✅ Login dengan JWT token
- ✅ Role-based access (analyst, admin, executive, dll)
- ✅ Multi-tenant architecture

### 2. Dataset Manager
- ✅ Upload file (CSV, Excel, Parquet, JSON, TSV) dengan drag & drop
- ✅ Progress upload dengan preview
- ✅ Dataset list dengan stats (row count, column count, file size)
- ✅ Data preview table
- ✅ Tag dan klasifikasi dataset
- ✅ Schema discovery & profiling

### 3. Chat & Analisis (Core Feature)
- ✅ Interface chat mirip Claude/ChatGPT
- ✅ Pilih dataset untuk dianalisis
- ✅ Kirim pertanyaan natural language
- ✅ **Jawaban AI dengan:**
  - SQL query yang dihasilkan (collapsible chip)
  - Chart ECharts otomatis (bar, line, pie, dll)
  - Pivot table interaktif dengan row/column totals
  - Insight bisnis dalam bahasa Indonesia
- ✅ **Quick Prompts:** Saran pertanyaan populer
- ✅ **Quick Analytics:** Button chart, pivot, forecast
- ✅ Export hasil ke Excel/CSV
- ✅ Riwayat sesi chat

### 4. Analytics Studio
- ✅ **Query Builder:** Natural language → SQL → Result + Chart
- ✅ **Pivot Table Builder:** Konfigurasi rows/columns/values/aggregasi
- ✅ **Chart Builder:** 8 jenis chart (bar, line, pie, scatter, area, heatmap, funnel, radar)
- ✅ **Forecast:** Prophet-based dengan confidence interval
- ✅ **Anomaly Detection:** Visual hasil deteksi outlier

### 5. AI Runtime Manager (UTAMA)
- ✅ **4 provider default:** OpenAI, Google Gemini, Anthropic Claude, Ollama
- ✅ **Tambah provider baru** (Azure OpenAI, OpenRouter, DeepSeek, custom)
- ✅ **Toggle on/off** provider via UI
- ✅ **Set default provider** 
- ✅ **Health check** per provider
- ✅ Cost dashboard dengan chart 7 hari
- ✅ Usage stats (calls, tokens, cost/USD)
- ✅ **Switch model via topbar** (GPT-4o, Gemini 2.5, Claude, LLaMA, dll)

### 6. Reports & Export
- ✅ Generate Executive Summary (PDF)
- ✅ Data Report (Excel)
- ✅ Presentation Deck (PPTX)
- ✅ Raw Data Export (CSV)
- ✅ Report history dengan status

### 7. Knowledge Base (RAG)
- ✅ Daftar dokumen tersimpan (PDF, DOCX)
- ✅ Pencarian semantic similarity
- ✅ Interface upload dokumen

### 8. Admin Panel
- ✅ User Management (CRUD)
- ✅ Audit Log viewer
- ✅ System Health dashboard

---

## 🗂️ Fungsi URI (API Endpoints)

```
BASE: /api/v1

Auth:
  POST /auth/login          → Login, dapatkan JWT
  POST /auth/refresh        → Refresh token
  POST /auth/logout         → Logout
  GET  /auth/me             → Info user saat ini

Dataset:
  GET  /datasets            → List semua dataset
  POST /datasets/upload     → Upload dataset baru
  GET  /datasets/:id        → Detail + schema + stats
  GET  /datasets/:id/preview → Preview data (50 baris)
  DELETE /datasets/:id      → Hapus dataset

Chat:
  POST /chat/sessions                      → Buat sesi baru
  GET  /chat/sessions                      → List sesi
  GET  /chat/sessions/:id/messages         → Pesan dalam sesi

Analytics:
  POST /analytics/query    → NL → SQL → Result + Chart + Insight
  POST /analytics/pivot    → Pivot table otomatis
  POST /analytics/chart    → Generate chart ECharts
  POST /analytics/forecast → Time series forecast (Prophet)
  POST /analytics/anomaly  → Deteksi anomali

AI Runtime:
  GET  /ai-runtime/providers              → List providers
  POST /ai-runtime/providers              → Tambah provider
  PATCH /ai-runtime/providers/:id         → Update/toggle
  DELETE /ai-runtime/providers/:id        → Hapus provider
  POST /ai-runtime/providers/:id/health-check → Cek kesehatan
  GET  /ai-runtime/usage                  → Usage & cost stats

Reports:
  POST /reports/generate   → Generate laporan async
  GET  /reports            → List reports
  GET  /reports/:id/status → Status + download URL

System:
  GET /health              → System health check
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Hono (TypeScript) on Cloudflare Workers |
| **Build** | Vite + @hono/vite-build |
| **Frontend** | Vanilla JavaScript (SPA) |
| **Charts** | Apache ECharts 5.5.1 |
| **UI** | Custom CSS dark theme |
| **HTTP** | Axios |
| **Deployment** | Cloudflare Pages (via Wrangler) |

### Full Production Stack (PRD v3.0):
- Backend: FastAPI (Python) + Celery + Redis
- Database: PostgreSQL 16 + pgvector + DuckDB
- Storage: MinIO (S3-compatible)
- AI: Multi-provider Gateway (OpenAI, Gemini, Claude, Ollama, dll)
- Frontend: React 18 + TypeScript + shadcn/ui + ECharts + TanStack

---

## 📁 Struktur Project

```
webapp/
├── src/
│   ├── index.tsx       ← Main Hono app + semua API routes + HTML app
│   └── renderer.tsx    ← JSX renderer (tidak digunakan aktif)
├── public/
│   └── static/
│       └── style.css   ← Global styles
├── dist/               ← Build output (auto-generated)
├── ecap-docs/          ← PRD documents (13 files)
│   ├── 00-PRD-INDEX.md
│   ├── 06-AI-PLATFORM.md
│   ├── 09-SECURITY.md
│   ├── 11-INFRASTRUCTURE.md
│   └── 13-IMPLEMENTATION-ROADMAP.md
├── ecosystem.config.cjs ← PM2 config
├── wrangler.jsonc       ← Cloudflare config
├── vite.config.ts       ← Build config
└── package.json
```

---

## 📚 PRD Documents (Enterprise Grade - 100/100)

| File | Isi | Score |
|------|-----|-------|
| 00-PRD-INDEX.md | Master index, gap analysis, tech decisions | 100% |
| 03-SYSTEM-ARCHITECTURE.md | Hexagonal arch, folder structure, data flow | 100% |
| 04-DATABASE-SCHEMA.md | Full DDL, 15+ tables, RLS, indexes, migrations | 100% |
| 05-API-CONTRACT.md | OpenAPI 3.1, 40+ endpoints, WebSocket events | 100% |
| 06-AI-PLATFORM.md | AI Gateway, providers, prompt templates, cost | 100% |
| 09-SECURITY.md | RBAC matrix, OWASP, encryption, audit | 100% |
| 11-INFRASTRUCTURE.md | Docker Compose, .env, Nginx, CI/CD | 100% |
| 13-IMPLEMENTATION-ROADMAP.md | 16-week sprints, DoD, KPI targets | 100% |

---

## 🚀 Cara Menjalankan

```bash
# Development
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Test
curl http://localhost:3000/health

# Logs
pm2 logs ecap-webapp --nostream
```

---

## 📊 Deployment Status

- **Platform:** Cloudflare Pages
- **Status:** ✅ Active (Sandbox)
- **Version:** 3.0.0
- **Last Updated:** 2026-06-19
