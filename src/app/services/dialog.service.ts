import { Injectable } from '@angular/core';
import { AuctionStateService } from '../auction/auction-state.service';
import { LotUserActivityService } from './lot-user-activity.service';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(
    private auctionState: AuctionStateService,
    private lotUserActivityService: LotUserActivityService
  ) {}

  openViewersDialog(): void {
    this.auctionState.setState({ isViewersDialogOpen: true });
  }

  closeViewersDialog(): void {
    this.auctionState.setState({ isViewersDialogOpen: false });
  }

  openWatchersDialog(): void {
    this.auctionState.setState({ isWatchersDialogOpen: true });
  }

  closeWatchersDialog(): void {
    this.auctionState.setState({ isWatchersDialogOpen: false });
  }

  openLeadsDialog(): void {
    this.auctionState.setState({ isLeadsDialogOpen: true });
  }

  closeLeadsDialog(): void {
    this.auctionState.setState({ isLeadsDialogOpen: false });
  }

  openOnlineDialog(): void {
    this.auctionState.setState({ isOnlineDialogOpen: true });
  }

  closeOnlineDialog(): void {
    this.auctionState.setState({ isOnlineDialogOpen: false });
  }
}