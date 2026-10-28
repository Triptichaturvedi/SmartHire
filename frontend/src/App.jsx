
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import "./index.css";
import ApplyJob from "./pages/ApplyJob.jsx";
import Applications from "./pages/Applications.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import Applicants from "./pages/Applicants.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/apply/:id" element={<ProtectedRoute roles={["student", "professional"]}><ApplyJob /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute roles={["student", "professional"]}><Applications /></ProtectedRoute>} />
        <Route path="/recruiter" element={<ProtectedRoute roles={["recruiter"]}><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter/applicants" element={<ProtectedRoute roles={["recruiter"]}><Applicants /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
