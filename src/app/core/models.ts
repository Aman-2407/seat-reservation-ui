// These mirror the JSON the Spring service returns (note the snake_case names).
export interface SeatView {
  seat_no: string;
  status: 'available' | 'held' | 'confirmed';
}

export interface Show {
  id: number;
  name: string;
  price_paise: number;
  per_user_limit: number;
  total_seats: number;
  available: number;
  held: number;
  confirmed: number;
  seats: SeatView[];
}

export interface Reservation {
  reservation_id: string;
  show_id: number;
  user_id: string;
  seats: string[];
  amount_paise: number;
  status: string; // 'confirmed' or 'cancelled'
}
