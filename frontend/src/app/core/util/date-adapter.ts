import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * The stock NativeDateAdapter formats dates by locale but parses typed text as US (MM/DD/YYYY).
 * This adapter parses typed dates as DD/MM/YYYY (or YYYY-MM-DD) so that what the user types
 * matches what the picker displays.
 */
@Injectable()
export class DayFirstDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value);
    const text = value.trim();
    if (!text) return null;

    const dayFirst = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    const [y, m, d] = dayFirst ? [+dayFirst[3], +dayFirst[2], +dayFirst[1]] : iso ? [+iso[1], +iso[2], +iso[3]] : [0, 0, 0];
    if (!y) return this.invalid();

    const date = new Date(y, m - 1, d);
    const real = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    return real ? date : this.invalid();
  }
}
