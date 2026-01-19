Here is the comprehensive **Product Requirements Document (PRD)** for the full **Neutron** application.

This document expands beyond the Landing Page into the core application logic, backend services, and social modules required for the MVP.

---

# **Product Requirements Document: Ton Delta App (MVP)**

**Version:** 1.1
**Platform:** Telegram Mini App (TMA)
**Stack:** Next.js 14, Base UI (Headless), Tailwind CSS, Prisma, PostgreSQL, Redis, STON.fi SDK.
**Core Objective:** Democratize delta-neutral carry trading via a trusted, transparent, and social interface.

---

## **1. Application Architecture**

The app is built as a **Hybrid-DeFi** system.

- **User Interface:** Lives entirely inside Telegram (Mini App).
- **Custody:** Hybrid.
- _Spot Assets:_ Non-custodial (Smart Contract interacting with STON.fi).
- _Hedge Assets:_ Custodial (API-managed Sub-accounts on Binance/Bybit).

- **Trust Layer:** "Proof of Reserves" Dashboard (Real-time verification).

### **Module Breakdown**

1. **Auth & Wallet Module:** Handles Telegram Login + TON Wallet Connection. [IMPLEMENTED]
2. **Opportunities Module:** Live funding rates across TON ecosystem pairs. [IMPLEMENTED]
3. **Portfolio Module:** Real-time PnL tracking and position management. [IMPLEMENTED]
4. **Transparency Module:** Real-time verification of delta-neutral yields and Proof of Reserves. [IMPLEMENTED]
5. **Vault Module:** (In Progress) The core investing engine (Deposit/Withdraw/Swap).
6. **Social Module:** (Planned) Leaderboards, Strategy Creation, and Referral loops.
7. **Admin Module:** (In Progress) Risk management and emergency stops.

---

## **2. Detailed Feature Modules & User Stories**

### **Module A: Auth & Onboarding (The "Zero Friction" Flow)**

**Goal:** Convert a Telegram user into a Ton Delta user in < 10 seconds.

- **Status:** IMPLEMENTED
- **Tech:** `@telegram-apps/sdk`, `@tonconnect/ui-react`.

### **Module B: Opportunities (Market Intel)**

**Goal:** Provide real-time data on the best funding rate opportunities.

- **Status:** IMPLEMENTED
- **UI:** `/dashboard` showing live pairs (TON/USDT, TON/BTC, etc.) with annualized yields.

### **Module C: Portfolio & Transparency**

**Goal:** Prove the "House Edge" narrative and show personal PnL.

- **Status:** IMPLEMENTED
- **Features:**
  - Live PnL tracking in `/dashboard/portfolio`.
  - Historical Basis Yield charts in `/dashboard/transparency`.
  - Real-time APR display.

### **Module D: The Vault (Investment Engine)**

**Goal:** Abstract complex arbitrage into "One Click."

- **Status:** IN PROGRESS
- **UI Components:** Base UI `<Tabs>` (Invest / Withdraw), Base UI `<Slider>` (Amount).
- **Tech:** STON.fi SDK (Spot Buy), CCXT (Hedge Short).

---

## **6. Development Phase Plan**

**Phase 1: The "Smoke" (Completed)**

- Build the **Landing Page**.
- Implement **Telegram Auth**.
- Database: Save Users.

**Phase 2: The "Core" (Current Priority)**

- **UI Implementation:** Dashboard, Portfolio, and Transparency pages finished.
- **Backend Infrastructure:** Workers for Funding, Risk, and Deposits in place.
- **Next Step:** Finalize the "One-Click" execution for Vault deposits.

**Phase 3: The "MVP" (Upcoming)**

- Deploy Smart Contract (Tact).
- Enable Real Deposits.
- Public launch for Founding Members.
