import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private static supabaseInstance: SupabaseClient | null = null;

  /**
   * Get the singleton Supabase client instance
   * This ensures only one client exists in the entire application
   */
  getClient(): SupabaseClient {
    if (!SupabaseService.supabaseInstance) {
      SupabaseService.supabaseInstance = createClient(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            flowType: 'implicit'
          },
          global: {
            headers: {
              'X-Client-Info': 'auction-app'
            }
          }
        }
      );
    }
    
    return SupabaseService.supabaseInstance;
  }
}