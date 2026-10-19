import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppLayout from './layouts/AppLayout';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import Spinner from './components/Spinner/Spinner';

const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Exercises = lazy(() => import('./pages/Exercises/Exercises'));
const Sessions = lazy(() => import('./pages/Sessions/Sessions'));
const Progress = lazy(() => import('./pages/Progress/Progress'));
const ExerciseSession = lazy(() => import('./pages/ExerciseSession/ExerciseSession'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard/PatientDashboard'));
const PatientExercises = lazy(() => import('./pages/PatientExercises/PatientExercises'));
const PatientPlans = lazy(() => import('./pages/PatientPlans/PatientPlans'));
const Privacy = lazy(() => import('./pages/Privacy/Privacy'));
const TherapistDashboard = lazy(() => import('./pages/TherapistDashboard/TherapistDashboard'));
const TherapistPatients = lazy(() => import('./pages/TherapistPatients/TherapistPatients'));
const TherapistPatientOverview = lazy(() => import('./pages/TherapistPatientOverview/TherapistPatientOverview'));
const AssignExercise = lazy(() => import('./pages/AssignExercise/AssignExercise'));
const TherapistPlans = lazy(() => import('./pages/TherapistPlans/TherapistPlans'));
const TherapistResults = lazy(() => import('./pages/TherapistResults/TherapistResults'));
const TherapistReview = lazy(() => import('./pages/TherapistReview/TherapistReview'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner label="Loading Aurevia..." fullPage />}>
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

  <Route path="/patient/care-plan" element={<PatientPlans />} />
  <Route path="/patient/privacy" element={<Privacy />} />

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

            <Route path="/therapist/patients/:patientId" element={<TherapistPatientOverview />} />

            <Route
              path="/therapist/assign-exercise"
              element={<AssignExercise />}
            />

            <Route path="/therapist/care-plans" element={<TherapistPlans />} />

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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
