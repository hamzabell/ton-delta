Here is the comprehensive **Product Requirements Document (PRD)** for the full **Neutron** application.

This document expands beyond the Landing Page into the core application logic, backend services, and social modules required for the MVP.

---

# **Product Requirements Document: Neutron App (MVP)**

**Version:** 1.0
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

1. **Auth & Wallet Module:** Handles Telegram Login + TON Wallet Connection.
2. **Vault Module:** The core investing engine (Deposit/Withdraw/Swap).
3. **Social Module:** Leaderboards, Strategy Creation, and Referral loops.
4. **Portfolio Module:** Real-time PnL tracking and history.
5. **Admin Module:** Risk management and emergency stops.

---

## **2. Detailed Feature Modules & User Stories**

### **Module A: Auth & Onboarding (The "Zero Friction" Flow)**

**Goal:** Convert a Telegram user into a Neutron user in < 10 seconds.

- **Tech:** `@telegram-apps/sdk`, `@tonconnect/ui-react`.
- **Logic:**

1. App launches -> Checks `initData` (Telegram ID).
2. Checks DB: Does User exist?

- _No:_ Create User via Prisma.
- _Yes:_ Load Dashboard.

3. **Wallet Connection:** Users can browse the app _without_ connecting a wallet. Connection is only required to **Deposit**.

**User Stories:**

> **Story 1:** _As a new user, I want to see the app immediately without creating a password, so I don't churn._
> **Story 2:** _As a security-conscious user, I want to connect my Tonkeeper wallet only when I decide to invest, so I feel safe exploring first._

### **Module B: The Vault (Investment Engine)**

**Goal:** Abstract complex arbitrage into "One Click."

- **UI Components:** Base UI `<Tabs>` (Invest / Withdraw), Base UI `<Slider>` (Amount), Base UI `<Dialog>` (Confirmation).
- **Tech:** STON.fi SDK (Spot Buy), CCXT (Hedge Short).

**Features:**

- **Strategy Selector:** A carousel of "Vaults" (e.g., DOGE Vault, TON Vault).
- **Smart Deposit:**
- User sends USDT to the Neutron Smart Contract.
- **Backend Worker** detects the deposit via Webhook.
- **Action:** Swaps 50% to Spot Asset (STON.fi) + Shorts 50% on Binance.

- **Withdrawal:**
- User requests withdrawal (e.g., "Withdraw $500").
- **Backend:** Unwinds position (Sells Spot + Closes Short).
- **Settlement:** Sends USDT back to User's Wallet.

**User Stories:**

> **Story 3:** _As a user, I want to see the "Projected APY" based on last week's data before I deposit, so I know if it's worth it._
> **Story 4:** _As a user, I want to withdraw my funds instantly (minus gas fees) without a lockup period, so I feel in control._

### **Module C: Social & Leaderboard**

**Goal:** Create FOMO and Trust through social proof.

- **Logic:**
- **Leaderboard:** Ranks available strategies by **7-Day Yield**.
- **"Copiers" Count:** Shows how many users have deposited into this vault.
- **Strategy Creator (Supply Side):** A form for Pro Traders to submit new strategy ideas (Asset + Exchange + Leverage). _Note: For MVP, this is an application form, not automated._

**User Stories:**

> **Story 5:** _As a beginner, I want to sort strategies by "Lowest Risk" so I can start safely._
> **Story 6:** _As a pro trader, I want to apply to build a strategy so I can earn the 10% Creator Fee._

### **Module D: Portfolio & Transparency**

**Goal:** Prove the "House Edge" narrative.

- **Features:**
- **Live PnL:** Shows "Yield Earned" distinct from "Principal."
- **Proof of Reserves:** A terminal-style view showing the live balance on STON.fi vs. Binance.
- **Transaction History:** Every Funding Fee payment is logged as a "Dividend."

**User Stories:**

> **Story 7:** _As a skeptic, I want to click a button and see the actual on-chain transaction where you bought the DOGE, so I know you aren't lying._

---

## **3. Backend Architecture (The "Engine")**

The backend is split into **API** (Next.js) and **Worker** (Node.js).

### **A. Database Schema (Prisma)**

This schema is designed for high-frequency updates (funding rates) and user tracking.

