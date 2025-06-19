import { Injectable, inject } from '@angular/core';
import { Subject, Subscription, timer } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Dealer, Bid } from '../models/interfaces';
import { AuctionService } from './auction.service';
import { getDealerName, getDealerId } from '../utils/dealer-utils';

@Injectable({
  providedIn: 'root'
})
export class BiddingService {
  private biddingEnabled = false;
  private currentBidding$: Subscription | null = null;
  private bidSubject = new Subject<Bid>();
  
  // Track current state
  private currentBidAmount = 0;
  private currentBidIncrement = 0;
  private currentReservePrice = 0;
  private currentAskingPrice = 0;
  private availableDealers: Dealer[] = [];
  private totalSimulatedBids = 0; // Track total simulated bids across all lots

  // Inject dependencies
  private auctionService = inject(AuctionService);

  getBids() {
    return this.bidSubject.asObservable();
  }

  startSimulation(
    dealers: Dealer[],
    currentHighestBid: number,
    bidIncrement: number,
    reservePrice: number,
    askingPrice?: number
  ) {
    console.log('Starting simulation with enabled:', this.biddingEnabled);
    
    if (!this.biddingEnabled) {
      console.log('Simulation not enabled, skipping start');
      return;
    }
    
    // Stop any existing simulation
    this.stopSimulation();

    // Initialize state
    this.currentBidAmount = currentHighestBid;
    this.currentBidIncrement = bidIncrement;
    this.currentReservePrice = reservePrice;
    this.currentAskingPrice = askingPrice || currentHighestBid + bidIncrement;
    
    // Filter out bid users
    this.availableDealers = dealers.filter(d => d.type !== 'Bid User 1' && d.type !== 'Bid User 2');
    
    console.log('Simulation parameters:', {
      dealers: this.availableDealers.length,
      currentBidAmount: this.currentBidAmount,
      bidIncrement: this.currentBidIncrement,
      reservePrice: this.currentReservePrice,
      askingPrice: this.currentAskingPrice
    });
    
    if (this.availableDealers.length === 0) {
      console.warn('No available dealers for simulation');
      return;
    }

    // Create a timer that starts after a short delay and repeats every 1-3 seconds
    this.currentBidding$ = timer(1000, this.getRandomInterval()).pipe(
      filter(() => {
        const shouldContinue = this.shouldContinueBidding();
        if (!shouldContinue) {
          console.log('Stopping simulation - conditions no longer met');
        }
        return shouldContinue;
      }),
      tap(() => {
        console.log('Generating new simulated bid...');
      })
    ).subscribe(() => {
      this.generateNewBid();
    });

    console.log('Simulation timer started');
  }

  stopSimulation() {
    if (this.currentBidding$) {
      console.log('Stopping simulation timer');
      this.currentBidding$.unsubscribe();
      this.currentBidding$ = null;
    }
  }

  setEnabled(enabled: boolean) {
    console.log('Setting bidding enabled to:', enabled);
    this.biddingEnabled = enabled;
    if (!enabled) {
      this.stopSimulation();
    }
  }
  
  // Update the asking price for simulation
  updateAskingPrice(newAskingPrice: number) {
    console.log('Updating asking price to:', newAskingPrice);
    this.currentAskingPrice = newAskingPrice;
  }

  private shouldContinueBidding(): boolean {
    // Handle special case for zero reserve price
    let maxBidAmount: number;
    
    if (this.currentReservePrice === 0) {
      // For lots with zero reserve, continue bidding up to a reasonable limit
      // Use 10,000 as a default maximum for zero reserve lots
      maxBidAmount = 10000;
    } else {
      // Normal case: continue until 110% of reserve price
      maxBidAmount = this.currentReservePrice * 1.1;
    }
    
    // Continue bidding if enabled and current bid is less than the maximum
    const shouldContinue = this.biddingEnabled && this.currentBidAmount < maxBidAmount;
    
    if (!shouldContinue) {
      console.log('Should not continue bidding:', {
        enabled: this.biddingEnabled,
        currentBid: this.currentBidAmount,
        maxBid: maxBidAmount,
        reservePrice: this.currentReservePrice
      });
    }
    
    return shouldContinue;
  }

  private getRandomInterval(): number {
    // Random interval between 2000ms and 4000ms for easier testing
    return Math.floor(Math.random() * 2000) + 2000;
  }

  private generateNewBid() {
    if (!this.availableDealers.length) {
      console.warn('No dealers available for bid generation');
      return;
    }

    // Get a random dealer
    const randomIndex = Math.floor(Math.random() * this.availableDealers.length);
    const randomDealer = this.availableDealers[randomIndex];
    
    // Calculate new bid amount - ensure it's at least the asking price
    const newBidAmount = Math.max(
      this.currentBidAmount + this.currentBidIncrement,
      this.currentAskingPrice
    );
    
    // Get the dealer's name and ID using utility functions
    const dealerName = getDealerName(randomDealer);
    const dealerId = getDealerId(randomDealer);
    const dealerType = randomDealer.type ?? 'STANDARD';
    
    const bid: Bid = {
      bidder: dealerName,
      bidderId: dealerId,
      amount: newBidAmount,
      time: this.auctionService.getCurrentTime(),
      type: dealerType,
      bidType: 'SIMULATED',
      companyName: randomDealer.companyName,
      companyType: randomDealer.companyType,
      city: randomDealer.city,
      country: randomDealer.country
    };

    // Update current bid amount
    this.currentBidAmount = newBidAmount;
    
    // Increment total simulated bids counter
    this.totalSimulatedBids++;
    
    console.log('Generated simulated bid:', bid);
    
    // Emit the new bid
    this.bidSubject.next(bid);
  }
}