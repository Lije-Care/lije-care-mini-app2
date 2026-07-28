export const captureAndCleanHandoffCode = (
  href: string,
  replace: (cleanUrl: string) => void,
) => {
  const url = new URL(href);
  const hashParams = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
  );
  const code = hashParams.get("code") || url.searchParams.get("code");
  hashParams.delete("code");
  url.searchParams.delete("code");
  const cleanedHash = hashParams.toString();
  replace(
    `${url.pathname}${url.search}${cleanedHash ? `#${cleanedHash}` : ""}`,
  );
  return code;
};
