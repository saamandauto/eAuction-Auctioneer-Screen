import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { VoiceService } from './voice.service';
import { BiddingService } from './bidding.service';
import { AuctionStateService } from '../auction/auction-state.service';
import { LotDetails } from '../models/interfaces';
import { AuctionStatsService } from './auction-stats.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionLifecycleService {
  private hasCreditsError = false;

  constructor(
    private auctionState: AuctionStateService,
    private biddingService: BiddingService,
    private voiceService: VoiceService,
    private toastr: ToastrService,
    private auctionStatsService: AuctionStatsService
  ) {
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });
  }

  startAuction(): void {
    // Use startAuction method instead of setState directly
    this.auctionState.startAuction();
    this.toastr.success('Auction started successfully');
    
    // Enhanced welcome message with auction details
    const activeDealers = this.auctionState.getValue('dealers').filter((d: any) => {
      const type = d.TYPE;
      return type !== 'Bid User 1' && type !== 'Bid User 2';
    });
    
    const welcomeMessage = `Welcome to the auction. We have ${this.auctionState.getValue('lots').length} lots available today and currently we have ${activeDealers.length} active dealers participating.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(welcomeMessage);
    }
  }

  endAuction(): void {
    // Use endAuction method instead of setState directly
    this.auctionState.endAuction();
    this.biddingService.stopSimulation();
    this.toastr.success('Auction ended successfully');
    
    // Enhanced end message with summary using speech-friendly price format
    const soldLots = this.auctionStatsService.getSoldLotsValue();
    const totalSoldValue = this.auctionStatsService.getTotalSoldValueValue();
    const soldLotsMessage = soldLots ? 
      `${soldLots} lots were sold for a total of ${this.voiceService.formatPriceForSpeech(totalSoldValue)}.` : 
      'No lots were sold in this session.';
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(`The auction has ended. ${soldLotsMessage} Thank you for participating.`);
    }
  }

  toggleView(): void {
    // Use toggleView method instead of setState directly
    this.auctionState.toggleView();
    
    const isViewingLots = this.auctionState.getValue('isViewingLots');
    if (isViewingLots) {
      this.toastr.info('Viewing planned lots');
    } else {
      this.toastr.info('Viewing auction interface');
    }
  }

  toggleSimulatedBidding(): void {
    const currentValue = this.auctionState.getValue('simulatedBiddingEnabled');
    const simulatedBiddingEnabled = !currentValue;
    
    if (simulatedBiddingEnabled) {
      this.toastr.info('Simulated bidding enabled');
    } else {
      this.toastr.info('Simulated bidding disabled');
    }
    
    this.auctionState.setState({ simulatedBiddingEnabled });
  }

  onLotUpdated(update: {lotNumber: number, field: string, value: number}): void {
    const lots = this.auctionState.getValue('lots');
    const lot = lots.find((l: LotDetails) => l.lotNumber === update.lotNumber);
    
    if (lot) {
      const updatedLot = { ...lot };
      
      if (update.field === 'reservePrice') {
        updatedLot.reservePrice = update.value;
        this.auctionState.updateLot(updatedLot);
        this.toastr.success(`Reserve price updated for Lot ${update.lotNumber}`);
        
        if (!this.hasCreditsError) {
          this.voiceService.speak(`Reserve price updated for Lot ${update.lotNumber} to ${this.voiceService.formatPriceForSpeech(update.value)}`);
        }
      } else if (update.field === 'initialAskingPrice') {
        updatedLot.initialAskingPrice = update.value;
        this.auctionState.updateLot(updatedLot);
        this.toastr.success(`Asking price updated for Lot ${update.lotNumber}`);
        
        if (!this.hasCreditsError) {
          this.voiceService.speak(`Asking price updated for Lot ${update.lotNumber} to ${this.voiceService.formatPriceForSpeech(update.value)}`);
        }
      }
    }
  }
}