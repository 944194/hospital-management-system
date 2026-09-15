import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ReceptionistDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    admissions: 0,
    bills: 0,
  });

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getData = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data?.results || [];
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    if (!status) {
      return "receptionist-status";
    }

    switch (status) {
      case "SCHEDULED":
        return "receptionist-status scheduled";

      case "CONFIRMED":
        return "receptionist-status confirmed";

      case "COMPLETED":
        return "receptionist-status completed";

      case "CANCELLED":
        return "receptionist-status cancelled";

      default:
        return "receptionist-status";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const [
          patientsResponse,
          doctorsResponse,
          appointmentsResponse,
          admissionsResponse,
          billsResponse,
        ] = await Promise.all([
          api.get("patients/"),
          api.get("doctors/"),
          api.get("appointments/"),
          api.get("admissions/"),
          api.get("bills/"),
        ]);

        const patients = getData(patientsResponse);
        const doctors = getData(doctorsResponse);
        const appointmentsData =
          getData(appointmentsResponse);
        const admissions = getData(admissionsResponse);
        const bills = getData(billsResponse);

        const sortedAppointments = [
          ...appointmentsData,
        ].sort((a, b) => b.id - a.id);

        setStats({
          patients: patients.length,
          doctors: doctors.length,
          appointments: appointmentsData.length,
          admissions: admissions.length,
          bills: bills.length,
        });

        setAppointments(
          sortedAppointments.slice(0, 5)
        );
      } catch (err) {
        console.error(
          "Error loading receptionist dashboard:",
          err
        );

        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="receptionist-dashboard-page">
        <div className="receptionist-dashboard-state">
          <div className="receptionist-dashboard-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="receptionist-dashboard-page">
        <div className="receptionist-dashboard-state error">
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="receptionist-dashboard-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="receptionist-dashboard-header">

        <div>
          <p className="receptionist-dashboard-eyebrow">
            Hospital Management
          </p>

          <h1>Receptionist Dashboard</h1>

          <p>
            Manage patients, appointments and
            daily hospital activities.
          </p>
        </div>

        <div className="receptionist-dashboard-welcome">
          <span>Today's Overview</span>
          <strong>Hospital Operations</strong>
        </div>

      </div>

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="receptionist-dashboard-stats">

        <div
          className="receptionist-stat-card clickable"
          onClick={() =>
            navigate("/receptionist/patients")
          }
        >
          <div className="receptionist-stat-icon purple">
            P
          </div>

          <div>
            <h3>Total Patients</h3>
            <strong>{stats.patients}</strong>
            <p>Registered patients</p>
          </div>
        </div>

        <div
          className="receptionist-stat-card clickable"
          onClick={() =>
            navigate("/receptionist/doctors")
          }
        >
          <div className="receptionist-stat-icon blue">
            D
          </div>

          <div>
            <h3>Total Doctors</h3>
            <strong>{stats.doctors}</strong>
            <p>Available doctors</p>
          </div>
        </div>

        <div
          className="receptionist-stat-card clickable"
          onClick={() =>
            navigate("/receptionist/appointments")
          }
        >
          <div className="receptionist-stat-icon violet">
            A
          </div>

          <div>
            <h3>Appointments</h3>
            <strong>{stats.appointments}</strong>
            <p>Total appointments</p>
          </div>
        </div>

        <div
          className="receptionist-stat-card clickable"
          onClick={() =>
            navigate("/receptionist/admissions")
          }
        >
          <div className="receptionist-stat-icon orange">
            I
          </div>

          <div>
            <h3>Admissions</h3>
            <strong>{stats.admissions}</strong>
            <p>Hospital admissions</p>
          </div>
        </div>

        <div
          className="receptionist-stat-card clickable"
          onClick={() =>
            navigate("/receptionist/bills")
          }
        >
          <div className="receptionist-stat-icon green">
            ₹
          </div>

          <div>
            <h3>Bills</h3>
            <strong>{stats.bills}</strong>
            <p>Total bills</p>
          </div>
        </div>

      </div>

      {/* ======================================
          RECENT APPOINTMENTS
      ====================================== */}

      <div className="receptionist-dashboard-section">

        <div className="receptionist-section-header">

          <div>
            <h2>Recent Appointments</h2>

            <p>
              Latest appointments registered
              in the hospital.
            </p>
          </div>

          <button
            type="button"
            className="receptionist-view-all-btn"
            onClick={() =>
              navigate("/receptionist/appointments")
            }
          >
            View All
          </button>

        </div>

        {appointments.length === 0 ? (

          <div className="receptionist-dashboard-empty">
            <div className="receptionist-empty-icon">
              A
            </div>

            <h3>No Appointments Found</h3>

            <p>
              There are currently no appointments
              available.
            </p>
          </div>

        ) : (

          <div className="receptionist-dashboard-table-wrapper">

            <table className="receptionist-dashboard-table">

              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {appointments.map(
                  (appointment) => (

                    <tr key={appointment.id}>

                      <td>
                        <span className="receptionist-appointment-id">
                          {appointment.appointment_id ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        <div className="receptionist-person">
                          <strong>
                            {appointment.patient_id ||
                              "-"}
                          </strong>

                          <span>
                            {appointment.patient_name ||
                              "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="receptionist-person">
                          <strong>
                            {appointment.doctor_id ||
                              "-"}
                          </strong>

                          <span>
                            {appointment.doctor_name ||
                              "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {appointment.department_name ||
                          "-"}
                      </td>

                      <td>
                        <span className="receptionist-room">
                          {appointment.consultation_room_number ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          appointment.appointment_date
                        )}
                      </td>

                      <td>
                        {appointment.appointment_time ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            appointment.status
                          )}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default ReceptionistDashboard;