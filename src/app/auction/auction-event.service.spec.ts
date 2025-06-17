import { TestBed } from '@angular/core/testing';
import { AuctionEventService } from './auction-event.service';
import { AuctionService } from '../services/auction.service';
import { BiddingService } from '../services/bidding.service';
import { VoiceService } from '../services/voice.service';
import { SoundService } from '../services/sound.service';
import { ToastrService } from 'ngx-toastr';
import { AuctionStateService } from './auction-state.service';
import { AuctionLifecycleService } from '../services/auction-lifecycle.service';
import { LotManagementService } from '../services/lot-management.service';
import { BiddingOrchestrationService } from '../services/bidding-orchestration.service';
import { DialogService } from '../services/dialog.service';
import { MessagingService } from '../services/messaging.service';
import { LotDetails, LotStatus, Bid, Dealer } from '../models/interfaces';
import { of } from 'rxjs';

describe('AuctionEventService', () => {
  let service: AuctionEventService;
  let auctionStateMock: jasmine.SpyObj<AuctionStateService>;
  let biddingServiceMock: jasmine.SpyObj<BiddingService>;
  let voiceServiceMock: jasmine.SpyObj<VoiceService>;
  let soundServiceMock: jasmine.SpyObj<SoundService>;
  let toastrServiceMock: jasmine.SpyObj<ToastrService>;
  let auctionServiceMock: jasmine.SpyObj<AuctionService>;
  let auctionLifecycleServiceMock: jasmine.SpyObj<AuctionLifecycleService>;
  let lotManagementServiceMock: jasmine.SpyObj<LotManagementService>;
  let biddingOrchestrationServiceMock: jasmine.SpyObj<BiddingOrchestrationService>;
  let dialogServiceMock: jasmine.SpyObj<DialogService>;
  let messagingServiceMock: jasmine.SpyObj<MessagingService>;

  const mockLot: LotDetails = {
    lotNumber: 1,
    make: 'Tesla',
    model: 'Model Y',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'White',
    mileage: 5000,
    location: 'London',
    registration: 'AB23 XYZ',
    reservePrice: 40000,
    initialAskingPrice: 35000,
    viewers: 5,
    watchers: 3,
    leadListUsers: 2,
    onlineUsers: 7
  };

  const mockBid: Bid = {
    bidder: 'John Doe',
    bidderId: '12345',
    amount: 36000,
    time: '14:30:22',
    type: 'Standard',
    bidType: 'STANDARD'
  };

  const mockDealer: Dealer = {
    ID: 12345,
    FIRSTNAME: 'John',
    LASTNAME: 'Doe',
    TYPE: 'Standard'
  };

  beforeEach(() => {
    // Create spy objects for all dependencies
    auctionServiceMock = jasmine.createSpyObj('AuctionService', ['getCurrentTime', 'calculateLotPerformance']);
    biddingServiceMock = jasmine.createSpyObj('BiddingService', 
      ['getBids', 'startSimulation', 'stopSimulation', 'setEnabled', 'updateAskingPrice']
    );
    voiceServiceMock = jasmine.createSpyObj('VoiceService', 
      ['speak', 'getHasCreditsError', 'formatPriceForSpeech']
    );
    soundServiceMock = jasmine.createSpyObj('SoundService', ['playBidNotification']);
    toastrServiceMock = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);
    auctionLifecycleServiceMock = jasmine.createSpyObj('AuctionLifecycleService', 
      ['startAuction', 'endAuction', 'toggleView', 'toggleSimulatedBidding', 'onLotUpdated']
    );
    lotManagementServiceMock = jasmine.createSpyObj('LotManagementService', 
      ['startLot', 'moveLot', 'noSale', 'withdrawLot', 'markAsSold', 'progressHammerState', 'getLotPerformance', 'selectLot']
    );
    biddingOrchestrationServiceMock = jasmine.createSpyObj('BiddingOrchestrationService', 
      ['setAskingPrice', 'adjustBidIncrement', 'onBidPlaced', 'onAuctioneerBidCountChanged']
    );
    dialogServiceMock = jasmine.createSpyObj('DialogService', 
      ['openViewersDialog', 'closeViewersDialog', 'openWatchersDialog', 'closeWatchersDialog', 
       'openLeadsDialog', 'closeLeadsDialog', 'openOnlineDialog', 'closeOnlineDialog']
    );
    messagingServiceMock = jasmine.createSpyObj('MessagingService', 
      ['onDealerSelect', 'onSendMessage']
    );
    
    // Create the mock for AuctionStateService
    auctionStateMock = jasmine.createSpyObj('AuctionStateService', [
      'setState',
      'getValue',
      'select',
      'resetLotState',
      'updateLot',
      'incrementSoldLots',
      'incrementWithdrawnLots',
      'addToTotalSoldValue',
      'addToTotalReserveValue',
      'incrementDealerBidsCount',
      'incrementAuctioneerBidsCount',
      'addMessage',
      'setSelectedDealer',
      'startAuction',
      'endAuction',
      'toggleView'
    ]);

    // Setup mock return values
    biddingServiceMock.getBids.and.returnValue(of(mockBid));
    voiceServiceMock.getHasCreditsError.and.returnValue(of(false));
    auctionStateMock.select.and.returnValue(of(false));
    auctionStateMock.getValue.and.returnValue(false);
    lotManagementServiceMock.getLotPerformance.and.returnValue({value: 1000, text: '+£1,000 (5.0%)'});
    
    TestBed.configureTestingModule({
      providers: [
        AuctionEventService,
        { provide: AuctionService, useValue: auctionServiceMock },
        { provide: BiddingService, useValue: biddingServiceMock },
        { provide: VoiceService, useValue: voiceServiceMock },
        { provide: SoundService, useValue: soundServiceMock },
        { provide: ToastrService, useValue: toastrServiceMock },
        { provide: AuctionStateService, useValue: auctionStateMock },
        { provide: AuctionLifecycleService, useValue: auctionLifecycleServiceMock },
        { provide: LotManagementService, useValue: lotManagementServiceMock },
        { provide: BiddingOrchestrationService, useValue: biddingOrchestrationServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock }
      ]
    });
    
    service = TestBed.inject(AuctionEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call startAuction on the auctionLifecycleService', () => {
    // Execute
    service.startAuction();
    
    // Assert
    expect(auctionLifecycleServiceMock.startAuction).toHaveBeenCalled();
  });

  it('should call endAuction on the auctionLifecycleService', () => {
    // Execute
    service.endAuction();
    
    // Assert
    expect(auctionLifecycleServiceMock.endAuction).toHaveBeenCalled();
  });

  it('should call toggleView on the auctionLifecycleService', () => {
    // Execute
    service.toggleView();
    
    // Assert
    expect(auctionLifecycleServiceMock.toggleView).toHaveBeenCalled();
  });

  it('should call toggleSimulatedBidding on the auctionLifecycleService', () => {
    // Execute
    service.toggleSimulatedBidding();
    
    // Assert
    expect(auctionLifecycleServiceMock.toggleSimulatedBidding).toHaveBeenCalled();
  });

  it('should call onLotUpdated on the auctionLifecycleService', () => {
    // Setup
    const update = { lotNumber: 1, field: 'reservePrice', value: 45000 };
    
    // Execute
    service.onLotUpdated(update);
    
    // Assert
    expect(auctionLifecycleServiceMock.onLotUpdated).toHaveBeenCalledWith(update);
  });

  describe('Dialog methods', () => {
    it('should call openViewersDialog on the dialogService', () => {
      service.openViewersDialog();
      expect(dialogServiceMock.openViewersDialog).toHaveBeenCalled();
    });

    it('should call closeViewersDialog on the dialogService', () => {
      service.closeViewersDialog();
      expect(dialogServiceMock.closeViewersDialog).toHaveBeenCalled();
    });

    it('should call openWatchersDialog on the dialogService', () => {
      service.openWatchersDialog();
      expect(dialogServiceMock.openWatchersDialog).toHaveBeenCalled();
    });

    it('should call closeWatchersDialog on the dialogService', () => {
      service.closeWatchersDialog();
      expect(dialogServiceMock.closeWatchersDialog).toHaveBeenCalled();
    });

    it('should call openLeadsDialog on the dialogService', () => {
      service.openLeadsDialog();
      expect(dialogServiceMock.openLeadsDialog).toHaveBeenCalled();
    });

    it('should call closeLeadsDialog on the dialogService', () => {
      service.closeLeadsDialog();
      expect(dialogServiceMock.closeLeadsDialog).toHaveBeenCalled();
    });

    it('should call openOnlineDialog on the dialogService', () => {
      service.openOnlineDialog();
      expect(dialogServiceMock.openOnlineDialog).toHaveBeenCalled();
    });

    it('should call closeOnlineDialog on the dialogService', () => {
      service.closeOnlineDialog();
      expect(dialogServiceMock.closeOnlineDialog).toHaveBeenCalled();
    });
  });

  describe('Lot control methods', () => {
    it('should call startLot on the lotManagementService', () => {
      service.startLot();
      expect(lotManagementServiceMock.startLot).toHaveBeenCalled();
    });

    it('should call moveLot on the lotManagementService', () => {
      service.moveLot();
      expect(lotManagementServiceMock.moveLot).toHaveBeenCalled();
    });

    it('should call noSale on the lotManagementService', () => {
      service.noSale();
      expect(lotManagementServiceMock.noSale).toHaveBeenCalled();
    });

    it('should call withdrawLot on the lotManagementService', () => {
      service.withdrawLot();
      expect(lotManagementServiceMock.withdrawLot).toHaveBeenCalled();
    });

    it('should call markAsSold on the lotManagementService', () => {
      service.markAsSold();
      expect(lotManagementServiceMock.markAsSold).toHaveBeenCalled();
    });

    it('should call progressHammerState on the lotManagementService', () => {
      service.progressHammerState();
      expect(lotManagementServiceMock.progressHammerState).toHaveBeenCalled();
    });

    it('should call getLotPerformance on the lotManagementService', () => {
      const result = service.getLotPerformance();
      expect(lotManagementServiceMock.getLotPerformance).toHaveBeenCalled();
      expect(result).toEqual({value: 1000, text: '+£1,000 (5.0%)'});
    });
  });

  describe('Bidding methods', () => {
    it('should call setAskingPrice on the biddingOrchestrationService', () => {
      const newPrice = 40000;
      service.setAskingPrice(newPrice);
      expect(biddingOrchestrationServiceMock.setAskingPrice).toHaveBeenCalledWith(newPrice);
    });

    it('should call adjustBidIncrement on the biddingOrchestrationService', () => {
      const amount = 100;
      service.adjustBidIncrement(amount);
      expect(biddingOrchestrationServiceMock.adjustBidIncrement).toHaveBeenCalledWith(amount);
    });

    it('should call onBidPlaced on the biddingOrchestrationService', () => {
      service.onBidPlaced(mockBid);
      expect(biddingOrchestrationServiceMock.onBidPlaced).toHaveBeenCalledWith(mockBid);
    });

    it('should call onAuctioneerBidCountChanged on the biddingOrchestrationService', () => {
      service.onAuctioneerBidCountChanged();
      expect(biddingOrchestrationServiceMock.onAuctioneerBidCountChanged).toHaveBeenCalled();
    });
  });

  describe('Lot selection and messaging methods', () => {
    it('should call selectLot on the lotManagementService', () => {
      service.selectLot(mockLot);
      expect(lotManagementServiceMock.selectLot).toHaveBeenCalledWith(mockLot);
    });

    it('should call onDealerSelect on the messagingService', () => {
      service.onDealerSelect(mockDealer);
      expect(messagingServiceMock.onDealerSelect).toHaveBeenCalledWith(mockDealer);
    });

    it('should call onSendMessage on the messagingService', () => {
      const message = { text: 'Hello', isGlobal: false };
      service.onSendMessage(message);
      expect(messagingServiceMock.onSendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('handleSimulatedBiddingToggle', () => {
    beforeEach(() => {
      spyOn<any>(service, 'handleSimulatedBiddingToggle').and.callThrough();
    });

    it('should start simulation when enabled and lot is active', () => {
      // Setup
      auctionStateMock.getValue.and.returnValue(true); // For the first call to check simulatedBiddingEnabled
      auctionStateMock.getValue.withArgs('lotStatus').and.returnValue(LotStatus.ACTIVE);
      auctionStateMock.getValue.withArgs('currentLot').and.returnValue(mockLot);
      auctionStateMock.getValue.withArgs('dealers').and.returnValue([mockDealer]);
      auctionStateMock.getValue.withArgs('currentHighestBid').and.returnValue(35000);
      auctionStateMock.getValue.withArgs('startPrice').and.returnValue(35000);
      auctionStateMock.getValue.withArgs('bidIncrement').and.returnValue(500);
      auctionStateMock.getValue.withArgs('askingPrice').and.returnValue(35500);

      // We need to manually call the constructor subscription handler
      (service as any).handleSimulatedBiddingToggle(true);
      
      // Assert
      expect(biddingServiceMock.setEnabled).toHaveBeenCalledWith(true);
      expect(biddingServiceMock.startSimulation).toHaveBeenCalledWith(
        [mockDealer], 35000, 500, 40000, 35500
      );
    });

    it('should stop simulation when disabled', () => {
      // We need to manually call the constructor subscription handler
      (service as any).handleSimulatedBiddingToggle(false);
      
      // Assert
      expect(biddingServiceMock.setEnabled).toHaveBeenCalledWith(false);
      expect(biddingServiceMock.stopSimulation).toHaveBeenCalled();
    });
  });

  describe('onBidPlaced', () => {
    it('should process new bids correctly', () => {
      // Execute - this would normally be called via the subscription
      service.onBidPlaced(mockBid);

      // Assert biddingOrchestrationService was called
      expect(biddingOrchestrationServiceMock.onBidPlaced).toHaveBeenCalledWith(mockBid);
    });
  });
});