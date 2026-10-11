import { Injectable, signal } from '@angular/core';
import { Reservation } from './models';

// Holds "who I am" (the token) and my own reservations.
// The backend has no "list my reservations" endpoint, so the browser keeps its own copy
// in localStorage, one list per user token.
@Injectable({ providedIn: 'root' })
export class Session {
  userToken = signal(localStorage.getItem('userToken') ?? 'user-1');
  adminToken = signal(localStorage.getItem('adminToken') ?? '');
  reservations = signal<Reservation[]>(this.load());

  setUser(token: string) {
    const t = token.trim();
    this.userToken.set(t);
    localStorage.setItem('userToken', t);
    this.reservations.set(this.load()); // switch to that user's list
  }

  setAdmin(token: string) {
    const t = token.trim();
    this.adminToken.set(t);
    localStorage.setItem('adminToken', t);
  }

  // add a new reservation, or replace an existing one (used after cancel)
  upsert(r: Reservation) {
    this.reservations.update(list => [r, ...list.filter(x => x.reservation_id !== r.reservation_id)]);
    localStorage.setItem(this.storageKey(), JSON.stringify(this.reservations()));
  }

  private storageKey() {
    return `reservations:${this.userToken()}`;
  }

  private load(): Reservation[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey()) ?? '[]');
    } catch {
      return [];
    }
  }
}
