import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { AdminPage } from './pages/AdminPage';
import { CheckInPage } from './pages/CheckInPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/checkin" element={<CheckInPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
