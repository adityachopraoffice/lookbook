-- CreateTable
CREATE TABLE "Lookbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "layout" TEXT NOT NULL DEFAULT 'GRID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LookbookImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lookbookId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "LookbookImage_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "Lookbook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "xPercent" REAL NOT NULL,
    "yPercent" REAL NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    CONSTRAINT "Pin_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "LookbookImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
