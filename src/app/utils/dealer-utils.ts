import { Dealer } from '../models/interfaces';

/**
 * Returns a formatted full name for a dealer
 * @param dealer Dealer object in unified format
 * @returns Formatted full name string
 */
export function getDealerName(dealer: Dealer): string {
  return dealer.fullName;
}

/**
 * Returns the dealer ID
 * @param dealer Dealer object in unified format
 * @returns Dealer ID string
 */
export function getDealerId(dealer: Dealer): string {
  return dealer.id;
}