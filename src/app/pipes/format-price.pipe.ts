import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'formatPrice',
  standalone: true
})
export class FormatPricePipe implements PipeTransform {
  private localizationService = inject(LocalizationService);

  transform(value: number | null | undefined): string {
    return this.localizationService.formatPrice(value);
  }
}