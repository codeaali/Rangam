import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AlertCircle, ShoppingCart, X, Ticket } from 'lucide-react';
import { useMovies } from '../hooks/useMovies';
import { createBooking } from '../services/bookingService';
import { MovieCard } from '../components/ui/MovieCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { SelectedShow, BookingFormValues } from '../types';

export function BookingPage() {
  const navigate = useNavigate();
  const { movies, loading, error, refetch } = useMovies();
  const [selections, setSelections] = useState<SelectedShow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>();

  const handleShowSelect = (movieId: string, showId: string) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.movieId === movieId);
      if (existing?.showId === showId) {
        // deselect
        return prev.filter((s) => s.movieId !== movieId);
      }
      if (existing) {
        return prev.map((s) => (s.movieId === movieId ? { ...s, showId, seats: 1 } : s));
      }
      return [...prev, { movieId, showId, seats: 1 }];
    });
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (selections.length === 0) {
      setSubmitError('Please select at least one movie and showtime.');
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const response = await createBooking(data, selections, movies);
      navigate('/confirmation', { state: { booking: response, name: data.name } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMovies = selections.length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#33130d]/10 bg-[#f9f0e7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-12 items-center justify-center">
              <img src="/logo.png" alt="Festival Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-cinematic font-bold text-[#33130d] leading-none text-xl">CineSchool</h1>
              <p className="text-xs text-[#33130d]/60 leading-none mt-1 font-medium tracking-wide">FESTIVAL 2026</p>
            </div>
          </div>
          {selections.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-[#33130d]/5 border border-[#33130d]/10 px-3 py-1.5">
              <ShoppingCart className="h-4 w-4 text-[#a41e22]" />
              <span className="text-sm font-semibold text-[#33130d]">
                {totalMovies} movie{totalMovies !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-14 text-center animate-slide-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#a41e22]/20 bg-[#a41e22]/5 px-4 py-1.5 text-xs font-semibold text-[#a41e22] tracking-wider uppercase">
            <Ticket className="h-3.5 w-3.5" />
            Booking Open
          </div>
          <h2 className="font-cinematic text-4xl font-bold text-[#33130d] sm:text-6xl mb-4 leading-tight">
            Short Film Festival<br/>
            <span className="text-[#a41e22]">2026</span>
          </h2>
          <p className="text-lg text-[#33130d]/70 max-w-lg mx-auto leading-relaxed">
            Reserve your complimentary screenings for the premier student film event of the year.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#33130d]/10 border-t-[#a41e22]" />
            <p className="text-[#33130d]/60 font-medium">Loading screenings…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="h-12 w-12 text-[#a41e22]" />
            <p className="text-[#33130d] font-medium">{error}</p>
            <Button variant="ghost" onClick={refetch}>Try again</Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            
            {/* Step 2: Contact Info */}
            <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#33130d] text-white font-bold text-sm">1</span>
                <h3 className="font-cinematic text-2xl font-bold text-[#33130d]">Your Details</h3>
              </div>
              <div className="bg-white rounded-2xl p-6 sm:p-8 movie-shadow border border-[#33130d]/5">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                    })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      error={errors.phone?.message}
                      {...register('phone', { required: 'Phone is required' })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 1: Movie Grid */}
            <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#33130d] text-white font-bold text-sm">2</span>
                <h3 className="font-cinematic text-2xl font-bold text-[#33130d]">Select Screenings</h3>
              </div>
              
              {movies.length === 0 ? (
                <div className="bg-white rounded-2xl py-16 text-center border border-[#33130d]/5">
                  <div className="mx-auto h-16 w-16 mb-4 opacity-20 grayscale">
                    <img src="/logo.png" alt="Festival Logo" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[#33130d]/60 font-medium">No screenings available yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      selectedShow={selections.find((s) => s.movieId === movie.id)}
                      onShowSelect={handleShowSelect}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Summary strip */}
            {selections.length > 0 && (
              <section className="bg-white rounded-2xl p-5 movie-shadow border border-[#33130d]/5 animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#33130d]/50 mb-1">
                    Your Selection
                  </p>
                  <p className="font-cinematic font-bold text-lg text-[#33130d]">
                    {totalMovies} Screening{totalMovies !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selections.map((sel) => {
                    const movie = movies.find((m) => m.id === sel.movieId);
                    const show = movie?.shows.find((s) => s.id === sel.showId);
                    if (!movie || !show) return null;
                    return (
                      <div
                        key={sel.movieId}
                        className="flex items-center gap-2 rounded-lg bg-[#f9f0e7] border border-[#33130d]/10 px-3 py-1.5 text-sm"
                      >
                        <span className="font-semibold text-[#33130d]">{movie.name}</span>
                        <span className="text-[#33130d]/60 text-xs font-medium">
                          {new Date(show.show_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelections((p) => p.filter((s) => s.movieId !== sel.movieId))}
                          className="text-[#33130d]/40 hover:text-[#a41e22] transition-colors ml-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f9f0e7] via-[#f9f0e7] to-transparent z-40 pb-6">
              <div className="max-w-4xl mx-auto mt-2">
                {submitError && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#a41e22] movie-shadow">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="pt-0.5">{submitError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  className="w-full text-lg py-4 shadow-xl"
                  disabled={selections.length === 0}
                >
                  Book Screening{totalMovies > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
