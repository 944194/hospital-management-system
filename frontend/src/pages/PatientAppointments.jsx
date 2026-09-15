import { useEffect, useState } from "react";
import api from "../services/api";

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================
  // SEARCH / FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formData, setFormData] = useState({
    department: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
  });

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    try {
      const [
        appointmentsResponse,
        doctorsResponse,
        availabilityResponse,
        departmentsResponse,
      ] = await Promise.all([
        api.get("appointments/"),
        api.get("doctors/"),
        api.get("doctor-availability/"),
        api.get("departments/"),
      ]);

      const sortedAppointments =
        [...appointmentsResponse.data].sort(
          (a, b) => b.id - a.id
        );

      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);

      setDoctors(doctorsResponse.data);
      setAvailabilities(
        availabilityResponse.data
      );
      setDepartments(
        departmentsResponse.data
      );
    } catch (err) {
      console.error(
        "Appointments error:",
        err
      );

      setError(
        "Unable to load appointment data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SEARCH / FILTER APPOINTMENTS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = appointments.filter(
      (appointment) => {
        // --------------------------------------
        // Search by Appointment ID
        // --------------------------------------

        const appointmentId =
          appointment.appointment_id
            ?.toLowerCase() || "";

        // --------------------------------------
        // Search by Doctor ID
        // --------------------------------------

        const doctorId =
          appointment.doctor_id
            ?.toLowerCase() || "";

        // --------------------------------------
        // Search by Doctor Name
        // --------------------------------------

        const doctorName =
          appointment.doctor_name
            ?.toLowerCase() || "";

        // --------------------------------------
        // Search text matching
        // --------------------------------------

        const matchesSearch =
          !searchValue ||
          appointmentId.includes(
            searchValue
          ) ||
          doctorId.includes(
            searchValue
          ) ||
          doctorName.includes(
            searchValue
          );

        // --------------------------------------
        // Status filter
        // --------------------------------------

        const matchesStatus =
          !statusFilter ||
          appointment.status ===
            statusFilter;

        // --------------------------------------
        // Department filter
        // --------------------------------------

        const matchesDepartment =
          !departmentFilter ||
          String(
            appointment.department_name || ""
          ).toLowerCase() ===
            String(
              departmentFilter
            ).toLowerCase();

        // --------------------------------------
        // From date filter
        // --------------------------------------

        const matchesFromDate =
          !fromDate ||
          appointment.appointment_date >=
            fromDate;

        // --------------------------------------
        // To date filter
        // --------------------------------------

        const matchesToDate =
          !toDate ||
          appointment.appointment_date <=
            toDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDepartment &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );

    setFilteredAppointments(results);
  }, [
    appointments,
    searchTerm,
    statusFilter,
    departmentFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDepartmentFilter("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,

      ...(name === "department"
        ? {
            doctor: "",
            appointment_time: "",
          }
        : {}),

      ...(name === "doctor" ||
      name === "appointment_date"
        ? {
            appointment_time: "",
          }
        : {}),
    }));

    setFormError("");
  };

  // ==========================================
  // GET FILTERED DOCTORS
  // department + date +
  // availability + consultation room
  // ==========================================

  const getFilteredDoctors = () => {
    if (
      !formData.department ||
      !formData.appointment_date
    ) {
      return [];
    }

    const selectedDate = new Date(
      `${formData.appointment_date}T00:00:00`
    );

    const dayOfWeek =
      selectedDate.getDay() === 0
        ? 6
        : selectedDate.getDay() - 1;

    return doctors.filter((doctor) => {
      // --------------------------------
      // Department filter
      // --------------------------------

      const departmentMatches =
        String(doctor.department) ===
        String(formData.department);

      if (!departmentMatches) {
        return false;
      }

      // --------------------------------
      // Doctor must have consultation room
      // --------------------------------

      if (!doctor.consultation_room) {
        return false;
      }

      // --------------------------------
      // Doctor must be available
      // on selected day
      // --------------------------------

      const doctorAvailable =
        availabilities.some(
          (availability) =>
            String(
              availability.doctor
            ) === String(doctor.id) &&
            Number(
              availability.day_of_week
            ) === dayOfWeek &&
            availability.is_available ===
              true
        );

      return doctorAvailable;
    });
  };

  // ==========================================
  // GET SELECTED DOCTOR AVAILABILITY
  // ==========================================

  const getSelectedDoctorAvailability =
    () => {
      if (!formData.doctor) {
        return [];
      }

      return availabilities.filter(
        (availability) =>
          String(
            availability.doctor
          ) === String(formData.doctor)
      );
    };

  // ==========================================
  // GET DAY NAME
  // ==========================================

  const getDayName = (dayNumber) => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return days[dayNumber];
  };

  // ==========================================
  // GENERATE 15-MINUTE TIME SLOTS
  // ==========================================

  const getAvailableTimeSlots = () => {
    if (
      !formData.doctor ||
      !formData.appointment_date
    ) {
      return [];
    }

    const selectedDate = new Date(
      `${formData.appointment_date}T00:00:00`
    );

    const dayOfWeek =
      selectedDate.getDay() === 0
        ? 6
        : selectedDate.getDay() - 1;

    const doctorAvailabilities =
      availabilities.filter(
        (availability) =>
          String(
            availability.doctor
          ) === String(formData.doctor) &&
          Number(
            availability.day_of_week
          ) === dayOfWeek &&
          availability.is_available ===
            true
      );

    const slots = [];

    doctorAvailabilities.forEach(
      (availability) => {
        const [
          startHour,
          startMinute,
        ] = availability.start_time
          .slice(0, 5)
          .split(":")
          .map(Number);

        const [
          endHour,
          endMinute,
        ] = availability.end_time
          .slice(0, 5)
          .split(":")
          .map(Number);

        let currentMinutes =
          startHour * 60 +
          startMinute;

        const endMinutes =
          endHour * 60 +
          endMinute;

        // A 15-minute appointment must
        // completely fit inside availability.
        while (
          currentMinutes + 15 <=
          endMinutes
        ) {
          const hour = Math.floor(
            currentMinutes / 60
          );

          const minute =
            currentMinutes % 60;

          const time =
            `${String(hour).padStart(
              2,
              "0"
            )}:` +
            `${String(minute).padStart(
              2,
              "0"
            )}`;

          // Check whether this slot is booked
          const alreadyBooked =
            appointments.some(
              (appointment) =>
                String(
                  appointment.doctor
                ) ===
                  String(
                    formData.doctor
                  ) &&
                appointment.appointment_date ===
                  formData.appointment_date &&
                appointment.appointment_time?.slice(
                  0,
                  5
                ) === time &&
                appointment.status !==
                  "CANCELLED"
            );

          if (!alreadyBooked) {
            slots.push(time);
          }

          currentMinutes += 15;
        }
      }
    );

    return [...new Set(slots)].sort();
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    const [hour, minute] =
      time.split(":").map(Number);

    const date = new Date();

    date.setHours(hour);
    date.setMinutes(minute);

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // SUBMIT APPOINTMENT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    try {
      const payload = {
        doctor: formData.doctor,

        appointment_date:
          formData.appointment_date,

        appointment_time:
          formData.appointment_time,

        reason: formData.reason,
      };

      const response = await api.post(
        "appointments/",
        payload
      );

      setAppointments((previous) => [
        response.data,
        ...previous,
      ]);

      setFormData({
        department: "",
        doctor: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
      });

      setShowForm(false);
      setFormError("");
    } catch (err) {
      console.error(
        "Create appointment error:",
        err
      );

      if (err.response?.data) {
        const errorData =
          err.response.data;

        let message = "";

        if (errorData.error) {
          message = errorData.error;
        }

        if (
          errorData.available_timings &&
          errorData.available_timings.length >
            0
        ) {
          message +=
            ` Available timings: ` +
            errorData.available_timings.join(
              ", "
            );
        }

        if (!message) {
          message = Object.values(
            errorData
          )
            .flat()
            .join(" ");
        }

        setFormError(
          message ||
            "Unable to create appointment."
        );
      } else {
        setFormError(
          "Unable to create appointment."
        );
      }
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancelForm = () => {
    setShowForm(false);

    setFormData({
      department: "",
      doctor: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
    });

    setFormError("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <h2>
        Loading appointments...
      </h2>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return <h2>{error}</h2>;
  }

  const timeSlots =
    getAvailableTimeSlots();

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-appointments-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-appointments-header">

        <div>

          <h1>
            My Appointments
          </h1>

          <p>
            View and book your appointments.
          </p>

        </div>

        <div className="patient-appointments-summary-card">

          <strong>
            Total Appointments:{" "}
            {appointments.length}
          </strong>

        </div>

      </div>

      {/* ======================================
    SEARCH / FILTER BUTTON
    ====================================== */}

<div className="patient-appointments-filter-toggle">
  <button
    type="button"
    className="patient-appointments-filter-button"
    onClick={() => setShowFilters(!showFilters)}
  >
    {showFilters
      ? "✕ Hide Search & Filters"
      : "☰ Search & Filter"}
  </button>

  {showFilters && (
    <span className="patient-appointments-active-filter-text">
      Find appointments using search, status,
      department or date.
    </span>
  )}
</div>

{/* ======================================
    APPOINTMENT SEARCH / FILTERS
    ====================================== */}

{showFilters && (
  <div className="patient-appointments-filter-card">

    <div className="patient-appointments-section-title">
      <h2>
        Search & Filter Appointments
      </h2>

      <p>
        Find your appointments quickly.
      </p>
    </div>

    <div className="form-grid">

      {/* Search */}

      <div>
        <label>
          Search
        </label>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          placeholder="Appointment ID, Doctor ID or Doctor Name"
        />
      </div>

      {/* Status */}

      <div>
        <label>
          Appointment Status
        </label>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="">
            All Statuses
          </option>

          <option value="SCHEDULED">
            SCHEDULED
          </option>

          <option value="CONFIRMED">
            CONFIRMED
          </option>

          <option value="COMPLETED">
            COMPLETED
          </option>

          <option value="CANCELLED">
            CANCELLED
          </option>

          <option value="NO_SHOW">
            NO SHOW
          </option>
        </select>
      </div>

      {/* Department */}

      <div>
        <label>
          Department
        </label>

        <select
          value={departmentFilter}
          onChange={(e) =>
            setDepartmentFilter(
              e.target.value
            )
          }
        >
          <option value="">
            All Departments
          </option>

          {departments.map(
            (department) => (
              <option
                key={department.id}
                value={department.name}
              >
                {department.name}
              </option>
            )
          )}
        </select>
      </div>

      {/* From Date */}

      <div>
        <label>
          From Date
        </label>

        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
        />
      </div>

      {/* To Date */}

      <div>
        <label>
          To Date
        </label>

        <input
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) =>
            setToDate(e.target.value)
          }
        />
      </div>

    </div>

    <button
      type="button"
      className="patient-appointments-clear-button"
      onClick={handleClearFilters}
    >
      Clear Filters
    </button>

    <p className="patient-appointments-result-count">
      Showing{" "}
      <strong>
        {filteredAppointments.length}
      </strong>{" "}
      of{" "}
      <strong>
        {appointments.length}
      </strong>{" "}
      appointments
    </p>

  </div>
)}

      {/* ======================================
          BOOK APPOINTMENT BUTTON
          ====================================== */}

      <button
        className="patient-appointments-book-button"
        onClick={() => {
          setShowForm(!showForm);
          setFormError("");
        }}
      >
        {showForm
          ? "Cancel"
          : "Book Appointment"}
      </button>

      {/* ======================================
          BOOKING FORM
          ====================================== */}

      {showForm && (
        <div className="patient-appointments-booking-card">

          <h2>
            Book Appointment
          </h2>

          <p>
            Appointments are available in
            15-minute slots.
          </p>

          {formError && (
            <p className="form-error">
              {formError}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
          >

            {/* Department */}

            <div>
              <label>
                Department
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
                  (department) => (
                    <option
                      key={department.id}
                      value={
                        department.id
                      }
                    >
                      {department.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Date */}

            <div>

              <label>
                Appointment Date
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
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                required
              />

            </div>

            {/* Doctor */}

            <div>

              <label>
                Doctor
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
                    ? "Select Department first"
                    : !formData.appointment_date
                    ? "Select Date first"
                    : getFilteredDoctors()
                        .length === 0
                    ? "No doctors available"
                    : "Select Doctor"}
                </option>

                {getFilteredDoctors().map(
                  (doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      {doctor.doctor_id ||
                        "-"}{" "}
                      - Dr.{" "}
                      {doctor.doctor_name ||
                        "-"}
                      {" - "}
                      {doctor.specialization ||
                        "-"}
                    </option>
                  )
                )}

              </select>

              {formData.department &&
                formData.appointment_date &&
                getFilteredDoctors()
                  .length === 0 && (
                  <p>
                    No doctors are available
                    in this department on
                    the selected date.
                  </p>
                )}

            </div>

            {/* Weekly Availability */}

            {formData.doctor && (
              <div>

                <h3>
                  Doctor Availability
                </h3>

                {getSelectedDoctorAvailability()
                  .length === 0 ? (
                  <p>
                    No availability found.
                  </p>
                ) : (
                  <ul>

                    {getSelectedDoctorAvailability().map(
                      (availability) => (
                        <li
                          key={
                            availability.id
                          }
                        >
                          {getDayName(
                            availability.day_of_week
                          )}
                          :{" "}
                          {availability.start_time.slice(
                            0,
                            5
                          )}
                          {" - "}
                          {availability.end_time.slice(
                            0,
                            5
                          )}
                        </li>
                      )
                    )}

                  </ul>
                )}

              </div>
            )}

            {/* Time */}

            <div>

              <label>
                Appointment Time
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
                  !formData.appointment_date
                }
              >

                <option value="">
                  {!formData.doctor
                    ? "Select Doctor first"
                    : !formData.appointment_date
                    ? "Select Date first"
                    : timeSlots.length === 0
                    ? "No slots available"
                    : "Select Time Slot"}
                </option>

                {timeSlots.map(
                  (time) => (
                    <option
                      key={time}
                      value={time}
                    >
                      {formatTime(time)}
                    </option>
                  )
                )}

              </select>

              {formData.doctor &&
                formData.appointment_date &&
                timeSlots.length === 0 && (
                  <p>
                    No available appointment
                    slots for the selected date.
                  </p>
                )}

            </div>

            {/* Reason */}

            <div>

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
                placeholder="Enter reason for appointment"
                rows="4"
                required
              />

            </div>

            <button type="submit">
              Book Appointment
            </button>

            <button
              type="button"
              onClick={
                handleCancelForm
              }
              style={{
                marginLeft: "10px",
              }}
            >
              Cancel
            </button>

          </form>

        </div>
      )}

      {/* ======================================
          APPOINTMENT TABLE
          ====================================== */}

      {filteredAppointments.length ===
      0 ? (
        <div className="patient-appointments-empty-state">

          <h3>
            No Appointments Found
          </h3>

          <p>
            {searchTerm ||
            statusFilter ||
            departmentFilter ||
            fromDate ||
            toDate
              ? "No appointments match the selected search or filters."
              : "You currently have no appointments."}
          </p>

        </div>
      ) : (
        <div className="patient-appointments-table-card">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  Appointment ID
                </th>

                <th>
                  Doctor
                </th>

                <th>
                  Department
                </th>

                <th>
                  Consultation Room
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

                    <td>
                      <strong>
                        {appointment.appointment_id ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {appointment.doctor_id ||
                          "-"}
                      </strong>
                      <br />
                      {appointment.doctor_name ||
                        "-"}
                    </td>

                    <td>
                      {appointment.department_name ||
                        "-"}
                    </td>

                    <td>
                      {appointment.consultation_room_number ||
                        "-"}
                    </td>

                    <td>
                      {
                        appointment.appointment_date
                      }
                    </td>

                    <td>
                      {
                        appointment.appointment_time
                      }
                    </td>

                    <td>

                      <span
                        className={`status-badge status-${appointment.status
                          ?.toLowerCase()
                          .replace(
                            "_",
                            "-"
                          )}`}
                      >
                        {
                          appointment.status
                        }
                      </span>

                    </td>

                    <td>
                      {appointment.reason ||
                        "-"}
                    </td>

                    <td>
                      {appointment.notes ||
                        "-"}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default PatientAppointments;