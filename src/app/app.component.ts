import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
import { LotDetails, Bid, Dealer } from './models/interfaces';
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
  
  // Subscriptions to clean up
  private subscriptions: Subscription[] = [];
  
  constructor(
    public auctionState: AuctionStateService,
    public lotUserActivityService: LotUserActivityService,
    private auctionEventService: AuctionEventService,
    private auctionLifecycleService: AuctionLifecycleService,
    private lotManagementService: LotManagementService,
    private biddingOrchestrationService: BiddingOrchestrationService,
    private dialogService: DialogService,
    private messagingService: MessagingService,
    private toastr: ToastrService,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}

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
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
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
  getLotPerformance() {
    return this.lotManagementService.getLotPerformance();
  }
  
  setAskingPrice(newPrice: number): void {
    this.biddingOrchestrationService.setAskingPrice(newPrice);
  }
  
  adjustBidIncrement(amount: number): void {
    this.biddingOrchestrationService.adjustBidIncrement(amount);
  }
  
  onBidPlaced(bid: Bid): void {
    this.biddingOrchestrationService.onBidPlaced(bid);
  }
  
  onAuctioneerBidCountChanged(): void {
    this.biddingOrchestrationService.onAuctioneerBidCountChanged();
  }
  
  // Lot selection - delegate to LotManagementService
  selectLot(lot: LotDetails): void {
    this.lotManagementService.selectLot(lot);
  }
  
  // Dealer messaging - delegate to MessagingService
  onDealerSelect(dealer: Dealer | null): void {
    this.messagingService.onDealerSelect(dealer);
  }
  
  onSendMessage(message: { text: string, isGlobal: boolean }): void {
    this.messagingService.onSendMessage(message);
  }
}