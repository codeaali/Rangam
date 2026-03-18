export interface Movie {
  id: string;
  name: string;
  poster_url?: string;
  shows: Show[];
}

export interface Show {
  id: string;
  movie_id: string;
  show_time: string;
  seat_limit: number;
  available_seats?: number;
}

export interface BookingFormValues {
  name: string;
  email: string;
  phone: string;
}

export interface SelectedShow {
  movieId: string;
  showId: string;
  seats: number;
}

export interface BookingResponse {
  bookingId: string;
  movies: {
    movieName: string;
    posterUrl?: string;
    showTime: string;
    seats: number;
  }[];
}
