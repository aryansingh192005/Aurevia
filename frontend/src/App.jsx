import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppLayout from './layouts/AppLayout';

import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Exercises from './pages/Exercises/Exercises';
import Sessions from './pages/Sessions/Sessions';
import Progress from './pages/Progress/Progress';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/progress" element={<Progress />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;