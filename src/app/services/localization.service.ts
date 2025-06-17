import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, catchError, of, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuctionDataService } from './auction-data.service';
import { ToastrService } from 'ngx-toastr';

export interface LocalizedContent {
  system: number;
  locale: string;
  path: string;
  filename: string;
  key: string;
  value: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private readonly STORAGE_KEY = 'auction_locale';
  private readonly CURRENCY_STORAGE_KEY = 'auction_currency';
  
  // Available languages
  public readonly availableLanguages: LanguageOption[] = [
    { code: 'en_GB', name: 'English (UK)', nativeName: 'English (UK)' },
    { code: 'da_DK', name: 'Danish (DK)', nativeName: 'Dansk (DK)' }
  ];

  // Available currencies
  public readonly availableCurrencies: CurrencyOption[] = [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' }
  ];
  
  // Current locale and currency state - initialized with fallback defaults
  private currentLocale = new BehaviorSubject<string>('en_GB');
  private currentCurrency = new BehaviorSubject<string>('GBP');
  
  // Content cache and initialization state
  private contentCache = new Map<string, string>();
  private isInitialized = false;

  constructor(
    private supabaseService: SupabaseService,
    private auctionDataService: AuctionDataService,
    private toastr: ToastrService
  ) {
    this.initialize();
  }

  /**
   * Initialize the localization service
   */
  private initialize(): void {
    this.auctionDataService.getAuctionData().subscribe({
      next: (auctionData) => {
        this.setupLocalizationSettings(auctionData.defaultLocale, auctionData.defaultCurrency);
      },
      error: (error) => {
        console.error('Error loading auction data for localization:', error);
        // Use fallback defaults and continue
        this.setupLocalizationSettings('en_GB', 'GBP');
      }
    });
  }

  /**
   * Setup localization settings with database defaults and user overrides
   */
  private setupLocalizationSettings(defaultLocale: string, defaultCurrency: string): void {
    // Determine final locale: user preference > database default > hardcoded fallback
    const userLocale = this.getStoredLocale();
    const finalLocale = userLocale || defaultLocale || 'en_GB';
    
    // Determine final currency: user preference > database default > hardcoded fallback
    const userCurrency = this.getStoredCurrency();
    const finalCurrency = userCurrency || defaultCurrency || 'GBP';
    
    // Validate the selected locale and currency
    const validLocale = this.availableLanguages.some(lang => lang.code === finalLocale) 
      ? finalLocale : 'en_GB';
    const validCurrency = this.availableCurrencies.some(curr => curr.code === finalCurrency) 
      ? finalCurrency : 'GBP';
    
    // Set the validated values
    this.currentLocale.next(validLocale);
    this.currentCurrency.next(validCurrency);
    
    // Mark as initialized and load content
    this.isInitialized = true;
    this.loadContent();
    
    // Set up locale change subscription after initialization
    this.setupLocaleChangeSubscription();
  }

  /**
   * Set up subscription to reload content when locale changes
   */
  private setupLocaleChangeSubscription(): void {
    this.currentLocale.subscribe(locale => {
      if (this.isInitialized) {
        this.loadContent();
      }
    });
  }

  /**
   * Get the current locale as an observable
   */
  getCurrentLocale(): Observable<string> {
    return this.currentLocale.asObservable();
  }

  /**
   * Get the current locale value
   */
  getCurrentLocaleValue(): string {
    return this.currentLocale.value;
  }

  /**
   * Set the current locale
   */
  setLocale(locale: string): void {
    if (this.availableLanguages.some(lang => lang.code === locale)) {
      this.currentLocale.next(locale);
      this.storeLocale(locale);
      this.toastr.success(`Language changed to ${this.getLanguageName(locale)}`);
    } else {
      this.toastr.error(`Unsupported locale: ${locale}`);
    }
  }

  /**
   * Get the current currency as an observable
   */
  getCurrentCurrency(): Observable<string> {
    return this.currentCurrency.asObservable();
  }

  /**
   * Get the current currency value
   */
  getCurrentCurrencyValue(): string {
    return this.currentCurrency.value;
  }

