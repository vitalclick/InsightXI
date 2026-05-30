# AGENTS.md

# InsightXI — True Football Intelligence Platform

## Overview

InsightXI is a modern AI-powered football intelligence and analytics platform designed to provide deep football insights, statistical modeling, tactical analysis, historical trends, and explainable predictive analytics.

The platform is NOT a gambling or betting platform. Predictions are presented as statistical probabilities and football intelligence insights.

InsightXI combines:

* Football data aggregation
* AI-powered analytics
* Tactical intelligence
* Historical trend analysis
* Explainable match intelligence
* Real-time football data systems

---

# Core Philosophy

InsightXI exists to transform football data into actionable intelligence.

We do not optimize for:

* gambling promotion
* misleading certainty
* “sure wins”
* fake accuracy claims

We optimize for:

* transparency
* explainability
* statistical integrity
* football intelligence
* modern analytics

---

# Product Vision

To become the world’s leading AI-powered football intelligence platform.

---

# Primary Product Categories

## 1. Football Data Hub

Core football information infrastructure.

### Includes

* fixtures
* live scores
* match results
* league tables
* player statistics
* team statistics
* transfers
* injuries
* suspensions
* head-to-head records

---

## 2. Football Intelligence Engine

AI-powered analytics and predictive systems.

### Includes

* match intelligence
* confidence scoring
* tactical analysis
* lineup impact analysis
* fatigue analysis
* momentum analysis
* expected goals analysis
* explainable predictions

---

## 3. Historical Analytics Engine

Long-term football data intelligence.

### Includes

* seasonal comparisons
* historical trends
* historical team strength
* home vs away history
* manager performance history
* historical xG analysis

---

## 4. Tactical Intelligence Layer

Advanced football tactical interpretation.

### Includes

* formation analysis
* pressing analysis
* defensive structure
* attacking flow
* transition patterns
* tactical matchup compatibility

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* Framer Motion
* Zustand or Redux Toolkit
* React Query / TanStack Query

---

## Backend

* NestJS
* PostgreSQL
* Redis
* BullMQ
* Socket.IO

---

## AI Service

* Python
* FastAPI
* Scikit-learn
* XGBoost
* Pandas
* NumPy

---

## Infrastructure

* Vercel (frontend)
* Railway or Render (backend)
* Supabase or Neon (database)
* Cloudflare CDN
* Docker
* GitHub Actions CI/CD

---

# Architectural Principles

## 1. Modular Architecture

All services must be independently scalable.

---

## 2. API-First Development

Everything must expose clean APIs.

---

## 3. Real-Time By Design

Live football data is critical.

---

## 4. Explainability First

Predictions must include explainable reasoning.

Example:

* lineup advantage
* xG superiority
* fatigue disadvantage
* tactical mismatch

Never expose opaque predictions without reasoning.

---

## 5. Statistical Integrity

Never display:

* “100% guaranteed”
* “sure win”
* misleading confidence claims

All outputs must be probabilistic.

---

# Project Structure

## Frontend Structure

```txt
/apps/web
  /app
  /components
  /modules
  /services
  /hooks
  /store
  /styles
  /utils
```

---

## Backend Structure

```txt
/apps/api
  /modules
    /auth
    /matches
    /teams
    /players
    /analytics
    /predictions
    /statistics
    /subscriptions
    /notifications
```

---

## AI Service Structure

```txt
/apps/ai-service
  /models
  /training
  /inference
  /datasets
  /features
  /evaluation
```

---

# Core Platform Features

# Match Intelligence

## Includes

* predicted outcomes
* confidence scoring
* xG comparison
* tactical breakdown
* momentum analysis
* lineup analysis
* injury impact

---

# Team Intelligence

## Includes

* form analysis
* attack rating
* defense rating
* possession profile
* tactical style
* squad depth
* pressing intensity

---

# Historical Data

## Includes

* 5+ years historical results
* team trends
* historical H2H
* manager history
* league evolution
* seasonal comparisons

---

# Real-Time Features

## Includes

* live score updates
* live momentum
* live match intelligence
* live xG updates
* live event timeline

---

