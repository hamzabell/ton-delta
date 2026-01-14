# 🎓 Financial Concepts: A Crash Course (ELI5)

Welcome to the **TΔ (TONDelta)** knowledge base. This guide explains the complex financial machinery behind our strategies in simple, human terms. We'll cover the basics, the "secret sauce" of our yield, and exactly what our robots ("Bots") do all day to make you money.

> **Note:** This platform focuses EXCLUSIVELY on "Delta Neutral" strategies. We do not gamble on whether prices go up or down. We only care about the _difference_ between prices.

---

## Part 1: The Core Vocabulary 📚

Before understanding the strategy, you need to know the words.

### 1. Delta (Δ)

- **What it is**: Exposure to price movement.
- **Delta-1**: Buying 1 TON. If price goes up $1, you make $1.
- **Delta-Neutral (Δ0)**: Your total exposure is zero. If price goes up $1, you make $0. Only yield matters.

### 2. Spot vs. Futures

- **Spot**: Buying the actual asset. You own 1 TON in your wallet.
- **Futures (Perpetuals)**: A contract betting on price. "I bet price will go down."
- **Dated Futures**: A contract betting on price at a _specific date_ (e.g., Dec 31st).

### 3. Funding Rate 💸

- **What it is**: The fee Longs pay Shorts to keep the perpetual price close to the spot price.
- **Why we care**: Since we are always **Short**, we are usually the ones **Getting Paid**.

### 4. Basis (The Gap) ↔️

- **What it is**: The price difference between Spot and Future.
- **Contango**: When Future price > Spot price. This is good for us. We sell the expensive Future and buy the cheap Spot.

---

## Part 2: The Strategies (Deep Dive) 🧠

### 1. Funding Arbitrage (The "Classic") 🏛️

_Target: 15-40% APY_

This is our bread and butter.

- **The Logic**:
  1.  Buy $1000 of TON (Spot).
  2.  Short $1000 of TON (Perp) on Binance.
  3.  **Net Exposure**: $0.
  4.  **Profit Source**: Every 8 hours, Binance pays you the Funding Fee (usually 0.01% - 0.1%).
- **The Bot's Job**:
  - **Monitor**: If TON price moons 🚀, your Short position loses Value. The bot must quickly move USDT collateral from your Spot wallet to Binance to prevent liquidation.
  - **Compound**: When the fee is paid, the bot uses it to open _more_ positions.

### 2. Spot-Future Basis (The "Fixed Income") 🔒

_Target: 5-15% Fixed APY_

This is for people who want guaranteed returns.

- **The Logic**:
  1.  Spot Price: $5.00.
  2.  December Future Price: $5.50 (trading at a premium).
  3.  **Action**: Buy Spot ($5.00) + Sell Future ($5.50).
  4.  **Result**: You instantly lock in that $0.50 profit. You just have to wait until December for the prices to converge.
- **The Bot's Job**:
  - **Execution**: Find the Future date with the biggest gap. Execute the trade.
  - **Hold**: Do nothing until expiry. It's boring, but profitable.

### 3. Delta-Neutral LP (Hedged Farming) 🚜

_Target: 30-60% APY_

Earning trading fees from DEXs without the risk.

- **The Logic**:
  1.  Provide TON/USDT liquidity on STON.fi.
  2.  Normally, if TON crashes, you lose money ("Impermanent Loss").
  3.  **Our Twist**: The Bot calculates exactly how much TON you hold in the pool and opens a matching **Short** on Binance.
- **The Bot's Job**:
  - **Dynamic Hedge**: As people trade against your pool, your TON amount changes. The bot adjusts the Short every minute to ensure you stay perfectly neutral.

### 4. Stable Gen (Lending) 🏦

_Target: 5-10% APY_

The safety net.

- **The Logic**: Lend USDT to degenerates who want to leverage trade.
- **The Bot's Job**: Automatically move funds between Aave, EVAA, and CEX Margin Lending to find the highest _safe_ interest rate.

---

## Part 3: The Fine-Grained Controls 🎛️

### 1. Leverage Exposure (1x - 3x)

- **ELI5**: turning up the volume.
  - **1x**: You use $100 to short $100. Safe.
  - **3x**: You borrow $200 extra to short $300 total. You earn 3x the funding fees, but if the bot fails to rebalance during a crash, you get wiped out.

### 2. Rebalance Threshold (0.5% - 5%)

- **ELI5**: How "OCD" is the bot?
  - **0.5% (Strict)**: If prices move even a tiny bit, fix the hedge. Costs more gas fees, but super safe.
  - **5.0% (Loose)**: Let prices swing wildly before fixing. Saves gas, but risky if market crashes 10% in one minute.

### 3. Stop Loss (1% - 20%)

- **ELI5**: The Eject Button.
  - If the "Total Portfolio Value" drops by this amount (due to slippage, fees, or hacks), the bot sells everything to USDT immediately.

---

## Part 4: Backend Architecture (For Devs) ⚙️

How to build this?

1.  **RebalanceWorker (Every 1 min)**:
    - Check `HealthFactor = Collateral / Debt`.
    - If `HealthFactor < Threshold`, triggers `RebalanceTx`.
2.  **FundingHarvester (Every 8 hours)**:
    - Listens for CEX `FundingFeePayment` event.
    - Logs `YieldEvent` in DB.
    - Executes `CompoundTx` (Buy Spot + Short More).
3.  **BasisMonitor (Hourly)**:
    - Scans Binance/Bybit for `(FuturePrice - SpotPrice) / TimeToExpiry`.
    - Alerts user if a "Juicy Basis" (>20% APY) is found.
