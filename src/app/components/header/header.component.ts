import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { LocalizationService } from '../../services/localization.service';

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
  @Input() currentDateTime: string = '';
  @Input() isAuctionStarted: boolean = false;
  @Input() isViewingLots: boolean = true;
  @Input() simulatedBiddingEnabled: boolean = false;

  @Output() startAuction = new EventEmitter<void>();
  @Output() endAuction = new EventEmitter<void>();
  @Output() toggleView = new EventEmitter<void>();
  @Output() toggleSimulatedBidding = new EventEmitter<boolean>();
  @Output() openSettings = new EventEmitter<void>();

  voiceEnabled = false;
  hasCreditsError = false;
  isListening = false;
  showShortcutsInUI = false;
  
  get isListeningValue(): boolean {
    return this.isListening;
  }
  
  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  // Inject dependencies
  private voiceService = inject(VoiceService);
  private speechRecognitionService = inject(SpeechRecognitionService);
  private keyboardShortcutService = inject(KeyboardShortcutService);
  public localizationService = inject(LocalizationService);

  ngOnInit() {
    this.voiceService.getVoiceEnabled()
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => this.voiceEnabled = enabled);
    
    this.voiceService.getHasCreditsError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasError => this.hasCreditsError = hasError);
    
    this.speechRecognitionService.getIsListening()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isListening => this.isListening = isListening);
    
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

    this.keyboardShortcutService.getShowShortcutsInUI()
      .pipe(takeUntil(this.destroy$))
      .subscribe(show => this.showShortcutsInUI = show);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartAuction() {
    this.startAuction.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      this.voiceService.speak('Auction started.');
    }
  }

  onEndAuction() {
    this.endAuction.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      this.voiceService.speak('Auction ended.');
    }
  }
  
  onToggleView() {
    this.toggleView.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      const message = this.isViewingLots ? 
        'Viewing auction interface.' : 
        'Viewing planned lots.';
      this.voiceService.speak(message);
    }
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

  onToggleShowShortcuts() {
    this.keyboardShortcutService.setShowShortcutsInUI(this.showShortcutsInUI);
  }

  onOpenSettings() {
    this.openSettings.emit();
  }
}