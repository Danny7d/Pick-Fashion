export const STORE_CURRENCY = "ETB";

export function formatMoney(amount) {
  const value = Number(amount || 0);
  const hasCents = !Number.isInteger(value);

  return `${STORE_CURRENCY} ${value.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
