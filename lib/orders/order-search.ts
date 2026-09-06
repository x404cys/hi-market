export function parseDisplayOrderNumber(value: string | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  const match = normalized.match(/^#?\s*(?:HM[-\s]*)?(\d+)$/);

  if (!match) return null;

  const orderNumber = Number(match[1]);
  return Number.isSafeInteger(orderNumber) && orderNumber > 0 ? orderNumber : null;
}
