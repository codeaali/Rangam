import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Movie } from '../types';

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .order('name');

      if (moviesError) throw moviesError;

      const { data: showsData, error: showsError } = await supabase
        .from('shows')
        .select('*');

      if (showsError) throw showsError;

      // Calculate available seats for each show
      const { data: bookingItems, error: bookingError } = await supabase
        .from('booking_items')
        .select('show_id, seats');

      if (bookingError) throw bookingError;

      const bookedSeatsMap: Record<string, number> = {};
      bookingItems?.forEach((item) => {
        bookedSeatsMap[item.show_id] = (bookedSeatsMap[item.show_id] || 0) + item.seats;
      });

      const moviesWithShows: Movie[] = (moviesData || []).map((movie) => ({
        ...movie,
        shows: (showsData || [])
          .filter((show) => show.movie_id === movie.id)
          .sort((a, b) => new Date(a.show_time).getTime() - new Date(b.show_time).getTime())
          .map((show) => ({
            ...show,
            available_seats: show.seat_limit - (bookedSeatsMap[show.id] || 0),
          })),
      }));

      setMovies(moviesWithShows);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return { movies, loading, error, refetch: fetchMovies };
}