```prisma
// schema.prisma

model User {
  id             String   @id @default(uuid())
  telegramId     BigInt   @unique
  username       String?
  walletAddress  String?
  isFoundingMember Boolean @default(false)
  referralCode   String   @unique
  referredBy     String?  // ID of the referrer

  deposits       Deposit[]
  positions      Position[]
}

model Strategy {
  id             String   @id @default(uuid())
  ticker         String   // "DOGE"
  name           String   // "DOGE Crusher"
  riskLevel      String   // "High", "Low"

  // Real-time Data
  currentApy     Float    // Updated every 8 hours
  tvl            Float    // Total Value Locked

  // Configuration
  stonfiPool     String   // Address
  cexSymbol      String   // "DOGE/USDT:USDT"
}

model Position {
  id        String   @id @default(uuid())
  userId    String
  strategyId String

  principal Float    // Initial Deposit
  shares    Float    // LP Tokens owned

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model FundingEvent {
  id          String   @id @default(uuid())
  strategyId  String
  amount      Float    // Amount earned in USDT
  timestamp   DateTime @default(now())
}

```

### **B. Background Workers (The "Brains")**

You need a separate Node.js process (using `BullMQ`) to handle these jobs:

1. **`FundingHarvester` Job (Every 8 Hours):**

- Checks Binance for realized funding fees.
- Updates the `Strategy` model's `currentApy`.
- Logically "re-invests" the profit into the pool (Auto-Compound).

2. **`RiskManager` Job (Every 1 Minute):**

- Checks the difference between Spot Price (STON.fi) and Futures Price (Binance).
- If the gap widens too much (Liquidation Risk), it moves USDT collateral from the Smart Contract to Binance.

3. **`DepositProcessor` Job (Event Listener):**

- Listens for `Deposit` events on the TON Smart Contract.
- Triggers the "Swap + Short" execution.

---

## **4. UI/UX Specifications (Next.js + Base UI)**

**Theme:** "Cyber-Institutional"

- **Backgrounds:** `bg-slate-950` (Almost Black).
- **Accents:** `text-emerald-400` (Profit), `text-rose-500` (Risk), `border-slate-800` (Separators).
- **Typography:** `Geist Mono` (or similar monospace) for numbers; `Inter` for text.

### **Component Implementation (Base UI)**

We use **Base UI** for accessibility and behavior, styled with Tailwind.

- **Tabs (Invest/Withdraw):**

```jsx
import { Tabs } from "@base-ui-components/react/tabs";

<Tabs.Root defaultValue="invest" className="w-full">
  <Tabs.List className="flex bg-slate-900 rounded-lg p-1">
    <Tabs.Trigger
      value="invest"
      className="flex-1 py-2 rounded-md data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400 transition-colors"
    >
      Invest
    </Tabs.Trigger>
    <Tabs.Trigger
      value="withdraw"
      className="flex-1 py-2 rounded-md data-[state=active]:bg-slate-800 transition-colors"
    >
      Withdraw
    </Tabs.Trigger>
  </Tabs.List>
  {/* Content */}
</Tabs.Root>;
```

- **Slider (Amount Input):**
- Use `<Slider.Root>` styled with a neon green track.
- Add haptic feedback `onChange`.

- **Bottom Sheet (Navigation):**
- Since Base UI doesn't have a native "Drawer" yet, use **Vaul** (built on Radix, compatible with this stack) or standard `Dialog` fixed to bottom with Framer Motion.

---

## **5. Safety & Trust Features (The "Un-Casino")**

To reinforce the narrative, these features must be prominent:

1. **"Smart Pause" Indicator:**

- If funding rates go negative, the UI shows a "Paused" badge on the Strategy.
- _Tooltip:_ "Market conditions unfavorable. Funds moved to USDT safety."

2. **Gas Fee Disclaimer:**

- Under every "Withdraw" button, small text: _"0% Neutron Fee. Estimated Gas: ~0.05 TON."_

---

## **6. Development Phase Plan**

**Phase 1: The "Smoke" (Current Priority)**

- Build the **Landing Page** (Next.js).
- Implement **Telegram Auth**.
- Database: Save Users + Waitlist position.

**Phase 2: The "Core" (Internal Alpha)**

- Set up **STON.fi SDK** script to swap dummy funds on Mainnet.
- Connect **CCXT** to Binance Testnet.
- Build the **Dashboard UI** with dummy data to test UX.

**Phase 3: The "MVP" (Founding Members)**

- Deploy Smart Contract (Tact).
- Enable Real Deposits (Capped at $100/user).
- Run the "FundingHarvester" manually to ensure accuracy.

This PRD provides the complete roadmap from "Marketing Test" to "Working Financial Product."
