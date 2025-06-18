import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuctionDetailsComponent } from '../../components/auction-details/auction-details.component';
import { Subject, Observable, combineLatest, map, takeUntil } from 'rxjs';
import { AuctionStatsService } from '../../services/auction-stats.service';

// Interface for the combined view state
interface AuctionDetailsFeatureViewState {
  soldLots: number;
  withdrawnLots: number;
  totalBids: number;
  auctioneerBids: number;
  dealerBids: number;
  totalSoldValue: number;
  totalReserveValue: number;
  performance: {sum: string, percentage: string};
}

@Component({
  selector: 'app-auction-details-feature',
  standalone: true,
  imports: [
    CommonModule,
    AuctionDetailsComponent
  ],
  templateUrl: './auction-details.component.html',
  styleUrls: ['./auction-details.component.scss']
})
export class AuctionDetailsFeatureComponent implements OnDestroy {
  // Combined view state observable
  viewState$: Observable<AuctionDetailsFeatureViewState>;
  
  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();
  
  // Inject dependencies using inject() pattern
  private auctionStatsService = inject(AuctionStatsService);
  
  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.auctionStatsService.getSoldLots(),
      this.auctionStatsService.getWithdrawnLots(),
      this.auctionStatsService.getAuctioneerBidsCount(),
      this.auctionStatsService.getDealerBidsCount(),
      this.auctionStatsService.getTotalSoldValue(),
      this.auctionStatsService.getTotalReserveValue(),
      this.auctionStatsService.getPerformanceMetrics(),
      this.auctionStatsService.getTotalBidsCount()
    ]).pipe(
      map(([
        soldLots,
        withdrawnLots,
        auctioneerBids,
        dealerBids,
        totalSoldValue,
        totalReserveValue,
        performance,
        totalBids
      ]) => ({
        soldLots,
        withdrawnLots,
        totalBids,
        auctioneerBids,
        dealerBids,
        totalSoldValue,
        totalReserveValue,
        performance
      })),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}