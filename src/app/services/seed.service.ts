import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  private supabaseUrl = environment.supabase.url;
  private supabaseAnonKey = environment.supabase.anonKey;

  // Inject dependencies
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  seedLots(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-lots`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Lots seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding lots: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }

  seedMessages(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-messages`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Messages seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding messages: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }

  seedLotUserActivity(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-lot-user-activity`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Lot user activity data seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding lot user activity: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }
  
  seedAuctionData(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-auction-data`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Auction data seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding auction data: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }

  seedContent(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-content`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Localization content seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding localization content: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }

  seedHeaderContent(): Observable<unknown> {
    const functionUrl = `${this.supabaseUrl}/functions/v1/seed-header-content`;
    
    return this.http.post(functionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(_response => {
        this.toastr.success('Header content seeded successfully');
      }),
      catchError(error => {
        this.toastr.error(`Error seeding header content: ${error.message || 'Unknown error'}`);
        return of({ success: false, error: error.message || 'Unknown error' });
      })
    );
  }
}