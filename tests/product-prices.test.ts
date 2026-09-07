import { strict as assert } from "node:assert";
import { test } from "node:test";
import { calculatePrice, samePrice, validPrice } from "../lib/products/price-editor";
import { bulkCategorySchema } from "../lib/validations/product";
import { bulkPricesSchema } from "../lib/validations/product-prices";
import { hasPermission } from "../lib/auth/permissions";

test("prices obey Decimal(14,2) precision and positive bounds", () => {
  for (const value of ["0", "-1", "NaN", "Infinity", "1e3", "", "1.001", "1000000000000", "2,500"]) assert.equal(validPrice(value), false, value);
  for (const value of ["0.01", "2500", "999999999999.99"]) assert.equal(validPrice(value), true, value);
  assert.equal(samePrice("2000.00", "2000"), true);
  assert.equal(samePrice("2000", "2000.01"), false);
});
test("all bulk operations use exact arithmetic and round final percentages half up", () => {
  assert.equal(calculatePrice("2000", "2500", "set"), "2500.00");
  assert.equal(calculatePrice("0.10", "0.20", "add"), "0.30");
  assert.equal(calculatePrice("2000", "250", "subtract"), "1750.00");
  assert.equal(calculatePrice("2000", "10", "increasePercent"), "2200.00");
  assert.equal(calculatePrice("2000", "5", "decreasePercent"), "1900.00");
  assert.equal(calculatePrice("0.01", "50", "decreasePercent"), "0.01");
  assert.equal(calculatePrice("2000", "100", "decreasePercent"), null);
  assert.equal(calculatePrice("2000", "2500", "subtract"), null);
  assert.equal(calculatePrice("999999999999.99", "1", "add"), null);
});
test("bulk validation rejects duplicates, missing IDs, empty and oversized batches and unrelated fields", () => {
  const update = { id: "00000000-0000-4000-8000-000000000001", price: "2500.25" };
  assert.equal(bulkPricesSchema.parse({ updates: [update] }).updates[0].price, "2500.25");
  for (const updates of [[], [update, update], [{ price: 1 }], [{ ...update, stock: 20 }], [{ ...update, price: -1 }], Array.from({ length: 501 }, () => update)]) {
    assert.equal(bulkPricesSchema.safeParse({ updates }).success, false);
  }
});
test("staff cannot update prices; managers and owners can", () => {
  assert.equal(hasPermission("STAFF", "products.update"), false);
  assert.equal(hasPermission("MANAGER", "products.update"), true);
  assert.equal(hasPermission("OWNER", "products.update"), true);
});

test("bulk category validation deduplicates IDs and rejects unsafe payloads", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const secondId = "00000000-0000-4000-8000-000000000002";
  const categoryId = "00000000-0000-4000-8000-000000000003";

  assert.deepEqual(
    bulkCategorySchema.parse({ productIds: [id, id, secondId], categoryId }).productIds,
    [id, secondId],
  );

  for (const payload of [
    { productIds: [], categoryId },
    { productIds: ["not-a-uuid"], categoryId },
    { productIds: [id], categoryId: "not-a-uuid" },
    { productIds: [id], categoryId, price: "1000" },
    { productIds: Array.from({ length: 201 }, () => id), categoryId },
  ]) {
    assert.equal(bulkCategorySchema.safeParse(payload).success, false);
  }
});
