# 🚀 NicheScope: YouTube Intelligence Platform

**NicheScope** is a professional-grade research and automation suite designed for YouTube creators, strategists, and automation experts. It leverages AI and real-time data to identify high-potential niches, analyze competitor strategies, and generate viral content blueprints.

---

## 🌟 Key Features

### 🔍 Niche Discovery & Analytics
- **Market Viability**: AI-scored evaluation of niche profitability and competition.
- **Trend Forecasting**: Real-time trend analysis using Google/YouTube data.
- **Monetization Scores**: Identification of high-CPM and diverse revenue stream opportunities.

### 📊 Channel Forensic Intelligence
- **Growth Velocity**: Track views-per-day and subscriber acceleration.
- **Opportunity Mapping**: Identify gaps in competitor content strategies.
- **Keyword Extraction**: Automated mapping of top-performing channel tags and SEO.

### 🧠 AI Content Strategy Engine
- **Viral Forensics**: Breakdown of video hooks, retention techniques, and emotional triggers.
- **Script Blueprints**: Full video script outlines generated via OpenAI (Exportable to Word).
- **Metadata Optimization**: AI-generated titles, descriptions, and thumbnail concepts.

### 📂 Data Portability
- **Excel (XLSX) Exports**: Bulk download niche and channel data for offline research.
- **Word (DOCX) Reports**: Professional forensic reports and script outlines for your production team.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, SlowAPI (Rate Limiting) |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL) |
| **AI / APIs** | OpenAI GPT-4, YouTube Data API v3 |
| **Utilities** | Pandas (Data Processing), Docx (Report Generation), Rake-NLTK |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 20+**
- **Supabase Account**
- **OpenAI API Key**
- **Google Cloud Console** (YouTube Data API v3 enabled)

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Initialization
1. Log in to your **Supabase Dashboard**.
2. Open the **SQL Editor**.
3. Copy and run the contents of `backend/db/migration_001_initial.sql`.

### 4. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
# Ensure .env.local contains NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Running Locally
**Start Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```
Visit `http://localhost:3000` to start exploring.

---

## 🌩️ Deployment
For a professional, **zero-budget** deployment guide using Vercel, Render, and Supabase, see the [Deployment Guide](DEPLOYMENT.md).

---

## 📁 Project Structure
```text
youtube-automation/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── routers/       # API Endpoints (Niches, Channels, Export)
│   │   ├── services/      # Business Logic (AI, Scraping, Exporting)
│   │   └── models/        # Pydantic Schemas
│   └── db/                # SQL Migrations & Database Logic
├── frontend/               # Next.js Application
│   ├── src/app/           # Pages & Routes
│   ├── src/components/    # Shared UI Components
│   └── public/            # Static Assets
└── README.md              # Project Documentation
```

---

## 📝 License
This project is for private use and development. See repository history for contributor details.
