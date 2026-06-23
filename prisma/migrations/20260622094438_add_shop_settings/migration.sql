-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "defaultLayout" TEXT NOT NULL DEFAULT 'GRID',
    "hotspotColor" TEXT NOT NULL DEFAULT '#000000'
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
