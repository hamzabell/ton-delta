# **Product Requirements Document: Pamelo.finance (V1.3)**

**Version:** 1.3
**Platform:** Telegram Mini App (TMA)
**Stack:** Next.js 16 (Turbopack), Tailwind CSS, Prisma, PostgreSQL, Redis, swap.coffee SDK, Storm Trade SDK.
**Core Objective:** Delegated high-yield asset management on USDT-based TON native pairs and meme coins via Non-Custodial AA.

---

## **1. Core Value Proposition**

Pamelo.finance provides a professional, sleek DeFi experience for automated yield generation. By focusing on **USDT pairs**, the platform reduces "double volatility" and simplifies risk calculations for the user.

- **Focus:** TON Ecosystem Native Pairs (e.g., USDT/TON, USDT/DOGS, USDT/NOT, USDT/REDO).
- **Control:** Users predefine Max Loss and Delegation Duration.
- **Monetization:** 20% Performance Fee (Platform only profits when the user does).

---

## **2. Application Architecture**

The app is built as a **Non-Custodial AA** system using **TON W5**.

- **User Wallet:** TON W5 (Account Abstraction) Wallet.
- **Custody:** Non-Custodial. Assets stay in the user's W5 wallet.
- **Execution:** Delegated to Pamelo Backend via restricted Session Keys.
- **Execution Engine:** Atomic swaps/positions via swap.coffee (Spot) and Storm Trade (Futures).

---

## **3. Detailed Feature Modules**

### **Module A: Onboarding & AA Deployment**

- User connects personal wallet.
- User deploys a personal W5 "Pamelo Account".
- User funds the account with USDT/TON.

### **Module B: Strategy & Session Authorization**

- **Trigger:** Initiated upon first investment.
- **Parameters:**
  - **Strategy Type:** Stable (Low-Risk) vs. Meme (High-Reward).
  - **Loss Safeguard:** User-defined threshold (e.g., 50 USDT).
  - **Duration:** Session length (1h, 24h, 7d, 30d, 1y).

### **Module C: Automated Basis Execution**

- Backend manages delta-neutral or carry positions autonomously.
- Smart contract guardrails prevent unauthorized withdrawals or loss-threshold violations.

### **Module D: Trust-Based Profit Sharing**

- **Mechanism:** 20% Withdrawal Fee on net profits.
- Atomic settlement: 80% profit + Principal -> User; 20% profit -> Platform.

---

## **4. User Interface & Screen Functionalities**

### **A. Yields (The "Spectrum of Choice")**

- **Toggle:** "Stable" (USDT/TON) vs. "Meme" (USDT/DOGS, USDT/NOT, USDT/REDO).
- **Pairs:** Exclusively USDT-denominated for clear tracking.
- **AA Status:** Persistent visual indicator of account health and session status.

### **B. Portfolio**

- **Balance:** Total Net Equity (USD) + Gross Yield tracking.
- **Account Control:** Manage W5 deployment and Session guardrails.
- **Positions:** Live view of active delegated strategies with "Redeem" (Exit) functionality.

### **C. Audit (System Health)**

- **Solvency:** Real-time proof of delta-neutrality/insurance.
- **Transparency:** Open ledger of performance fee distributions.

---

## **5. Technical Phase Plan**

**Phase 1: Rebranding & USDT Transition (Current)**

- Update name, icon (🍈), and metadata.
- Refactor dashboard to USDT-centric pairs and "Spectrum Toggle".

**Phase 2: Advanced Guardrails**

- Implement dynamic Max Loss validation based on USDT equity.

**Phase 3: Performance Settlement**

- Deploy the atomic profit-sharing smart contract logic.
