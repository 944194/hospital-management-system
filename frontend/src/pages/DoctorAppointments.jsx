import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
    status: "CONFIRMED",
  });

  // ==========================================
  // SEARCH / FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [filteredAppointments, setFilteredAppointments] =
    useState([]);

  // ==========================================
  // HELPER
  // ==========================================

  const getData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  // ==========================================
  // FETCH APPOINTMENTS
  // ==========================================

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("appointments/");

      const appointmentData = getData(response);

      const sortedAppointments = [...appointmentData].sort(
        (a, b) => b.id - a.id
      );

      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
    } catch (err) {
      console.error(
        "Doctor appointments error:",
        err
      );

      setError(
        "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = appointments.filter(
      (appointment) => {
        const appointmentId =
          String(
            appointment.appointment_id || ""
          ).toLowerCase();

        const patientId =
          String(
            appointment.patient_id || ""
          ).toLowerCase();

        const patientName =
          String(
            appointment.patient_name || ""
          ).toLowerCase();

        const departmentName =
          String(
            appointment.department_name || ""
          ).toLowerCase();

        const roomNumber =
          String(
            appointment.consultation_room_number ||
              ""
          ).toLowerCase();

        const reason =
          String(
            appointment.reason || ""
          ).toLowerCase();

        const notes =
          String(
            appointment.notes || ""
          ).toLowerCase();

        const matchesSearch =
          !searchValue ||
          appointmentId.includes(
            searchValue
          ) ||
          patientId.includes(
            searchValue
          ) ||
          patientName.includes(
            searchValue
          ) ||
          departmentName.includes(
            searchValue
          ) ||
          roomNumber.includes(
            searchValue
          ) ||
          reason.includes(
            searchValue
          ) ||
          notes.includes(
            searchValue
          );

        const appointmentStatus =
          String(
            appointment.status || ""
          ).toLowerCase();

        const matchesStatus =
          !statusFilter ||
          appointmentStatus ===
            statusFilter.toLowerCase();

        const appointmentDate =
          appointment.appointment_date || "";

        const matchesFromDate =
          !fromDate ||
          appointmentDate >= fromDate;

        const matchesToDate =
          !toDate ||
          appointmentDate <= toDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );

    results.sort(
      (a, b) => b.id - a.id
    );

    setFilteredAppointments(results);
  }, [
    appointments,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // STATUS OPTIONS
  // ==========================================

  const statusOptions = [
    ...new Set(
      appointments
        .map(
          (appointment) =>
            appointment.status
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // FUTURE APPOINTMENT CHECK
  // ==========================================

  const isFutureAppointment = (appointment) => {
    if (!appointment?.appointment_date) {
      return false;
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const appointmentDate =
      new Date(
        `${appointment.appointment_date}T00:00:00`
      );

    appointmentDate.setHours(
      0,
      0,
      0,
      0
    );

    return appointmentDate > today;
  };

  // ==========================================
  // EDIT APPOINTMENT
  // ==========================================

  const handleEdit = (appointment) => {
    setEditingAppointment(
      appointment
    );

    setFormData({
      appointment_date:
        appointment.appointment_date ||
        "",

      appointment_time:
        appointment.appointment_time
          ? appointment.appointment_time.substring(
              0,
              5
            )
          : "",

      reason:
        appointment.reason ||
        "",

      notes:
        appointment.notes ||
        "",

      status:
        appointment.status ||
        "SCHEDULED",
    });

    setFormError("");
  };

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // ==========================================
  // UPDATE APPOINTMENT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    try {
      const payload = {
        appointment_date:
          formData.appointment_date,

        appointment_time:
          formData.appointment_time,

        reason:
          formData.reason,

        notes:
          formData.notes,

        status:
          formData.status,
      };

      const response =
        await api.patch(
          `appointments/${editingAppointment.id}/`,
          payload
        );

      setAppointments(
        (currentAppointments) =>
          currentAppointments
            .map(
              (appointment) =>
                appointment.id ===
                editingAppointment.id
                  ? response.data
                  : appointment
            )
            .sort(
              (a, b) => b.id - a.id
            )
      );

      setEditingAppointment(
        null
      );

      setFormError("");
    } catch (err) {
      console.error(
        "Update appointment error:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      if (err.response?.data) {
        const errorData =
          err.response.data;

        if (errorData.error) {
          setFormError(
            errorData.error
          );
        } else {
          const messages =
            Object.values(
              errorData
            )
              .flat()
              .join(" ");

          setFormError(
            messages ||
              "Unable to update appointment."
          );
        }
      } else {
        setFormError(
          "Unable to update appointment."
        );
      }
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setEditingAppointment(
      null
    );

    setFormError("");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [
      hour,
      minute,
    ] = time
      .slice(0, 5)
      .split(":")
      .map(Number);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    ) {
      return time;
    }

    const date =
      new Date();

    date.setHours(
      hour,
      minute,
      0,
      0
    );

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (status) => {
    if (!status) {
      return "-";
    }

    return status
      .replaceAll(
        "_",
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-appointments-page">

        <div className="doctor-appointments-state-card">

          <div className="doctor-appointments-spinner"></div>

          <h3>
            Loading appointments...
          </h3>

          <p>
            Please wait while we load your appointments.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="doctor-appointments-page">

        <div className="doctor-appointments-state-card error">

          <div className="doctor-appointments-state-icon">
            !
          </div>

          <h3>
            Unable to load appointments
          </h3>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="doctor-appointments-retry-button"
            onClick={
              fetchAppointments
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  const activeFilters =
    searchTerm ||
    statusFilter ||
    fromDate ||
    toDate;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="doctor-appointments-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="doctor-appointments-header">

        <div className="doctor-appointments-title-area">

          <div className="doctor-appointments-eyebrow">
            CLINICAL MANAGEMENT
          </div>

          <h1>
            My Appointments
          </h1>

          <p>
            View and manage appointments assigned
            to you.
          </p>

        </div>

        <div className="doctor-appointments-header-card">

          <div className="doctor-appointments-header-icon">
            📅
          </div>

          <div>
            <span>
              Total Appointments
            </span>

            <strong>
              {appointments.length}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================
          ACTIONS
      ====================================== */}

      <div className="doctor-appointments-actions">

        <button
          type="button"
          className="doctor-appointments-filter-button"
          onClick={() =>
            setShowFilters(
              !showFilters
            )
          }
        >
          {showFilters
            ? "✕ Hide Search & Filters"
            : "☰ Search & Filter"}
        </button>

      </div>

      {/* ======================================
          FILTER CARD
      ====================================== */}

      {showFilters && (
        <div className="doctor-appointments-filter-card">

          <div className="doctor-appointments-section-heading">

            <div>

              <h2>
                Search & Filter
              </h2>

              <p>
                Find appointments by patient,
                department, room, status or date.
              </p>

            </div>

            {activeFilters && (
              <span className="doctor-appointments-filter-active">
                Filters active
              </span>
            )}

          </div>

          <div className="doctor-appointments-filter-grid">

            {/* SEARCH */}

            <div className="doctor-appointments-field">

              <label>
                Search
              </label>

              <input
                type="text"
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Appointment ID, Patient, Department, Room..."
              />

            </div>

            {/* STATUS */}

            <div className="doctor-appointments-field">

              <label>
                Status
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                {statusOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(
                        status
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* FROM DATE */}

            <div className="doctor-appointments-field">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={
                  fromDate
                }
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* TO DATE */}

            <div className="doctor-appointments-field">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={
                  toDate
                }
                min={
                  fromDate ||
                  undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="doctor-appointments-filter-footer">

            <button
              type="button"
              className="doctor-appointments-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <p>
              Showing{" "}
              <strong>
                {
                  filteredAppointments.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {appointments.length}
              </strong>{" "}
              appointments
            </p>

          </div>

        </div>
      )}

      {/* ======================================
          EDIT APPOINTMENT
      ====================================== */}

      {editingAppointment && (

        <div className="doctor-appointments-edit-card">

          <div className="doctor-appointments-edit-header">

            <div>

              <div className="doctor-appointments-eyebrow">
                APPOINTMENT UPDATE
              </div>

              <h2>
                Edit Appointment
              </h2>

              <p>
                Update the appointment status,
                reason or clinical notes.
              </p>

            </div>

            <button
              type="button"
              className="doctor-appointments-close-button"
              onClick={
                handleCancel
              }
            >
              ✕
            </button>

          </div>

          {formError && (
            <div className="doctor-appointments-form-error">

              <strong>
                Update failed
              </strong>

              <span>
                {formError}
              </span>

            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="doctor-appointments-form-grid">

              {/* PATIENT */}

              <div className="doctor-appointments-field">

                <label>
                  Patient
                </label>

                <input
                  type="text"
                  value={
                    `${
                      editingAppointment.patient_id ||
                      "-"
                    } - ${
                      editingAppointment.patient_name ||
                      "-"
                    }`
                  }
                  disabled
                />

              </div>

              {/* DEPARTMENT */}

              <div className="doctor-appointments-field">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  value={
                    editingAppointment.department_name ||
                    "-"
                  }
                  disabled
                />

              </div>

              {/* ROOM */}

              <div className="doctor-appointments-field">

                <label>
                  Consultation Room
                </label>

                <input
                  type="text"
                  value={
                    editingAppointment.consultation_room_number ||
                    "-"
                  }
                  disabled
                />

              </div>

              {/* DATE */}

              <div className="doctor-appointments-field">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={
                    formData.appointment_date
                  }
                  disabled
                />

              </div>

              {/* TIME */}

              <div className="doctor-appointments-field">

                <label>
                  Time
                </label>

                <input
                  type="time"
                  value={
                    formData.appointment_time
                  }
                  disabled
                />

              </div>

              {/* STATUS */}

              <div className="doctor-appointments-field">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="SCHEDULED">
                    Scheduled
                  </option>

                  <option value="CONFIRMED">
                    Confirmed
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                  <option value="NO_SHOW">
                    No Show
                  </option>

                </select>

              </div>

              {/* REASON */}

              <div className="doctor-appointments-field">

                <label>
                  Reason
                </label>

                <input
                  type="text"
                  name="reason"
                  value={
                    formData.reason
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Appointment reason"
                />

              </div>

              {/* NOTES */}

              <div className="doctor-appointments-field doctor-appointments-full-width">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Add clinical or appointment notes..."
                />

              </div>

            </div>

            <div className="doctor-appointments-form-actions">

              <button
                type="submit"
                className="doctor-appointments-update-button"
              >
                Update Appointment
              </button>

              <button
                type="button"
                className="doctor-appointments-cancel-button"
                onClick={
                  handleCancel
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          RESULTS HEADER
      ====================================== */}

      <div className="doctor-appointments-results-header">

        <div>

          <h2>
            Appointment Schedule
          </h2>

          <p>
            {filteredAppointments.length}{" "}
            appointment
            {filteredAppointments.length !== 1
              ? "s"
              : ""}{" "}
            displayed
          </p>

        </div>

        {activeFilters && (
          <span className="doctor-appointments-results-badge">
            Filtered Results
          </span>
        )}

      </div>

      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {filteredAppointments.length === 0 ? (

        <div className="doctor-appointments-empty-state">

          <div className="doctor-appointments-empty-icon">
            📅
          </div>

          <h3>
            No Appointments Found
          </h3>

          <p>
            {activeFilters
              ? "No appointments match the selected search or filters."
              : "You currently have no appointments assigned to you."}
          </p>

        </div>

      ) : (

        <div className="doctor-appointments-table-card">

          <div className="doctor-appointments-table-wrapper">

            <table className="doctor-appointments-table">

              <thead>

                <tr>

                  <th>
                    Appointment
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Room
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Notes
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredAppointments.map(
                  (appointment) => {

                    const future =
                      isFutureAppointment(
                        appointment
                      );

                    return (
                      <tr
                        key={
                          appointment.id
                        }
                      >

                        {/* APPOINTMENT */}

                        <td>

                          <div className="doctor-appointments-id-cell">

                            <strong>
                              {
                                appointment.appointment_id ||
                                "-"
                              }
                            </strong>

                            <span>
                              APPOINTMENT
                            </span>

                          </div>

                        </td>

                        {/* PATIENT */}

                        <td>

                          <div className="doctor-appointments-patient-cell">

                            <strong>
                              {
                                appointment.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                appointment.patient_id ||
                                "-"
                              }
                            </span>

                          </div>

                        </td>

                        {/* DEPARTMENT */}

                        <td>

                          <span className="doctor-appointments-department">
                            {
                              appointment.department_name ||
                              "-"
                            }
                          </span>

                        </td>

                        {/* ROOM */}

                        <td>

                          <span className="doctor-appointments-room">
                            {
                              appointment.consultation_room_number ||
                              "-"
                            }
                          </span>

                        </td>

                        {/* DATE */}

                        <td>

                          <span className="doctor-appointments-date">
                            {formatDate(
                              appointment.appointment_date
                            )}
                          </span>

                        </td>

                        {/* TIME */}

                        <td>

                          <strong className="doctor-appointments-time">
                            {formatTime(
                              appointment.appointment_time
                            )}
                          </strong>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`doctor-appointments-status status-${appointment.status
                              ?.toLowerCase()
                              .replaceAll(
                                "_",
                                "-"
                              )}`}
                          >
                            {formatStatus(
                              appointment.status
                            )}
                          </span>

                        </td>

                        {/* REASON */}

                        <td>

                          <span className="doctor-appointments-text-cell">
                            {
                              appointment.reason ||
                              "-"
                            }
                          </span>

                        </td>

                        {/* NOTES */}

                        <td>

                          <span className="doctor-appointments-text-cell">
                            {
                              appointment.notes ||
                              "-"
                            }
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="doctor-appointments-edit-button"
                            onClick={() =>
                              handleEdit(
                                appointment
                              )
                            }
                            disabled={
                              future
                            }
                            title={
                              future
                                ? "Future appointments cannot be edited."
                                : "Edit appointment"
                            }
                          >
                            {future
                              ? "Locked"
                              : "Edit"}
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}

export default DoctorAppointments;