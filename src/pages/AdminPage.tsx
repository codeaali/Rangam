import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  Film, Plus, Trash2, RefreshCw, Users,
  Clock, ChevronDown, ChevronUp, AlertCircle, Check, Lock, Eye, EyeOff, UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/cn';

// ── Credentials (client-side gate for school use) ──────────
const ADMIN_EMAIL = 'admin@haca.com';
const ADMIN_PASSWORD = 'Admin@Haca';

// ── Types ───────────────────────────────────────────────────
interface AdminMovie { id: string; name: string; }
interface AdminShow { id: string; movie_id: string; show_time: string; seat_limit: number; booked: number; }

// ── Login Form ───────────────────────────────────────────────
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<{ email: string; password: string }>();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (data: { email: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_authed', '1');
        onSuccess();
      } else {
        setError('password', { message: 'Invalid email or password' });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="bg-white rounded-3xl p-8 movie-shadow border border-[#33130d]/5">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a41e22] shadow-lg shadow-[#a41e22]/30">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="font-cinematic text-2xl font-bold text-[#33130d]">Admin Access</h1>
              <p className="text-sm font-medium text-[#33130d]/60">CineSchool Festival</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@haca.com"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-9 text-[#33130d]/40 hover:text-[#a41e22] transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs font-semibold text-[#33130d]/50 hover:text-[#a41e22] transition-colors">
              ← Back to Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────
export function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [shows, setShows] = useState<AdminShow[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'bookings'>('movies');
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null);
  const [filterShowId, setFilterShowId] = useState<string>('');
  const [checkins, setCheckins] = useState<Record<string, string>>({}); // booking_item_id -> checkin_id
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const movieForm = useForm<{ name: string; poster: FileList }>();
  const showForm = useForm<{ movie_id: string; show_time: string; seat_limit: number }>();

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [moviesRes, showsRes, bookingsRes, itemsRes, checkinsRes] = await Promise.all([
        supabase.from('movies').select('*').order('name'),
        supabase.from('shows').select('*').order('show_time'),
        supabase.from('bookings').select('id, booking_id, created_at, users(name, email, phone)').order('created_at', { ascending: false }),
        supabase.from('booking_items').select('id, booking_id, show_id, seats, shows(show_time, movies(name))'),
        supabase.from('checkins').select('*'),
      ]);

      const checkinMap: Record<string, string> = {};
      (checkinsRes.data || []).forEach(c => {
        checkinMap[c.booking_item_id] = c.id;
      });
      setCheckins(checkinMap);

      setMovies(moviesRes.data || []);

      const itemsByShow: Record<string, number> = {};
      (itemsRes.data || []).forEach((i: any) => {
        itemsByShow[i.show_id] = (itemsByShow[i.show_id] || 0) + i.seats;
      });
      setShows((showsRes.data || []).map((s: any) => ({ ...s, booked: itemsByShow[s.id] || 0 })));

      const itemsByBooking: Record<string, any[]> = {};
      (itemsRes.data || []).forEach((i: any) => {
        if (!itemsByBooking[i.booking_id]) itemsByBooking[i.booking_id] = [];
        itemsByBooking[i.booking_id].push(i);
      });
      setBookings(
        (bookingsRes.data || []).map((b: any) => ({
          ...b,
          booking_items: itemsByBooking[b.id] || [],
        }))
      );
    } catch {
      showToast('Failed to load data', false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data once logged in
  const handleLogin = () => {
    setAuthed(true);
    fetchAll();
  };

  // Show login gate if not authenticated
  if (!authed) return <LoginGate onSuccess={handleLogin} />;

  // Fetch on first render when already authed
  if (loading && movies.length === 0 && !authed) fetchAll();
  if (authed && movies.length === 0 && !loading) fetchAll();

  const addMovie = async (data: { name: string; poster: FileList }) => {
    setIsUploading(true);
    let poster_url = null;

    try {
      if (data.poster && data.poster.length > 0) {
        const file = data.poster[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posters')
          .getPublicUrl(fileName);

        poster_url = publicUrl;
      }

      const { error } = await supabase.from('movies').insert({
        name: data.name.trim(),
        poster_url,
      });

      if (error) { throw error; }

      showToast('Movie added!');
      movieForm.reset();
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to add movie', false);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMovie = async (id: string) => {
    if (!confirm('Delete this movie and all its shows?')) return;
    await supabase.from('shows').delete().eq('movie_id', id);
    await supabase.from('movies').delete().eq('id', id);
    showToast('Movie deleted');
    fetchAll();
  };

  const addShow = async (data: { movie_id: string; show_time: string; seat_limit: number }) => {
    const { error } = await supabase.from('shows').insert({
      movie_id: data.movie_id,
      show_time: new Date(data.show_time).toISOString(),
      seat_limit: Number(data.seat_limit),
    });
    if (error) { showToast('Failed to add show', false); return; }
    showToast('Show added!');
    showForm.reset();
    fetchAll();
  };

  const deleteShow = async (id: string) => {
    if (!confirm('Delete this show?')) return;
    await supabase.from('shows').delete().eq('id', id);
    fetchAll();
  };

  const handleCheckIn = async (bookingItemId: string) => {
    if (checkins[bookingItemId]) {
      // Already checked in, maybe undo? (Optional, let's just show success)
      return;
    }

    try {
      const { error } = await supabase.from('checkins').insert({
        booking_item_id: bookingItemId
      });

      if (error) throw error;
      
      showToast('User checked in!');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
  };

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl animate-slide-up',
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#33130d]/10 bg-[#f9f0e7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-12 items-center justify-center">
              <img src="/logo.png" alt="Festival Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-cinematic font-bold text-[#33130d] leading-none text-xl">Admin Panel</h1>
              <p className="text-xs text-[#33130d]/60 leading-none mt-1 font-medium tracking-wide">FESTIVAL 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAll}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
            <Link to="/" className="text-xs font-semibold text-[#33130d]/50 hover:text-[#a41e22] transition-colors ml-2">
              ← Booking
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Movies', value: movies.length, icon: Film },
            { label: 'Shows', value: shows.length, icon: Clock },
            { label: 'Bookings', value: bookings.length, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-5 text-center movie-shadow border border-[#33130d]/5">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f9f0e7] text-[#a41e22]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-cinematic text-3xl font-bold text-[#33130d]">{value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-[#33130d]/50 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-xl p-1 bg-[#33130d]/5">
          {(['movies', 'bookings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all capitalize',
                activeTab === tab ? 'bg-white text-[#33130d] shadow-sm' : 'text-[#33130d]/60 hover:text-[#33130d]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#33130d]/10 border-t-[#a41e22]" />
          </div>
        ) : activeTab === 'movies' ? (
          <div className="space-y-6">
            {/* Add Movie */}
            <div className="bg-white rounded-2xl p-6 movie-shadow border border-[#33130d]/5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#33130d]/50">Add Movie</h2>
              <form onSubmit={movieForm.handleSubmit(addMovie)} className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Movie Title" placeholder="e.g. Interstellar" {...movieForm.register('name', { required: true })} />
                  <Input label="Poster Image" type="file" accept="image/*" {...movieForm.register('poster')} />
                </div>
                <Button type="submit" loading={isUploading}><Plus className="h-4 w-4" /> Add Movie</Button>
              </form>
            </div>

            {/* Add Show */}
            <div className="bg-white rounded-2xl p-6 movie-shadow border border-[#33130d]/5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#33130d]/50">Add Show</h2>
              <form onSubmit={showForm.handleSubmit(addShow)} className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#33130d] pl-1">Movie</label>
                  <select
                    className="bg-white rounded-xl px-4 py-3.5 text-[15px] text-[#33130d] border border-[#33130d]/10 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#a41e22]/20 focus:border-[#a41e22] w-full hover:border-[#33130d]/30"
                    {...showForm.register('movie_id', { required: true })}
                  >
                    <option value="" className="bg-white">Select movie…</option>
                    {movies.map((m) => (
                      <option key={m.id} value={m.id} className="bg-white">{m.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Date & Time" type="datetime-local" {...showForm.register('show_time', { required: true })} />
                <Input label="Seat Limit" type="number" min={1} max={500} placeholder="e.g. 100" {...showForm.register('seat_limit', { required: true })} />
                <Button type="submit" className="sm:col-span-3 mt-1"><Plus className="h-4 w-4" /> Add Show</Button>
              </form>
            </div>

            {/* Movies List */}
            <div className="space-y-4">
              {movies.map((movie) => {
                const movieShows = shows.filter((s) => s.movie_id === movie.id);
                const isExpanded = expandedMovie === movie.id;
                return (
                  <div key={movie.id} className="bg-white rounded-2xl overflow-hidden movie-shadow border border-[#33130d]/5">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex bg-[#f9f0e7] rounded p-2 text-[#a41e22]">
                          <Film className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-[#33130d]">{movie.name}</span>
                        <span className="rounded-full bg-[#f9f0e7] border border-[#33130d]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#33130d]/60">
                          {movieShows.length} show{movieShows.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpandedMovie(isExpanded ? null : movie.id)} className="text-[#33130d]/40 border border-transparent hover:bg-[#33130d]/5 p-2 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteMovie(movie.id)} className="text-[#33130d]/40 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && movieShows.length > 0 && (
                      <div className="border-t border-[#33130d]/5 bg-[#f9f0e7]/50 p-4 space-y-2">
                        {movieShows.map((show) => (
                          <div key={show.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white border border-[#33130d]/5 px-4 py-3 shadow-sm">
                            <span className="text-sm font-semibold text-[#33130d]">
                              {new Date(show.show_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-semibold text-[#33130d]/60">{show.booked}/{show.seat_limit} booked</span>
                              <div className="h-2 w-24 rounded-full bg-[#33130d]/10 overflow-hidden">
                                <div className="h-full rounded-full bg-[#a41e22]" style={{ width: `${Math.min(100, (show.booked / show.seat_limit) * 100)}%` }} />
                              </div>
                              <button onClick={() => deleteShow(show.id)} className="text-[#33130d]/40 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter */}
            <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 movie-shadow border border-[#33130d]/5">
              <span className="text-sm font-bold uppercase tracking-widest text-[#33130d]/50">Filter Bookings</span>
              <select
                className="bg-[#f9f0e7] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#33130d] border border-[#33130d]/10 focus:outline-none focus:ring-2 focus:ring-[#a41e22]/20"
                value={filterShowId}
                onChange={(e) => setFilterShowId(e.target.value)}
              >
                <option value="" className="bg-white">All Shows & Timings</option>
                {shows.map((s) => {
                  const m = movies.find(m => m.id === s.movie_id);
                  return (
                    <option key={s.id} value={s.id} className="bg-white">
                      {m?.name} — {new Date(s.show_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-4">
              {(() => {
                const filteredBookings = filterShowId
                  ? bookings.filter((b) => b.booking_items.some((i: any) => i.show_id === filterShowId))
                  : bookings;

                if (filteredBookings.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl py-16 text-center border border-[#33130d]/5">
                      <p className="text-[#33130d]/50 font-medium">No bookings found.</p>
                    </div>
                  );
                }

                return filteredBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl p-6 movie-shadow border border-[#33130d]/5">
                    <div className="flex items-start justify-between gap-4 border-b border-[#33130d]/5 pb-4 mb-4">
                      <div>
                        <div className="font-mono font-bold text-[#a41e22] text-sm tracking-wider">{b.booking_id}</div>
                        <p className="mt-1 text-lg font-bold text-[#33130d] leading-none">{b.users?.name}</p>
                        <p className="text-sm font-medium text-[#33130d]/60 mt-1">{b.users?.email} · {b.users?.phone}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#33130d]/40 whitespace-nowrap bg-[#f9f0e7] px-2 py-1 rounded-md">
                        {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    {b.booking_items.length > 0 && (
                      <div className="space-y-2">
                        {b.booking_items.map((item: any, i: number) => {
                          const isCheckedIn = !!checkins[item.id];
                          return (
                            <div key={i} className="flex items-center justify-between rounded-xl bg-[#f9f0e7]/50 px-4 py-3">
                              <div className="flex-1">
                                <span className="font-semibold text-[#33130d] text-sm block">{item.shows?.movies?.name}</span>
                                <span className="text-xs font-medium text-[#33130d]/60">
                                  {item.shows?.show_time ? new Date(item.shows.show_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-[#a41e22] bg-[#a41e22]/10 px-2 py-0.5 rounded-md text-sm">1 Seat</span>
                                {isCheckedIn ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                    <UserCheck className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Checked In</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleCheckIn(item.id)}
                                    className="flex items-center gap-1.5 bg-[#33130d] text-white px-3 py-1.5 rounded-lg hover:bg-[#a41e22] transition-all hover:shadow-md active:scale-95 group"
                                  >
                                    <UserCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white">Check In</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
