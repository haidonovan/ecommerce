export function formatKHR(value) {
  return `${Number(value || 0).toLocaleString()} KHR`;
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

export function convertMoney(value, fromCurrency, toCurrency, exchangeRate) {
  if (fromCurrency === toCurrency) {
    return Number(value || 0);
  }

  return toCurrency === "USD" ? toUSD(value, exchangeRate) : toKHR(value, exchangeRate);
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

export function formatPrimaryMoney(value, settings, showBoth = true) {
  const currency = settings?.currency?.primaryCurrency || "USD";
  const exchangeRate = settings?.currency?.exchangeRate || 4100;
  const shouldShowBoth = Boolean(settings?.currency?.showBothCurrencies) && showBoth;
  const usd = Number(value || 0);

  if (currency === "USD") {
    return formatMoney(usd, "USD", exchangeRate, shouldShowBoth);
  }

  return formatMoney(toKHR(usd, exchangeRate), "KHR", exchangeRate, shouldShowBoth);
}

export function formatDisplayMoney(valueUsd, displayCurrency, settings, showBoth = true) {
  const currency = displayCurrency || settings?.currency?.primaryCurrency || "USD";
  const exchangeRate = settings?.currency?.exchangeRate || 4100;
  const shouldShowBoth = Boolean(settings?.currency?.showBothCurrencies) && showBoth;
  const usd = Number(valueUsd || 0);

  if (currency === "USD") {
    return formatMoney(usd, "USD", exchangeRate, shouldShowBoth);
  }

  return formatMoney(toKHR(usd, exchangeRate), "KHR", exchangeRate, shouldShowBoth);
}
