// Minimal helpers for partner brand_color (expected as hex like #RRGGBB)

export function normalizeHexColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  const hex = v.startsWith("#") ? v : `#${v}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : null;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyPartnerBrandColor(brandHex: string | null): void {
  // We keep it deliberately scoped: override --primary and friends only when partner is active.
  const root = document.documentElement;
  if (!brandHex) {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    return;
  }
  const { h, s, l } = hexToHsl(brandHex);
  root.style.setProperty("--primary", `${h} ${s}% ${Math.max(20, Math.min(55, l))}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${Math.max(20, Math.min(55, l))}%`);
}
