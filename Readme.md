# TailorCV


[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Semantic search platform that intelligently matches your experiences to job requirements using vector embeddings and LLM generation. Built to solve the co-op application grind at UWaterloo.

**Live at [tailorcvai.vercel.app](https://tailorcvai.vercel.app)**

## 🎯 Why I Built This

During my first co-op search at Waterloo, I applied to 500+ positions and spent countless hours manually tailoring resumes. I realized the core problem wasn't writing bullet points—it was **finding which experiences were actually relevant** to each role.

Traditional keyword matching fails to capture semantic similarity. This system uses vector embeddings to understand that "built scalable microservices" semantically matches "distributed systems experience," even without shared keywords.

## ✨ How It Works

1. **Build your experience library** — Add work experience, projects, and volunteering manually or by importing from LinkedIn
2. **Paste a job description** — pgvector performs semantic similarity search to find your most relevant experiences
3. **Generate tailored bullets** — LLM creates ATS-optimized resume bullet points matched to the job requirements

## 🧠 Technical Highlights

### Semantic Search Engine
- **Cohere embeddings** (embed-english-light-v3.0) for cost-effective similarity matching
- **PostgreSQL with pgvector** extension for efficient vector operations
- **384-dimensional embeddings** for fast search without sacrificing accuracy
- Average search time: **<200ms** across 100+ experiences

### LLM Integration
- **Groq API** with Llama 3.1 for 10-50x faster generation vs. OpenAI
- Context-aware prompting using retrieved experiences
- Cost: **~$0.002** per resume generation vs **~$0.02+** with GPT-4

## 🔧 Production Operations

### Platform Migration: Render → Railway

**Original Setup (Render):**
- Free tier with 15-minute sleep timeout
- Required cron keepalive every 5 minutes to prevent cold starts
- Memory crashes after 4-6 hours (512MB limit)

**Problem Identified:**
After running in production, discovered three issues:
1. **Cold starts**: Users experienced 30-50s delays after idle periods
2. **Memory leaks**: App crashed hitting 512MB limit
3. **Cron reliability**: Keepalive sometimes failed during slow container restarts

**Solution (Railway):**
- Migrated to Railway (always-on, no sleep)
- Eliminated cold start problem entirely
- 1GB memory limit (no more crashes)
- **Cost**: $5/month vs free tier

**Result**: 
- ✅ <100ms response times (vs 30-50s cold starts)
- ✅ 100% uptime since migration
- ✅ Zero memory-related crashes

### Uptime Monitoring

**Health Check System:**
- Cron job pings `/health` endpoint every 30 minutes
- Alert triggers if endpoint fails to respond
- Provides basic uptime monitoring without paid tools

**Why 30 minutes:**
- Railway doesn't sleep (no need for frequent pings)
- Frequent enough to catch issues quickly
- Reduces noise from transient failures

**Future improvement**: Migrate to proper monitoring (UptimeRobot, Better Uptime)

## 🏗️ Architecture