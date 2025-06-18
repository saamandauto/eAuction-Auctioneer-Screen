import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuctionData } from '../models/interfaces';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuctionDataService {
  // Default auction data to use as fallback
  private defaultAuction: AuctionData = {
    id: '00000000-0000-0000-0000-000000000000',
    auctionTitle: 'NextGen eAuction Demo',
    auctionId: '1067268',
    auctionDate: 'Thursday, December 13, 13:00',
    auctionCompany: 'Auto Cars Great Britain Ltd',
    defaultLocale: 'en_GB',
    defaultCurrency: 'GBP',
    createdAt: new Date().toISOString()
  };

  // Inject dependencies
  private supabaseService = inject(SupabaseService);
  private toastr = inject(ToastrService);

  /**
   * Get auction data from Supabase
   * If no auction data is found, the default values will be returned
   */
  getAuctionData(): Observable<AuctionData> {
    return from(
      this.supabaseService.getClient()
        .from('auction')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          // Return default auction data if none exists in database
          return this.defaultAuction;
        }
        
        // Map the database fields (snake_case) to the interface fields (camelCase)
        const auction = data[0];
        return {
          id: auction.id,
          auctionTitle: auction.auction_title,
          auctionId: auction.auction_id,
          auctionDate: auction.auction_date,
          auctionCompany: auction.auction_company,
          defaultLocale: auction.default_locale || 'en_GB',
          defaultCurrency: auction.default_currency || 'GBP',
          createdAt: auction.created_at
        };
      }),
      catchError(error => {
        console.error('Error fetching auction data:', error);
        this.toastr.error('Failed to load auction data. Using default values.');
        return of(this.defaultAuction);
      })
    );
  }

  /**
   * Create or update auction data in Supabase
   */
  saveAuctionData(auction: AuctionData): Observable<AuctionData> {
    // Convert to snake_case for database
    const dbAuction = {
      auction_title: auction.auctionTitle,
      auction_id: auction.auctionId,
      auction_date: auction.auctionDate,
      auction_company: auction.auctionCompany,
      default_locale: auction.defaultLocale,
      default_currency: auction.defaultCurrency
    };

    return from(
      this.supabaseService.getClient()
        .from('auction')
        .upsert(dbAuction)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No data returned after saving auction');
        }
        
        // Map back to camelCase
        const savedAuction = data[0];
        return {
          id: savedAuction.id,
          auctionTitle: savedAuction.auction_title,
          auctionId: savedAuction.auction_id,
          auctionDate: savedAuction.auction_date,
          auctionCompany: savedAuction.auction_company,
          defaultLocale: savedAuction.default_locale,
          defaultCurrency: savedAuction.default_currency,
          createdAt: savedAuction.created_at
        };
      }),
      catchError(error => {
        console.error('Error saving auction data:', error);
        this.toastr.error('Failed to save auction data');
        throw error;
      })
    );
  }
}