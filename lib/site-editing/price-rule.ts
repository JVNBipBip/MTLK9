/**
 * Prices are never owner-editable: what the page says has to match what Square
 * charges. Text that looks like a price or a discount stays in code. Shared by
 * components that make data-file text editable and by fields.test.ts.
 */
export const PRICE_LIKE = /\$\s?\d|\d\s?\$|\bCAD\b|\bdollars?\b|\d\s?%/i

export function isPriceLike(text: string) {
  return PRICE_LIKE.test(text)
}
