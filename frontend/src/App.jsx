import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppLayout from './layouts/AppLayout';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

import Dashboard from './pages/Dashboard/Dashboard';
import Exercises from './pages/Exercises/Exercises';
import Sessions from './pages/Sessions/Sessions';
import Progress from './pages/Progress/Progress';
import ExerciseSession from './pages/ExerciseSession/ExerciseSession';

import PatientDashboard from './pages/PatientDashboard/PatientDashboard';
import PatientExercises from './pages/PatientExercises/PatientExercises';

import TherapistDashboard from './pages/TherapistDashboard/TherapistDashboard';
import TherapistPatients from './pages/TherapistPatients/TherapistPatients';
import AssignExercise from './pages/AssignExercise/AssignExercise';
import TherapistResults from './pages/TherapistResults/TherapistResults';
import TherapistReview from './pages/TherapistReview/TherapistReview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          {/* Generic authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/progress" element={<Progress />} />
          </Route>

          {/* Patient routes */}
          
<Route element={<RoleRoute allowedRole="patient" />}>
  <Route
    path="/patient/dashboard"
    element={<PatientDashboard />}
  />

  <Route
    path="/patient/exercises"
    element={<PatientExercises />}
  />

  <Route
    path="/patient/exercises/:assignmentId/start"
    element={<ExerciseSession />}
  />
  
</Route>

          {/* Therapist routes */}
          <Route element={<RoleRoute allowedRole="therapist" />}>
            <Route
              path="/therapist/dashboard"
              element={<TherapistDashboard />}
            />

            <Route
              path="/therapist/patients"
              element={<TherapistPatients />}
            />

            <Route
              path="/therapist/assign-exercise"
              element={<AssignExercise />}
            />

            <Route
              path="/therapist/sessions"
              element={<TherapistResults />}
            />

            <Route
              path="/therapist/review"
              element={<TherapistReview />}
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;