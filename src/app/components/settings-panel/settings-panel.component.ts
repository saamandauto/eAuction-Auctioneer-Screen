import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, combineLatest, map, takeUntil } from 'rxjs';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { SoundService } from '../../services/sound.service';
import { AuctionStateService } from '../../auction/auction-state.service';
import { SeedService } from '../../services/seed.service';
import { LocalizationService, LanguageOption, CurrencyOption } from '../../services/localization.service';

// Interface for the combined view state
interface SettingsViewState {
  showShortcutsInUI: boolean;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  simulatedBiddingEnabled: boolean;
  skipConfirmations: boolean;
  hammerRequiresReserveMet: boolean;
  currentLocale: string;
  selectedCurrencyCode: string;
}

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss']
})
export class SettingsPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() panelClose = new EventEmitter<void>(); // Renamed from 'close'
  
  // Combined view state observable
  viewState$: Observable<SettingsViewState>;
  
  speechRecognitionSensitivity = 0.5;
  activeTab = 'general';
  availableVoices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Daniel (UK Male)' },
    { id: 'AZnz4mQRbjc5FGsdAnNL', name: 'Sarah (UK Female)' }
  ]; 
  selectedVoice = '21m00Tcm4TlvDq8ikWAM';
  
  // Data seeding state
  isSeedingLots = false;
  isSeedingMessages = false;
  isSeedingActivity = false;
  isSeedingAuctionData = false;
  isSeedingContent = false;
  isSeedingHeaderContent = false;
  
  // Localization settings
  availableLanguages: LanguageOption[] = [];
  availableCurrencies: CurrencyOption[] = [];

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();
  
  // Inject dependencies using inject() pattern
  private keyboardShortcutService = inject(KeyboardShortcutService);
  private voiceService = inject(VoiceService);
  private speechRecognitionService = inject(SpeechRecognitionService);
  private soundService = inject(SoundService);
  private auctionState = inject(AuctionStateService);
  private seedService = inject(SeedService);
  public localizationService = inject(LocalizationService);

  constructor() {
    // Create combined view state observable in constructor
    this.viewState$ = combineLatest([
      this.keyboardShortcutService.getShowShortcutsInUI(),
      this.voiceService.getVoiceEnabled(),
      this.soundService.getSoundEnabled(),
      this.auctionState.getSimulatedBiddingEnabledObservable(),
      this.auctionState.getSkipConfirmationsObservable(),
      this.auctionState.select('hammerRequiresReserveMet'),
      this.localizationService.getCurrentLocale(),
      this.localizationService.getCurrentCurrency()
    ]).pipe(
      map(([
        showShortcutsInUI,
        voiceEnabled,
        soundEnabled,
        simulatedBiddingEnabled,
        skipConfirmations,
        hammerRequiresReserveMet,
        currentLocale,
        selectedCurrencyCode
      ]) => ({
        showShortcutsInUI,
        voiceEnabled,
        soundEnabled,
        simulatedBiddingEnabled,
        skipConfirmations,
        hammerRequiresReserveMet,
        currentLocale,
        selectedCurrencyCode
      })),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    // Initialize localization settings
    this.availableLanguages = this.localizationService.availableLanguages;
    this.availableCurrencies = this.localizationService.availableCurrencies;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onToggleShowShortcuts(value: boolean) {
    this.keyboardShortcutService.setShowShortcutsInUI(value);
  }
  
  onToggleVoice() {
    this.voiceService.toggleVoice();
  }
  
  onToggleSound(value: boolean) {
    this.soundService.setSoundEnabled(value);
  }
  
  onToggleSimulatedBidding(value: boolean) {
    this.auctionState.setSimulatedBiddingEnabled(value);
  }
  
  onToggleSkipConfirmations(value: boolean) {
    this.auctionState.setSkipConfirmations(value);
  }
  
  onToggleHammerRequiresReserveMet(value: boolean) {
    this.auctionState.setState({ hammerRequiresReserveMet: value });
  }
  
  onSpeechRecognitionSensitivityChanged() {
    this.speechRecognitionService.setSensitivity(this.speechRecognitionSensitivity);
  }
  
  onSelectedVoiceChanged() {
    this.voiceService.setSelectedVoice(this.selectedVoice);
  }

  onLanguageChange(value: string) {
    this.localizationService.setLocale(value);
  }

  onCurrencyChange(value: string) {
    this.localizationService.setCurrentCurrency(value);
  }

  onSeedAuctionData() {
    this.isSeedingAuctionData = true;
    this.seedService.seedAuctionData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingAuctionData = false;
        },
        error: (error) => {
          this.isSeedingAuctionData = false;
        }
      });
  }
  
  onSeedLots() {
    this.isSeedingLots = true;
    this.seedService.seedLots()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingLots = false;
        },
        error: (error) => {
          this.isSeedingLots = false;
        }
      });
  }
  
  onSeedMessages() {
    this.isSeedingMessages = true;
    this.seedService.seedMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingMessages = false;
        },
        error: (error) => {
          this.isSeedingMessages = false;
        }
      });
  }
  
  onSeedLotUserActivity() {
    this.isSeedingActivity = true;
    this.seedService.seedLotUserActivity()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingActivity = false;
        },
        error: (error) => {
          this.isSeedingActivity = false;
        }
      });
  }

  onSeedContent() {
    this.isSeedingContent = true;
    this.seedService.seedContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingContent = false;
          // Refresh the localization content after seeding
          this.localizationService.refreshContent();
        },
        error: (error) => {
          this.isSeedingContent = false;
        }
      });
  }

  onSeedHeaderContent() {
    this.isSeedingHeaderContent = true;
    this.seedService.seedHeaderContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSeedingHeaderContent = false;
          // Refresh the localization content after seeding
          this.localizationService.refreshContent();
        },
        error: (error) => {
          this.isSeedingHeaderContent = false;
        }
      });
  }
  
  onClose() {
    this.panelClose.emit();
  }
}