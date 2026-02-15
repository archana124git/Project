import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin.jsx';
import Dashboard from './components/Dashboard';
import ManageDoctors from './components/ManageDoctors.jsx';
import ManagePatients from './components/ManagePatients.jsx';
import AdminViewDoctor from './components/AdminViewDoctor.jsx';
import AddDoctor from './components/AddDoctor.jsx';

import HomePage from './components/HomePage.jsx';
import ForgotPwd from './components/ForgotPwd.jsx';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDetails from './components/PatientDetails.jsx';

import PharmacyDashboard from './components/PharmacyDashboard.jsx';

import ListeningPage from './components/ListeningPage';
import ConsultationCompletion from './components/ConsultationCompletion';
import PrescriptionView from './components/PrescriptionView.jsx';
import PatientLogin from './components/Patientlogin.jsx';
import PatientVerifyOtp from './components/PatientVerifyOtp';
import PatientRegister from "./components/PatientRegister";
import PatientDashboard from "./components/PatientDashboard";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/manage-doctors" element={<ManageDoctors />} />
        <Route path="/doctor-profile/:id" element={<AdminViewDoctor />} />
        <Route path="/add-doctor" element={<AddDoctor />} />
        <Route path="/manage-patients" element={<ManagePatients />} />
        <Route path="/forgot-pwd" element={<ForgotPwd />} />

        <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
        
        <Route path="/dashboard" element={<DoctorDashboard />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/verify-otp" element={<PatientVerifyOtp />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient/:patientId" element={<PatientDetails />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/:patientId" element={<PatientDetails />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/consultation" element={<ConsultationCompletion />} />
        <Route path="/prescription/:prescriptionId" element={<PrescriptionView />} />
        
      </Routes>
    </BrowserRouter>
  );
}   