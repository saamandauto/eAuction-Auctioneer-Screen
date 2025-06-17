import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { VoiceService } from './voice.service';
import { SoundService } from './sound.service';
import { BiddingService } from './bidding.service';
import { AuctionStateService } from '../auction/auction-state.service';
import { AuctionService } from './auction.service';
import { Bid } from '../models/interfaces';
import { HammerState } from '../models/enums';
import { AuctionStatsService } from './auction-stats.service';

@Injectable({
  providedIn: 'root'
})
export class BiddingOrchestrationService {
  private hasCreditsError = false;
  // Track the last time a bid was announced
  private lastBidAnnouncementTime = 0;
  private bidAnnouncementCooldown = 5000; // 5 seconds cooldown between bid announcements
  
  constructor(
    private auctionState: AuctionStateService,
    private auctionService: AuctionService,
    private biddingService: BiddingService,
    private voiceService: VoiceService,
    private soundService: SoundService,
    private toastr: ToastrService,
    private auctionStatsService: AuctionStatsService
  ) {
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });
  }

  setAskingPrice(newPrice: number): void {
    const currentHighestBid = this.auctionState.getValue('currentHighestBid');
    const currentLot = this.auctionState.getValue('currentLot');
    
    // Check if the bid is already above reserve price
    const isAboveReserve = !!currentHighestBid && 
                          !!currentLot?.reservePrice && 
                          currentHighestBid >= currentLot.reservePrice;
    
    // Don't allow setting asking price if above reserve
    if (isAboveReserve) {
      this.toastr.error('Cannot change asking price when the current bid is above reserve');
      return;
    }
    
    if (newPrice > (currentHighestBid || 0)) {
      this.auctionState.setState({
        askingPrice: newPrice,
        newBidAmount: newPrice
      });
      this.toastr.success('Asking price updated');
      
      // Update asking price in the bidding service for simulation
      if (this.auctionState.getValue('simulatedBiddingEnabled')) {
        this.biddingService.updateAskingPrice(newPrice);
      }
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`New asking price set to ${this.voiceService.formatPriceForSpeech(newPrice)}.`);
      }
    } else {
      this.toastr.error('New asking price must be higher than current highest bid');
    }
  }

  adjustBidIncrement(amount: number): void {
    const currentBidIncrement = this.auctionState.getValue('bidIncrement');
    const newBidIncrement = Math.max(100, currentBidIncrement + amount);
    this.auctionState.setState({ bidIncrement: newBidIncrement });
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(`Bid increment adjusted to ${this.voiceService.formatPriceForSpeech(newBidIncrement)}.`);
    }
  }

  onBidPlaced(bid: Bid): void {
    // Check if we should continue the hammer sequence or reset it
    const hammerState = this.auctionState.getValue('hammerState');
    const continueHammer = hammerState !== HammerState.ACCEPTING_BIDS && 
                           bid.bidType === 'WAR'; // Only continue if it's a bid war
    
    // Reset hammer state if needed
    if (!continueHammer && hammerState !== HammerState.ACCEPTING_BIDS) {
      this.auctionState.setState({ hammerState: HammerState.ACCEPTING_BIDS });
    }
    
    // Add the bid
    this.auctionState.setState({
      bids: [bid, ...this.auctionState.getValue('bids')],
      currentHighestBid: bid.amount,
      highestBid: bid,
      askingPrice: bid.amount + this.auctionState.getValue('bidIncrement'),
      canUseHammer: true
    });
    
    // Track dealer bids vs auctioneer bids
    if (bid.bidType === 'SIMULATED' || 
        (bid.bidType !== 'BID1' && bid.bidType !== 'BID2' && bid.bidType !== 'WAR')) {
      // This is a dealer bid, not from the auctioneer
      this.auctionStatsService.incrementDealerBidsCount();
      
      // Play sound only for real user bids (not simulated or auctioneer bids)
      if (bid.bidType !== 'SIMULATED') {
        this.soundService.playBidNotification();
      }
    }
    
    // Update bid announcement time
    this.lastBidAnnouncementTime = Date.now();
  }

  onAuctioneerBidCountChanged(): void {
    this.auctionStatsService.incrementAuctioneerBidsCount();
  }
}