-- CreateTable
CREATE TABLE "House" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "mobile" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "propertyStatus" TEXT NOT NULL,
    "maintenanceApplicable" BOOLEAN NOT NULL DEFAULT true,
    "monthlyMaintenance" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "houseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "houseId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'Cash',
    "txn" TEXT NOT NULL DEFAULT '',
    "remarks" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'Regular',
    "advanceMonths" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'Cash',
    "vendor" TEXT NOT NULL DEFAULT '',
    "remarks" TEXT NOT NULL DEFAULT '',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringStart" TEXT NOT NULL DEFAULT '',
    "recurringEnd" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RwaMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "houseFlat" TEXT NOT NULL DEFAULT '',
    "designation" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "dob" TEXT NOT NULL DEFAULT '',
    "idProofType" TEXT NOT NULL DEFAULT 'Aadhaar',
    "idProofNumber" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Renter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "houseFlat" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 0,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "phone" TEXT NOT NULL DEFAULT '',
    "familyCount" INTEGER NOT NULL DEFAULT 1,
    "familyMembers" TEXT NOT NULL DEFAULT '[]',
    "moveInDate" TEXT NOT NULL DEFAULT '',
    "validIdType" TEXT NOT NULL DEFAULT 'Aadhaar',
    "validIdNumber" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "kind" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "expenseId" INTEGER,
    "rwaMemberId" INTEGER,
    "renterId" INTEGER,
    CONSTRAINT "Document_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_rwaMemberId_fkey" FOREIGN KEY ("rwaMemberId") REFERENCES "RwaMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Renter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "autoBackup" BOOLEAN NOT NULL DEFAULT false,
    "backupTime" TEXT NOT NULL DEFAULT '23:00',
    "backupEmail" TEXT NOT NULL DEFAULT '',
    "emailApiUrl" TEXT NOT NULL DEFAULT '',
    "emailBackup" BOOLEAN NOT NULL DEFAULT false,
    "localBackup" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 30
);

-- CreateIndex
CREATE INDEX "House_number_idx" ON "House"("number");

-- CreateIndex
CREATE INDEX "House_propertyStatus_idx" ON "House"("propertyStatus");

-- CreateIndex
CREATE INDEX "House_status_idx" ON "House"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Member_houseId_key" ON "Member"("houseId");

-- CreateIndex
CREATE INDEX "Payment_houseId_idx" ON "Payment"("houseId");

-- CreateIndex
CREATE INDEX "Payment_month_idx" ON "Payment"("month");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "RwaMember_designation_idx" ON "RwaMember"("designation");

-- CreateIndex
CREATE INDEX "RwaMember_status_idx" ON "RwaMember"("status");

-- CreateIndex
CREATE INDEX "Renter_houseFlat_idx" ON "Renter"("houseFlat");

-- CreateIndex
CREATE INDEX "Document_memberId_idx" ON "Document"("memberId");

-- CreateIndex
CREATE INDEX "Document_expenseId_idx" ON "Document"("expenseId");

-- CreateIndex
CREATE INDEX "Document_rwaMemberId_idx" ON "Document"("rwaMemberId");

-- CreateIndex
CREATE INDEX "Document_renterId_idx" ON "Document"("renterId");
