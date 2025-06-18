import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, combineLatest, map, takeUntil } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { VehicleDetailsFeatureComponent } from './features/vehicle-details/vehicle-details.component';
import { BiddingComponent } from './features/bidding/bidding.component';
import { MessagingComponent } from './features/messaging/messaging.component';
import { LotControlComponent } from './features/lot-control/lot-control.component';
import { BidHistoryComponent } from './components/bid-history/bid-history.component';
import { LotsListComponent } from './components/lots-list/lots-list.component';
import { UserListDialogComponent } from './components/shared/user-list-dialog/user-list-dialog.component';
import { CurrentStatusComponent } from './components/current-status/current-status.component';
import { AuctionDetailsFeatureComponent } from './features/auction-details/auction-details.component';
import { DealersListComponent } from './components/dealers-list/dealers-list.component';
import { PlannedLotsComponent } from './components/planned-lots/planned-lots.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { AuctionEventService } from './auction/auction-event.service';
import { AuctionStateService } from './auction/auction-state.service';
import { LotStatus, HammerState } from './models/enums';
import { KeyboardShortcutService } from './services/keyboard-shortcut.service';
import { ToastrService } from 'ngx-toastr';
import { LotDetails, ViewerInfo } from './models/interfaces';
import { LotPerformance } from './models/display-interfaces';
import { AuctionService } from './services/auction.service';
import { AuctionLifecycleService } from './services/auction-lifecycle.service';
import { LotManagementService } from './services/lot-management.service';
import { BiddingOrchestrationService } from './services/bidding-orchestration.service';
import { DialogService } from './services/dialog.service';
import { MessagingService } from './services/messaging.service';
import { LotUserActivityService } from './services/lot-user-activity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    VehicleDetailsFeatureComponent,
    BiddingComponent,
    MessagingComponent,
    LotControlComponent,
    BidHistoryComponent,
    LotsListComponent,
    UserListDialogComponent,
    CurrentStatusComponent,
    AuctionDetailsFeatureComponent,
    DealersListComponent,
    PlannedLotsComponent,
    SettingsPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Expose enums to the template
  protected readonly LotStatus = LotStatus;
  protected readonly HammerState = HammerState;
  
  // Settings panel state
  isSettingsPanelOpen = false;
  
  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();
  
  // Observable properties for template consumption
  lotPerformance$: Observable<LotPerformance>;
  viewers$: Observable<ViewerInfo[]>;
  watchers$: Observable<ViewerInfo[]>;
  leads$: Observable<ViewerInfo[]>;
  onlineUsers$: Observable<ViewerInfo[]>;

  // Inject dependencies
  public auctionState = inject(AuctionStateService);
  public lotUserActivityService = inject(LotUserActivityService);
  private auctionEventService = inject(AuctionEventService);
  private auctionService = inject(AuctionService);
  private auctionLifecycleService = inject(AuctionLifecycleService);
  private lotManagementService = inject(LotManagementService);
  private biddingOrchestrationService = inject(BiddingOrchestrationService);
  private dialogService = inject(DialogService);
  private messagingService = inject(MessagingService);
  private toastr = inject(ToastrService);
  private keyboardShortcutService = inject(KeyboardShortcutService);

  constructor() {
    // Initialize observable properties
    this.lotPerformance$ = combineLatest([
      this.auctionState.select('currentHighestBid'),
      this.auctionState.select('currentLot')
    ]).pipe(
      map(([currentHighestBid, currentLot]) => {
        if (!currentLot) return { value: 0, text: '-' };
        return this.auctionService.calculateLotPerformance(currentHighestBid, currentLot.reservePrice);
      }),
      takeUntil(this.destroy$)
    );

    this.viewers$ = this.lotUserActivityService.getViewers();
    this.watchers$ = this.lotUserActivityService.getWatchers();
    this.leads$ = this.lotUserActivityService.getLeads();
    this.onlineUsers$ = this.lotUserActivityService.getOnlineUsers();
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboardEvent(event: KeyboardEvent) {
    // Global keyboard shortcuts that apply regardless of component focus
    // Only handle global shortcuts here - specific ones are in their respective components
    
    // ALT + S to open settings panel
    if (this.keyboardShortcutService.isShortcutMatch(event, 's')) {
      this.toggleSettingsPanel();
      event.preventDefault();
    }
    
    // ALT + Q to toggle simulated bidding
    if (this.keyboardShortcutService.isShortcutMatch(event, 'q')) {
      this.toggleSimulatedBidding();
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    // Initialize auction state if needed
  }
  
  ngOnDestroy(): void {
    // Complete the destroy subject to unsubscribe all observables
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Settings panel methods
  toggleSettingsPanel(): void {
    this.isSettingsPanelOpen = !this.isSettingsPanelOpen;
  }
  
  closeSettingsPanel(): void {
    this.isSettingsPanelOpen = false;
  }
  
  // Header event handlers - delegate to AuctionLifecycleService
  startAuction(): void {
    this.auctionLifecycleService.startAuction();
  }
  
  endAuction(): void {
    this.auctionLifecycleService.endAuction();
  }
  
  toggleView(): void {
    this.auctionLifecycleService.toggleView();
  }
  
  toggleSimulatedBidding(): void {
    this.auctionLifecycleService.toggleSimulatedBidding();
  }
  
  // Lot management - delegate to AuctionLifecycleService
  onLotUpdated(update: {lotNumber: number, field: string, value: number}): void {
    this.auctionLifecycleService.onLotUpdated(update);
  }

  onLotsReordered(reorderedLots: LotDetails[]): void {
    // Update the state with the new lot order
    this.auctionState.setLots(reorderedLots);
    this.toastr.success('Lot order updated successfully');
  }
  
  // User list dialog handlers - delegate to DialogService
  openViewersDialog(): void {
    this.dialogService.openViewersDialog();
  }
  
  closeViewersDialog(): void {
    this.dialogService.closeViewersDialog();
  }
  
  openWatchersDialog(): void {
    this.dialogService.openWatchersDialog();
  }
  
  closeWatchersDialog(): void {
    this.dialogService.closeWatchersDialog();
  }
  
  openLeadsDialog(): void {
    this.dialogService.openLeadsDialog();
  }
  
  closeLeadsDialog(): void {
    this.dialogService.closeLeadsDialog();
  }
  
  openOnlineDialog(): void {
    this.dialogService.openOnlineDialog();
  }
  
  closeOnlineDialog(): void {
    this.dialogService.closeOnlineDialog();
  }
  
  // Lot control - delegate to LotManagementService
  startLot(): void {
    this.lotManagementService.startLot();
  }
  
  moveLot(): void {
    this.lotManagementService.moveLot();
  }
  
  noSale(): void {
    this.lotManagementService.noSale();
  }
  
  withdrawLot(): void {
    this.lotManagementService.withdrawLot();
  }
  
  markAsSold(): void {
    this.lotManagementService.markAsSold();
  }
  
  progressHammerState(): void {
    this.lotManagementService.progressHammerState();
  }
  
  // Bidding handlers - delegate to BiddingOrchestrationService and LotManagementService
  setAskingPrice(newPrice: number): void {
    this.biddingOrchestrationService.setAskingPrice(newPrice);
  }
  
  adjustBidIncrement(amount: number): void {
    this.biddingOrchestrationService.adjustBidIncrement(amount);
  }
  
  onBidPlaced(bid: any): void {
    this.biddingOrchestrationService.onBidPlaced(bid);
  }
  
  onAuctioneerBidCountChanged(): void {
    this.biddingOrchestrationService.onAuctioneerBidCountChanged();
  }
  
  // Lot selection - delegate to LotManagementService
  selectLot(lot: any): void {
    this.lotManagementService.selectLot(lot);
  }
  
  // Dealer messaging - delegate to MessagingService
  onDealerSelect(dealer: any): void {
    this.messagingService.onDealerSelect(dealer);
  }
  
  onSendMessage(message: { text: string, isGlobal: boolean }): void {
    this.messagingService.onSendMessage(message);
  }
}