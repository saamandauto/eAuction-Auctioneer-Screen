import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'formatMileage',
  standalone: true
})
export class FormatMileagePipe implements PipeTransform {
  private localizationService = inject(LocalizationService);

  transform(value: number | null | undefined): string {
    return this.localizationService.formatMileage(value);
  }
}