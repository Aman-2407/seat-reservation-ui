import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { Reservation } from '../../core/models';
import { Session } from '../../core/session';
import { errorMessage, rupees } from '../../core/util';

@Component({
  selector: 'app-reservations',
  imports: [RouterLink],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private api = inject(Api);
  protected session = inject(Session);
  protected rupees = rupees;

  busyId = signal('');
  error = signal('');

  async cancel(r: Reservation) {
    this.error.set('');
    this.busyId.set(r.reservation_id);
    try {
      const updated = await this.api.cancel(r.reservation_id);
      this.session.upsert(updated);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busyId.set('');
    }
  }
}
