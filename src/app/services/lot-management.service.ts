import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { VoiceService } from './voice.service';
import { BiddingService } from './bidding.service';
import { AuctionService } from './auction.service';
import { AuctionStateService } from '../auction/auction-state.service';
import { LotDetails } from '../models/interfaces';
import { LotStatus, HammerState } from '../models/enums';
import { AuctionStatsService } from './auction-stats.service';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LotManagementService {
  private hasCreditsError = false;
  // Track lots where reserve has been met to avoid duplicate notifications
  private lotsReserveMetAnnounced = new Set<number>();

  constructor(
    private auctionState: AuctionStateService,
    private auctionService: AuctionService,
    private biddingService: BiddingService,
    private voiceService: VoiceService,
    private toastr: ToastrService,
    private auctionStatsService: AuctionStatsService
  ) {
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });

    // Listen for changes to current bid and current lot to detect reserve price met
    combineLatest([
      this.auctionState.select('currentHighestBid'),
      this.auctionState.select('currentLot')
    ]).subscribe(([highestBid, currentLot]) => {
      if (highestBid && currentLot) {
        if (highestBid >= currentLot.reservePrice && 
            !this.lotsReserveMetAnnounced.has(currentLot.lotNumber)) {
          // Reserve price has been met for the first time on this lot
          this.lotsReserveMetAnnounced.add(currentLot.lotNumber);
          
          // Show toast notification
          this.toastr.info(`Reserve price of £${currentLot.reservePrice} met for Lot ${currentLot.lotNumber}!`, 'Reserve Price Met');
          
          // Voice announcement if enabled
          if (!this.hasCreditsError && this.voiceService.getVoiceEnabledValue()) {
            this.voiceService.speak(`Reserve price met for Lot ${currentLot.lotNumber}. The current high bid of ${this.voiceService.formatPriceForSpeech(highestBid)} is now above reserve.`);
          }
          
          // Update canUseHammer state to reflect this change
          this.auctionState.updateCanUseHammer();
        }
      }
    });
  }

  startLot(): void {
    this.auctionState.setState({
      lotStatus: LotStatus.ACTIVE,
      canUseHammer: false
    });
    
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return;
    
    const startPrice = this.auctionState.getValue('startPrice');
    
    // Enhanced lot details announcement with speech-friendly price
    const lotDetails = `Lot ${currentLot.lotNumber} is now active. ${currentLot.year} ${currentLot.make} ${currentLot.model}, ${currentLot.color}, with ${currentLot.mileage} kilometers. Starting price is ${this.voiceService.formatPriceForSpeech(startPrice)}.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(lotDetails);
    }

    // Start simulation if enabled
    if (this.auctionState.getValue('simulatedBiddingEnabled') && currentLot) {
      this.biddingService.startSimulation(
        this.auctionState.getValue('dealers'),
        this.auctionState.getValue('currentHighestBid') || this.auctionState.getValue('startPrice'),
        this.auctionState.getValue('bidIncrement'),
        currentLot.reservePrice,
        this.auctionState.getValue('askingPrice')
      );
    }
    
    // Reset the reserve met announced set when starting a new lot
    this.lotsReserveMetAnnounced.clear();
  }

  moveLot(): void {
    this.biddingService.stopSimulation();
    
    const lots = this.auctionState.getValue('lots');
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return;
    
    const currentIndex = lots.findIndex((lot: LotDetails) => lot.lotNumber === currentLot.lotNumber);
    if (currentIndex < lots.length - 1) {
      const nextLot = lots[currentIndex + 1];
      this.auctionState.setState({ currentLot: nextLot });
      this.auctionState.resetLotState();
      
      // Enhanced next lot announcement
      const nextLotMessage = `Moving to lot ${nextLot.lotNumber}, ${nextLot.year} ${nextLot.make} ${nextLot.model}. This vehicle has ${nextLot.watchers} watchers and ${nextLot.viewers} viewers.`;
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(nextLotMessage);
      }
    }
  }

  noSale(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    if (currentLot) {
      this.auctionState.setState({
        lotStatus: LotStatus.NO_SALE,
        canControlLot: false,
        canUseHammer: false
      });

      // Create final state for No Sale
      const bids = this.auctionState.getValue('bids');
      const currentHighestBid = this.auctionState.getValue('currentHighestBid');
      
      // Update the lot with final state
      const updatedLot = { 
        ...currentLot, 
        status: LotStatus.NO_SALE, // Set the lot's direct status
        finalState: {
          soldPrice: currentHighestBid || 0,
          reservePrice: currentLot.reservePrice,
          performance: this.getLotPerformance(),
          soldTime: this.auctionService.getCurrentTime(),
          soldTo: bids.length > 0 ? bids[0].bidder : 'No bidder',
          soldToId: bids.length > 0 ? bids[0].bidderId : '',
          bids: [...bids],
          status: LotStatus.NO_SALE  // Set appropriate status
        }
      };
      
      this.auctionState.updateLot(updatedLot);
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`Lot ${currentLot.lotNumber} is marked as no sale.`);
      }
    }
  }

  withdrawLot(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    if (currentLot) {
      this.auctionState.setState({
        lotStatus: LotStatus.WITHDRAWN,
        canControlLot: false,
        canUseHammer: false
      });
      this.auctionStatsService.incrementWithdrawnLots();

      // Create final state for Withdrawn
      const bids = this.auctionState.getValue('bids');
      const currentHighestBid = this.auctionState.getValue('currentHighestBid');
      
      // Update the lot with final state
      const updatedLot = { 
        ...currentLot, 
        status: LotStatus.WITHDRAWN, // Set the lot's direct status
        finalState: {
          soldPrice: currentHighestBid || 0,
          reservePrice: currentLot.reservePrice,
          performance: this.getLotPerformance(),
          soldTime: this.auctionService.getCurrentTime(),
          soldTo: bids.length > 0 ? bids[0].bidder : 'No bidder',
          soldToId: bids.length > 0 ? bids[0].bidderId : '',
          bids: [...bids],
          status: LotStatus.WITHDRAWN  // Set appropriate status
        }
      };
      
      this.auctionState.updateLot(updatedLot);
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`Lot ${currentLot.lotNumber} has been withdrawn.`);
      }
    }
  }

  markAsSold(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    const currentHighestBid = this.auctionState.getValue('currentHighestBid');
    
    if (currentLot && currentHighestBid) {
      const bids = this.auctionState.getValue('bids');
      const winningBid = bids[0];
      
      // Update the lot with final state
      const updatedLot = { 
        ...currentLot, 
        status: LotStatus.SOLD, // Set the lot's direct status
        finalState: {
          soldPrice: currentHighestBid,
          reservePrice: currentLot.reservePrice,
          performance: this.getLotPerformance(),
          soldTime: winningBid.time,
          soldTo: winningBid.bidder,
          soldToId: winningBid.bidderId,
          bids: [...bids],
          status: LotStatus.SOLD  // Set appropriate status
        }
      };
      
      this.auctionState.updateLot(updatedLot);
      this.auctionState.setState({
        lotStatus: LotStatus.SOLD,
        canControlLot: false,
        canUseHammer: false
      });
      
      // Update auction statistics
      this.auctionStatsService.incrementSoldLots();
      this.auctionStatsService.addToTotalSoldValue(currentHighestBid);
      this.auctionStatsService.addToTotalReserveValue(currentLot.reservePrice);
      
      let performanceText = "";
      if (currentHighestBid >= currentLot.reservePrice) {
        const above = currentHighestBid - currentLot.reservePrice;
        performanceText = ` at ${this.voiceService.formatPriceForSpeech(currentHighestBid)}, which is ${this.voiceService.formatPriceForSpeech(above)} above reserve price`;
      } else {
        const below = currentLot.reservePrice - currentHighestBid;
        performanceText = ` at ${this.voiceService.formatPriceForSpeech(currentHighestBid)}, which is ${this.voiceService.formatPriceForSpeech(below)} below reserve price`;
      }
      
      // Enhanced sold announcement with properly formatted prices for speech
      const soldLotsValue = this.auctionStatsService.getSoldLotsValue();
      const soldMessage = `Lot ${currentLot.lotNumber}, ${currentLot.year} ${currentLot.make} ${currentLot.model}, sold to ${winningBid.bidder}${performanceText}. This is sale number ${soldLotsValue} today.`;
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(soldMessage);
      }
    }
  }

  progressHammerState(): void {
    const currentHammerState = this.auctionState.getValue('hammerState');
    
    switch (currentHammerState) {
      case HammerState.ACCEPTING_BIDS:
        this.auctionState.setState({ hammerState: HammerState.GOING_ONCE });
        if (!this.hasCreditsError) {
          this.voiceService.speak("Going once!");
        }
        break;
      case HammerState.GOING_ONCE:
        this.auctionState.setState({ hammerState: HammerState.GOING_TWICE });
        if (!this.hasCreditsError) {
          this.voiceService.speak("Going twice!");
        }
        break;
      case HammerState.GOING_TWICE:
        this.auctionState.setState({ hammerState: HammerState.SOLD });
        this.markAsSold();
        break;
    }
  }

  selectLot(lot: LotDetails): void {
    this.auctionState.setState({ currentLot: lot });
    this.auctionState.resetLotState();
    
    // Clear the reserve met announced set when selecting a new lot
    this.lotsReserveMetAnnounced.clear();
    
    // Enhanced lot selection announcement with more details
    const lotSelectionMessage = `Selected lot ${lot.lotNumber}, ${lot.year} ${lot.make} ${lot.model}. This vehicle has ${lot.watchers} watchers and ${lot.viewers} viewers interested.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(lotSelectionMessage);
    }
  }

  getLotPerformance() {
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return { value: 0, text: '-' };
    
    return this.auctionService.calculateLotPerformance(
      this.auctionState.getValue('currentHighestBid'),
      currentLot.reservePrice
    );
  }
}