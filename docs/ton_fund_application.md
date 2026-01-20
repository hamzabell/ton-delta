# TONcoin Fund Application: Pamelo.finance

## 1. Executive Summary

**Project Name:** Pamelo.finance
**One-liner:** Delegated high-yield asset management on USDT-based TON native pairs via Non-Custodial Account Abstraction.

**Problem:**
DeFi participants on TON face "double volatility" (asset price + TON price) and complex risk management when seeking high yields. Existing yield aggregators often lack transparent risk guardrails or require active manual management.

**Solution:**
Pamelo.finance provides a professional, "set-and-forget" DeFi experience. By focusing exclusively on **USDT pairs**, we eliminate base currency volatility. Using **TON W5 Account Abstraction**, we enable non-custodial delegated trading where users retain ownership of assets while "Pamelo" executes strategies within predefined safety boundaries (Max Loss, Duration).

---

## 2. Technical Architecture & Innovation

Pamelo.finance is built as a Non-Custodial AA system leveraging **TON W5**.

- **Non-Custodial Delegation:** Assets stay in the user's W5 wallet. Execution is delegated to Pamelo's backend via restricted **Session Keys**.
- **Safety Guardrails:** Smart contract-level constraints prevent unauthorized withdrawals and enforce user-defined Max Loss thresholds.
- **Deep Integration:** Native execution using:
  - **swap.coffee:** For optimal routing on TON spot markets (USDT/TON, USDT/NOT, etc.).
  - **Storm Trade:** For delta-neutral strategies and carry trade execution.
- **Platform Sync:** A seamless Telegram Mini App (TMA) interface for one-click deployment and monitoring.

---

## 3. Market Alignment & Opportunity

The TON ecosystem is experiencing a massive influx of USDT liquidity. Pamelo.finance is positioned to be the primary yield destination for this Liquidity:

- **USDT Focus:** Reduces the exit barrier for conservative capital entering TON.
- **Meme Growth:** Captures high-velocity volume in pairs like USDT/DOGS and USDT/NOT while providing a "Loss Safeguard" for retail users.
- **Performance-First Model:** 20% performance fee aligns platform incentives directly with user profitability.

---

## 4. Business Model & Sustainability

- **Revenue:** 20% Performance Fee on net profits.
- **Settlement:** Atomic profit-sharing ensures the platform only collects fees when the user wins.
- **Scalability:** The architecture allows for "Strategy Multipliers" where proven traders or bots can list strategies on the Pamelo SDK.

---

## 5. Roadmap & Milestones

- **Phase 1 (Current):** USDT Transition & Rebranding. Finalizing USDT-centric dashboard and W5 deployment flow.
- **Phase 2:** Advanced Guardrails. Implementation of dynamic USDT-denominated Max Loss validation.
- **Phase 3:** Mainnet Launch & Performance Settlement. Scaling to full non-custodial delegated execution with atomic profit sharing.

---

## 6. Team & Vision

The team behind Pamelo.finance consists of experienced TON developers and DeFi architects focused on bringing institutional-grade risk management to TON retail users. Our vision is to become the "Standard Oil" for TON liquidity — the essential refiner that turns raw assets into safe, optimized yield.

---

## 7. Metrics & Traction

- [Insert current TVL/User metrics if available]
- [Insert Testnet performance data if available]

---

**Link to Docs:** [Requirements](file:///Users/apple/Documents/ton-delta/docs/requirements.md)
**GitHub:** [ton-delta Repository](https://github.com/hamzabell/ton-delta)
