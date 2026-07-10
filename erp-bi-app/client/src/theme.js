export const C = {
  bg: "#F5F6F8",
  card: "#FFFFFF",
  ink: "#151A2D",
  inkSoft: "#5B6172",
  border: "#E3E5EA",
  accent: "#0F6E67",
  accentSoft: "#E4F1EF",
  warn: "#B8860B",
  warnSoft: "#FBF3DF",
  bad: "#B23A3A",
  badSoft: "#FBEBEB",
  navy: "#151A2D",
};

export const FONT_UI = "'IBM Plex Sans', -apple-system, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'SF Mono', monospace";

export const fmtNaira = (n) => "₦" + Math.round(n || 0).toLocaleString("en-NG");
export const fmtNum = (n) => Math.round(n || 0).toLocaleString("en-NG");
export const fmtCompact = (n) => {
  n = n || 0;
  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);
  if (n >= 1e6) return sign + "₦" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return sign + "₦" + (n / 1e3).toFixed(0) + "K";
  return sign + "₦" + n;
};
