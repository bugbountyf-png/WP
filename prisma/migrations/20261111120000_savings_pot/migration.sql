-- Custom savings pots. paidBy and SavingsEntry.side store the pot id.
CREATE TABLE "SavingsPot" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsPot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavingsPot_weddingId_idx" ON "SavingsPot"("weddingId");

ALTER TABLE "SavingsPot" ADD CONSTRAINT "SavingsPot_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
