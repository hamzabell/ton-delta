# Strategy Mechanics & Bot Logic (Pure Delta Neutral)

This document defines the "Engine" logic for each **Delta-Neutral Strategy Type** available in the TΔ (TONDelta) application. These strategies focus _exclusively_ on generating yield without exposure to the price volatility of the underlying asset.

---

## 1. Funding Arbitrage (The Classic)

_Target Yield: 10% - 40% APY_

### **Concept**

Exploits the "Funding Rate" mechanism. When the market is bullish, Longs pay Shorts.

- **Action**: Buy Spot Asset (Long) + Sell Perpetual Contract (Short).
- **Result**: Net Zero Price Exposure. You collect the Funding Fee payment every 8 hours.

### **Bot Actions**

1.  **Entry**: Atomic execution of Buy Spot + Short Perp (1:1 ratio).
2.  **Rebalance**: Monitors price 24/7. If Spot price rises, collateral is moved to the Short side to maintain health.
3.  **Harvest**: Auto-compounds funding fees into the position.

---

## 2. Spot-Future Basis (Fixed Term)

_Target Yield: 5% - 15% APY (Fixed)_

### **Concept**

Exploits the price difference between Spot and a **Dated Future** (e.g., Quarterly Futures). Futures often trade at a premium (Contango).

- **Action**: Buy Spot + Sell Dated Future.
- **Result**: You lock in the price difference immediately. As the Future gets closer to expiration, its price converges with Spot. You capture that "Basis" as profit.

### **Bot Actions**

1.  **Entry**: Identify the Date Future with the highest premium. Execute spread.
2.  **Hold**: Simply hold until expiry or until the gap closes significantly.
3.  **Exit**: Close both positions to realize the locked profit.

---

## 3. Delta-Neutral LP (Hedged Farming)

_Target Yield: 20% - 60% APY_

### **Concept**

Providing liquidity to a DEX (like STON.fi) to earn trading fees, but removing the "Impermanent Loss" risk by hedging.

- **Action**: Provide Liquidity (e.g., TON/USDT) + Open Short on TON (to cover the TON inventory in the LP).
- **Result**: You earn trading fees from the DEX, but you don't care if TON goes up or down.

### **Bot Actions**

1.  **Entry**: Supply LP. Calculate "Delta" (how much TON exposure you have). Short that exact amount on CEX.
2.  **Dynamic Hedge**: As the LP pool changes ratio (due to price moves), the bot adjusts the Short position size to stay perfectly neutral.

---

## 4. Stable Gen (Lending)

_Target Yield: 3% - 10% APY_

### **Concept**

The safest baseline. Lending stablecoins (USDT) to margin traders who want to bet on the market.

- **Action**: Supply USDT to Lending Protocols (EVAA) or CEX Margin Funding.
- **Result**: Low risk interest paid by borrowers.

### **Bot Actions**

1.  **Rate Optimization**: Bot scans available lending pools (DeFi & CEX).
2.  **Auto-Rotate**: Moves funds to the pool offering the highest _safe_ yield.
