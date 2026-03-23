import { useState, useEffect } from 'react';
import { 
  Search, UserCheck, ArrowLeft, RefreshCw, Check, AlertCircle, Loader2, X, ChevronRight, Calendar, Film, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

interface Movie { id: string; name: string; poster_url?: string; }
interface Show { id: string; movie_id: string; show_time: string; seat_limit: number; movie_name?: string; }
interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  movie_name: string;
  show_time: string;
  booking_id: string;
  created_at: string;
  checked_in_at?: string;
}

export function CheckInPage() {
  const [step, setStep] = useState<'movie' | 'show' | 'list'>('movie');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkedParticipants, setCheckedParticipants] = useState<Participant[]>([]);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMovies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('movies').select('*').order('name');
    if (!error) setMovies(data || []);
    setLoading(false);
  };

  const fetchShows = async (movieId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('shows').select('*').eq('movie_id', movieId).order('show_time');
    if (!error) setShows(data || []);
    setLoading(false);
  };

  const fetchList = async (movieName: string, showTime: string) => {
    setLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase
        .from('participants')
        .select('*')
        .eq('movie_name', movieName)
        .eq('show_time', showTime);
        
      const { data: cData, error: cErr } = await supabase
        .from('checked_in_participants')
        .select('*')
        .eq('movie_name', movieName)
        .eq('show_time', showTime);
        
      if (!pErr) setParticipants(pData || []);
      if (!cErr) setCheckedParticipants(cData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'movie') fetchMovies();
    else if (step === 'show' && selectedMovie) fetchShows(selectedMovie.id);
    else if (step === 'list' && selectedMovie && selectedShow) {
      fetchList(selectedMovie.name, selectedShow.show_time);
      
      const channel = supabase
        .channel('checkin-move-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchList(selectedMovie.name, selectedShow.show_time))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checked_in_participants' }, () => fetchList(selectedMovie.name, selectedShow.show_time))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [step, selectedMovie, selectedShow]);

  const handleCheckIn = async (participant: Participant) => {
    setCheckingIn(participant.id);
    try {
      const { checked_in_at, ...cleanInfo } = participant as any;
      const { error: insErr } = await supabase.from('checked_in_participants').insert({
        ...cleanInfo,
        checked_in_at: new Date().toISOString()
      });
      if (insErr) throw insErr;
      const { error: delErr } = await supabase.from('participants').delete().eq('id', participant.id);
      if (delErr) throw delErr;
      showToast('Checked in!');
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleUndoCheckIn = async (participant: Participant) => {
    if (!window.confirm(`Undo ${participant.name}?`)) return;
    setCheckingIn(participant.id);
    try {
      const { checked_in_at, ...originalInfo } = participant as any;
      const { error: insErr } = await supabase.from('participants').insert(originalInfo);
      if (insErr) throw insErr;
      const { error: delErr } = await supabase.from('checked_in_participants').delete().eq('id', participant.id);
      if (delErr) throw delErr;
      showToast('Check-in undone!');
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredItems = [...participants, ...checkedParticipants].filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.booking_id.toLowerCase().includes(s);
  }).sort((a, b) => {
    const aChecked = !!a.checked_in_at;
    const bChecked = !!b.checked_in_at;
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-[#f9f0e7]/30">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl animate-slide-up',
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#33130d]/10 bg-[#f9f0e7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (step === 'movie') window.history.back();
                else if (step === 'show') setStep('movie');
                else setStep('show');
              }}
              className="p-2 hover:bg-[#33130d]/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#33130d]" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-[#a41e22] uppercase tracking-widest leading-none">
                <span className={cn(step === 'movie' ? "text-[#a41e22]" : "text-[#33130d]/40")}>Movies</span>
                <ChevronRight className="h-3 w-3 text-[#33130d]/20" />
                <span className={cn(step === 'show' ? "text-[#a41e22]" : "text-[#33130d]/40")}>Timings</span>
                <ChevronRight className="h-3 w-3 text-[#33130d]/20" />
                <span className={cn(step === 'list' ? "text-[#a41e22]" : "text-[#33130d]/40")}>Verify</span>
              </div>
              <h1 className="font-cinematic font-bold text-[#33130d] text-xl mt-1">
                {step === 'movie' ? 'Select Movie' : step === 'show' ? selectedMovie?.name : 'Entrance List'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {step === 'list' && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#33130d]/40 uppercase tracking-widest leading-none mb-1">Attendance</p>
                <p className="text-sm font-black text-[#a41e22] leading-none">
                  {checkedParticipants.length} / {participants.length + checkedParticipants.length}
                </p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => {
              if (step === 'movie') fetchMovies();
              else if (step === 'show' && selectedMovie) fetchShows(selectedMovie.id);
              else if (step === 'list' && selectedMovie && selectedShow) fetchList(selectedMovie.name, selectedShow.show_time);
            }} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {step === 'movie' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {movies.map((movie) => (
              <button key={movie.id} onClick={() => { setSelectedMovie(movie); setStep('show'); }} className="group bg-white rounded-3xl overflow-hidden movie-shadow border border-[#33130d]/5 hover:scale-[1.02] transition-all">
                <div className="aspect-[2/3] bg-[#33130d]/5 overflow-hidden">
                  {movie.poster_url ? <img src={movie.poster_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <Film className="w-full h-full p-12 text-[#33130d]/10" />}
                </div>
                <div className="p-4 text-center font-bold text-[#33130d] truncate">{movie.name}</div>
              </button>
            ))}
          </div>
        ) : step === 'show' ? (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-cinematic font-bold text-[#33130d] mb-6">Select Show Time</h2>
            {shows.map((show) => (
              <button key={show.id} onClick={() => { setSelectedShow(show); setStep('list'); }} className="w-full bg-white rounded-2xl p-6 flex items-center justify-between movie-shadow border border-[#33130d]/5 hover:border-[#a41e22]/30 hover:bg-[#a41e22]/5 transition-all group">
                <div className="flex items-center gap-4 text-left">
                  <div className="h-12 w-12 rounded-xl bg-[#f9f0e7] text-[#a41e22] flex items-center justify-center group-hover:bg-[#a41e22] group-hover:text-white transition-colors">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-[#33130d] text-lg">{new Date(show.show_time).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div className="flex items-center gap-2 text-[#33130d]/60 font-medium"><Clock className="h-3 w-3" /> {new Date(show.show_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-[#33130d]/20 group-hover:text-[#a41e22]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#33130d]/30 group-focus-within:text-[#a41e22] transition-colors" />
              <input type="text" placeholder="Search by name or booking ID..." className="w-full bg-white rounded-2xl py-5 pl-12 pr-4 text-lg font-medium text-[#33130d] border border-[#33130d]/10 focus:outline-none focus:ring-4 focus:ring-[#a41e22]/10 focus:border-[#a41e22] transition-all shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#33130d]/30 hover:text-[#a41e22]"><X className="h-5 w-5" /></button>}
            </div>

            <div className="space-y-4">
              {filteredItems.map((p) => {
                const isCheckedIn = !!p.checked_in_at;
                return (
                  <div key={p.id} className={cn("rounded-2xl p-5 movie-shadow border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6", isCheckedIn ? "bg-emerald-50 border-emerald-200" : "bg-white border-[#33130d]/5")}>
                    <div className="flex gap-5 items-center">
                      <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm", isCheckedIn ? "bg-emerald-100 text-emerald-600" : "bg-[#f9f0e7] text-[#33130d]/40")}>
                        {isCheckedIn ? <UserCheck className="h-7 w-7" /> : <RefreshCw className="h-7 w-7 opacity-20" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-black tracking-widest text-[#a41e22] bg-[#a41e22]/5 px-2 py-0.5 rounded">{p.booking_id}</span>
                          {isCheckedIn && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded">Verified at {new Date(p.checked_in_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        <h3 className="text-xl font-bold text-[#33130d] leading-none mb-1.5">{p.name}</h3>
                        <div className="flex flex-col gap-1 text-xs font-medium text-[#33130d]/60">
                          <p><span className="opacity-40 uppercase text-[9px] font-bold tracking-tighter">Contact:</span> {p.email} · {p.phone}</p>
                          <p><span className="opacity-40 uppercase text-[9px] font-bold tracking-tighter">Joined:</span> {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      {isCheckedIn ? (
                        <button onClick={() => handleUndoCheckIn(p)} className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors group">
                          <Check className="h-5 w-5 group-hover:hidden" />
                          <X className="h-5 w-5 hidden group-hover:block" />
                          <span className="group-hover:hidden">Verified</span>
                          <span className="hidden group-hover:block">Undo?</span>
                        </button>
                      ) : (
                        <button onClick={() => handleCheckIn(p)} disabled={!!checkingIn} className={cn("flex items-center justify-center gap-3 bg-[#33130d] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#a41e22] transition-all active:scale-95 shadow-lg shadow-[#33130d]/20", checkingIn === p.id && "bg-[#a41e22] opacity-80")}>
                          {checkingIn === p.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                          Verify Entry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
