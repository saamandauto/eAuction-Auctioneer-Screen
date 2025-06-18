import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ViewerInfo, Dealer, DealerStatus } from '../models/interfaces';
import { LotService } from './lot.service';
import { getDealerId } from '../utils/dealer-utils';

@Injectable({
  providedIn: 'root'
})
export class LotUserActivityService {
  // BehaviorSubjects to store user activity data
  private viewersSubject = new BehaviorSubject<ViewerInfo[]>([]);
  private watchersSubject = new BehaviorSubject<ViewerInfo[]>([]);
  private leadsSubject = new BehaviorSubject<ViewerInfo[]>([]);
  private onlineUsersSubject = new BehaviorSubject<ViewerInfo[]>([]);
  
  // Track dealer statuses for the current lot
  private dealerStatusMap = new Map<string, DealerStatus>();

  // Inject dependencies
  private lotService = inject(LotService);

  /**
   * Load all user activity for a specific lot
   * @param lotNumber The lot number to load activity for
   * @param allDealers All dealers for initializing status map
   */
  loadActivityForCurrentLot(lotNumber: number, allDealers: Dealer[]): void {
    // Initialize dealer status map with default values
    this._initializeDealerStatusMap(allDealers);
    
    // Fetch and update all types of user activity
    this.updateViewers(lotNumber);
    this.updateWatchers(lotNumber);
    this.updateLeads(lotNumber);
    this.updateOnlineUsers(lotNumber);
  }

  /**
   * Initialize the dealer status map with default values
   */
  private _initializeDealerStatusMap(dealers: Dealer[]): void {
    // Clear existing statuses
    this.dealerStatusMap.clear();
    
    // Initialize status objects for all dealers with default values
    dealers.forEach(dealer => {
      const dealerId = getDealerId(dealer);
      
      if (dealerId) {
        this.dealerStatusMap.set(dealerId, {
          dealerId,
          isViewer: false,
          isWatcher: false,
          isLead: false,
          isOnline: false,
          lastActive: ''
        });
      }
    });
  }

  /**
   * Update the dealer status map with specific status updates
   */
  private _setDealerStatus(dealerId: string, updates: Partial<DealerStatus>): void {
    const currentStatus = this.dealerStatusMap.get(dealerId);
    if (currentStatus) {
      this.dealerStatusMap.set(dealerId, { ...currentStatus, ...updates });
    } else {
      this.dealerStatusMap.set(dealerId, {
        dealerId,
        isViewer: false,
        isWatcher: false,
        isLead: false,
        isOnline: false,
        lastActive: '',
        ...updates
      });
    }
  }

  /**
   * Get the status of a specific dealer
   */
  getDealerStatus(dealerId: string): DealerStatus | undefined {
    return this.dealerStatusMap.get(dealerId);
  }

  /**
   * Get the viewers for the current lot
   */
  getViewers(): Observable<ViewerInfo[]> {
    return this.viewersSubject.asObservable();
  }

  /**
   * Get the watchers for the current lot
   */
  getWatchers(): Observable<ViewerInfo[]> {
    return this.watchersSubject.asObservable();
  }

  /**
   * Get the leads for the current lot
   */
  getLeads(): Observable<ViewerInfo[]> {
    return this.leadsSubject.asObservable();
  }

  /**
   * Get the online users for the current lot
   */
  getOnlineUsers(): Observable<ViewerInfo[]> {
    return this.onlineUsersSubject.asObservable();
  }

  /**
   * Update viewers for a specific lot
   */
  private updateViewers(lotNumber: number): void {
    this.lotService.getLotUserActivity(lotNumber, 'viewer')
      .subscribe(viewers => {
        this.viewersSubject.next(viewers);
        
        // Update dealer status map to reflect viewer status
        viewers.forEach(viewer => {
          this._setDealerStatus(viewer.dealerId, { 
            isViewer: true,
            lastActive: viewer.lastActive 
          });
        });
      });
  }

  /**
   * Update watchers for a specific lot
   */
  private updateWatchers(lotNumber: number): void {
    this.lotService.getLotUserActivity(lotNumber, 'watcher')
      .subscribe(watchers => {
        this.watchersSubject.next(watchers);
        
        // Update dealer status map to reflect watcher status
        watchers.forEach(watcher => {
          this._setDealerStatus(watcher.dealerId, { 
            isWatcher: true,
            lastActive: watcher.lastActive
          });
        });
      });
  }

  /**
   * Update leads for a specific lot
   */
  private updateLeads(lotNumber: number): void {
    this.lotService.getLotUserActivity(lotNumber, 'lead')
      .subscribe(leads => {
        this.leadsSubject.next(leads);
        
        // Update dealer status map to reflect lead status
        leads.forEach(lead => {
          this._setDealerStatus(lead.dealerId, { 
            isLead: true,
            lastActive: lead.lastActive
          });
        });
      });
  }

  /**
   * Update online users for a specific lot
   */
  private updateOnlineUsers(lotNumber: number): void {
    this.lotService.getLotUserActivity(lotNumber, 'online')
      .subscribe(onlineUsers => {
        this.onlineUsersSubject.next(onlineUsers);
        
        // Update dealer status map to reflect online status
        onlineUsers.forEach(onlineUser => {
          this._setDealerStatus(onlineUser.dealerId, { 
            isOnline: true,
            lastActive: onlineUser.lastActive
          });
        });
      });
  }
}