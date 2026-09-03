-- Support bounded newest-first storefront product feeds and category pagination.
CREATE INDEX "Product_status_createdAt_id_idx" ON "Product"("status", "createdAt", "id");
CREATE INDEX "Product_categoryId_status_createdAt_id_idx" ON "Product"("categoryId", "status", "createdAt", "id");
