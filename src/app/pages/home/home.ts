import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { DEMO_SHOW_ID } from '../../core/config';
import { Session } from '../../core/session';
import { errorMessage } from '../../core/util';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private api = inject(Api);
  private router = inject(Router);
  protected session = inject(Session);

  // a show that already exists on the live service, so visitors can try booking without the admin token
  demoShowId = DEMO_SHOW_ID;

  showId = '';
  name = 'friday-night';
  rows = 5;
  perRow = 10;
  priceRupees = 250;

  busy = signal(false);
  error = signal('');

  open() {
    const id = Number(this.showId);
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Enter a valid show id');
      return;
    }
    this.router.navigate(['/shows', id]);
  }

  async create() {
    this.error.set('');
    if (this.rows < 1 || this.rows > 26 || this.perRow < 1 || this.perRow > 100) {
      this.error.set('Rows must be 1-26 and seats per row 1-100');
      return;
    }
    this.busy.set(true);
    try {
      // seats are labelled A1..A10, B1..B10 and so on
      const seats: string[] = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 1; c <= this.perRow; c++) seats.push(String.fromCharCode(65 + r) + c);
      }
      // rupees to integer paise, because the backend never accepts decimals for money
      const price_paise = Math.round(this.priceRupees * 100);
      const show = await this.api.createShow({ name: this.name, seats, price_paise });
      this.router.navigate(['/shows', show.id]);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
