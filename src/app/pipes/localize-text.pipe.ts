import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'localizeText',
  standalone: true
})
export class LocalizeTextPipe implements PipeTransform {
  private localizationService = inject(LocalizationService);

  transform(path: string, filename: string, key: string, fallback?: string): string {
    return this.localizationService.getText(path, filename, key, fallback);
  }
}