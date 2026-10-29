/** Nick's confirmed daycare rules (October 28, 2026).
 * Enforced by the booking ledger as well as displayed on the website.
 */
export const DAYCARE_MAX_DOGS_PER_DAY = 15
export const DAYCARE_HALF_DAY_MAX_HOURS = 6
export const DAYCARE_FULL_DAY_MAX_HOURS = 11
export const DAYCARE_BUNDLE_START = "first_visit" as const
// Periods authorized for publication; Nick may revise them later.
export const DAYCARE_BUNDLE_WEEKS = { 5: 4, 10: 7, 20: 12 } as const
// Nick confirmed coverage of daycare, training, add-ons and bundles on October 28.
// Additional 30% after bundle savings. Balances belong to individual approved dogs.
export const DAYCARE_SECOND_DOG_DISCOUNT_PERCENT = 30
