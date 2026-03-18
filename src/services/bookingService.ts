import { supabase } from '../lib/supabase';
import type { BookingFormValues, SelectedShow, BookingResponse } from '../types';

function generateBookingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SCHMOV-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createBooking(
  formData: BookingFormValues,
  selections: SelectedShow[],
  movies: { id: string; name: string; poster_url?: string; shows: { id: string; show_time: string; seat_limit: number; available_seats?: number }[] }[]
): Promise<BookingResponse> {
  // 1. Validate seat availability
  for (const selection of selections) {
    const movie = movies.find((m) => m.id === selection.movieId);
    const show = movie?.shows.find((s) => s.id === selection.showId);

    if (!show) throw new Error('Show not found');

    const { data: bookedData, error: bookedError } = await supabase
      .from('booking_items')
      .select('seats')
      .eq('show_id', selection.showId);

    if (bookedError) throw bookedError;

    const bookedSeats = bookedData?.reduce((sum, item) => sum + item.seats, 0) || 0;
    const available = show.seat_limit - bookedSeats;

    if (selection.seats > available) {
      throw new Error(`Not enough seats for "${movie?.name}". Only ${available} seat(s) remaining.`);
    }
  }

  // 2. Create or find user
  let userId: string;

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', formData.email)
    .single();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ name: formData.name, email: formData.email, phone: formData.phone })
      .select('id')
      .single();

    if (userError) throw userError;
    userId = newUser!.id;
  }

  // 3. Create booking
  const bookingId = generateBookingId();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({ booking_id: bookingId, user_id: userId })
    .select('id')
    .single();

  if (bookingError) throw bookingError;

  // 4. Create booking items
  const items = selections.map((s) => ({
    booking_id: booking!.id,
    show_id: s.showId,
    seats: s.seats,
  }));

  const { error: itemsError } = await supabase.from('booking_items').insert(items);
  if (itemsError) throw itemsError;

  // 5. Build response
  const responseMovies = selections.map((s) => {
    const movie = movies.find((m) => m.id === s.movieId)!;
    const show = movie.shows.find((sh) => sh.id === s.showId)!;
    return {
      movieName: movie.name,
      posterUrl: movie.poster_url,
      showTime: show.show_time,
      seats: s.seats,
    };
  });

  return { bookingId, movies: responseMovies };
}
