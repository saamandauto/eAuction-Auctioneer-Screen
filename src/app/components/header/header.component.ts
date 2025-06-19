import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, combineLatest, map, takeUntil } from 'rxjs';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { LocalizationService } from '../../services/localization.service';

// Interface for the combined view state
interface HeaderViewState {
  voiceEnabled: boolean;
  hasCreditsError: boolean;
  isListening: boolean;
  showShortcutsInUI: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() auctionTitle = '';
  @Input() auctionId = '';
  @Input() auctionDate = '';
  @Input() auctionCompany = '';
  @Input() currentDateTime = ''; // Removed ': string'
  @Input() isAuctionStarted = false; // Removed ': boolean'
  @Input() isViewingLots = true; // Removed ': boolean'
  @Input() simulatedBiddingEnabled = false; // Removed ': boolean'

  @Output() startAuction = new EventEmitter<void>();
  @Output() endAuction = new EventEmitter<void>();
  @Output() toggleView = new EventEmitter<void>();
  @Output() toggleSimulatedBidding = new EventEmitter<boolean>();
  @Output() openSettings = new EventEmitter<void>();

  // Combined view state observable
  viewState$: Observable<HeaderViewState>;
  
  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  // Inject dependencies using inject() pattern
  private voiceService = inject(VoiceService);
  private speechRecognitionService = inject(SpeechRecognitionService);
  private keyboardShortcutService = inject(KeyboardShortcutService);
  public localizationService = inject(LocalizationService);

  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.voiceService.getVoiceEnabled(),
      this.voiceService.getHasCreditsError(),
      this.speechRecognitionService.getIsListening(),
      this.keyboardShortcutService.getShowShortcutsInUI()
    ]).pipe(
      map(([voiceEnabled, hasCreditsError, isListening, showShortcutsInUI]) => ({
        voiceEnabled,
        hasCreditsError,
        isListening,
        showShortcutsInUI
      })),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    // Listen for speech recognition commands
    this.speechRecognitionService.getCommandDetected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(command => {
        if (command === 'start auction' && !this.isAuctionStarted) {
          this.onStartAuction();
        } else if (command === 'end auction' && this.isAuctionStarted) {
          this.onEndAuction();
        } else if (command === 'toggle simulation' || command === 'start simulation' || command === 'stop simulation') {
          this.onToggleSimulatedBidding();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartAuction() {
    this.startAuction.emit();
    // Voice feedback will be handled by the service that receives this event
  }

  onEndAuction() {
    this.endAuction.emit();
    // Voice feedback will be handled by the service that receives this event
  }
  
  onToggleView() {
    this.toggleView.emit();
    // Voice feedback will be handled by the service that receives this event
  }

  onToggleSimulatedBidding() {
    // Emit the boolean value directly without double negation
    this.toggleSimulatedBidding.emit(this.simulatedBiddingEnabled);
    // Removed speech for simulation toggle
  }

  toggleVoice() {
    this.voiceService.toggleVoice();
  }
  
  toggleSpeechRecognition() {
    this.speechRecognitionService.toggleListening();
  }

  onOpenSettings() {
    this.openSettings.emit();
  }
}