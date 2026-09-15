import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isDoctor = user?.role === "DOCTOR";
  const isPatient = user?.role === "PATIENT";
  const isReceptionist = user?.role === "RECEPTIONIST";

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2>🏥 HMS</h2>
          <p>Hospital Management</p>
        </div>

        <nav className="sidebar-nav">
          <p>Navigation</p>

          <div className="nav-links">

            {/* ================================
                ADMIN NAVIGATION
                ================================ */}
            {isAdmin && (
              <>
                <NavLink to="/admin" end>
                  ☰ Dashboard
                </NavLink>

                <NavLink to="/admin/users">
                  👤 User Management
                </NavLink>

                <NavLink to="/admin/departments">
                  🏢 Departments
                </NavLink>

                <NavLink to="/admin/patients">
                  👥 Patients
                </NavLink>

                <NavLink to="/admin/doctors">
                  🩺 Doctors
                </NavLink>

                <NavLink to="/admin/receptionists">
                  👤 Receptionists
                </NavLink>

                <NavLink to="/admin/appointments">
                  📅 Appointments
                </NavLink>

                <NavLink to="/admin/medical-records">
                  📋 Medical Records
                </NavLink>

                <NavLink to="/admin/prescriptions">
                  💊 Prescriptions
                </NavLink>

                <NavLink to="/admin/laboratory">
                  🧪 Laboratory
                </NavLink>

                <NavLink to="/admin/admissions">
                  🛏 Admissions
                </NavLink>

                <NavLink to="/admin/rooms-beds">
                  🚪 Rooms & Beds
                </NavLink>

                <NavLink to="/admin/billing">
                  💰 Billing
                </NavLink>

                <NavLink to="/admin/audit-logs">
                  📜 Audit Logs
                </NavLink>
              </>
            )}

            {/* ================================
                DOCTOR NAVIGATION
                ================================ */}
            {isDoctor && (
              <>
                <NavLink to="/doctor" end>
                  🩺 Dashboard
                </NavLink>

                <NavLink to="/doctor/profile">
                  👤 My Profile
                </NavLink>

                <NavLink to="/doctor/availability">
                  🕐 My Availability
                </NavLink>

                <NavLink to="/doctor/appointments">
                  📅 My Appointments
                </NavLink>

                <NavLink to="/doctor/medical-records">
                  📋 Medical Records
                </NavLink>

                <NavLink to="/doctor/prescriptions">
                  💊 Prescriptions
                </NavLink>

                <NavLink to="/doctor/laboratory">
                  🧪 Laboratory
                </NavLink>

                <NavLink to="/doctor/admissions">
                  🛏 Admissions
                </NavLink>
              </>
            )}

            {/* ================================
                PATIENT NAVIGATION
                ================================ */}
            {isPatient && (
              <>
                <NavLink to="/patient" end>
                  👤 Dashboard
                </NavLink>

                <NavLink to="/patient/profile">
                  👤 My Profile
                </NavLink>

                <NavLink to="/patient/appointments">
                  📅 My Appointments
                </NavLink>

                <NavLink to="/patient/medical-records">
                  📋 Medical Records
                </NavLink>

                <NavLink to="/patient/prescriptions">
                  💊 Prescriptions
                </NavLink>

                <NavLink to="/patient/laboratory">
                  🧪 Laboratory
                </NavLink>

                <NavLink to="/patient/admissions">
                  🛏 Admissions
                </NavLink>

                <NavLink to="/patient/bills">
                  💰 My Bills
                </NavLink>
              </>
            )}

            {/* ================================
                RECEPTIONIST NAVIGATION
                ================================ */}
            {isReceptionist && (
              <>
                <NavLink to="/receptionist" end>
                  🏥 Dashboard
                </NavLink>

                <NavLink to="/receptionist/patients">
                  👥 Patients
                </NavLink>

                <NavLink to="/receptionist/doctors">
                  🩺 Doctors
                </NavLink>

                <NavLink to="/receptionist/appointments">
                  📅 Appointments
                </NavLink>

                <NavLink to="/receptionist/admissions">
                  🛏 Admissions
                </NavLink>

                <NavLink to="/receptionist/rooms-beds">
                  🚪 Rooms & Beds
                </NavLink>

                <NavLink to="/receptionist/billing">
                  💰 Billing
                </NavLink>

                <NavLink to="/receptionist/profile">
                  👤 My Profile
                </NavLink>
              </>
            )}

          </div>
        </nav>
      </aside>

      {/* Main area */}
      <div className="main-area">

        {/* Top bar */}
        <header className="topbar">
          <button
  className="mobile-menu-btn"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  ☰
</button>
          <div>
            <h1>Hospital Management System</h1>
          </div>

          <div className="user-area">
            <div>
              <strong>
                {user?.first_name || user?.username}
              </strong>

              <span>{user?.role}</span>
            </div>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default MainLayout;