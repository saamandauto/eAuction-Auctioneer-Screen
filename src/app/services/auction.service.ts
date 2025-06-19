import { Injectable } from '@angular/core';
import { Dealer } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

  getRandomDealer(dealers: Dealer[]): Dealer {
    return dealers[Math.floor(Math.random() * dealers.length)];
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  }

  calculateLotPerformance(currentHighestBid: number | null, reservePrice: number) {
    if (!currentHighestBid) {
      return { value: 0, text: '-' };
    }

    const difference = currentHighestBid - reservePrice;
    const percentage = (difference / reservePrice) * 100;
    
    return {
      value: difference,
      text: `${difference >= 0 ? '+' : ''}£${difference} (${percentage.toFixed(1)}%)`
    };
  }
}