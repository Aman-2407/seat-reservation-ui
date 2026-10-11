import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from './config';
import { Reservation, Show } from './models';
import { Session } from './session';

// The only place that talks HTTP. Identity goes in the Authorization header,
// never in the request body, which matches how the backend reads it.
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private session = inject(Session);

  private bearer(token: string) {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getShow(id: number) {
    return firstValueFrom(this.http.get<Show>(`${API_BASE}/shows/${id}`));
  }

  createShow(body: { name: string; seats: string[]; price_paise: number }) {
    return firstValueFrom(
      this.http.post<Show>(`${API_BASE}/shows`, body, { headers: this.bearer(this.session.adminToken()) }),
    );
  }

  // observe: 'response' so the caller can tell 201 (new booking) from 200 (retry, original returned)
  reserve(showId: number, seats: string[], idempotencyKey: string) {
    return firstValueFrom(
      this.http.post<Reservation>(
        `${API_BASE}/shows/${showId}/reserve`,
        { seats, idempotency_key: idempotencyKey },
        { headers: this.bearer(this.session.userToken()), observe: 'response' },
      ),
    );
  }

  cancel(reservationId: string) {
    return firstValueFrom(
      this.http.post<Reservation>(`${API_BASE}/reservations/${reservationId}/cancel`, null, {
        headers: this.bearer(this.session.userToken()),
      }),
    );
  }
}
