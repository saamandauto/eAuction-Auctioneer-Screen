import { Injectable } from '@angular/core';
import { Observable, from, catchError, of, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Dealer } from '../models/interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DealerService {
  // Mock bid users that aren't stored in the database but are needed for the application
  private mockBidUsers: Dealer[] = [
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
  private fallbackDealers: Dealer[] = [
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

  constructor(private supabaseService: SupabaseService) {}

  getDealers(): Observable<Dealer[]> {
    return from(
      this.supabaseService.getClient()
        .from('loggedInDealers')
        .select('*')
    ).pipe(
      tap(response => {
        if (response.error) {
          // Error in Supabase response
        }
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          const combinedFallback = [...this.fallbackDealers, ...this.mockBidUsers];
          return this.prepareDealerData(combinedFallback);
        }
        
        // Combine with mock bid users
        const allDealers = [...data, ...this.mockBidUsers];
        return this.prepareDealerData(allDealers);
      }),
      catchError(err => {
        const combinedFallback = [...this.fallbackDealers, ...this.mockBidUsers];
        return of(this.prepareDealerData(combinedFallback));
      }),
      tap(dealers => {
        // Final dealers array ready
      })
    );
  }
  
  private prepareDealerData(dealers: any[]): Dealer[] {
    return dealers.map(dealer => {
      // Check individual dealer before transformation

      // ID field workaround
      let dealerId = dealer.ID;
      if (dealerId === undefined) {
        // Check USR_ID next
        dealerId = dealer.USR_ID;
      }

      // Ensure all fields exist
      const preparedDealer = {
        ...dealer,
        // Make sure ID exists and is properly set
        ID: dealerId,
        // Format dates if needed
        LASTLOGIN: dealer.LASTLOGIN ? 
          (typeof dealer.LASTLOGIN === 'string' ? dealer.LASTLOGIN : new Date(dealer.LASTLOGIN).toLocaleString('en-GB')) : 
          null,
        LASTBIDDATE: dealer.LASTBIDDATE ? 
          (typeof dealer.LASTBIDDATE === 'string' ? dealer.LASTBIDDATE : new Date(dealer.LASTBIDDATE).toLocaleString('en-GB')) : 
          null,
        LASTBUY: dealer.LASTBUY ? 
          (typeof dealer.LASTBUY === 'string' ? dealer.LASTBUY : new Date(dealer.LASTBUY).toLocaleString('en-GB')) : 
          null,
        // Ensure USR_ID exists
        USR_ID: dealer.USR_ID || dealer.ID,
        FIRSTNAME: dealer.FIRSTNAME || '',
        LASTNAME: dealer.LASTNAME || '',
        TYPE: dealer.TYPE || 'Standard'
      };
      
      return preparedDealer;
    });
  }
}