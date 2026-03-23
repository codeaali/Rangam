import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Trash2, Clock, Film, Users, RefreshCw, 
  Check, Edit2, Save, X, ExternalLink, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/cn';

interface Movie { id: string; name: string; poster_url?: string | null; }
interface Show { id: string; movie_id: string; show_time: string; seat_limit: number; booked: number; }
interface Booking { id: string; booking_id: string; created_at: string; users: { name: string; email: string; phone: string }; booking_items: any[] }

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'admin@rangam') {
      sessionStorage.setItem('admin_authed', 'true');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f0e7] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-8 movie-shadow border border-[#33130d]/5 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Rangam Logo" className="h-20 object-contain" />
        </div>
        <h1 className="font-cinematic text-3xl font-bold text-[#33130d] mb-2 uppercase tracking-tighter">Admin Access</h1>
        <p className="text-[#33130d]/40 text-sm font-medium mb-8">Enter the master key to continue</p>
        <div className="space-y-4 text-left">
          <Input
            label="Security Pin"
            type="password"
            placeholder="Passcode"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(false); }}
            error={error ? 'Invalid key' : undefined}
          />
          <Button type="submit" className="w-full py-4 text-base shadow-xl">Authenticate</Button>
        </div>
      </form>
    </div>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('admin_authed') === 'true');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'bookings' | 'checkin'>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const movieForm = useForm<{ name: string; poster: FileList }>();
  const showForm = useForm<{ movie_id: string; show_time: string; seat_limit: number }>();

  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovieName, setEditingMovieName] = useState('');
  const [editingMoviePoster, setEditingMoviePoster] = useState<FileList | null>(null);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [editingShowTime, setEditingShowTime] = useState('');
  const [editingShowSeats, setEditingShowSeats] = useState<number>(0);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [moviesRes, showsRes, bookingsRes, itemsRes] = await Promise.all([
        supabase.from('movies').select('*').order('name'),
        supabase.from('shows').select('*').order('show_time'),
        supabase.from('bookings').select('id, booking_id, created_at, users(name, email, phone)').order('created_at', { ascending: false }),
        supabase.from('booking_items').select('id, booking_id, show_id, seats, shows(show_time, movies(name))'),
      ]);

      setMovies(moviesRes.data || []);
      
      const showsWithStats = (showsRes.data || []).map((s: any) => ({
        ...s,
        booked: (itemsRes.data || [])
          .filter((i: any) => i.show_id === s.id)
          .reduce((sum: number, i: any) => sum + i.seats, 0)
      }));
      setShows(showsWithStats);

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

  const handleLogin = () => {
    setAuthed(true);
    fetchAll();
  };

  if (!authed) return <LoginGate onSuccess={handleLogin} />;
  if (authed && movies.length === 0 && !loading) fetchAll();

  const addMovie = async (data: { name: string; poster: FileList }) => {
    setIsUploading(true);
    let poster_url = null;
    try {
      if (data.poster && data.poster.length > 0) {
        const file = data.poster[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName);
        poster_url = publicUrl;
      }
      const { error } = await supabase.from('movies').insert({ name: data.name.trim(), poster_url });
      if (error) throw error;
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

  const updateMovie = async (id: string, currentPosterUrl?: string | null) => {
    if (!editingMovieName.trim()) return;
    setIsUploading(true);
    let poster_url = currentPosterUrl;
    try {
      if (editingMoviePoster && editingMoviePoster.length > 0) {
        const file = editingMoviePoster[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName);
        poster_url = publicUrl;
      }
      const { error } = await supabase.from('movies').update({ name: editingMovieName.trim(), poster_url }).eq('id', id);
      if (error) throw error;
      showToast('Movie updated!');
      setEditingMovieId(null);
      setEditingMoviePoster(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Update failed', false);
    } finally {
      setIsUploading(false);
    }
  };

  const updateShow = async (id: string) => {
    if (editingShowSeats <= 0) return;
    try {
      const { error } = await supabase.from('shows').update({
        show_time: new Date(editingShowTime).toISOString(),
        seat_limit: editingShowSeats
      }).eq('id', id);
      if (error) throw error;
      showToast('Show updated!');
      setEditingShowId(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Update failed', false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
  };

  return (
    <div className="min-h-screen">
      {toast && (
        <div className={cn('fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl animate-slide-up', toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')}>
          <Check className="h-4 w-4" />
          {toast.msg}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#33130d]/10 bg-[#f9f0e7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="flex h-14 w-18 items-center justify-center -ml-2">
              <img src="/logo.png" alt="Rangam Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:support.rangamfilmfestival@gmail.com" className="hidden lg:flex items-center gap-2 text-[#33130d]/40 hover:text-[#a41e22] transition-colors border-r border-[#33130d]/10 pr-6 mr-2">
              <Mail className="h-4 w-4" />
              <span className="text-[11px] font-bold tracking-tight lowercase">support.rangamfilmfestival@gmail.com</span>
            </a>
            <Button variant="ghost" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button variant="danger" size="sm" onClick={logout}>Sign Out</Button>
            <Link to="/" className="text-xs font-semibold text-[#33130d]/50 hover:text-[#a41e22] ml-4">← Booking</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[ { label: 'Movies', value: movies.length, icon: Film }, { label: 'Shows', value: shows.length, icon: Clock }, { label: 'Bookings', value: bookings.length, icon: Users } ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-5 text-center movie-shadow border border-[#33130d]/5">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f9f0e7] text-[#a41e22]"><Icon className="h-5 w-5" /></div>
              <p className="font-cinematic text-3xl font-bold text-[#33130d]">{value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-[#33130d]/50 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 rounded-xl p-1 bg-[#33130d]/5">
          {(['movies', 'bookings', 'checkin'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all capitalize', activeTab === tab ? 'bg-white text-[#33130d] shadow-sm' : 'text-[#33130d]/60 hover:text-[#33130d]')}>
              {tab === 'checkin' ? 'Check-In' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'movies' ? (
          <div className="space-y-6">
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

            <div className="bg-white rounded-2xl p-6 movie-shadow border border-[#33130d]/5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#33130d]/50">Add Show</h2>
              <form onSubmit={showForm.handleSubmit(addShow)} className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#33130d] pl-1">Target Movie</label>
                  <select className="bg-[#f9f0e7] rounded-xl px-4 py-3.5 text-sm font-semibold text-[#33130d] border border-[#33130d]/10" {...showForm.register('movie_id', { required: true })}>
                    <option value="">Select Movie</option>
                    {movies.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <Input label="Show Time" type="datetime-local" {...showForm.register('show_time', { required: true })} />
                <Input label="Seats" type="number" placeholder="Seat Limit" {...showForm.register('seat_limit', { required: true })} />
                <Button type="submit" className="sm:col-span-3">Add Showtime</Button>
              </form>
            </div>

            <div className="grid gap-6">
              {movies.map((movie: Movie) => (
                <div key={movie.id} className="bg-white rounded-2xl overflow-hidden movie-shadow border border-[#33130d]/5">
                  <div className="p-6">
                    {editingMovieId === movie.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-[#f9f0e7] p-4 rounded-xl items-end">
                        <Input label="Movie Name" value={editingMovieName} onChange={(e) => setEditingMovieName(e.target.value)} placeholder="Movie Name" className="bg-white" />
                        <Input label="New Poster" type="file" accept="image/*" onChange={(e) => setEditingMoviePoster(e.target.files)} className="bg-white" />
                        <div className="flex gap-2">
                          <Button onClick={() => updateMovie(movie.id, movie.poster_url)} loading={isUploading} className="flex-1 bg-emerald-600"><Save className="h-4 w-4" /></Button>
                          <Button variant="ghost" onClick={() => setEditingMovieId(null)} className="flex-1"><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {movie.poster_url && <img src={movie.poster_url} className="h-12 w-10 object-cover rounded shadow-sm" />}
                          <h3 className="text-xl font-bold text-[#33130d]">{movie.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingMovieId(movie.id); setEditingMovieName(movie.name); }} className="p-2 hover:bg-[#33130d]/5 rounded-lg text-[#33130d]/60"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteMovie(movie.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {shows.filter(s => s.movie_id === movie.id).map(show => (
                        <div key={show.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f9f0e7]/50 rounded-xl gap-4">
                          {editingShowId === show.id ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 items-end">
                              <Input label="Show Time" type="datetime-local" value={editingShowTime} onChange={(e) => setEditingShowTime(e.target.value)} />
                              <Input label="Total Seats" type="number" value={editingShowSeats.toString()} onChange={(e) => setEditingShowSeats(Number(e.target.value))} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateShow(show.id)} className="flex-1 bg-emerald-600"><Save className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingShowId(null)} className="flex-1"><X className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-bold text-[#33130d]">{new Date(show.show_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                <p className="text-xs font-semibold opacity-40">{show.booked}/{show.seat_limit} Tickets Reserved</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingShowId(show.id); setEditingShowTime(new Date(show.show_time).toISOString()); setEditingShowSeats(show.seat_limit); }} className="p-2 hover:bg-white rounded-lg text-[#33130d]/40 hover:text-[#a41e22]"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => deleteShow(show.id)} className="p-2 hover:bg-white rounded-lg text-[#33130d]/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-4">
            {bookings.map((b: Booking) => (
              <div key={b.id} className="bg-white rounded-2xl p-6 movie-shadow border border-[#33130d]/5">
                <div className="flex justify-between border-b pb-4 mb-4">
                  <div>
                    <div className="font-mono text-[#a41e22] font-bold text-sm tracking-widest">{b.booking_id}</div>
                    <div className="text-lg font-bold">{b.users?.name}</div>
                    <div className="text-sm opacity-60">{b.users?.email} · {b.users?.phone}</div>
                  </div>
                  <div className="text-right text-[10px] font-bold opacity-30 uppercase tracking-widest">
                    {new Date(b.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="grid gap-2">
                  {b.booking_items.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs font-bold text-[#33130d] bg-[#f9f0e7] p-3 rounded-lg flex justify-between items-center">
                      <span>{item.shows?.movies?.name}</span>
                      <span className="opacity-60">{new Date(item.shows?.show_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#33130d]/10">
            <ExternalLink className="h-12 w-12 mx-auto mb-4 text-[#a41e22] opacity-40" />
            <h2 className="text-xl font-bold mb-4">Manage Check-Ins</h2>
            <Link to="/admin/checkin">
              <Button size="lg">Open Check-In Portal</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
