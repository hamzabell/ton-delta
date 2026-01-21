# Product Requirements & Architecture Document: Pamelo.finance

## 1. Executive Summary

**Pamelo.finance** is an institutional-grade "refining" protocol for the TON ecosystem, designed to convert retail liquidity from high-volatility assets into stable, delta-neutral yield. By utilizing a **Cash-and-Carry (Basis Trading)** model, the protocol extracts Funding Rate yields while neutralizing underlying price risk through a tri-pillar integration of Storm Trade, swap.coffee, and STON.fi.

---

## 2. Core Mechanism & Mathematical Framework

The protocol's primary objective is to exploit the price difference (Basis) between the spot market and the perpetual futures market.

- **Basis Formula ():** Defined as . In bullish "contango" markets, , resulting in a positive funding rate paid to short-sellers.

- **Delta-Neutral Identity:** To eliminate price sensitivity (), the protocol ensures the quantity of spot assets () matches the quantity of perpetual short contracts ().

- **Total Equity Calculation ():** Sum of the Spot Value () and the Perpetual Equity ():

.

---

## 3. Technical Architecture (Next.js & Redis)

The implementation replaces legacy n8n automation with a robust **Next.js** backend and **Redis-backed** task queues (e.g., BullMQ) to handle high-frequency monitoring and atomic execution.

### 3.1 The Watchman Engine (Redis Integration)

The "Watchman" is a background worker architecture that monitors the following metrics every block:

- **Drift Monitoring:** Calculates the Drift Coefficient to trigger rebalancing if the spot and perp legs become imbalanced.

- **Funding Rate Tracking:** Monitors the 24-hour Exponential Moving Average () of the funding rate ().

- **Safety Polling:** Continuously compares current Total Equity () against the Principal Floor ().

### 3.2 Integration Stack

| Pillar        | Provider        | Role in Architecture                                     |
| ------------- | --------------- | -------------------------------------------------------- |
| **Execution** | **swap.coffee** | Smart router for spot entries () and emergency exits (). |

|
| **Hedging** | **Storm Trade** | Liquidity source for 1x leverage perpetual short positions ().

|
| **Productivity** | **STON.fi** | Vault infrastructure for liquid staking rewards during Stasis Mode.

|

---

## 4. Safety & Operational Modes

### 4.1 Stasis Mode (Negative Carry Protection)

When markets enter backwardation () and , the Redis worker triggers an atomic sequence to prevent "negative carry":

1.  **De-leveraging:** Close the Storm Trade short position.

2.  **Liquidation:** Sell the spot asset via swap.coffee into TON.

3.  **Migration:** Deposit 100% of recovered TON into STON.fi liquid staking to earn yield until market conditions improve.

### 4.2 Max Loss Circuit Breaker

Designed to prevent capital destruction during "black swan" events or oracle lags.

- **Principal Floor ():** A hard floor typically set at of initial capital ().

- **Atomic Unwind:** If , the system executes an immediate market exit: cancels pending orders, market-closes the Storm short, and executes a spot sale via swap.coffee.

---

## 5. Implementation Requirements

- **Framework:** Next.js (App Router) for the dashboard and API routes.
- **State Store:** Redis for caching real-time price feeds, funding rates, and tracking the .
- **Task Scheduling:** BullMQ or similar for managing the "Watchman" heartbeat and executing atomic sequences across multiple protocols.
- **Security:** Non-custodial framework ensuring all trades and migrations are signed via the user’s TON wallet.
