-- Custom budget categories. BudgetItem, Vendor, and Research.category store the category id.
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BudgetCategory_weddingId_idx" ON "BudgetCategory"("weddingId");

ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