# Supported Prediction Markets

Predictions must remain analytical and statistically explainable.

## Supported Markets

* Home Win
* Away Win
* Draw
* Double Chance
* Over 1.5 Goals
* Under 4.5 Goals
* Both Teams To Score
* Team To Score
* Draw No Bet
* First Half Goal

---

# Confidence System

## Confidence Levels

| Level            | Range  |
| ---------------- | ------ |
| Medium           | 50–65% |
| Strong           | 66–79% |
| Very Strong      | 80–89% |
| Elite Confidence | 90%+   |

Avoid excessive use of 90%+ outputs.

---

# AI Modeling Principles

## Core Inputs

* xG
* xGA
* recent form
* home advantage
* lineup strength
* injuries
* suspensions
* fatigue
* travel distance
* tactical compatibility
* historical trends
* motivation analysis

---

## Core Models

* Poisson Models
* Elo Ratings
* Logistic Regression
* XGBoost
* Ensemble Models

---

# Explainable AI Standards

Every prediction should include machine-generated explanations.

## Example

```txt
Arsenal Win Probability Increased Due To:
- Stronger recent xG trend
- Opponent defensive injuries
- Better home form
- Tactical pressing advantage
```

---

# UX Philosophy

The platform must feel:

* premium
* intelligent
* modern
* data-rich
* trustworthy

It must NOT feel:

* spammy
* gambling-focused
* overloaded
* outdated

---

# UI Design Principles

## Use

* cards
* heatmaps
* charts
* tactical visuals
* momentum bars
* interactive graphs
* probability rings

## Avoid

* outdated tables
* flashing gambling aesthetics
* cluttered dashboards

---

# Branding

## Brand Name

InsightXI

## Tagline

True Football Intelligence Platform

---

# Tone & Voice

InsightXI communication must be:

* intelligent
* analytical
* professional
* football-native
* transparent

Avoid:

* hype language
* fake certainty
* gambling slang
* “banker”
* “sure odds”

---

# Subscription Model

## Free Users

* limited daily insights
* limited analytics
* limited historical access

## Premium Users

* deep analytics
* advanced AI insights
* tactical reports
* historical intelligence
* lineup intelligence
* advanced match analysis

---

# Performance Requirements

## Frontend

* Lighthouse 90+
* PWA installable
* mobile-first
* SSR optimized

---

## Backend

* scalable queues
* websocket support
* low-latency APIs

---

## AI

* daily retraining pipelines
* feature versioning
* model evaluation tracking

---

# Security Standards

* JWT authentication
* rate limiting
* DDoS protection
* secure API gateways
* encrypted secrets
* role-based access control

---

# Data Sources

## Potential Providers

* API-Football
* SportMonks
* Football-Data.org
* StatsBomb
* Opta (future)

---

# Future Expansion

## Potential Future Modules

* fantasy football intelligence
* player scouting
* recruitment analytics
* football media APIs
* tactical simulators
* live probability engine
* AI-generated match reports

---

# Coding Standards

## Frontend

* strict TypeScript
* reusable components
* server components where possible
* accessibility-first

---

## Backend

* modular NestJS architecture
* DTO validation
* service abstraction
* repository pattern

---

## AI Service

* reproducible training
* dataset versioning
* feature engineering pipelines
* explainability outputs

---

# Git Workflow

## Branch Naming

```txt
feature/
fix/
refactor/
hotfix/
```

---

## Commit Convention

```txt
feat:
fix:
refactor:
docs:
test:
```

---

# CI/CD

## Required Checks

* linting
* type safety
* tests
* build verification

---

# Testing Strategy

## Frontend

* Playwright
* Jest

## Backend

* Jest
* Supertest

## AI

* evaluation metrics
* prediction drift monitoring

---

# Non-Negotiable Rules

## Never

* fake prediction accuracy
* display “guaranteed wins”
* fabricate statistics
* manipulate historical performance

## Always

* prioritize explainability
* prioritize transparency
* prioritize statistical integrity

---

# Mission Statement

InsightXI transforms football data into intelligent, explainable, and actionable football insights powered by modern analytics and AI.
