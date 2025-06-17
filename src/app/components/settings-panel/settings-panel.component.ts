import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { SoundService } from '../../services/sound.service';
import { AuctionStateService } from '../../auction/auction-state.service';
import { SeedService } from '../../services/seed.service';
import { LocalizationService, LanguageOption, CurrencyOption } from '../../services/localization.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss']
})
export class SettingsPanelComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  showShortcutsInUI = false;
  voiceEnabled = false;
  soundEnabled = true;
  simulatedBiddingEnabled = false;
  skipConfirmations = false;
  hammerRequiresReserveMet = false;
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
  currentLocale = 'en_GB';
  availableCurrencies: CurrencyOption[] = [];
  selectedCurrencyCode = 'GBP';
  
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private voiceService: VoiceService,
    private speechRecognitionService: SpeechRecognitionService,
    private soundService: SoundService,
    private auctionState: AuctionStateService,
    private seedService: SeedService,
    public localizationService: LocalizationService
  ) {
    this.keyboardShortcutService.getShowShortcutsInUI().subscribe(
      show => this.showShortcutsInUI = show
    );
    
    this.voiceService.getVoiceEnabled().subscribe(
      enabled => this.voiceEnabled = enabled
    );
    
    this.soundService.getSoundEnabled().subscribe(
      enabled => this.soundEnabled = enabled
    );
    
    this.auctionState.getSimulatedBiddingEnabledObservable().subscribe(
      enabled => this.simulatedBiddingEnabled = enabled
    );
    
    this.auctionState.getSkipConfirmationsObservable().subscribe(
      skip => this.skipConfirmations = skip
    );
    
    this.auctionState.select('hammerRequiresReserveMet').subscribe(
      required => this.hammerRequiresReserveMet = required
    );

    // Initialize localization settings
    this.availableLanguages = this.localizationService.availableLanguages;
    this.availableCurrencies = this.localizationService.availableCurrencies;
    
    this.localizationService.getCurrentLocale().subscribe(
      locale => this.currentLocale = locale
    );
    
    this.localizationService.getCurrentCurrency().subscribe(
      currency => this.selectedCurrencyCode = currency
    );
  }
  
  onToggleShowShortcuts() {
    this.keyboardShortcutService.setShowShortcutsInUI(this.showShortcutsInUI);
  }
  
  onToggleVoice() {
    this.voiceService.toggleVoice();
  }
  
  onToggleSound() {
    this.soundService.setSoundEnabled(this.soundEnabled);
  }
  
  onToggleSimulatedBidding() {
    this.auctionState.setSimulatedBiddingEnabled(this.simulatedBiddingEnabled);
  }
  
  onToggleSkipConfirmations() {
    this.auctionState.setSkipConfirmations(this.skipConfirmations);
  }
  
  onToggleHammerRequiresReserveMet() {
    this.auctionState.setState({ hammerRequiresReserveMet: this.hammerRequiresReserveMet });
  }
  
  onSpeechRecognitionSensitivityChanged() {
    this.speechRecognitionService.setSensitivity(this.speechRecognitionSensitivity);
  }
  
  onSelectedVoiceChanged() {
    this.voiceService.setSelectedVoice(this.selectedVoice);
  }

  onLanguageChange() {
    this.localizationService.setLocale(this.currentLocale);
  }

  onCurrencyChange() {
    this.localizationService.setCurrentCurrency(this.selectedCurrencyCode);
  }

  onSeedAuctionData() {
    this.isSeedingAuctionData = true;
    this.seedService.seedAuctionData().subscribe({
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
    this.seedService.seedLots().subscribe({
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
    this.seedService.seedMessages().subscribe({
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
    this.seedService.seedLotUserActivity().subscribe({
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
    this.seedService.seedContent().subscribe({
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
    this.seedService.seedHeaderContent().subscribe({
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
    this.close.emit();
  }
}