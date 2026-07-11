const getCurrentUrl = () => new URL(window.location.href);

export const getCurrentHashPath = () => {
  const hashValue = getCurrentUrl().hash.startsWith("#")
    ? getCurrentUrl().hash.slice(1)
    : getCurrentUrl().hash;

  return hashValue.split("?")[0] || "/";
};

export const getShopPaymentTxRef = () => {
  const currentUrl = getCurrentUrl();
  const hashValue = currentUrl.hash.startsWith("#")
    ? currentUrl.hash.slice(1)
    : currentUrl.hash;
  const [, hashSearch = ""] = hashValue.split("?");
  const hashParams = new URLSearchParams(hashSearch);

  return hashParams.get("tx_ref") ?? currentUrl.searchParams.get("tx_ref");
};

export const normalizeChapaPaymentReturnLocation = () => {
  const currentUrl = getCurrentUrl();
  const txRef = currentUrl.searchParams.get("tx_ref");
  const paymentSource = currentUrl.searchParams.get("payment_source");

  if (!txRef || paymentSource !== "chapa") {
    return;
  }

  const hashValue = currentUrl.hash.startsWith("#")
    ? currentUrl.hash.slice(1)
    : currentUrl.hash;
  const [hashPath, hashSearch = ""] = hashValue.split("?");
  const hashParams = new URLSearchParams(hashSearch);

  if (hashPath !== "/shop/payment-status") {
    currentUrl.hash = `/shop/payment-status?tx_ref=${encodeURIComponent(txRef)}`;
  } else if (!hashParams.get("tx_ref")) {
    hashParams.set("tx_ref", txRef);
    currentUrl.hash = `${hashPath}?${hashParams.toString()}`;
  }

  currentUrl.searchParams.delete("payment_source");
  currentUrl.searchParams.delete("tx_ref");
  window.history.replaceState(null, "", currentUrl.toString());
};

export const isChapaPaymentStatusRoute = () => {
  const currentUrl = getCurrentUrl();
  return (
    getCurrentHashPath() === "/shop/payment-status" ||
    currentUrl.searchParams.get("payment_source") === "chapa"
  );
};
