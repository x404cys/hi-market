export const MAX_PRICE_UPDATES = 500;
const HUNDRED = BigInt(100);
const MAX_MINOR = BigInt("99999999999999");

export type PriceProduct = {
  id: string; name: string; image: string | null; price: string;
  categoryId: string; category: { name: string }; status: string;
};
export type PriceEdit = { product: PriceProduct; value: string };
export type PriceOperation = "set" | "add" | "subtract" | "increasePercent" | "decreasePercent";

export function minorUnits(value: string): bigint | null {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  return BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, "0"));
}

export function validPrice(value: string) {
  const minor = minorUnits(value);
  return minor !== null && minor > BigInt(0) && minor <= MAX_MINOR;
}

export function samePrice(a: string, b: string) {
  const minor = minorUnits(a);
  return minor !== null && minor === minorUnits(b);
}

function decimalString(minor: bigint) {
  return `${minor / HUNDRED}.${(minor % HUNDRED).toString().padStart(2, "0")}`;
}

export function calculatePrice(current: string, amount: string, operation: PriceOperation): string | null {
  const base = minorUnits(current);
  const operand = minorUnits(amount);
  if (base === null || operand === null || operand <= BigInt(0)) return null;
  let result: bigint;
  if (operation === "set") result = operand;
  else if (operation === "add") result = base + operand;
  else if (operation === "subtract") result = base - operand;
  else {
    const scale = BigInt(10000);
    const factor = operation === "increasePercent" ? scale + operand : scale - operand;
    if (factor <= BigInt(0)) return null;
    // Round the final price to two decimal places, half up.
    result = (base * factor + scale / BigInt(2)) / scale;
  }
  return result > BigInt(0) && result <= MAX_MINOR ? decimalString(result) : null;
}
