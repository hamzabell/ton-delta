-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "walletAddress" TEXT,
    "isFoundingMember" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "currentApy" DOUBLE PRECISION NOT NULL,
    "tvl" DOUBLE PRECISION NOT NULL,
    "fromAsset" TEXT,
    "toAsset" TEXT,
    "cexSymbol" TEXT,
    "futureSymbol" TEXT,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "txHash" TEXT,
    "fromAsset" TEXT,
    "toAsset" TEXT,
    "amount" DOUBLE PRECISION,
    "basisCaptured" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION DEFAULT 0,
    "feesPaid" DOUBLE PRECISION DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "stasisPreference" TEXT NOT NULL DEFAULT 'CASH',
    "vaultAddress" TEXT NOT NULL,
    "spotAmount" DOUBLE PRECISION NOT NULL,
    "perpAmount" DOUBLE PRECISION NOT NULL,
    "spotValue" DOUBLE PRECISION NOT NULL,
    "perpValue" DOUBLE PRECISION NOT NULL,
    "totalEquity" DOUBLE PRECISION NOT NULL,
    "principalFloor" DOUBLE PRECISION NOT NULL,
    "maxLossPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "fundingRate" DOUBLE PRECISION NOT NULL,
    "driftCoefficient" DOUBLE PRECISION NOT NULL,
    "delegationExpiry" TIMESTAMP(3),
    "delegationDuration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRebalanced" TIMESTAMP(3),
    "exitTxHash" TEXT,
    "entryTxHash" TEXT,
    "spotTxHash" TEXT,
    "stormTxHash" TEXT,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingEvent" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionId" TEXT NOT NULL,

    CONSTRAINT "FundingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" TEXT NOT NULL,
    "errorStack" TEXT,
    "itemsProcessed" INTEGER,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTvl" DOUBLE PRECISION NOT NULL,
    "blendedApy" DOUBLE PRECISION NOT NULL,
    "activeStrategies" INTEGER NOT NULL,
    "activePositions" INTEGER NOT NULL,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "positionId" TEXT,
    "details" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_level_idx" ON "AuditLog"("level");

-- CreateIndex
CREATE INDEX "AuditLog_component_idx" ON "AuditLog"("component");

-- CreateIndex
CREATE INDEX "AuditLog_positionId_idx" ON "AuditLog"("positionId");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingEvent" ADD CONSTRAINT "FundingEvent_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
