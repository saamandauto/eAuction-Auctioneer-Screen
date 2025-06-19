import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, throwError, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { LotDetails, LotStatus, Bid, LotFinalState, ViewerInfo, DatabaseLot, DatabaseLotFinalState, DatabaseLotBid, DatabaseLotUserActivity } from '../models/interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LotService {
  // Inject dependencies
  private supabaseService = inject(SupabaseService);

  /**
   * Fetches all lots from the Supabase database, including their final state and bids if available
   * @returns Observable with array of LotDetails
   */
  getLots(): Observable<LotDetails[]> {
    return from(
      this.supabaseService.getClient()
        .from('lots')
        .select(`
          *,
          lot_final_states(*)
        `)
        .order('lot_number', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          return [];
        }

        // Cast data to DatabaseLot[] and map the database field names (snake_case) to the interface field names (camelCase)
        const dbLots = data as DatabaseLot[];
        return dbLots.map(lot => this.mapDbLotToLotDetails(lot));
      }),
      catchError((err: unknown) => {
        console.error('Error fetching lots:', err);
        return of([]);
      })
    );
  }

  /**
   * Updates a lot in the Supabase database, including its final state and bids if provided
   * @param lot The lot to update
   * @returns Observable with the updated lot
   */
  updateLot(lot: LotDetails): Observable<LotDetails> {
    // If the lot has a final state, handle that first
    if (lot.finalState) {
      return this.saveLotFinalState(lot).pipe(
        switchMap(updatedLot => {
          return this.saveBasicLotData(updatedLot);
        })
      );
    } else {
      // Otherwise just update the basic lot data
      return this.saveBasicLotData(lot);
    }
  }

  /**
   * Fetches user activity data (viewers, watchers, leads, online) for a specific lot
   * @param lotNumber The lot number to fetch activity for
   * @param activityType The type of activity to fetch (viewer, watcher, lead, online)
   * @returns Observable with array of ViewerInfo
   */
  getLotUserActivity(lotNumber: number, activityType: string): Observable<ViewerInfo[]> {
    return from(
      this.supabaseService.getClient()
        .from('lot_user_activity')
        .select('*')
        .eq('lot_number', lotNumber)
        .eq('activity_type', activityType)
        .order('last_active', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error(`Error fetching ${activityType} data for lot ${lotNumber}:`, error);
          return [];
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Cast data to DatabaseLotUserActivity[] and map database fields to ViewerInfo interface
        const dbActivities = data as DatabaseLotUserActivity[];
        return dbActivities.map(item => ({
          name: item.dealer_name,
          dealerId: item.dealer_id,
          type: item.dealer_type,
          lastBuy: item.last_buy,
          lastActive: item.last_active
        }));
      }),
      catchError((err: unknown) => {
        console.error(`Error in getLotUserActivity for lot ${lotNumber}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Saves just the basic lot data without the final state
   * @param lot The lot to update
   * @returns Observable with the updated lot
   */
  private saveBasicLotData(lot: LotDetails): Observable<LotDetails> {
    // Convert camelCase to snake_case for database column names
    const dbLot = {
      lot_number: lot.lotNumber,
      make: lot.make,
      model: lot.model,
      year: lot.year,
      transmission: lot.transmission,
      fuel: lot.fuel,
      color: lot.color,
      mileage: lot.mileage,
      location: lot.location,
      registration: lot.registration,
      reserve_price: lot.reservePrice,
      initial_asking_price: lot.initialAskingPrice,
      last_auction_bid: lot.lastAuctionBid,
      indicata_market_price: lot.indicataMarketPrice,
      viewers: lot.viewers,
      watchers: lot.watchers,
      lead_list_users: lot.leadListUsers,
      online_users: lot.onlineUsers,
      updated_at: new Date().toISOString()
    };
    
    return from(
      this.supabaseService.getClient()
        .from('lots')
        .update(dbLot)
        .eq('lot_number', lot.lotNumber)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error(`No lot found with lot number ${lot.lotNumber}`);
        }
        
        // Cast data to DatabaseLot[] and map to LotDetails
        const dbLots = data as DatabaseLot[];
        return this.mapDbLotToLotDetails(dbLots[0]);
      }),
      catchError((err: unknown) => {
        return throwError(() => new Error(`Failed to update lot in Supabase: ${String(err)}`));
      })
    );
  }

  /**
   * Saves a lot's final state and bids to the database
   * @param lot The lot with final state to save
   * @returns Observable with the updated lot
   */
  private saveLotFinalState(lot: LotDetails): Observable<LotDetails> {
    if (!lot.finalState) {
      return throwError(() => new Error('No final state provided for lot'));
    }
    
    const finalState = lot.finalState;
    
    // Prepare final state data for Supabase
    const dbFinalState = {
      lot_number: lot.lotNumber, // Use direct lot_number reference
      sold_price: finalState.soldPrice,
      reserve_price: finalState.reservePrice,
      performance_value: finalState.performance.value,
      performance_text: finalState.performance.text,
      sold_time: finalState.soldTime,
      sold_to: finalState.soldTo,
      sold_to_id: finalState.soldToId,
      status: finalState.status // Save the status field
    };
    
    // First save the final state
    return from(
      this.supabaseService.getClient()
        .from('lot_final_states')
        .upsert(dbFinalState, { onConflict: 'lot_number' })
        .select()
    ).pipe(
      switchMap(({ data: finalStateData, error: finalStateError }) => {
        if (finalStateError) {
          return throwError(() => new Error(`Failed to save lot final state: ${finalStateError.message}`));
        }
        
        if (!finalStateData || finalStateData.length === 0) {
          return throwError(() => new Error('No final state data returned after insert'));
        }
        
        // Cast finalStateData to DatabaseLotFinalState[]
        const dbFinalStates = finalStateData as DatabaseLotFinalState[];
        const finalStateId = dbFinalStates[0].id;
        
        // Now save all the bids
        if (finalState.bids && finalState.bids.length > 0) {
          
          // Prepare all bids for batch insert
          const dbBids: Partial<DatabaseLotBid>[] = finalState.bids.map(bid => ({
            lot_final_state_id: finalStateId,
            bidder: bid.bidder,
            bidder_id: bid.bidderId,
            amount: bid.amount,
            time: bid.time,
            type: bid.type || 'STANDARD',
            bid_type: bid.bidType,
            company_name: bid.companyName,
            company_type: bid.companyType,
            city: bid.city,
            country: bid.country
          }));
          
          return from(
            this.supabaseService.getClient()
              .from('lot_bids')
              .upsert(dbBids)
          ).pipe(
            map(() => {
              // Return the updated lot
              return lot;
            }),
            catchError((bidsError: unknown) => {
              // Even if bids fail to save, return the lot
              console.error('Error saving bids:', bidsError);
              return of(lot);
            })
          );
        } else {
          // No bids to save, just return the lot
          return of(lot);
        }
      }),
      catchError((err: unknown) => {
        return throwError(() => new Error(`Failed to save lot final state: ${String(err)}`));
      })
    );
  }

  /**
   * Calls the seed-lots Supabase function to populate the database with initial lot data
   * @returns Observable with the result of the operation
   */
  seedLots(): Observable<unknown> {
    const anon_key = environment.supabase.anonKey;
    const supabase_url = environment.supabase.url;
    
    return from(
      window.fetch(
        `${supabase_url}/functions/v1/seed-lots`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anon_key}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(async (response: Response) => {
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            // Try to parse the error response as JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage += ` - ${errorJson.error}`;
            }
          } catch {
            // If parsing fails, just use the raw text
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
    ).pipe(
      map(result => {
        if (!result.success) {
          throw new Error(`Failed to seed lots: ${result.error || 'Unknown error'}`);
        }
        return result;
      }),
      catchError((err: unknown) => {
        // Return a proper error instead of a fake success object
        return throwError(() => new Error(`Failed to seed lots in Supabase: ${String(err)}`));
      })
    );
  }

  /**
   * Calls the seed-lot-user-activity Supabase function to populate user activity data
   * @returns Observable with the result of the operation
   */
  seedLotUserActivity(): Observable<unknown> {
    const anon_key = environment.supabase.anonKey;
    const supabase_url = environment.supabase.url;
    
    return from(
      window.fetch(
        `${supabase_url}/functions/v1/seed-lot-user-activity`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anon_key}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(async (response: Response) => {
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            // Try to parse the error response as JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage += ` - ${errorJson.error}`;
            }
          } catch {
            // If parsing fails, just use the raw text
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
    ).pipe(
      map(result => {
        if (!result.success) {
          throw new Error(`Failed to seed lot user activity: ${result.error || 'Unknown error'}`);
        }
        return result;
      }),
      catchError((err: unknown) => {
        return throwError(() => new Error(`Failed to seed lot user activity in Supabase: ${String(err)}`));
      })
    );
  }
  
  /**
   * Maps a database lot object (snake_case) to a LotDetails object (camelCase)
   * @param dbLot The database lot object
   * @returns A LotDetails object
   */
  private mapDbLotToLotDetails(dbLot: DatabaseLot): LotDetails {
    // First map the basic lot properties
    const lotDetails: LotDetails = {
      lotNumber: dbLot.lot_number,
      make: dbLot.make,
      model: dbLot.model,
      year: dbLot.year,
      transmission: dbLot.transmission,
      fuel: dbLot.fuel,
      color: dbLot.color,
      mileage: dbLot.mileage,
      location: dbLot.location,
      registration: dbLot.registration,
      reservePrice: dbLot.reserve_price,
      initialAskingPrice: dbLot.initial_asking_price,
      lastAuctionBid: dbLot.last_auction_bid,
      indicataMarketPrice: dbLot.indicata_market_price,
      viewers: dbLot.viewers,
      watchers: dbLot.watchers,
      leadListUsers: dbLot.lead_list_users,
      onlineUsers: dbLot.online_users,
      // finalState will be added below if available
    };
    
    // Now handle the final state if present
    if (dbLot.lot_final_states && dbLot.lot_final_states.length > 0) {
      const finalStateData = dbLot.lot_final_states[0] as DatabaseLotFinalState;
      
      // Create the final state object
      const finalState: LotFinalState = {
        soldPrice: finalStateData.sold_price,
        reservePrice: finalStateData.reserve_price,
        performance: {
          value: finalStateData.performance_value,
          text: finalStateData.performance_text
        },
        soldTime: finalStateData.sold_time,
        soldTo: finalStateData.sold_to,
        soldToId: finalStateData.sold_to_id,
        bids: [], // Will be populated later if available
        status: finalStateData.status as LotStatus || LotStatus.SOLD // Use status from DB or default to SOLD
      };
      
      // Then separately fetch the bids if needed
      // For now we'll use an empty array, but in a real app you'd fetch them
      
      // Attach the final state to the lot
      lotDetails.finalState = finalState;
      
      // Also set the lot status based on the final state status
      lotDetails.status = finalState.status;
    }
    
    return lotDetails;
  }

  /**
   * Fetches bids for a specific lot final state
   * @param finalStateId The ID of the final state
   * @returns Observable with array of Bid objects
   */
  getBidsForLotFinalState(finalStateId: string): Observable<Bid[]> {
    return from(
      this.supabaseService.getClient()
        .from('lot_bids')
        .select('*')
        .eq('lot_final_state_id', finalStateId)
        .order('amount', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return [];
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Cast data to DatabaseLotBid[] and map to Bid objects
        const dbBids = data as DatabaseLotBid[];
        return dbBids.map(bid => ({
          bidder: bid.bidder,
          bidderId: bid.bidder_id,
          amount: bid.amount,
          time: bid.time,
          type: bid.type,
          bidType: bid.bid_type,
          companyName: bid.company_name,
          companyType: bid.company_type,
          city: bid.city,
          country: bid.country
        }));
      }),
      catchError((err: unknown) => {
        console.error('Error fetching bids:', err);
        return of([]);
      })
    );
  }
}