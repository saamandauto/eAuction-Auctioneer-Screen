import { LotDetails, Dealer, Message, Bid } from './interfaces';
import { LotStatus, HammerState } from './enums';

/**
 * Strongly-typed state interface for the auction application
 */
export interface AuctionState {
  // Auction meta info
  auctionTitle: string;
  currentDateTime: string;
  auctionId: string;
  auctionDate: string;
  auctionCompany: string;
  
  // Auction state
  isAuctionStarted: boolean;
  isViewingLots: boolean;
  simulatedBiddingEnabled: boolean;
  skipConfirmations: boolean;
  hammerRequiresReserveMet: boolean;

  // Lots and dealers
  currentLot: LotDetails | null;
  lots: LotDetails[];
  dealers: Dealer[];
  messages: Message[];
  bids: Bid[];
  
  // Dialog states
  isViewersDialogOpen: boolean;
  isWatchersDialogOpen: boolean;
  isLeadsDialogOpen: boolean;
  isOnlineDialogOpen: boolean;

  // Lot status
  lotStatus: LotStatus;
  hammerState: HammerState;
  canControlLot: boolean;
  canUseHammer: boolean;

  // Bidding state
  currentHighestBid: number | null;
  askingPrice: number;
  startPrice: number;
  bidIncrement: number;
  newBidAmount: number;
  highestBid: Bid | null;

  // Selected dealer
  selectedDealer: Dealer | null;
}

// Type for keys of AuctionState
export type AuctionStateKey = keyof AuctionState;