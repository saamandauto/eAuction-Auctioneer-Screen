import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuctionStatsService {
  // Auction stats
  private soldLots$ = new BehaviorSubject<number>(0);
  private withdrawnLots$ = new BehaviorSubject<number>(0);
  private totalSoldValue$ = new BehaviorSubject<number>(0);
  private totalReserveValue$ = new BehaviorSubject<number>(0);
  private auctioneerBidsCount$ = new BehaviorSubject<number>(0);
  private dealerBidsCount$ = new BehaviorSubject<number>(0);

  constructor() {}

  // Getter methods for observables
  getSoldLots(): Observable<number> {
    return this.soldLots$.asObservable();
  }

  getSoldLotsValue(): number {
    return this.soldLots$.value;
  }

  getWithdrawnLots(): Observable<number> {
    return this.withdrawnLots$.asObservable();
  }

  getWithdrawnLotsValue(): number {
    return this.withdrawnLots$.value;
  }

  getTotalSoldValue(): Observable<number> {
    return this.totalSoldValue$.asObservable();
  }

  getTotalSoldValueValue(): number {
    return this.totalSoldValue$.value;
  }

  getTotalReserveValue(): Observable<number> {
    return this.totalReserveValue$.asObservable();
  }

  getTotalReserveValueValue(): number {
    return this.totalReserveValue$.value;
  }

  getAuctioneerBidsCount(): Observable<number> {
    return this.auctioneerBidsCount$.asObservable();
  }

  getAuctioneerBidsCountValue(): number {
    return this.auctioneerBidsCount$.value;
  }

  getDealerBidsCount(): Observable<number> {
    return this.dealerBidsCount$.asObservable();
  }

  getDealerBidsCountValue(): number {
    return this.dealerBidsCount$.value;
  }
  
  // Get total bids count (auctioneer + dealer)
  getTotalBidsCount(): Observable<number> {
    return combineLatest([
      this.auctioneerBidsCount$,
      this.dealerBidsCount$
    ]).pipe(
      map(([auctioneerBids, dealerBids]) => auctioneerBids + dealerBids)
    );
  }

  // Calculate performance metrics
  getPerformanceMetrics(): Observable<{sum: string, percentage: string}> {
    return this.getTotalStats().pipe(
      map(({soldLots, totalSoldValue, totalReserveValue}) => {
        if (soldLots === 0) {
          return { sum: '-', percentage: '-' };
        }

        const formattedSum = `£${totalSoldValue.toLocaleString()}`;
        const percentage = ((totalSoldValue / totalReserveValue - 1) * 100).toFixed(2);
        
        return {
          sum: formattedSum,
          percentage: `${percentage}%`
        };
      })
    );
  }

  // Get all stats as a combined object - use combineLatest to react to all changes
  private getTotalStats(): Observable<{
    soldLots: number;
    withdrawnLots: number;
    totalSoldValue: number;
    totalReserveValue: number;
    auctioneerBidsCount: number;
    dealerBidsCount: number;
  }> {
    return combineLatest([
      this.soldLots$,
      this.withdrawnLots$,
      this.totalSoldValue$,
      this.totalReserveValue$,
      this.auctioneerBidsCount$,
      this.dealerBidsCount$
    ]).pipe(
      map(([soldLots, withdrawnLots, totalSoldValue, totalReserveValue, auctioneerBidsCount, dealerBidsCount]) => ({
        soldLots,
        withdrawnLots,
        totalSoldValue,
        totalReserveValue,
        auctioneerBidsCount,
        dealerBidsCount
      }))
    );
  }

  // Setter/increment methods
  incrementSoldLots(): void {
    const newValue = this.soldLots$.value + 1;
    this.soldLots$.next(newValue);
  }

  incrementWithdrawnLots(): void {
    const newValue = this.withdrawnLots$.value + 1;
    this.withdrawnLots$.next(newValue);
  }

  addToTotalSoldValue(value: number): void {
    const newValue = this.totalSoldValue$.value + value;
    this.totalSoldValue$.next(newValue);
  }

  addToTotalReserveValue(value: number): void {
    const newValue = this.totalReserveValue$.value + value;
    this.totalReserveValue$.next(newValue);
  }

  incrementAuctioneerBidsCount(): void {
    const newValue = this.auctioneerBidsCount$.value + 1;
    this.auctioneerBidsCount$.next(newValue);
  }

  incrementDealerBidsCount(): void {
    const newValue = this.dealerBidsCount$.value + 1;
    this.dealerBidsCount$.next(newValue);
  }

  // Reset all stats
  resetAllStats(): void {
    this.soldLots$.next(0);
    this.withdrawnLots$.next(0);
    this.totalSoldValue$.next(0);
    this.totalReserveValue$.next(0);
    this.auctioneerBidsCount$.next(0);
    this.dealerBidsCount$.next(0);
  }
}