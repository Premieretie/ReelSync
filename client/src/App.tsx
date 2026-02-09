import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { VideoPlayerProvider } from '@/context/VideoPlayerContext';
import { Home } from '@/pages/Home';
import { Sliders } from '@/pages/Sliders';
import { Results } from '@/pages/Results';
import { History } from '@/pages/History';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { Subscribe } from '@/pages/Subscribe';

function App() {
  return (
    <AuthProvider>
      <VideoPlayerProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/join/:code" element={<Sliders />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/history/:sessionId" element={<History />} />
          </Routes>
        </HashRouter>
      </VideoPlayerProvider>
    </AuthProvider>
  );
}

export default App;
