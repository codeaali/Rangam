import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Ticket, Home, Calendar, Users, Film, Download, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { BookingResponse } from '../types';

interface LocationState {
  booking: BookingResponse;
  name: string;
}

export function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  if (!state?.booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4 bg-[#f9f0e7]">
        <p className="text-[#33130d]/60 font-medium text-lg">No booking found.</p>
        <Button onClick={() => navigate('/')}>Back to Booking</Button>
      </div>
    );
  }

  const { booking, name } = state;

  const downloadPDF = async () => {
    const element = document.getElementById('ticket-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f9f0e7',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Ticket-${booking.bookingId}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16 bg-[#f9f0e7]">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Success card */}
        <div id="ticket-content" className="bg-white rounded-3xl p-8 sm:p-10 text-center movie-shadow border border-[#33130d]/5 overflow-hidden relative">
          {/* Festival Branding Background */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#a41e22]" />
          
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Logo" className="h-12 object-contain opacity-80" />
          </div>
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f9f0e7] text-[#a41e22] shadow-inner shadow-[#33130d]/5">
            <CheckCircle className="h-10 w-10" />
          </div>

          <h1 className="font-cinematic text-4xl font-bold text-[#33130d]">You're In! 🎬</h1>
          <p className="mt-3 text-lg text-[#33130d]/70 font-medium">Hey {name.split(' ')[0]}, your booking is confirmed.</p>

          {/* Booking ID badge */}
          <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-2xl bg-[#f9f0e7] border border-[#33130d]/10 px-6 py-4">
            <Ticket className="h-5 w-5 text-[#a41e22]" />
            <span className="font-mono font-bold text-[#33130d] text-2xl tracking-wider">
              {booking.bookingId}
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-[#33130d]/50 uppercase tracking-widest">Keep this ID handy — you'll need it at the door.</p>

          {/* Movie details */}
          <div className="mt-10 space-y-4 text-left">
            {booking.movies.map((m, i) => (
              <div key={i} className="bg-[#f9f0e7]/50 rounded-2xl p-5 flex gap-5 border border-[#33130d]/5 transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                {m.posterUrl ? (
                  <img src={m.posterUrl} alt={m.movieName} className="h-20 w-14 rounded-lg bg-[#33130d]/10 object-cover shadow-sm shrink-0" />
                ) : (
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-[#33130d]/5 border border-[#33130d]/10">
                    <Film className="h-6 w-6 text-[#33130d]/30" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="font-cinematic text-xl font-bold text-[#33130d] leading-tight">
                    {m.movieName}
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-[#33130d]/60 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#a41e22]" />
                      {new Date(m.showTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-[#33130d] bg-[#f9f0e7] px-2 py-1.5 rounded w-fit border border-[#33130d]/10">
                      <Users className="h-3.5 w-3.5 text-[#a41e22]" />
                      {m.seats} seat{m.seats > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-3 no-print">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => navigate('/')} className="py-4 border border-[#33130d]/10 hover:bg-[#33130d]/5">
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="py-4 border border-[#33130d]/10 hover:bg-[#33130d]/5"
                onClick={() => {
                  const text = `🎬 CineSchool Booking\n\nID: ${booking.bookingId}\n${booking.movies.map((m) => `• ${m.movieName} — ${m.seats} seat(s)`).join('\n')}`;
                  navigator.share
                    ? navigator.share({ title: 'My Booking', text })
                    : navigator.clipboard.writeText(text);
                }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
            <Button
              className="w-full py-5 text-lg shadow-lg flex items-center justify-center gap-3"
              onClick={downloadPDF}
            >
              <Download className="h-5 w-5" />
              Download PDF Ticket
            </Button>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none ! alienation; }
        }
      `}</style>
    </div>
  );
}
