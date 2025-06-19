import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, map, combineLatest } from 'rxjs';
import { Bid, Dealer, LotDetails, Message } from '../models/interfaces';
import { LotStatus, HammerState } from '../models/enums';
import { DealerService } from '../services/dealer.service';
import { LotService } from '../services/lot.service';
import { LotControlsComponent } from '../components/lot-controls/lot-controls.component';
import { AuctionState, AuctionStateKey } from '../models/state.interface';
import { AuctionDataService } from '../services/auction-data.service';
import { LotUserActivityService } from '../services/lot-user-activity.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionStateService {
  // Reference to the lot control component for hammer/withdraw control
  private lotControlComponent: LotControlsComponent | null = null;
  
  // Auction meta info
  private auctionTitle$ = new BehaviorSubject<string>('');
  private currentDateTime$ = new BehaviorSubject<string>(new Date().toLocaleString('en-GB'));
  private auctionId$ = new BehaviorSubject<string>('');
  private auctionDate$ = new BehaviorSubject<string>('');
  private auctionCompany$ = new BehaviorSubject<string>('');
  
  // Auction state
  private isAuctionStarted$ = new BehaviorSubject<boolean>(false);
  private isViewingLots$ = new BehaviorSubject<boolean>(true);
  private simulatedBiddingEnabled$ = new BehaviorSubject<boolean>(false);
  private skipConfirmations$ = new BehaviorSubject<boolean>(false);
  private hammerRequiresReserveMet$ = new BehaviorSubject<boolean>(false);

  // Lots and dealers
  private currentLot$ = new BehaviorSubject<LotDetails | null>(null);
  private lots$ = new BehaviorSubject<LotDetails[]>([]);
  private dealers$ = new BehaviorSubject<Dealer[]>([]);
  private messages$ = new BehaviorSubject<Message[]>([]);
  private bids$ = new BehaviorSubject<Bid[]>([]);
  
  // Dialog states
  private isViewersDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isWatchersDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isLeadsDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isOnlineDialogOpen$ = new BehaviorSubject<boolean>(false);

  // Lot status
  private lotStatus$ = new BehaviorSubject<LotStatus>(LotStatus.PENDING);
  private hammerState$ = new BehaviorSubject<HammerState>(HammerState.ACCEPTING_BIDS);
  private canControlLot$ = new BehaviorSubject<boolean>(true);
  private canUseHammer$ = new BehaviorSubject<boolean>(false);

  // Bidding state
  private currentHighestBid$ = new BehaviorSubject<number | null>(null);
  private askingPrice$ = new BehaviorSubject<number>(0);
  private startPrice$ = new BehaviorSubject<number>(0);
  private bidIncrement$ = new BehaviorSubject<number>(500);
  private newBidAmount$ = new BehaviorSubject<number>(0);
  private highestBid$ = new BehaviorSubject<Bid | null>(null);

  // Selected dealer
  private selectedDealer$ = new BehaviorSubject<Dealer | null>(null);

  // Type-safe mapping of state keys to their BehaviorSubject observables
  private stateSubjects: { [K in AuctionStateKey]?: BehaviorSubject<AuctionState[K]> } = {};

  // Inject dependencies using inject() pattern
  private dealerService = inject(DealerService);
  private lotService = inject(LotService);
  private auctionDataService = inject(AuctionDataService);
  private lotUserActivityService = inject(LotUserActivityService);

  constructor() {
    // Initialize the state subjects mapping
    this.initStateSubjects();
    
    // Load auction data
    this.loadAuctionData();
    
    // Load dealers first
    this.loadDealers().subscribe(dealers => {
      // After dealers are loaded, load lots
      this.loadLots();
    });

    // Set up timer for current date-time
    setInterval(() => {
      this.currentDateTime$.next(new Date().toLocaleString('en-GB'));
    }, 1000);
    
    // Set up listener for bid and current lot changes to update canUseHammer status
    combineLatest([
      this.currentHighestBid$,
      this.currentLot$,
      this.lotStatus$,
      this.bids$,
      this.hammerRequiresReserveMet$
    ]).subscribe(() => {
      this.updateCanUseHammer();
    });
  }
  
  // Initialize the mapping between state keys and BehaviorSubjects
  private initStateSubjects(): void {
    this.stateSubjects = {
      auctionTitle: this.auctionTitle$,
      currentDateTime: this.currentDateTime$,
      auctionId: this.auctionId$,
      auctionDate: this.auctionDate$,
      auctionCompany: this.auctionCompany$,
      isAuctionStarted: this.isAuctionStarted$,
      isViewingLots: this.isViewingLots$,
      simulatedBiddingEnabled: this.simulatedBiddingEnabled$,
      skipConfirmations: this.skipConfirmations$,
      hammerRequiresReserveMet: this.hammerRequiresReserveMet$,
      currentLot: this.currentLot$,
      lots: this.lots$,
      dealers: this.dealers$,
      messages: this.messages$,
      bids: this.bids$,
      isViewersDialogOpen: this.isViewersDialogOpen$,
      isWatchersDialogOpen: this.isWatchersDialogOpen$,
      isLeadsDialogOpen: this.isLeadsDialogOpen$,
      isOnlineDialogOpen: this.isOnlineDialogOpen$,
      lotStatus: this.lotStatus$,
      hammerState: this.hammerState$,
      canControlLot: this.canControlLot$,
      canUseHammer: this.canUseHammer$,
      currentHighestBid: this.currentHighestBid$,
      askingPrice: this.askingPrice$,
      startPrice: this.startPrice$,
      bidIncrement: this.bidIncrement$,
      newBidAmount: this.newBidAmount$,
      highestBid: this.highestBid$,
      selectedDealer: this.selectedDealer$
    };
  }
  
  // Store a reference to the lot control component
  setLotControlComponent(component: LotControlsComponent | undefined) {
    this.lotControlComponent = component || null;
  }
  
  // Get reference to lot control component
  getLotControlComponent(): LotControlsComponent | null {
    return this.lotControlComponent;
  }

  // Load auction data from the service
  private loadAuctionData(): void {
    this.auctionDataService.getAuctionData().subscribe(auction => {
      this.auctionTitle$.next(auction.auctionTitle);
      this.auctionId$.next(auction.auctionId);
      this.auctionDate$.next(auction.auctionDate);
      this.auctionCompany$.next(auction.auctionCompany);
    });
  }

  // Private method to load dealers
  private loadDealers(): Observable<Dealer[]> {
    return this.dealerService.getDealers().pipe(
      tap(dealers => {
        console.log(`Loaded ${dealers.length} dealers from database/fallback`);
        this.dealers$.next(dealers);
      }),
      catchError(error => {
        console.error('Error loading dealers:', error);
        return of([]);
      })
    );
  }

  // Private method to load lots from Supabase
  private loadLots(): void {
    this.lotService.getLots().pipe(
      tap(lots => {
        this.processLoadedLots(lots);
      }),
      catchError(error => {
        console.error('Error loading lots:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  // Helper method to process loaded lots
  private processLoadedLots(lots: LotDetails[]): void {
    console.log(`Loaded ${lots.length} lots from database`);
    this.lots$.next(lots);
    
    // Initialize currentLot
    if (lots.length > 0) {
      const initialLot = lots[0];
      this.currentLot$.next(initialLot);
      this.startPrice$.next(initialLot.initialAskingPrice);
      this.askingPrice$.next(initialLot.initialAskingPrice);
      
      // Load user activity data for the initial lot
      this.lotUserActivityService.loadActivityForCurrentLot(initialLot.lotNumber, this.dealers$.value);
    }
  }

  // Type-safe method to get a specific value from state
  getValue<K extends AuctionStateKey>(key: K): AuctionState[K] {
    const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
    if (subject) {
      return subject.value;
    }
    
    // Fallback to specific getters for any keys not in the mapping
    return null as unknown as AuctionState[K];
  }

  // Type-safe method to get an observable of a specific state value
  select<K extends AuctionStateKey>(key: K): Observable<AuctionState[K]> {
    const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
    if (subject) {
      return subject.asObservable();
    }
    
    // Fallback to specific observables for any keys not in the mapping
    return of(null as unknown as AuctionState[K]);
  }

  // Type-safe method to update state
  public setState<K extends AuctionStateKey>(updates: Partial<Pick<AuctionState, K>>): void {
    // Update each property from the provided updates object
    (Object.keys(updates) as K[]).forEach(key => {
      const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
      if (subject) {
        subject.next(updates[key] as AuctionState[K]);
        
        // Special case for currentLot - update related data
        if (key === 'currentLot' && updates[key]) {
          const lot = updates[key] as LotDetails;
          if (lot && lot.lotNumber) {
            // Load user activity data for the new lot
            this.lotUserActivityService.loadActivityForCurrentLot(lot.lotNumber, this.dealers$.value);
          }
        }
        
        // If we updated hammerRequiresReserveMet, recalculate canUseHammer
        if (key === 'hammerRequiresReserveMet') {
          this.updateCanUseHammer();
        }
      }
    });
  }
  
  // Update the canUseHammer status based on various conditions
  public updateCanUseHammer(): void {
    const lotStatus = this.lotStatus$.value;
    const hasBids = this.bids$.value.length > 0;
    const hammerRequiresReserveMet = this.hammerRequiresReserveMet$.value;
    const currentHighestBid = this.currentHighestBid$.value;
    const currentLot = this.currentLot$.value;
    
    let canUseHammer = false;
    
    if (lotStatus === LotStatus.ACTIVE && hasBids) {
      if (!hammerRequiresReserveMet) {
        // If hammer doesn't require reserve to be met, allow using hammer
        canUseHammer = true;
      } else {
        // If hammer requires reserve to be met, check if the current bid meets it
        canUseHammer = !!currentHighestBid && 
                       !!currentLot && 
                       currentHighestBid >= currentLot.reservePrice;
      }
    }
    
    this.canUseHammer$.next(canUseHammer);
  }

  // All the other methods remain the same, just keeping them for backward compatibility
  
  getAuctionTitle(): string {
    return this.auctionTitle$.value;
  }

  getCurrentDateTime(): Observable<string> {
    return this.currentDateTime$.asObservable();
  }

  getIsAuctionStarted(): Observable<boolean> {
    return this.isAuctionStarted$.asObservable();
  }

  getIsAuctionStartedValue(): boolean {
    return this.isAuctionStarted$.value;
  }

  getIsViewingLots(): Observable<boolean> {
    return this.isViewingLots$.asObservable();
  }

  getIsViewingLotsValue(): boolean {
    return this.isViewingLots$.value;
  }

  getSimulatedBiddingEnabled(): boolean {
    return this.simulatedBiddingEnabled$.value;
  }
  
  getSimulatedBiddingEnabledObservable(): Observable<boolean> {
    return this.simulatedBiddingEnabled$.asObservable();
  }

  getSkipConfirmations(): boolean {
    return this.skipConfirmations$.value;
  }
  
  getSkipConfirmationsObservable(): Observable<boolean> {
    return this.skipConfirmations$.asObservable();
  }
  
  getHammerRequiresReserveMet(): boolean {
    return this.hammerRequiresReserveMet$.value;
  }
  
  getHammerRequiresReserveMetObservable(): Observable<boolean> {
    return this.hammerRequiresReserveMet$.asObservable();
  }

  getCurrentLot(): Observable<LotDetails | null> {
    return this.currentLot$.asObservable();
  }

  getCurrentLotValue(): LotDetails | null {
    return this.currentLot$.value;
  }

  getLots(): Observable<LotDetails[]> {
    return this.lots$.asObservable();
  }

  getLotsValue(): LotDetails[] {
    return this.lots$.value;
  }

  getDealers(): Observable<Dealer[]> {
    return this.dealers$.asObservable();
  }

  getDealersValue(): Dealer[] {
    return this.dealers$.value;
  }

  getMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  getMessagesValue(): Message[] {
    return this.messages$.value;
  }

  getBids(): Observable<Bid[]> {
    return this.bids$.asObservable();
  }

  getBidsValue(): Bid[] {
    return this.bids$.value;
  }

  getHighestBid(): Observable<Bid | null> {
    return this.highestBid$.asObservable();
  }

  getHighestBidValue(): Bid | null {
    return this.highestBid$.value;
  }

  getIsViewersDialogOpen(): Observable<boolean> {
    return this.isViewersDialogOpen$.asObservable();
  }

  getIsWatchersDialogOpen(): Observable<boolean> {
    return this.isWatchersDialogOpen$.asObservable();
  }

  getIsLeadsDialogOpen(): Observable<boolean> {
    return this.isLeadsDialogOpen$.asObservable();
  }

  getIsOnlineDialogOpen(): Observable<boolean> {
    return this.isOnlineDialogOpen$.asObservable();
  }

  getLotStatus(): Observable<LotStatus> {
    return this.lotStatus$.asObservable();
  }

  getLotStatusValue(): LotStatus {
    return this.lotStatus$.value;
  }

  getHammerState(): Observable<HammerState> {
    return this.hammerState$.asObservable();
  }

  getHammerStateValue(): HammerState {
    return this.hammerState$.value;
  }

  getCanControlLot(): Observable<boolean> {
    return this.canControlLot$.asObservable();
  }

  getCanUseHammer(): Observable<boolean> {
    return this.canUseHammer$.asObservable();
  }

  getCurrentHighestBid(): Observable<number | null> {
    return this.currentHighestBid$.asObservable();
  }

  getCurrentHighestBidValue(): number | null {
    return this.currentHighestBid$.value;
  }

  getAskingPrice(): Observable<number> {
    return this.askingPrice$.asObservable();
  }

  getAskingPriceValue(): number {
    return this.askingPrice$.value;
  }

  getStartPrice(): Observable<number> {
    return this.startPrice$.asObservable();
  }

  getStartPriceValue(): number {
    return this.startPrice$.value;
  }

  getBidIncrement(): Observable<number> {
    return this.bidIncrement$.asObservable();
  }

  getBidIncrementValue(): number {
    return this.bidIncrement$.value;
  }

  getNewBidAmount(): Observable<number> {
    return this.newBidAmount$.asObservable();
  }

  getNewBidAmountValue(): number {
    return this.newBidAmount$.value;
  }

  getSelectedDealer(): Observable<Dealer | null> {
    return this.selectedDealer$.asObservable();
  }

  getSelectedDealerValue(): Dealer | null {
    return this.selectedDealer$.value;
  }

  // Setters
  setIsAuctionStarted(value: boolean): void {
    this.isAuctionStarted$.next(value);
  }

  setIsViewingLots(value: boolean): void {
    this.isViewingLots$.next(value);
  }

  setSimulatedBiddingEnabled(value: boolean): void {
    this.simulatedBiddingEnabled$.next(value);
  }

  setSkipConfirmations(value: boolean): void {
    this.skipConfirmations$.next(value);
  }
  
  setHammerRequiresReserveMet(value: boolean): void {
    this.hammerRequiresReserveMet$.next(value);
    this.updateCanUseHammer();
  }

  setCurrentLot(lot: LotDetails | null): void {
    this.currentLot$.next(lot);
    if (lot) {
      // Load user activity for the new lot
      this.lotUserActivityService.loadActivityForCurrentLot(lot.lotNumber, this.dealers$.value);
    }
  }

  updateLot(updatedLot: LotDetails): void {
    // First update the local state
    const lots = this.lots$.value.map(lot => 
      lot.lotNumber === updatedLot.lotNumber ? updatedLot : lot
    );
    this.lots$.next(lots);
    
    // If this is the current lot, update it
    if (this.currentLot$.value?.lotNumber === updatedLot.lotNumber) {
      this.currentLot$.next(updatedLot);
    }
    
    // Then update in Supabase
    this.lotService.updateLot(updatedLot).subscribe(
      updatedLotFromDb => {
        // Lot updated in Supabase
      },
      error => {
        // Error updating lot in Supabase
      }
    );
  }

  setLots(lots: LotDetails[]): void {
    this.lots$.next(lots);
    
    // Update user activity for current lot if it exists
    if (this.currentLot$.value) {
      this.lotUserActivityService.loadActivityForCurrentLot(
        this.currentLot$.value.lotNumber,
        this.dealers$.value
      );
    }
  }

  setLotStatus(status: LotStatus): void {
    this.lotStatus$.next(status);
    
    if (this.currentLot$.value) {
      const updatedLot = { ...this.currentLot$.value, status };
      this.updateLot(updatedLot);
    }
  }

  setHammerState(state: HammerState): void {
    this.hammerState$.next(state);
  }

  setCanControlLot(value: boolean): void {
    this.canControlLot$.next(value);
  }

  setCanUseHammer(value: boolean): void {
    this.canUseHammer$.next(value);
  }

  setCurrentHighestBid(value: number | null): void {
    this.currentHighestBid$.next(value);
  }

  setAskingPrice(value: number): void {
    this.askingPrice$.next(value);
  }

  setStartPrice(value: number): void {
    this.startPrice$.next(value);
  }

  setBidIncrement(value: number): void {
    this.bidIncrement$.next(value);
  }

  setNewBidAmount(value: number): void {
    this.newBidAmount$.next(value);
  }

  setSelectedDealer(dealer: Dealer | null): void {
    this.selectedDealer$.next(dealer);
  }

  addBid(bid: Bid): void {
    this.bids$.next([bid, ...this.bids$.value]);
    this.currentHighestBid$.next(bid.amount);
    this.highestBid$.next(bid);
    this.askingPrice$.next(bid.amount + this.bidIncrement$.value);
    this.updateCanUseHammer();
  }

  addMessage(message: Message): void {
    this.messages$.next([message, ...this.messages$.value]);
  }

  resetLotState(): void {
    this.lotStatus$.next(LotStatus.PENDING);
    this.hammerState$.next(HammerState.ACCEPTING_BIDS);
    this.canControlLot$.next(true);
    this.canUseHammer$.next(false);
    this.currentHighestBid$.next(null);
    this.highestBid$.next(null);
    this.startPrice$.next(this.currentLot$.value?.initialAskingPrice || 0);
    this.askingPrice$.next(this.startPrice$.value);
    this.bids$.next([]);
    this.newBidAmount$.next(0);
    // Reset bid increment to default 500
    this.bidIncrement$.next(500);
  }

  // Support methods for legacy to new state management transition
  startAuction(): void {
    this.setState({ isAuctionStarted: true, isViewingLots: false });
  }

  endAuction(): void {
    this.setState({ isAuctionStarted: false, isViewingLots: true });
  }

  toggleView(): void {
    this.setState({ isViewingLots: !this.isViewingLots$.value });
  }
}