import { LotStatus } from './enums';

export { LotStatus } from './enums';

// ============================================
// DATABASE INTERFACES (snake_case, as they come from Supabase)
// ============================================

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

// Database lot interface matching Supabase lots table
export interface DatabaseLot {
  lot_number: number;
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuel: string;
  color: string;
  mileage: number;
  location: string;
  registration: string;
  reserve_price: number;
  initial_asking_price: number;
  last_auction_bid?: number;
  indicata_market_price?: number;
  viewers: number;
  watchers: number;
  lead_list_users: number;
  online_users: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  lot_final_states?: DatabaseLotFinalState[];
}

// Database lot final state interface
export interface DatabaseLotFinalState {
  id: string;
  lot_number: number;
  sold_price: number;
  reserve_price: number;
  performance_value: number;
  performance_text: string;
  sold_time: string;
  sold_to: string;
  sold_to_id: string;
  status: string;
  created_at?: string;
}

// Database lot bid interface
export interface DatabaseLotBid {
  id: string;
  lot_final_state_id: string;
  bidder: string;
  bidder_id: string;
  amount: number;
  time: string;
  type: string;
  bid_type: string;
  company_name?: string;
  company_type?: string;
  city?: string;
  country?: string;
  created_at?: string;
}

// Database message interface
export interface DatabaseMessage {
  id: string;
  created_at?: string;
  text: string;
  time: string;
  alternate: boolean;
  dealer: string;
  dealer_id: string;
  recipient_id?: string;
  type?: string;
  is_global?: boolean;
  is_read?: boolean;
}

// Database auction interface
export interface DatabaseAuction {
  id: string;
  auction_title: string;
  auction_id: string;
  auction_date: string;
  auction_company: string;
  default_locale: string;
  default_currency: string;
  created_at: string;
}

// Database content interface
export interface DatabaseContent {
  system: number;
  locale: string;
  path: string;
  filename: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

// Database lot user activity interface
export interface DatabaseLotUserActivity {
  id: string;
  created_at?: string;
  lot_number: number;
  dealer_id: string;
  activity_type: string;
  last_active: string;
  last_buy: string;
  dealer_name: string;
  dealer_type: string;
}

// ============================================
// APPLICATION INTERFACES (camelCase, for use in the app)
// ============================================

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