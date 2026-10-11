import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { SeatView, Show } from '../../core/models';
import { Session } from '../../core/session';
import { errorMessage, isNetworkError, rupees } from '../../core/util';

interface SeatRow {
  label: string;
  seats: SeatView[];
}

@Component({
  selector: 'app-show-page',
  imports: [RouterLink],
  templateUrl: './show-page.html',
  styleUrl: './show-page.css',
})
export class ShowPage implements OnInit, OnDestroy {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  protected session = inject(Session);
  protected rupees = rupees;

  showId = Number(this.route.snapshot.paramMap.get('id'));
  show = signal<Show | null>(null);
  selected = signal<string[]>([]);
  message = signal<{ kind: 'ok' | 'err'; text: string } | null>(null);
  loadError = signal('');
  busy = signal(false);

  // total in paise for the current selection (integers all the way)
  total = computed(() => this.selected().length * (this.show()?.price_paise ?? 0));

  // Groups seats into rows by their letter prefix (A1, A2 -> row A) and sorts them
  // by the number, because the backend returns them as text order (A1, A10, A2).
  rows = computed<SeatRow[]>(() => {
    const s = this.show();
    if (!s) return [];
    const byRow = new Map<string, SeatView[]>();
    for (const seat of s.seats) {
      const label = /^[A-Za-z]+/.exec(seat.seat_no)?.[0].toUpperCase() ?? '#';
      const list = byRow.get(label) ?? [];
      list.push(seat);
      byRow.set(label, list);
    }
    const num = (x: SeatView) => parseInt(x.seat_no.replace(/\D/g, ''), 10) || 0;
    return [...byRow.entries()]
      .sort(([a], [b]) => a.length - b.length || a.localeCompare(b))
      .map(([label, seats]) => ({ label, seats: seats.sort((x, y) => num(x) - num(y)) }));
  });

  private timer?: ReturnType<typeof setInterval>;
  private refreshing = false;
  // One idempotency key per "attempt": if the network drops and I press Reserve again,
  // the same key is reused, so the backend can never book twice.
  private idemKey: string | null = null;

  ngOnInit() {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 3000); // live view while others book
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  async refresh() {
    if (this.refreshing) return; // a slow (cold-start) response must not pile up more requests
    this.refreshing = true;
    try {
      this.show.set(await this.api.getShow(this.showId));
      this.loadError.set('');
    } catch (e) {
      this.loadError.set(errorMessage(e));
    } finally {
      this.refreshing = false;
    }
  }

  pct(part: number, whole: number) {
    return whole ? (part / whole) * 100 : 0;
  }

  // "A12" in row "A" is displayed as "12"
  seatText(seatNo: string, rowLabel: string) {
    return rowLabel === '#' ? seatNo : seatNo.slice(rowLabel.length);
  }

  seatClass(seatNo: string, status: string) {
    return this.selected().includes(seatNo) ? 'seat selected' : `seat ${status}`;
  }

  toggle(seatNo: string, status: string) {
    if (status !== 'available') return;
    this.idemKey = null; // a different selection is a different request
    this.selected.update(list =>
      list.includes(seatNo) ? list.filter(s => s !== seatNo) : [...list, seatNo],
    );
  }

  async reserve() {
    if (this.selected().length === 0) return;
    this.busy.set(true);
    this.message.set(null);
    this.idemKey ??= crypto.randomUUID();
    try {
      const res = await this.api.reserve(this.showId, this.selected(), this.idemKey);
      const r = res.body!;
      this.session.upsert(r);
      this.message.set({
        kind: 'ok',
        text:
          res.status === 200
            ? `Already booked earlier, the retry returned the original: ${r.seats.join(', ')}`
            : `Booked ${r.seats.join(', ')} for ${rupees(r.amount_paise)}`,
      });
      this.selected.set([]);
      this.idemKey = null;
    } catch (e) {
      this.message.set({ kind: 'err', text: errorMessage(e) });
      // keep the key only when we never got an answer, so a retry is safe
      if (!isNetworkError(e)) this.idemKey = null;
    } finally {
      this.busy.set(false);
      await this.refresh();
    }
  }
}
