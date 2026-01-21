# 🍈 pamelo.finance: Product Requirements Document & Investor Pitch

**The Vision:** To become the "Institutional Refiner" for TON’s retail volatility. We convert high-risk meme coin movements into low-risk, TON-denominated yield for 900M+ Telegram users.

**The Problem:**

- **Retail Burn:** Meme coin season (DOGS, NOT, REDO) creates massive hype, but retail users lose capital to 50% price corrections.
- **Yield Gap:** TON holders have few ways to earn high yield without being "Long" on volatile assets.
- **Complexity:** Professional "Basis Trading" (Cash & Carry) is currently only available to hedge funds and sophisticated bots.

**The Solution:** Pamelo is a **Non-Custodial Basis Trading Protocol**. Using **TON W5 Account Abstraction**, we automate a delta-neutral strategy that harvests "Funding Rates" from meme coin speculators. Users earn institutional-grade yield while maintaining zero exposure to asset price crashes.

---

# 📊 Business Model & Monetization

Pamelo operates on a **Pure Success Model**. We do not charge management fees or entry/exit fees. We only win when the user wins.

- **Performance Fee:** **20%** of net yield generated during the 7-day session.
- **User Share:** **80%** of net yield.
- **Settlement:** Fees are automatically calculated and deducted at the end of the session or upon early redemption via smart contract.

---

# 🛠️ Product Requirements Document (PRD) v2.1

## 1. Technical Architecture: The "Pure TON" Meme Loop

### **Core Execution Logic (End-to-End)**

For a user investing **1,000 TON** into a **$DOGS** strategy:

1. **Onboarding:** User deploys a **W5 Pamelo Account** and signs a **7-day Session Key**.
2. **The Atomic Open (The "Brain"):**
   - The Backend splits the 1,000 TON.
   - **Long Leg:** Swaps **490 TON** for **$DOGS** via **swap.coffee**.
   - **Short Leg:** Uses **510 TON** as collateral on **Storm Trade** to open a **1x Short** on $DOGS/TON.
   - _Note: Using TON-native pairs avoids USDT slippage._

3. **Real-Time Balancing (The "Watchman"):**
   - **n8n** monitors the **Delta**. If $DOGS price moves ±2%, the values of the Long and Short legs become unequal.
   - n8n triggers a **Rebalance Webhook**. The backend sells or buys small amounts of $DOGS Spot to re-center the hedge to a perfect 1:1 ratio.

4. **Max Loss Guardrail:**
   - User sets a **100 TON Max Loss**.
   - If total equity (Spot + Short) drops to 901 TON, n8n triggers an **Emergency Liquidator**. All positions are market-sold back to native TON instantly.

## 2. Technical Stack

- **Frontend:** Next.js 16 (Turbopack), Tailwind CSS, TON Connect 2.0.
- **Automation:** **n8n** (Self-hosted) for monitoring, rebalancing triggers, and audit logging.
- **Execution:** Node.js Backend with **W5 Session Key** support.
- **DeFi Layer:** swap.coffee SDK (Spot) & Storm Trade SDK (Perps).
- **Database:** PostgreSQL (User states) & Redis (Real-time price/funding feeds).

---

# 📈 User Stories

| ID       | Feature           | User Story                                                                                                   |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **US.1** | **W5 Deployment** | As a user, I want to deploy a W5 wallet in one click so I don't have to manage complex contract deployments. |
| **US.2** | **Yield Toggle**  | As a user, I want to see a "Hot List" of meme coin APRs so I can choose the most profitable farm.            |
| **US.3** | **Transparency**  | As a user, I want to see a live "Audit Ledger" of every rebalance made by n8n so I know my funds are safe.   |
| **US.4** | **Panic Exit**    | As a user, I want a "Panic Button" to close all positions and return to TON in under 10 seconds.             |
