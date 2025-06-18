import { Dealer, MessageCount, DealerStatus } from './interfaces';

// Extended interface for dealers with pre-computed display data
export interface DisplayDealer extends Dealer {
  displayStatus: DealerStatus;
  messageCount: MessageCount;
  tooltipText: string;
  isSelected: boolean;
}

// Interface for pre-computed lot performance
export interface LotPerformance {
  value: number;
  text: string;
}