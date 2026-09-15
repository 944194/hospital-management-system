import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDepartments from "./pages/AdminDepartments";
import AdminPatients from "./pages/AdminPatients";
import AdminDoctors from "./pages/AdminDoctors";
import AdminAppointments from "./pages/AdminAppointments";
import AdminMedicalRecords from "./pages/AdminMedicalRecords";
import AdminPrescriptions from "./pages/AdminPrescriptions";
import AdminLaboratory from "./pages/AdminLaboratory";
import AdminAdmissions from "./pages/AdminAdmissions";
import AdminRoomsBeds from "./pages/AdminRoomsBeds";
import AdminBilling from "./pages/AdminBilling";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import DoctorAvailability from "./pages/DoctorAvailability";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorMedicalRecords from "./pages/DoctorMedicalRecords";
import DoctorPrescriptions from "./pages/DoctorPrescriptions";
import DoctorLaboratory from "./pages/DoctorLaboratory";
import DoctorAdmissions from "./pages/DoctorAdmissions";
import PatientDashboard from "./pages/PatientDashboard";
import PatientAppointments from "./pages/PatientAppointments";
import PatientProfile from "./pages/PatientProfile";
import PatientMedicalRecords from "./pages/PatientMedicalRecords";
import PatientPrescriptions from "./pages/PatientPrescriptions";
import PatientLaboratory from "./pages/PatientLaboratory";
import PatientAdmissions from "./pages/PatientAdmissions";
import PatientBills from "./pages/PatientBills";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import ReceptionistPatients from "./pages/ReceptionistPatients";
import ReceptionistDoctors from "./pages/ReceptionistDoctors";
import ReceptionistAppointments from "./pages/ReceptionistAppointments";
import ReceptionistAdmissions from "./pages/ReceptionistAdmissions";
import ReceptionistRoomsBeds from "./pages/ReceptionistRoomsBeds";
import ReceptionistBilling from "./pages/ReceptionistBilling";
import ReceptionistProfile from "./pages/ReceptionistProfile";
import AdminReceptionists from "./pages/AdminReceptionists";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================================
            ADMIN
            ================================ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="receptionists" element={<AdminReceptionists />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="medical-records" element={<AdminMedicalRecords />} />
          <Route path="prescriptions" element={<AdminPrescriptions />} />
          <Route path="laboratory" element={<AdminLaboratory />} />
          <Route path="admissions" element={<AdminAdmissions />} />
          <Route path="rooms-beds" element={<AdminRoomsBeds />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* ================================
            DOCTOR
            ================================ */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="availability" element={<DoctorAvailability />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="medical-records" element={<DoctorMedicalRecords />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="laboratory" element={<DoctorLaboratory />} />
          <Route path="admissions" element={<DoctorAdmissions />} />
        </Route>

        {/* ================================
            PATIENT
            ================================ */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="medical-records" element={<PatientMedicalRecords />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="laboratory" element={<PatientLaboratory />} />
          <Route path="admissions" element={<PatientAdmissions />} />
          <Route path="bills" element={<PatientBills />} />
        </Route>

        {/* ================================
            RECEPTIONIST
            ================================ */}
        <Route
          path="/receptionist"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ReceptionistDashboard />} />
          <Route path="patients" element={<ReceptionistPatients />} />
          <Route path="doctors" element={<ReceptionistDoctors />} />
          <Route path="appointments" element={<ReceptionistAppointments />} />
          <Route path="admissions" element={<ReceptionistAdmissions />} />
          <Route path="rooms-beds" element={<ReceptionistRoomsBeds />} />
          <Route path="billing" element={<ReceptionistBilling />} />
          <Route path="profile" element={<ReceptionistProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;