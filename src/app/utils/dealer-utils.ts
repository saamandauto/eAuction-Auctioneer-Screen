import { Dealer } from '../models/interfaces';

/**
 * Returns a formatted full name for a dealer
 * @param dealer Dealer object
 * @returns Formatted full name string
 */
export function getDealerName(dealer: Dealer): string {
  return `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim();
}

/**
 * Returns a consistent dealer ID from either USR_ID or ID fields
 * @param dealer Dealer object
 * @returns Dealer ID string
 */
export function getDealerId(dealer: Dealer): string {
  return (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
         (dealer.ID ? dealer.ID.toString() : '');
}