  /**
   * Set the current currency
   */
  setCurrentCurrency(currencyCode: string): void {
    if (this.availableCurrencies.some(curr => curr.code === currencyCode)) {
      this.currentCurrency.next(currencyCode);
      this.storeCurrency(currencyCode);
      this.toastr.success(`Currency changed to ${this.getCurrencyName(currencyCode)}`);
    } else {
      this.toastr.error(`Unsupported currency: ${currencyCode}`);
    }
  }

  /**
   * Format a price with the current currency symbol
   */
  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const currency = this.availableCurrencies.find(curr => curr.code === this.currentCurrency.value);
    const symbol = currency ? currency.symbol : '£';
    
    return `${symbol}${value.toLocaleString()}`;
  }

  /**
   * Format mileage with the appropriate unit based on locale
   */
  formatMileage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const unit = this.getText('components', 'shared', 'mileageUnit', 'km');
    return `${value.toLocaleString()} ${unit}`;
  }

  /**
   * Get localized text for a given key
   */
  getText(path: string, filename: string, key: string, fallback?: string): string {
    const cacheKey = this.buildCacheKey(path, filename, key);
    const text = this.contentCache.get(cacheKey);
    
    if (text !== undefined) {
      return text;
    }
    
    // Return fallback or a placeholder if not found
    return fallback || `${path}.${filename}.${key}`;
  }

  /**
   * Get localized text as an observable that updates when locale changes
   */
  getTextObservable(path: string, filename: string, key: string, fallback?: string): Observable<string> {
    return this.currentLocale.pipe(
      map(() => this.getText(path, filename, key, fallback))
    );
  }

  /**
   * Get the display name of a language by its code
   */
  getLanguageName(code: string): string {
    const language = this.availableLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  /**
   * Get the display name of a currency by its code
   */
  getCurrencyName(code: string): string {
    const currency = this.availableCurrencies.find(curr => curr.code === code);
    return currency ? currency.name : code;
  }

  /**
   * Refresh content from the server
   */
  refreshContent(): void {
    if (this.isInitialized) {
      this.loadContent();
    }
  }

  /**
   * Load content from Supabase for the current locale
   */
  private loadContent(): void {
    const locale = this.currentLocale.value;
    
    from(
      this.supabaseService.getClient()
        .from('content')
        .select('*')
        .eq('system', 1)
        .eq('locale', locale)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data || [];
      }),
      tap(content => {
        // Clear existing cache for this locale
        this.clearCacheForLocale();
        
        // Populate cache with new content
        content.forEach(item => {
          const cacheKey = this.buildCacheKey(item.path, item.filename, item.key);
          this.contentCache.set(cacheKey, item.value);
        });
      }),
      catchError(error => {
        console.error('Error loading localization content:', error);
        this.toastr.error('Failed to load localization content');
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Build cache key for a content item
   */
  private buildCacheKey(path: string, filename: string, key: string): string {
    return `${this.currentLocale.value}:${path}:${filename}:${key}`;
  }

  /**
   * Clear cache for the current locale
   */
  private clearCacheForLocale(): void {
    const locale = this.currentLocale.value;
    const keysToDelete = Array.from(this.contentCache.keys()).filter(key => key.startsWith(`${locale}:`));
    keysToDelete.forEach(key => this.contentCache.delete(key));
  }

  /**
   * Get stored locale from localStorage (returns null if not found)
   */
  private getStoredLocale(): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.availableLanguages.some(lang => lang.code === stored)) {
        return stored;
      }
    } catch (error) {
      // localStorage might not be available in some environments
    }
    return null;
  }

  /**
   * Store locale in localStorage
   */
  private storeLocale(locale: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, locale);
    } catch (error) {
      // localStorage might not be available in some environments
    }
  }

  /**
   * Get stored currency from localStorage (returns null if not found)
   */
  private getStoredCurrency(): string | null {
    try {
      const stored = localStorage.getItem(this.CURRENCY_STORAGE_KEY);
      if (stored && this.availableCurrencies.some(curr => curr.code === stored)) {
        return stored;
      }
    } catch (error) {
      // localStorage might not be available in some environments
    }
    return null;
  }

  /**
   * Store currency in localStorage
   */
  private storeCurrency(currencyCode: string): void {
    try {
      localStorage.setItem(this.CURRENCY_STORAGE_KEY, currencyCode);
    } catch (error) {
      // localStorage might not be available in some environments
    }
  }
}