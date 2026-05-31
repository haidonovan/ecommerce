export function formatKHR(value) {
  return `${Number(value || 0).toLocaleString()} ៛`;
}

export function formatUSD(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function toUSD(khr, exchangeRate) {
  return Number(khr || 0) / Number(exchangeRate || 4100);
}

export function toKHR(usd, exchangeRate) {
  return Math.round(Number(usd || 0) * Number(exchangeRate || 4100));
}

export function formatMoney(value, currency, exchangeRate, showBoth = true) {
  if (currency === "USD") {
    const usd = Number(value || 0);
    const khr = toKHR(usd, exchangeRate);
    return showBoth ? `${formatUSD(usd)} (~${formatKHR(khr)})` : formatUSD(usd);
  }

  const khr = Number(value || 0);
  const usd = toUSD(khr, exchangeRate);
  return showBoth ? `${formatKHR(khr)} (~${formatUSD(usd)})` : formatKHR(khr);
}
