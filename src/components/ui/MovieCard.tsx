import { cn } from '../../lib/cn';
import { ImageOff } from 'lucide-react';
import type { Movie, SelectedShow } from '../../types';

interface MovieCardProps {
  movie: Movie;
  selectedShow: SelectedShow | undefined;
  onShowSelect: (movieId: string, showId: string) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function MovieCard({ movie, selectedShow, onShowSelect }: MovieCardProps) {
  const isMovieSelected = !!selectedShow;

  return (
    <div
      onClick={() => {
        if (!isMovieSelected && movie.shows.length > 0) {
          onShowSelect(movie.id, movie.shows[0].id);
        }
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 transform',
        isMovieSelected
          ? 'border-[#a41e22]/30 shadow-md ring-1 ring-[#a41e22]/20'
          : 'border border-[#33130d]/5 movie-shadow hover:-translate-y-1 hover:movie-shadow-hover cursor-pointer'
      )}
    >
      {/* ── Poster area ─────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e8ded2] shrink-0">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.name}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-in-out",
              "group-hover:scale-105"
            )}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#33130d]">
            <ImageOff className="h-10 w-10 text-white/20" />
          </div>
        )}

        {/* Selected badge overlay */}
        {isMovieSelected && (
          <div className="absolute top-3 right-3 animate-fade-in z-20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a41e22] text-white shadow-lg shadow-[#a41e22]/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#1a0a06] via-[#1a0a06]/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-4">
          <h3 className="font-cinematic text-2xl font-bold text-white shadow-black drop-shadow-lg leading-tight">
            {movie.name}
          </h3>
          <p className="text-xs text-white/80 mt-1 font-medium tracking-wide">
            {movie.shows.length} SCREENING{movie.shows.length !== 1 ? 'S' : ''}
          </p>
        </div>
      </div>

      {/* ── Body ─────────── */}
      <div className="p-4 bg-[#f9f0e7] flex-1 flex flex-col">
        {/* Shows */}
        {movie.shows.length > 0 ? (
          <div className="mt-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#33130d]/50">Showtimes</span>
            </div>
            <div className="grid gap-2">
              {movie.shows.map((show) => {
                const isShowSelected = selectedShow?.showId === show.id;
                const available = show.available_seats ?? show.seat_limit;
                const isSoldOut = available <= 0;

                return (
                  <button
                    key={show.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowSelect(movie.id, show.id);
                    }}
                    className={cn(
                      'relative flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none',
                      isShowSelected
                        ? 'border-[#a41e22] bg-[#a41e22]/5 shadow-sm'
                        : isSoldOut
                        ? 'cursor-not-allowed border-transparent bg-slate-100 opacity-60'
                        : 'border-[#33130d]/10 bg-white hover:border-[#a41e22]/40 hover:bg-white z-10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                        isShowSelected ? "border-[#a41e22] bg-[#a41e22]" : "border-[#33130d]/30 bg-transparent"
                      )}>
                        {isShowSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className={cn("font-bold text-[15px] leading-tight", isShowSelected ? "text-[#a41e22]" : isSoldOut ? "text-[#33130d]/40" : "text-[#33130d]")}>
                          {formatTime(show.show_time)}
                        </div>
                        <div className="text-[11px] font-medium text-[#33130d]/50">
                          {formatDate(show.show_time)}
                        </div>
                      </div>
                    </div>
                    
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-wider",
                      isShowSelected ? "text-[#a41e22]" : isSoldOut ? "text-[#33130d]/40" : "text-[#33130d]/40"
                    )}>
                      {isSoldOut ? 'Sold Out' : `${available} Left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#33130d]/10 p-5 pl-4 text-center mt-auto">
            <p className="text-sm font-medium text-[#33130d]/60">More shows coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
