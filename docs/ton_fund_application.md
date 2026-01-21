# pamelo.finance

**Non-custodial Basis Trading architecture for USDT-native yield on TON, powered by W5 Account Abstraction.**

---

### Executive Summary

**Project:** pamelo.finance  
**Stage:** Pre-Seed / Technical Prototype  
**Founder:** [Akan Bassey](https://www.linkedin.com/in/akan-bassey-708941171/) (Senior Software Engineer @ EarlyNode)

**The Problem:** Earning predictable yield on TON is difficult. Liquid staking offers low returns (~4%) and exposes users to TON price volatility. Manual yield farming is complex and time-consuming.

**The Solution:** I am building the first automated **Basis Trading** (Cash and Carry) protocol on TON. Using TON W5 Account Abstraction, I enable users to execute multi-leg market-neutral strategies that capture high funding rates while keeping their principal 100% non-custodial.

---

### Core Strategy: Delta-Neutral Basis Trading

Pamelo automates the "Basis Trade" to generate consistent yield regardless of market direction:

1.  **The Long Leg:** A 1x spot position in a TON-native asset (e.g., TON, NOT, DOGS) using **swap.coffee**.
2.  **The Short Leg:** A simultaneous 1x short perpetual position on **Storm Trade**.
3.  **The Result:** A **Delta-Neutral** position with zero exposure to asset price volatility. The yield is generated directly from the **Funding Rate** spread between the spot and perpetual markets—historically one of the most reliable yield sources in crypto.

---

### The Competitive Advantage

- **Yield Stability:** Unlike traditional farming, we provide USDT-denominated returns. If TON price drops 20%, the user's principal remains stable.
- **Non-Custodial W5 Delegation:** This is our core innovation. I use **W5 Session Keys** so users don't "deposit" funds into a custodial vault. Instead, they delegate trading authority to my execution engine with strict on-chain guardrails (Max Loss, Daily Budget).
- **Trustless Architecture:** Every step—from opening the hedge to profit settlement—is verifiable through a real-time Audit Ledger.

---

### Technical Infrastructure

- **Account Abstraction:** Full W5 standard integration for restricted session delegation.
- **DEX Aggregation:** **swap.coffee** for optimized spot entry/exit with minimal slippage.
- **Derivatives Layer:** **Storm Trade** for high-efficiency hedging and funding rate capture.
- **Atomic Profit Split:** Protocol-level 20% performance fee settlement—no profit, no fee.

---

### Market Opportunity

With over **$1B in native USDT** now on TON, there is a massive demand for stablecoin-denominated yield. Pamelo acts as the "Institutional Refiner" for this liquidity, turning raw assets into low-risk, sovereign yield.

---

### Founder

I am a Senior Software Engineer with a focus on high-performance crypto trading infrastructure.

- **Experience:** I spearheaded the development of the web interface for **Bananagun**, a leading crypto trading platform. I have a proven track record of building reliable, high-velocity systems at **EarlyNode** and **Sterling Bank**.
- **Vision:** My goal is to normalize professional-grade, non-custodial asset management on TON.

