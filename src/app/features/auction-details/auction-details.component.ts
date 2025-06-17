import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuctionDetailsComponent } from '../../components/auction-details/auction-details.component';
import { Observable } from 'rxjs';
import { AuctionStatsService } from '../../services/auction-stats.service';

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
export class AuctionDetailsFeatureComponent implements OnInit {
  // Statistics observables
  soldLots$: Observable<number>;
  withdrawnLots$: Observable<number>;
  totalBids$: Observable<number>;
  auctioneerBids$: Observable<number>;
  dealerBids$: Observable<number>;
  totalSoldValue$: Observable<number>;
  totalReserveValue$: Observable<number>;
  performance$: Observable<{sum: string, percentage: string}>;
  
  constructor(private auctionStatsService: AuctionStatsService) {
    // Initialize observables
    this.soldLots$ = this.auctionStatsService.getSoldLots();
    this.withdrawnLots$ = this.auctionStatsService.getWithdrawnLots();
    this.auctioneerBids$ = this.auctionStatsService.getAuctioneerBidsCount();
    this.dealerBids$ = this.auctionStatsService.getDealerBidsCount();
    this.totalSoldValue$ = this.auctionStatsService.getTotalSoldValue();
    this.totalReserveValue$ = this.auctionStatsService.getTotalReserveValue();
    this.performance$ = this.auctionStatsService.getPerformanceMetrics();
    
    // totalBids is calculated from auctioneerBids and dealerBids
    this.totalBids$ = this.auctionStatsService.getTotalBidsCount();
  }

  ngOnInit(): void {
    // No initialization required as we're using observables directly from the service
  }
}