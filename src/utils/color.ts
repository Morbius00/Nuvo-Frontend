/** Mixes a plain #rrggbb hex toward white (255) or black (0) — used to fake a lit, volumetric stroke on charts. */
export function mixHex(hex: string, target: 0 | 255, amount: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (channel: number) => Math.round(channel + (target - channel) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}
