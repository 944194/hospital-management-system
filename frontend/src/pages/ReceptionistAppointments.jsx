import { useEffect, useState } from "react";
import api from "../services/api";

function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] =
    useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorAvailability, setDoctorAvailability] =
    useState([]);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchResults, setPatientSearchResults] =
    useState([]);
  const [selectedPatient, setSelectedPatient] =
    useState(null);
  const [patientSearching, setPatientSearching] =
    useState(false);

  const [availableSlots, setAvailableSlots] =
    useState([]);
  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    patient: "",
    department: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
  });

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [editFormData, setEditFormData] = useState({
    appointment_date: "",
    appointment_time: "",
    status: "",
    reason: "",
    notes: "",
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const getData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  const getErrorMessage = (err, fallback) => {
    if (err.response?.data) {
      const data = err.response.data;

      if (typeof data === "string") {
        return data;
      }

      return Object.entries(data)
        .map(([field, message]) => {
          const text = Array.isArray(message)
            ? message.join(" ")
            : String(message);

          return `${field}: ${text}`;
        })
        .join(" ");
    }

    return err.message || fallback;
  };

  const sortAppointments = (items) => {
    return [...items].sort((a, b) => {
      const dateA = `${a.appointment_date || ""} ${
        a.appointment_time || ""
      }`;

      const dateB = `${b.appointment_date || ""} ${
        b.appointment_time || ""
      }`;

      return dateB.localeCompare(dateA);
    });
  };

  const filterAppointments = (
    appointmentList,
    value
  ) => {
    const searchValue = value
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return appointmentList;
    }

    return appointmentList.filter(
      (appointment) => {
        const appointmentId =
          appointment.appointment_id
            ?.toLowerCase() || "";

        const patientId =
          appointment.patient_id
            ?.toLowerCase() || "";

        return (
          appointmentId.includes(
            searchValue
          ) ||
          patientId.includes(
            searchValue
          )
        );
      }
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsedDate.getTime())) {
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

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] =
      time.slice(0, 5).split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "confirmed";

      case "COMPLETED":
        return "completed";

      case "CANCELLED":
        return "cancelled";

      case "NO_SHOW":
        return "no-show";

      case "SCHEDULED":
      default:
        return "scheduled";
    }
  };

  // ============================================================
  // FETCH APPOINTMENTS, DEPARTMENTS, DOCTORS & AVAILABILITY
  // ============================================================

  const fetchData = async () => {
    try {
      const [
        appointmentsResponse,
        departmentsResponse,
        doctorsResponse,
        availabilityResponse,
      ] = await Promise.all([
        api.get("appointments/"),
        api.get("departments/"),
        api.get("doctors/"),
        api.get("doctor-availability/"),
      ]);

      const appointmentData = sortAppointments(
        getData(appointmentsResponse)
      );

      setAppointments(appointmentData);

      setFilteredAppointments(
        filterAppointments(
          appointmentData,
          searchTerm
        )
      );

      setDepartments(
        getData(departmentsResponse)
      );

      setDoctors(
        getData(doctorsResponse)
      );

      setDoctorAvailability(
        getData(availabilityResponse)
      );
    } catch (err) {
      console.error(
        "Appointments data error:",
        err
      );

      setError(
        "Unable to load appointments data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // APPOINTMENT SEARCH
  // ============================================================

  const handleAppointmentSearch = (e) => {
    const value = e.target.value;

    setSearchTerm(value);

    setFilteredAppointments(
      filterAppointments(
        appointments,
        value
      )
    );
  };

  const clearAppointmentSearch = () => {
    setSearchTerm("");
    setFilteredAppointments(
      appointments
    );
  };

  // ============================================================
  // PATIENT SEARCH
  // ============================================================

  const searchPatients = async (value) => {
    setPatientSearch(value);

    if (!value.trim()) {
      setPatientSearchResults([]);
      return;
    }

    try {
      setPatientSearching(true);

      const response = await api.get(
        `patients/search/?search=${encodeURIComponent(
          value
        )}`
      );

      setPatientSearchResults(
        getData(response)
      );
    } catch (err) {
      console.error(
        "Patient search error:",
        err
      );

      setPatientSearchResults([]);
    } finally {
      setPatientSearching(false);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);

    setFormData({
      ...formData,
      patient: patient.id,
    });

    setPatientSearchResults([]);
    setPatientSearch("");
  };

  const changePatient = () => {
    setSelectedPatient(null);

    setFormData({
      ...formData,
      patient: "",
    });

    setPatientSearch("");
    setPatientSearchResults([]);
  };

  // ============================================================
  // GET SELECTED DATE WEEKDAY
  // ============================================================

  const getSelectedWeekday = () => {
    if (!formData.appointment_date) {
      return null;
    }

    const selectedDate = new Date(
      `${formData.appointment_date}T00:00:00`
    );

    return (
      (selectedDate.getDay() + 6) % 7
    );
  };

  const selectedWeekday =
    getSelectedWeekday();

  // ============================================================
  // FILTER DOCTORS
  // ============================================================

  const filteredDoctors =
    formData.department &&
    selectedWeekday !== null
      ? doctors.filter((doctor) => {
          const sameDepartment =
            String(
              doctor.department
            ) ===
            String(
              formData.department
            );

          if (!sameDepartment) {
            return false;
          }

          if (!doctor.consultation_room) {
            return false;
          }

          const availableOnSelectedDay =
            doctorAvailability.some(
              (availability) =>
                String(
                  availability.doctor
                ) === String(doctor.id) &&
                Number(
                  availability.day_of_week
                ) === selectedWeekday &&
                availability.is_available ===
                  true
            );

          return availableOnSelectedDay;
        })
      : [];

  // ============================================================
  // FETCH AVAILABLE TIME SLOTS
  // ============================================================

  const fetchAvailableSlots = async (
    doctorId,
    appointmentDate
  ) => {
    if (!doctorId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);

      const response = await api.get(
        `appointments/available-slots/?doctor=${doctorId}&date=${appointmentDate}`
      );

      setAvailableSlots(
        response.data.available_slots || []
      );
    } catch (err) {
      console.error(
        "Available slots error:",
        err
      );

      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // FETCH SLOTS WHEN DOCTOR + DATE CHANGE
  // ============================================================

  useEffect(() => {
    fetchAvailableSlots(
      formData.doctor,
      formData.appointment_date
    );
  }, [
    formData.doctor,
    formData.appointment_date,
  ]);

  // ============================================================
  // HANDLE CREATE FORM CHANGES
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "department") {
      setFormData({
        ...formData,
        department: value,
        doctor: "",
        appointment_time: "",
      });

      setAvailableSlots([]);

      return;
    }

    if (name === "doctor") {
      setFormData({
        ...formData,
        doctor: value,
        appointment_time: "",
      });

      return;
    }

    if (name === "appointment_date") {
      setFormData({
        ...formData,
        appointment_date: value,
        doctor: "",
        appointment_time: "",
      });

      setAvailableSlots([]);

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ============================================================
  // CREATE APPOINTMENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await api.post(
        "appointments/",
        {
          patient: Number(
            formData.patient
          ),
          doctor: Number(
            formData.doctor
          ),
          appointment_date:
            formData.appointment_date,
          appointment_time:
            formData.appointment_time,
          reason: formData.reason,
        }
      );

      setSuccess(
        "Appointment created successfully."
      );

      setFormData({
        patient: "",
        department: "",
        doctor: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
      });

      setAvailableSlots([]);

      setSelectedPatient(null);
      setPatientSearch("");
      setPatientSearchResults([]);

      setShowForm(false);

      await fetchData();
    } catch (err) {
      console.error(
        "Create appointment error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to create appointment."
        )
      );
    }
  };

  // ============================================================
  // START EDITING
  // ============================================================

  const startEditing = (
    appointment
  ) => {
    setError("");
    setSuccess("");

    setEditingAppointment(
      appointment
    );

    setEditFormData({
      appointment_date:
        appointment.appointment_date,

      appointment_time:
        appointment.appointment_time
          ? appointment.appointment_time.slice(
              0,
              5
            )
          : "",

      status:
        appointment.status,

      reason:
        appointment.reason || "",

      notes:
        appointment.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // EDIT FORM CHANGE
  // ============================================================

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]:
        e.target.value,
    });
  };

  // ============================================================
  // UPDATE APPOINTMENT
  // ============================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingAppointment) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.put(
        `appointments/${editingAppointment.id}/`,
        editFormData
      );

      setSuccess(
        "Appointment updated successfully."
      );

      setEditingAppointment(null);

      await fetchData();
    } catch (err) {
      console.error(
        "Update appointment error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update appointment."
        )
      );
    }
  };

  // ============================================================
  // CANCEL APPOINTMENT
  // ============================================================

  const cancelAppointment = async (
    appointment
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to cancel the appointment for ${appointment.patient_name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `appointments/${appointment.id}/`
      );

      setSuccess(
        "Appointment cancelled successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Cancel appointment error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to cancel appointment."
        )
      );
    }
  };

  // ============================================================
  // STATUS OPTIONS
  // ============================================================

  const getStatusOptions = (
    currentStatus
  ) => {
    const statusTransitions = {
      SCHEDULED: [
        "SCHEDULED",
        "CONFIRMED",
        "CANCELLED",
      ],

      CONFIRMED: [
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],

      COMPLETED: [
        "COMPLETED",
      ],

      CANCELLED: [
        "CANCELLED",
      ],

      NO_SHOW: [
        "NO_SHOW",
      ],
    };

    return (
      statusTransitions[
        currentStatus
      ] || [currentStatus]
    );
  };

  // ============================================================
  // OPEN CREATE FORM
  // ============================================================

  const openCreateForm = () => {
    setEditingAppointment(null);

    setFormData({
      patient: "",
      department: "",
      doctor: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
    });

    setSelectedPatient(null);
    setPatientSearch("");
    setPatientSearchResults([]);
    setAvailableSlots([]);

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeCreateForm = () => {
    setShowForm(false);

    setFormData({
      patient: "",
      department: "",
      doctor: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
    });

    setSelectedPatient(null);
    setPatientSearch("");
    setPatientSearchResults([]);
    setAvailableSlots([]);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="receptionist-appointments-page">

        <div className="receptionist-appointments-state">

          <div className="receptionist-appointments-spinner" />

          <p>
            Loading appointments...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="receptionist-appointments-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="receptionist-appointments-header">

        <div>

          <p className="receptionist-appointments-eyebrow">
            RECEPTIONIST PORTAL
          </p>

          <h1>
            Appointments
          </h1>

          <p className="receptionist-appointments-subtitle">
            Schedule, review, and manage
            hospital appointments.
          </p>

        </div>

        <div className="receptionist-appointments-header-actions">

          <div className="receptionist-appointments-count">

            <span>
              Total Appointments
            </span>

            <strong>
              {appointments.length}
            </strong>

          </div>

          <button
            type="button"
            className="receptionist-appointments-primary-btn"
            onClick={
              showForm
                ? closeCreateForm
                : openCreateForm
            }
          >
            <span>
              {showForm
                ? "×"
                : "+"}
            </span>

            {showForm
              ? "Close Form"
              : "Add Appointment"}

          </button>

        </div>

      </div>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="receptionist-appointments-success">

          <span>✓</span>

          {success}

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="receptionist-appointments-error">

          <span>!</span>

          {error}

        </div>
      )}

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="receptionist-appointments-search-card">

        <div className="receptionist-appointments-search-header">

          <div>

            <h2>
              Find an Appointment
            </h2>

            <p>
              Search using Appointment ID
              or Patient ID.
            </p>

          </div>

          {searchTerm && (
            <button
              type="button"
              className="receptionist-appointments-clear-btn"
              onClick={
                clearAppointmentSearch
              }
            >
              Clear
            </button>
          )}

        </div>

        <div className="receptionist-appointments-search-box">

          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={
              handleAppointmentSearch
            }
            placeholder="Search by Appointment ID or Patient ID..."
          />

        </div>

      </div>

      {/* ======================================================
          CREATE FORM
      ====================================================== */}

      {showForm && (
        <div className="receptionist-appointments-form-card">

          <div className="receptionist-appointments-section-header">

            <div>

              <p className="receptionist-appointments-section-eyebrow">
                NEW APPOINTMENT
              </p>

              <h2>
                Schedule Appointment
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-appointments-close-btn"
              onClick={
                closeCreateForm
              }
            >
              ×
            </button>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* PATIENT */}

            <div className="receptionist-appointments-form-section">

              <div className="receptionist-appointments-form-section-title">

                <span>01</span>

                <div>

                  <h3>
                    Patient
                  </h3>

                  <p>
                    Select the patient
                    for this appointment.
                  </p>

                </div>

              </div>

              {!selectedPatient ? (

                <div className="receptionist-appointments-patient-search">

                  <label>
                    Search Patient *
                  </label>

                  <div className="receptionist-appointments-search-box">

                    <span>⌕</span>

                    <input
                      type="text"
                      value={
                        patientSearch
                      }
                      onChange={(e) =>
                        searchPatients(
                          e.target.value
                        )
                      }
                      placeholder="Patient ID, Aadhaar, or name..."
                      required
                    />

                  </div>

                  {patientSearching && (
                    <p className="receptionist-appointments-search-status">
                      Searching patients...
                    </p>
                  )}

                  {patientSearchResults.length >
                    0 && (

                    <div className="receptionist-appointments-patient-results">

                      {patientSearchResults.map(
                        (patient) => (

                          <button
                            type="button"
                            key={
                              patient.id
                            }
                            className="receptionist-appointments-patient-result"
                            onClick={() =>
                              selectPatient(
                                patient
                              )
                            }
                          >

                            <span className="receptionist-appointments-patient-avatar">
                              {(
                                patient.first_name ||
                                "P"
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </span>

                            <span>

                              <strong>
                                {
                                  patient.patient_id
                                }
                              </strong>

                              <small>
                                {
                                  patient.first_name
                                }{" "}
                                {
                                  patient.last_name
                                }

                                {patient.mobile_number &&
                                  ` • ${patient.mobile_number}`}
                              </small>

                            </span>

                          </button>

                        )
                      )}

                    </div>

                  )}

                  {patientSearch.trim() &&
                    !patientSearching &&
                    patientSearchResults.length ===
                      0 && (

                    <p className="receptionist-appointments-search-empty">
                      No patient found.
                    </p>

                  )}

                </div>

              ) : (

                <div className="receptionist-appointments-selected-patient">

                  <div className="receptionist-appointments-selected-patient-icon">
                    {(
                      selectedPatient.first_name ||
                      "P"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <span>
                      Selected Patient
                    </span>

                    <strong>
                      {
                        selectedPatient.patient_id
                      }{" "}
                      —{" "}
                      {
                        selectedPatient.first_name
                      }{" "}
                      {
                        selectedPatient.last_name
                      }
                    </strong>

                  </div>

                  <button
                    type="button"
                    onClick={
                      changePatient
                    }
                  >
                    Change
                  </button>

                </div>

              )}

            </div>

            {/* APPOINTMENT DETAILS */}

            <div className="receptionist-appointments-form-section">

              <div className="receptionist-appointments-form-section-title">

                <span>02</span>

                <div>

                  <h3>
                    Appointment Details
                  </h3>

                  <p>
                    Choose department,
                    date, doctor, and time.
                  </p>

                </div>

              </div>

              <div className="receptionist-appointments-form-grid">

                {/* DEPARTMENT */}

                <div className="receptionist-appointments-form-group">

                  <label>
                    Department *
                  </label>

                  <select
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (
                        department
                      ) => (

                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* DATE */}

                <div className="receptionist-appointments-form-group">

                  <label>
                    Appointment Date *
                  </label>

                  <input
                    type="date"
                    name="appointment_date"
                    value={
                      formData.appointment_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                {/* DOCTOR */}

                <div className="receptionist-appointments-form-group">

                  <label>
                    Doctor *
                  </label>

                  <select
                    name="doctor"
                    value={
                      formData.doctor
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      !formData.department ||
                      !formData.appointment_date
                    }
                  >

                    <option value="">

                      {!formData.department
                        ? "Select Department First"
                        : !formData.appointment_date
                        ? "Select Date First"
                        : filteredDoctors.length ===
                          0
                        ? "No Doctors Available"
                        : "Select Doctor"}

                    </option>

                    {filteredDoctors.map(
                      (
                        doctor
                      ) => (

                        <option
                          key={
                            doctor.id
                          }
                          value={
                            doctor.id
                          }
                        >
                          {
                            doctor.doctor_id
                          }{" "}
                          - Dr.{" "}
                          {
                            doctor.first_name
                          }{" "}
                          {
                            doctor.last_name
                          }
                        </option>

                      )
                    )}

                  </select>

                  {formData.department &&
                    formData.appointment_date &&
                    filteredDoctors.length ===
                      0 && (

                    <small className="receptionist-appointments-field-hint">
                      No doctor with a
                      consultation room is
                      available for this
                      department and day.
                    </small>

                  )}

                </div>

                {/* TIME */}

                <div className="receptionist-appointments-form-group">

                  <label>
                    Appointment Time *
                  </label>

                  <select
                    name="appointment_time"
                    value={
                      formData.appointment_time
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      !formData.doctor ||
                      !formData.appointment_date ||
                      loadingSlots
                    }
                  >

                    <option value="">

                      {!formData.doctor
                        ? "Select Doctor First"
                        : loadingSlots
                        ? "Loading available slots..."
                        : availableSlots.length ===
                          0
                        ? "No Available Slots"
                        : "Select Available Time"}

                    </option>

                    {availableSlots.map(
                      (slot) => (

                        <option
                          key={
                            slot.value
                          }
                          value={
                            slot.value
                          }
                        >
                          {
                            slot.display
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* REASON */}

                <div className="receptionist-appointments-form-group form-full">

                  <label>
                    Reason
                  </label>

                  <textarea
                    name="reason"
                    value={
                      formData.reason
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Enter reason for appointment..."
                  />

                </div>

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="receptionist-appointments-form-actions">

              <button
                type="button"
                className="receptionist-appointments-cancel-btn"
                onClick={
                  closeCreateForm
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-appointments-save-btn"
              >
                Schedule Appointment
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================
          EDIT FORM
      ====================================================== */}

      {editingAppointment && (
        <div className="receptionist-appointments-form-card">

          <div className="receptionist-appointments-section-header">

            <div>

              <p className="receptionist-appointments-section-eyebrow">
                UPDATE APPOINTMENT
              </p>

              <h2>
                Edit Appointment
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-appointments-close-btn"
              onClick={() =>
                setEditingAppointment(
                  null
                )
              }
            >
              ×
            </button>

          </div>

          <div className="receptionist-appointments-edit-summary">

            <div>
              <span>
                Appointment
              </span>

              <strong>
                {
                  editingAppointment.appointment_id
                }
              </strong>
            </div>

            <div>
              <span>
                Patient
              </span>

              <strong>
                {
                  editingAppointment.patient_id
                }
                {" — "}
                {
                  editingAppointment.patient_name
                }
              </strong>
            </div>

            <div>
              <span>
                Doctor
              </span>

              <strong>
                {
                  editingAppointment.doctor_id
                }
                {" — "}
                {
                  editingAppointment.doctor_name
                }
              </strong>
            </div>

            <div>
              <span>
                Consultation Room
              </span>

              <strong>
                {
                  editingAppointment.consultation_room_number ||
                  "-"
                }
              </strong>
            </div>

          </div>

          <form
            onSubmit={
              handleUpdate
            }
          >

            <div className="receptionist-appointments-form-grid">

              {/* DATE */}

              <div className="receptionist-appointments-form-group">

                <label>
                  Appointment Date *
                </label>

                <input
                  type="date"
                  name="appointment_date"
                  value={
                    editFormData.appointment_date
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />

              </div>

              {/* TIME */}

              <div className="receptionist-appointments-form-group">

                <label>
                  Appointment Time *
                </label>

                <input
                  type="time"
                  name="appointment_time"
                  value={
                    editFormData.appointment_time
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                />

              </div>

              {/* STATUS */}

              <div className="receptionist-appointments-form-group">

                <label>
                  Status *
                </label>

                <select
                  name="status"
                  value={
                    editFormData.status
                  }
                  onChange={
                    handleEditChange
                  }
                  required
                >

                  {getStatusOptions(
                    editingAppointment.status
                  ).map(
                    (status) => (

                      <option
                        key={status}
                        value={
                          status
                        }
                      >
                        {
                          status
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* REASON */}

              <div className="receptionist-appointments-form-group form-full">

                <label>
                  Reason
                </label>

                <textarea
                  name="reason"
                  value={
                    editFormData.reason
                  }
                  onChange={
                    handleEditChange
                  }
                  rows="3"
                />

              </div>

              {/* NOTES */}

              <div className="receptionist-appointments-form-group form-full">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    editFormData.notes
                  }
                  onChange={
                    handleEditChange
                  }
                  rows="3"
                  placeholder="Add appointment notes..."
                />

              </div>

            </div>

            <div className="receptionist-appointments-form-actions">

              <button
                type="button"
                className="receptionist-appointments-cancel-btn"
                onClick={() =>
                  setEditingAppointment(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-appointments-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================
          APPOINTMENT DIRECTORY
      ====================================================== */}

      <div className="receptionist-appointments-table-section">

        <div className="receptionist-appointments-table-header">

          <div>

            <h2>
              Appointment Directory
            </h2>

            <p>
              {filteredAppointments.length}{" "}
              appointment
              {filteredAppointments.length !==
              1
                ? "s"
                : ""}{" "}
              displayed
            </p>

          </div>

        </div>

        {filteredAppointments.length ===
        0 ? (

          <div className="receptionist-appointments-empty">

            <div className="receptionist-appointments-empty-icon">
              ◷
            </div>

            <h3>
              {searchTerm
                ? "No appointment found"
                : "No appointments found"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with another Appointment ID or Patient ID."
                : "Schedule an appointment to get started."}
            </p>

            {searchTerm && (
              <button
                type="button"
                className="receptionist-appointments-clear-btn"
                onClick={
                  clearAppointmentSearch
                }
              >
                Clear Search
              </button>
            )}

          </div>

        ) : (

          <div className="receptionist-appointments-table-wrapper">

            <table className="receptionist-appointments-table">

              <thead>

                <tr>
                  <th>
                    Appointment
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Room
                  </th>

                  <th>
                    Schedule
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredAppointments.map(
                  (appointment) => (

                    <tr
                      key={
                        appointment.id
                      }
                    >

                      {/* APPOINTMENT */}

                      <td>

                        <div className="receptionist-appointment-id-cell">

                          <strong>
                            {
                              appointment.appointment_id ||
                              "-"
                            }
                          </strong>

                          <span>
                            Created{" "}
                            {appointment.created_at
                              ? formatDate(
                                  appointment.created_at.slice(
                                    0,
                                    10
                                  )
                                )
                              : "-"}
                          </span>

                        </div>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="receptionist-appointment-person">

                          <div className="receptionist-appointment-avatar">
                            {(
                              appointment.patient_name ||
                              "P"
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>

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

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="receptionist-appointment-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              appointment.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              appointment.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      {/* DEPARTMENT */}

                      <td>

                        <span className="receptionist-appointment-department">
                          {
                            appointment.department_name ||
                            "-"
                          }
                        </span>

                      </td>

                      {/* ROOM */}

                      <td>

                        <span className="receptionist-appointment-room">
                          {appointment.consultation_room_number ||
                            "Not Assigned"}
                        </span>

                      </td>

                      {/* SCHEDULE */}

                      <td>

                        <div className="receptionist-appointment-schedule">

                          <strong>
                            {formatDate(
                              appointment.appointment_date
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              appointment.appointment_time
                            )}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`receptionist-appointment-status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {
                            appointment.status
                          }
                        </span>

                      </td>

                      {/* REASON */}

                      <td>

                        <div className="receptionist-appointment-reason">

                          <span>
                            {
                              appointment.reason ||
                              "No reason provided"
                            }
                          </span>

                          {appointment.notes && (
                            <small>
                              Notes:{" "}
                              {
                                appointment.notes
                              }
                            </small>
                          )}

                        </div>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="receptionist-appointment-actions">

                          <button
                            type="button"
                            className="receptionist-appointments-edit-btn"
                            onClick={() =>
                              startEditing(
                                appointment
                              )
                            }
                          >
                            <span>
                              ✎
                            </span>
                            Edit
                          </button>

                          {[
                            "COMPLETED",
                            "CANCELLED",
                            "NO_SHOW",
                          ].includes(
                            appointment.status
                          ) ? (

                            <button
                              type="button"
                              className="receptionist-appointments-cancel-action-btn disabled"
                              disabled
                            >
                              Cancel
                            </button>

                          ) : (

                            <button
                              type="button"
                              className="receptionist-appointments-cancel-action-btn"
                              onClick={() =>
                                cancelAppointment(
                                  appointment
                                )
                              }
                            >
                              Cancel
                            </button>

                          )}

                        </div>

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

export default ReceptionistAppointments;