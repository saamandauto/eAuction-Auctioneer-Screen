import { LotStatus } from './enums';

export { LotStatus } from './enums';

// Unified dealer interface that the application will use
export interface BaseDealer {
  id: string; // Standardized ID field
  firstName: string;
  lastName: string;
  fullName: string; // Computed full name
  phone?: string;
  mobilePhone?: string;
  note?: string;
  lastLogin?: string;
  lastBidDate?: string;
  lastBuy?: string;
  type: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}

// Database dealer interface that matches the Supabase structure
export interface DatabaseDealer {
  ID?: number;
  USR_ID?: number;
  FIRSTNAME?: string | null;
  LASTNAME?: string | null;
  PHONE?: string | null;
  MOBILEPHONE?: string | null;
  NOTE?: string | null;
  LASTLOGIN?: string | null;
  LASTBIDDATE?: string | null;
  LASTBUY?: string | null;
  TYPE?: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}

// The application uses BaseDealer as the unified dealer type
export type Dealer = BaseDealer;

// Helper function to convert database format to application format
export function databaseToDealerModel(dbDealer: DatabaseDealer): BaseDealer {
  const id = (dbDealer.USR_ID ? dbDealer.USR_ID.toString() : '') || 
             (dbDealer.ID ? dbDealer.ID.toString() : '');
  
  const firstName = dbDealer.FIRSTNAME || '';
  const lastName = dbDealer.LASTNAME || '';
  
  return {
    id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    phone: dbDealer.PHONE || undefined,
    mobilePhone: dbDealer.MOBILEPHONE || undefined,
    note: dbDealer.NOTE || undefined,
    lastLogin: dbDealer.LASTLOGIN || undefined,
    lastBidDate: dbDealer.LASTBIDDATE || undefined,
    lastBuy: dbDealer.LASTBUY || undefined,
    type: dbDealer.TYPE || 'Standard',
    companyName: dbDealer.companyName,
    companyType: dbDealer.companyType,
    city: dbDealer.city,
    country: dbDealer.country
  };
}

export interface LotDetails {
  lotNumber: number;
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuel: string;
  color: string;
  mileage: number;
  location: string;
  registration: string;
  reservePrice: number;
  initialAskingPrice: number;
  lastAuctionBid?: number;
  indicataMarketPrice?: number;
  status?: LotStatus;
  viewers: number;
  watchers: number;
  leadListUsers: number;
  onlineUsers: number;
  finalState?: LotFinalState;
}

export interface LotFinalState {
  soldPrice: number;
  reservePrice: number;
  performance: {
    value: number;
    text: string;
  };
  soldTime: string;
  soldTo: string;
  soldToId: string;
  bids: Bid[];
  status: LotStatus;  // Required status field
}

export interface Message {
  id: string;
  text: string;
  time: string;
  alternate: boolean;
  dealer: string;
  dealerId: string;
  recipientId?: string;
  type?: string;
  isGlobal?: boolean;
  isRead?: boolean;
}

export interface ViewerInfo {
  name: string;
  dealerId: string;
  type: string;
  lastBuy: string;
  lastActive: string;
}

export interface DealerStatus {
  dealerId: string;
  isViewer: boolean;
  isWatcher: boolean;
  isLead: boolean;
  isOnline: boolean;
  lastActive: string;
}

export type SortColumn = 'name' | 'type' | 'lastBuy' | 'lastActive';
export type SortDirection = 'asc' | 'desc';

export interface MessageCount {
  total: number;
  unread: number;
}

export type DealerFilter = 'all' | 'viewers' | 'watchers' | 'leads' | 'online';

export interface Bid {
  bidder: string;
  bidderId: string;
  amount: number;
  time: string;
  type: string;
  bidType: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}

// New interface for auction data
export interface AuctionData {
  id: string;
  auctionTitle: string;
  auctionId: string;
  auctionDate: string;
  auctionCompany: string;
  defaultLocale: string;
  defaultCurrency: string;
  createdAt: string;
}