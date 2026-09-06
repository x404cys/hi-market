import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseDisplayOrderNumber } from "../lib/orders/order-search";

test("dashboard order search accepts display and numeric order numbers", () => {
  assert.equal(parseDisplayOrderNumber("HM-10254"), 10254);
  assert.equal(parseDisplayOrderNumber("#HM-10254"), 10254);
  assert.equal(parseDisplayOrderNumber("10254"), 10254);
  assert.equal(parseDisplayOrderNumber("#10254"), 10254);
});

test("dashboard order search ignores non-order-number text", () => {
  assert.equal(parseDisplayOrderNumber("HM-10254 بغداد"), null);
  assert.equal(parseDisplayOrderNumber("Ahmed 10254"), null);
  assert.equal(parseDisplayOrderNumber("HM-0"), null);
});
