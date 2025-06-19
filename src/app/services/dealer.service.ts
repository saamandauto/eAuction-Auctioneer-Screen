import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap, map, from } from 'rxjs';
import { Dealer, DatabaseDealer, databaseToDealerModel } from '../models/interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DealerService {
  // Mock bid users that aren't stored in the database but are needed for the application
  // These are in DatabaseDealer format as they simulate coming from the database
  private mockBidUsers: DatabaseDealer[] = [
    { 
      ID: 23456789,
      USR_ID: 23456789,
      FIRSTNAME: 'Bid',
      LASTNAME: 'User 1',
      PHONE: null,
      MOBILEPHONE: null,
      NOTE: 'System bid user',
      LASTLOGIN: null,
      LASTBIDDATE: null,
      LASTBUY: null,
      TYPE: 'Bid User 1',
      companyName: 'Smith Motors Ltd',
      companyType: 'Independent Dealer',
      city: 'Manchester',
      country: 'United Kingdom'
    },
    { 
      ID: 34567890,
      USR_ID: 34567890,
      FIRSTNAME: 'Bid',
      LASTNAME: 'User 2',
      PHONE: null,
      MOBILEPHONE: null,
      NOTE: 'System bid user',
      LASTLOGIN: null,
      LASTBIDDATE: null,
      LASTBUY: null,
      TYPE: 'Bid User 2',
      companyName: 'Johnson Auto Group',
      companyType: 'Franchise Dealer',
      city: 'Birmingham',
      country: 'United Kingdom'
    }
  ];

  // Fallback mock dealers in case Supabase fails
  // These are in DatabaseDealer format as they simulate coming from the database
  private fallbackDealers: DatabaseDealer[] = [
    { 
      ID: 12345678,
      USR_ID: 12345678,
      FIRSTNAME: 'KAM',
      LASTNAME: 'Demo Account',
      PHONE: '123456789',
      MOBILEPHONE: '987654321',
      NOTE: 'Demo account',
      LASTLOGIN: '14 May 2023, 10:30',
      LASTBIDDATE: '10 May 2023, 15:45',
      LASTBUY: '05 May 2023, 11:20',
      TYPE: 'Standard',
      companyName: 'KAM Automotive',
      companyType: 'Dealership',
      city: 'London',
      country: 'United Kingdom'
    },
    { 
      ID: 45678901,
      USR_ID: 45678901,
      FIRSTNAME: 'Michael',
      LASTNAME: 'Brown',
      PHONE: '111222333',
      MOBILEPHONE: '333222111',
      NOTE: 'VIP customer',
      LASTLOGIN: '13 May 2023, 09:15',
      LASTBIDDATE: '11 May 2023, 14:30',
      LASTBUY: '01 May 2023, 16:45',
      TYPE: 'VIP',
      companyName: 'Brown\'s Premium Cars',
      companyType: 'Luxury Dealer',
      city: 'Edinburgh',
      country: 'United Kingdom'
    },
    { 
      ID: 56789012,
      USR_ID: 56789012,
      FIRSTNAME: 'Sarah',
      LASTNAME: 'Wilson',
      PHONE: '444555666',
      MOBILEPHONE: '666555444',
      NOTE: 'Premium customer',
      LASTLOGIN: '12 May 2023, 16:40',
      LASTBIDDATE: '09 May 2023, 11:20',
      LASTBUY: '03 May 2023, 15:10',
      TYPE: 'Premium',
      companyName: 'Wilson Automotive',
      companyType: 'Multi-Brand Dealer',
      city: 'Glasgow',
      country: 'United Kingdom'
    }
  ];

  // Inject dependencies
  private supabaseService = inject(SupabaseService);

  /**
   * Fetches dealers from Supabase and returns them in the unified Dealer format
   * @returns Observable<Dealer[]> - Array of dealers in the unified format
   */
  getDealers(): Observable<Dealer[]> {
    const supabaseQuery = this.supabaseService.getClient()
      .from('loggedInDealers')
      .select('*');

    return from(supabaseQuery).pipe(
      map(({ data, error }) => {
        if (error) {
          console.warn('Error fetching dealers from Supabase:', error);
        }
        
        let databaseDealers: DatabaseDealer[];
        
        if (!data || data.length === 0) {
          console.info('No dealers found in database, using fallback data');
          databaseDealers = [...this.fallbackDealers, ...this.mockBidUsers];
        } else {
          // Cast data to DatabaseDealer[] and combine with mock bid users
          const dbDealers = data as DatabaseDealer[];
          databaseDealers = [...dbDealers, ...this.mockBidUsers];
        }
        
        // Transform all DatabaseDealer objects to unified Dealer format
        return this.transformDealersFromDatabase(databaseDealers);
      }),
      catchError((err: any) => {
        console.error('Error in getDealers:', err);
        const combinedFallback = [...this.fallbackDealers, ...this.mockBidUsers];
        return of(this.transformDealersFromDatabase(combinedFallback));
      }),
      tap(dealers => {
        console.info(`Successfully loaded ${dealers.length} dealers in unified format`);
      })
    );
  }
  
  /**
   * Transforms an array of DatabaseDealer objects to the unified Dealer format
   * @param databaseDealers Array of dealers in database format
   * @returns Array of dealers in unified format
   */
  private transformDealersFromDatabase(databaseDealers: DatabaseDealer[]): Dealer[] {
    return databaseDealers.map(dbDealer => {
      try {
        // Ensure all required database fields exist and format dates if needed
        const processedDbDealer: DatabaseDealer = {
          ...dbDealer,
          // Ensure ID fields are properly set
          ID: dbDealer.ID || dbDealer.USR_ID,
          USR_ID: dbDealer.USR_ID || dbDealer.ID,
          // Format dates if they're Date objects instead of strings
          LASTLOGIN: this.formatDateField(dbDealer.LASTLOGIN),
          LASTBIDDATE: this.formatDateField(dbDealer.LASTBIDDATE),
          LASTBUY: this.formatDateField(dbDealer.LASTBUY),
          // Ensure required fields have defaults
          FIRSTNAME: dbDealer.FIRSTNAME || '',
          LASTNAME: dbDealer.LASTNAME || '',
          TYPE: dbDealer.TYPE || 'Standard'
        };
        
        // Transform to unified format
        return databaseToDealerModel(processedDbDealer);
      } catch (error) {
        console.error('Error transforming dealer:', dbDealer, error);
        // Return a fallback dealer in case of transformation error
        return databaseToDealerModel({
          ID: 0,
          USR_ID: 0,
          FIRSTNAME: 'Unknown',
          LASTNAME: 'Dealer',
          TYPE: 'Standard'
        });
      }
    });
  }
  
  /**
   * Formats a date field from the database
   * @param dateValue The date value from the database
   * @returns Formatted date string or null
   */
  private formatDateField(dateValue: string | Date | null | undefined): string | null {
    if (!dateValue) {
      return null;
    }
    
    if (typeof dateValue === 'string') {
      return dateValue;
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toLocaleString('en-GB');
    }
    
    return null;
  }
}