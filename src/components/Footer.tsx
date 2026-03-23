import { Mail, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#33130d]/5 py-12 mt-auto">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
              <div className="h-16 w-16">
                <img src="/logo.png" alt="Rangam Logo" className="h-full w-full object-contain grayscale opacity-60" />
              </div>
            </div>
            <p className="text-sm text-[#33130d]/40 font-medium">
              Developing the next generation of visual storytellers.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
            <div className="flex items-center gap-2 text-[#a41e22] hover:text-[#33130d] transition-colors group">
              <Mail className="h-4 w-4" />
              <a 
                href="mailto:support.rangamfilmfestival@gmail.com" 
                className="text-sm font-bold tracking-wide"
              >
                support.rangamfilmfestival@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[11px] font-bold text-[#33130d]/30 uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} rangamfilmfestival2026
              </p>
              <div className="h-1 w-1 rounded-full bg-[#33130d]/10" />
              <div className="flex items-center gap-1.5 grayscale opacity-30">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
