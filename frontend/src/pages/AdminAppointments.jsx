import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminAppointments.css";

function AdminAppointments() {
  const emptyForm = {
    patient: "",
    department: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
    status: "SCHEDULED",
  };

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchResults, setPatientSearchResults] =
    useState([]);
  const [selectedPatient, setSelectedPatient] =
    useState(null);
  const [patientSearching, setPatientSearching] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getData = (response) => {
    return Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];
  };

  const getErrorMessage = (err, fallback) => {
    if (!err.response?.data) {
      return err.message || fallback;
    }

    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data.error) {
      return data.error;
    }

    if (data.detail) {
      return data.detail;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const value = Array.isArray(messages)
            ? messages.join(", ")
            : messages;

          return `${field}: ${value}`;
        })
        .join(" | ");
    }

    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        appointmentsResponse,
        patientsResponse,
        doctorsResponse,
        availabilityResponse,
      ] = await Promise.all([
        api.get("appointments/"),
        api.get("patients/"),
        api.get("doctors/"),
        api.get("doctor-availability/"),
      ]);

      setAppointments(
        getData(appointmentsResponse).sort(
          (a, b) => b.id - a.id
        )
      );

      setPatients(getData(patientsResponse));
      setDoctors(getData(doctorsResponse));
      setAvailabilities(
        getData(availabilityResponse)
      );
    } catch (err) {
      console.error(
        "Appointments error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load appointments."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     FILTER OPTIONS
     ========================================== */

  const departmentOptions = useMemo(() => {
    return [
      ...new Map(
        doctors
          .filter(
            (doctor) =>
              doctor.department &&
              doctor.department_name
          )
          .map((doctor) => [
            String(doctor.department),
            doctor.department_name,
          ])
      ),
    ];
  }, [doctors]);

  const statusOptions = useMemo(() => {
    return [
      ...new Set(
        appointments
          .map(
            (appointment) =>
              appointment.status
          )
          .filter(Boolean)
      ),
    ];
  }, [appointments]);

  /* ==========================================
     FILTER APPOINTMENTS
     ========================================== */

  const filteredAppointments = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return appointments.filter(
      (appointment) => {
        const searchableValues = [
          appointment.appointment_id,
          appointment.patient_id,
          appointment.patient_name,
          appointment.doctor_id,
          appointment.doctor_name,
          appointment.department_name,
          appointment.consultation_room_number,
          appointment.reason,
          appointment.notes,
        ];

        const matchesSearch =
          !search ||
          searchableValues.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search)
          );

        const matchesStatus =
          !statusFilter ||
          String(
            appointment.status || ""
          ).toLowerCase() ===
            statusFilter.toLowerCase();

        const appointmentDepartment =
          appointment.doctor?.department
            ? String(
                appointment.doctor.department
              )
            : "";

        const matchesDepartment =
          !departmentFilter ||
          appointmentDepartment ===
            String(departmentFilter) ||
          doctors.some(
            (doctor) =>
              String(
                doctor.id
              ) ===
                String(
                  appointment.doctor
                ) &&
              String(
                doctor.department
              ) ===
                String(
                  departmentFilter
                )
          );

        const date =
          appointment.appointment_date || "";

        const matchesFromDate =
          !fromDate || date >= fromDate;

        const matchesToDate =
          !toDate || date <= toDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDepartment &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );
  }, [
    appointments,
    searchTerm,
    statusFilter,
    departmentFilter,
    fromDate,
    toDate,
    doctors,
  ]);

  /* ==========================================
     SUMMARY
     ========================================== */

  const summary = useMemo(() => {
    const total = appointments.length;

    const scheduled = appointments.filter(
      (item) =>
        item.status === "SCHEDULED"
    ).length;

    const confirmed = appointments.filter(
      (item) =>
        item.status === "CONFIRMED"
    ).length;

    const completed = appointments.filter(
      (item) =>
        item.status === "COMPLETED"
    ).length;

    const cancelled = appointments.filter(
      (item) =>
        item.status === "CANCELLED"
    ).length;

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
    };
  }, [appointments]);

  /* ==========================================
     PATIENT SEARCH
     ========================================== */

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

    setFormData((previous) => ({
      ...previous,
      patient: patient.id,
    }));

    setPatientSearch("");
    setPatientSearchResults([]);
    setFormError("");
  };

  /* ==========================================
     DOCTOR FILTERING
     ========================================== */

  const filteredDoctors = useMemo(() => {
    if (
      !formData.department ||
      !formData.appointment_date
    ) {
      return [];
    }

    const selectedDate = new Date(
      `${formData.appointment_date}T00:00:00`
    );

    const jsDay =
      selectedDate.getDay();

    const selectedWeekday =
      jsDay === 0 ? 6 : jsDay - 1;

    return doctors.filter((doctor) => {
      if (!doctor.consultation_room) {
        return false;
      }

      if (
        String(doctor.department) !==
        String(formData.department)
      ) {
        return false;
      }

      return availabilities.some(
        (availability) =>
          String(
            availability.doctor
          ) === String(doctor.id) &&
          Number(
            availability.day_of_week
          ) === selectedWeekday &&
          availability.is_available === true
      );
    });
  }, [
    doctors,
    availabilities,
    formData.department,
    formData.appointment_date,
  ]);

  /* ==========================================
     DOCTOR AVAILABILITY
     ========================================== */

  const getDoctorAvailability = () => {
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

  /* ==========================================
     TIME SLOTS
     ========================================== */

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

    const jsDay =
      selectedDate.getDay();

    const dayOfWeek =
      jsDay === 0 ? 6 : jsDay - 1;

    const doctorAvailabilities =
      availabilities.filter(
        (availability) =>
          String(
            availability.doctor
          ) === String(formData.doctor) &&
          Number(
            availability.day_of_week
          ) === dayOfWeek &&
          availability.is_available === true
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
            )}:${String(minute).padStart(
              2,
              "0"
            )}`;

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
                  "CANCELLED" &&
                appointment.id !==
                  editingAppointment?.id
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

  const availableTimeSlots =
    getAvailableTimeSlots();

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

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

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    return (
      `admin-appointments-status-${String(
        status || ""
      ).toLowerCase()}`
    );
  };

  /* ==========================================
     FORM CHANGE
     ========================================== */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,

      ...(name === "department" ||
      name === "appointment_date"
        ? {
            doctor: "",
            appointment_time: "",
          }
        : name === "doctor"
        ? {
            appointment_time: "",
          }
        : {}),
    }));

    setFormError("");
  };

  /* ==========================================
     RESET FORM
     ========================================== */

  const resetForm = () => {
    setEditingAppointment(null);
    setFormData(emptyForm);
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientSearchResults([]);
    setFormError("");
  };

  /* ==========================================
     CREATE
     ========================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!formData.patient) {
      setFormError(
        "Please select a patient."
      );
      return;
    }

    try {
      const response = await api.post(
        "appointments/",
        formData
      );

      setAppointments((previous) =>
        [
          ...previous,
          response.data,
        ].sort(
          (a, b) => b.id - a.id
        )
      );

      resetForm();
      setShowForm(false);

      setSuccessMessage(
        "Appointment created successfully."
      );
    } catch (err) {
      console.error(
        "Create appointment error:",
        err
      );

      setFormError(
        getAppointmentError(
          err,
          "Unable to create appointment."
        )
      );
    }
  };

  /* ==========================================
     APPOINTMENT ERROR
     ========================================== */

  const getAppointmentError = (
    err,
    fallback
  ) => {
    const data = err.response?.data;

    if (!data) {
      return fallback;
    }

    let message = "";

    if (data.error) {
      message = data.error;
    }

    if (
      data.available_timings &&
      data.available_timings.length > 0
    ) {
      message +=
        ` Available timings: ` +
        data.available_timings.join(
          ", "
        );
    }

    if (!message) {
      if (typeof data === "object") {
        message = Object.values(data)
          .flat()
          .join(" ");
      } else {
        message = String(data);
      }
    }

    return message || fallback;
  };

  /* ==========================================
     EDIT
     ========================================== */

  const handleEdit = (appointment) => {
    const existingPatient =
      patients.find(
        (patient) =>
          String(patient.id) ===
          String(appointment.patient)
      );

    const selectedDoctor =
      doctors.find(
        (doctor) =>
          String(doctor.id) ===
          String(appointment.doctor)
      );

    setEditingAppointment(
      appointment
    );

    setSelectedPatient(
      existingPatient || {
        id: appointment.patient,
        patient_id:
          appointment.patient_id,
        first_name:
          appointment.patient_name,
        last_name: "",
      }
    );

    setPatientSearch("");

    setFormData({
      patient:
        appointment.patient || "",
      department:
        selectedDoctor?.department || "",
      doctor:
        appointment.doctor || "",
      appointment_date:
        appointment.appointment_date ||
        "",
      appointment_time:
        appointment.appointment_time?.slice(
          0,
          5
        ) || "",
      reason:
        appointment.reason || "",
      notes:
        appointment.notes || "",
      status:
        appointment.status ||
        "SCHEDULED",
    });

    setFormError("");
    setSuccessMessage("");
    setShowForm(true);

    setTimeout(() => {
      document
        .querySelector(
          ".admin-appointments-form-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /* ==========================================
     UPDATE
     ========================================== */

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingAppointment) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.put(
        `appointments/${editingAppointment.id}/`,
        formData
      );

      setAppointments((previous) =>
        previous
          .map((appointment) =>
            appointment.id ===
            editingAppointment.id
              ? response.data
              : appointment
          )
          .sort(
            (a, b) => b.id - a.id
          )
      );

      resetForm();
      setShowForm(false);

      setSuccessMessage(
        "Appointment updated successfully."
      );
    } catch (err) {
      console.error(
        "Update appointment error:",
        err
      );

      setFormError(
        getAppointmentError(
          err,
          "Unable to update appointment."
        )
      );
    }
  };

  /* ==========================================
     CANCEL APPOINTMENT
     ========================================== */

  const handleCancelAppointment =
    async (appointmentId) => {
      const appointment =
        appointments.find(
          (item) =>
            item.id === appointmentId
        );

      if (!appointment) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this appointment?"
        );

      if (!confirmed) {
        return;
      }

      setFormError("");
      setSuccessMessage("");

      try {
        const response =
          await api.put(
            `appointments/${appointmentId}/`,
            {
              patient:
                appointment.patient,
              doctor:
                appointment.doctor,
              appointment_date:
                appointment.appointment_date,
              appointment_time:
                appointment.appointment_time,
              reason:
                appointment.reason ||
                "",
              notes:
                appointment.notes ||
                "",
              status:
                "CANCELLED",
            }
          );

        setAppointments((previous) =>
          previous
            .map((item) =>
              item.id === appointmentId
                ? response.data
                : item
            )
            .sort(
              (a, b) => b.id - a.id
            )
        );

        setSuccessMessage(
          "Appointment cancelled successfully."
        );
      } catch (err) {
        console.error(
          "Cancel appointment error:",
          err
        );

        setFormError(
          getAppointmentError(
            err,
            "Unable to cancel appointment."
          )
        );
      }
    };

  /* ==========================================
     CLEAR FILTERS
     ========================================== */

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDepartmentFilter("");
    setFromDate("");
    setToDate("");
  };

  /* ==========================================
     FORM
     ========================================== */

  const renderForm = () => (
    <div className="admin-appointments-form-card">

      <div className="admin-appointments-form-header">
        <div>
          <p>
            {editingAppointment
              ? "UPDATE APPOINTMENT"
              : "NEW APPOINTMENT"}
          </p>

          <h2>
            {editingAppointment
              ? "Edit Appointment"
              : "Create Appointment"}
          </h2>
        </div>

        <button
          type="button"
          className="admin-appointments-close-btn"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          ×
        </button>
      </div>

      {formError && (
        <div className="admin-appointments-form-error">
          <span>!</span>
          {formError}
        </div>
      )}

      <form
        className="admin-appointments-form"
        onSubmit={
          editingAppointment
            ? handleUpdate
            : handleSubmit
        }
      >

        {/* PATIENT */}

        <div className="admin-appointments-section-title">
          <span>01</span>

          <div>
            <h3>Patient</h3>
            <p>
              Search and select the patient.
            </p>
          </div>
        </div>

        <div className="admin-appointments-patient-search">

          <label>Patient</label>

          {selectedPatient ? (
            <div className="admin-appointments-selected-patient">

              <div className="admin-appointments-patient-avatar">
                {String(
                  selectedPatient.first_name ||
                    selectedPatient.patient_name ||
                    "P"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {selectedPatient.patient_id ||
                    "-"}
                </strong>

                <span>
                  {selectedPatient.first_name ||
                    ""}{" "}
                  {selectedPatient.last_name ||
                    ""}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setFormData(
                    (previous) => ({
                      ...previous,
                      patient: "",
                    })
                  );
                }}
              >
                Change
              </button>

            </div>
          ) : (
            <>
              <div className="admin-appointments-search-input">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search Patient ID, Aadhaar, or Name"
                  value={patientSearch}
                  onChange={(event) =>
                    searchPatients(
                      event.target.value
                    )
                  }
                  autoComplete="off"
                  required={!formData.patient}
                />
              </div>

              {patientSearching && (
                <small className="admin-appointments-helper">
                  Searching patients...
                </small>
              )}

              {patientSearchResults.length >
                0 && (
                <div className="admin-appointments-patient-results">
                  {patientSearchResults.map(
                    (patient) => (
                      <button
                        type="button"
                        key={patient.id}
                        onClick={() =>
                          selectPatient(
                            patient
                          )
                        }
                      >
                        <strong>
                          {patient.patient_id}
                        </strong>

                        <span>
                          {
                            patient.first_name
                          }{" "}
                          {
                            patient.last_name
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* APPOINTMENT DETAILS */}

        <div className="admin-appointments-section-title">
          <span>02</span>

          <div>
            <h3>
              Appointment Details
            </h3>

            <p>
              Select department, date,
              doctor and time.
            </p>
          </div>
        </div>

        <div className="admin-appointments-form-grid">

          <div className="admin-appointments-form-group">
            <label>Department</label>

            <select
              name="department"
              value={
                formData.department
              }
              onChange={handleChange}
              required
            >
              <option value="">
                Select Department
              </option>

              {departmentOptions.map(
                ([
                  departmentId,
                  departmentName,
                ]) => (
                  <option
                    key={departmentId}
                    value={departmentId}
                  >
                    {departmentName}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-appointments-form-group">
            <label>
              Appointment Date
            </label>

            <input
              type="date"
              name="appointment_date"
              value={
                formData.appointment_date
              }
              onChange={handleChange}
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              required
            />
          </div>

          <div className="admin-appointments-form-group">
            <label>Doctor</label>

            <select
              name="doctor"
              value={
                formData.doctor
              }
              onChange={handleChange}
              disabled={
                !formData.department ||
                !formData.appointment_date
              }
              required
            >
              <option value="">
                {!formData.department
                  ? "Select Department first"
                  : !formData.appointment_date
                  ? "Select Date first"
                  : filteredDoctors.length ===
                    0
                  ? "No available doctors"
                  : "Select Doctor"}
              </option>

              {filteredDoctors.map(
                (doctor) => (
                  <option
                    key={doctor.id}
                    value={doctor.id}
                  >
                    {doctor.doctor_id ||
                      "-"}{" "}
                    - Dr.{" "}
                    {doctor.first_name ||
                      "-"}{" "}
                    {doctor.last_name ||
                      "-"}{" "}
                    -{" "}
                    {doctor.specialization ||
                      "-"}{" "}
                    - Room{" "}
                    {doctor.consultation_room_number ||
                      "-"}
                  </option>
                )
              )}
            </select>

            {formData.department &&
              formData.appointment_date &&
              filteredDoctors.length ===
                0 && (
                <small className="admin-appointments-helper">
                  No doctors with an
                  assigned consultation
                  room are available on
                  this date.
                </small>
              )}
          </div>

          <div className="admin-appointments-form-group">
            <label>
              Appointment Time
            </label>

            <select
              name="appointment_time"
              value={
                formData.appointment_time
              }
              onChange={handleChange}
              disabled={
                !formData.doctor ||
                !formData.appointment_date
              }
              required
            >
              <option value="">
                {!formData.doctor
                  ? "Select Doctor first"
                  : availableTimeSlots.length ===
                    0
                  ? "No slots available"
                  : "Select Time Slot"}
              </option>

              {availableTimeSlots.map(
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
              availableTimeSlots.length >
                0 && (
                <small className="admin-appointments-helper">
                  15-minute appointment
                  slots
                </small>
              )}
          </div>

        </div>

        {/* AVAILABILITY */}

        {formData.doctor && (
          <div className="admin-appointments-availability">

            <div className="admin-appointments-availability-title">
              <strong>
                Doctor Availability
              </strong>

              <span>
                {availableTimeSlots.length}{" "}
                slots available
              </span>
            </div>

            <div className="admin-appointments-availability-grid">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map(
                (day, index) => {
                  const daySlots =
                    getDoctorAvailability().filter(
                      (availability) =>
                        Number(
                          availability.day_of_week
                        ) === index &&
                        availability.is_available
                    );

                  return (
                    <div
                      key={day}
                      className={
                        daySlots.length
                          ? "available"
                          : "unavailable"
                      }
                    >
                      <strong>
                        {day.slice(
                          0,
                          3
                        )}
                      </strong>

                      <span>
                        {daySlots.length
                          ? daySlots
                              .map(
                                (
                                  slot
                                ) =>
                                  `${slot.start_time.slice(
                                    0,
                                    5
                                  )} - ${slot.end_time.slice(
                                    0,
                                    5
                                  )}`
                              )
                              .join(
                                ", "
                              )
                          : "Not Available"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

          </div>
        )}

        {/* REASON / NOTES */}

        <div className="admin-appointments-section-title">
          <span>03</span>

          <div>
            <h3>
              Clinical Information
            </h3>

            <p>
              Add reason and additional
              appointment notes.
            </p>
          </div>
        </div>

        <div className="admin-appointments-form-grid">

          <div className="admin-appointments-form-group full">
            <label>Reason</label>

            <input
              type="text"
              name="reason"
              value={
                formData.reason
              }
              onChange={handleChange}
              placeholder="Reason for appointment"
            />
          </div>

          <div className="admin-appointments-form-group full">
            <label>Notes</label>

            <textarea
              name="notes"
              value={
                formData.notes
              }
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="4"
            />
          </div>

          {editingAppointment && (
            <div className="admin-appointments-form-group">
              <label>Status</label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={handleChange}
              >
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
              </select>
            </div>
          )}

        </div>

        {/* ACTIONS */}

        <div className="admin-appointments-form-actions">

          <button
            type="button"
            className="admin-appointments-cancel-btn"
            onClick={() => {
              resetForm();
              setShowForm(false);
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-appointments-save-btn"
          >
            {editingAppointment
              ? "Save Changes"
              : "Create Appointment"}
          </button>

        </div>

      </form>
    </div>
  );

  /* ==========================================
     LOADING
     ========================================== */

  if (loading) {
    return (
      <div className="admin-appointments-page">
        <div className="admin-appointments-state">
          <div className="admin-appointments-spinner" />
          <p>
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================
     PAGE
     ========================================== */

  return (
    <div className="admin-appointments-page">

      {/* HEADER */}

      <div className="admin-appointments-header">

        <div>
          <p className="admin-appointments-eyebrow">
            HOSPITAL ADMINISTRATION
          </p>

          <h1>
            Appointments
          </h1>

          <p>
            Manage, schedule and monitor
            hospital appointments.
          </p>
        </div>

        <button
          className="admin-appointments-primary-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setSuccessMessage("");
              setShowForm(true);

              setTimeout(() => {
                document
                  .querySelector(
                    ".admin-appointments-form-card"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                    block: "start",
                  });
              }, 50);
            }
          }}
        >
          <span>
            {showForm ? "×" : "+"}
          </span>

          {showForm
            ? "Close Form"
            : "Add Appointment"}
        </button>

      </div>

      {/* MESSAGES */}

      {successMessage && (
        <div className="admin-appointments-success">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-appointments-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="admin-appointments-summary-grid">

        <div className="admin-appointments-summary-card">
          <div className="admin-appointments-summary-icon">
            AP
          </div>

          <div>
            <span>Total</span>
            <strong>
              {summary.total}
            </strong>
            <small>
              All appointments
            </small>
          </div>
        </div>

        <div className="admin-appointments-summary-card">
          <div className="admin-appointments-summary-icon">
            SC
          </div>

          <div>
            <span>Scheduled</span>
            <strong>
              {summary.scheduled}
            </strong>
            <small>
              Awaiting appointment
            </small>
          </div>
        </div>

        <div className="admin-appointments-summary-card">
          <div className="admin-appointments-summary-icon">
            ✓
          </div>

          <div>
            <span>Confirmed</span>
            <strong>
              {summary.confirmed}
            </strong>
            <small>
              Confirmed visits
            </small>
          </div>
        </div>

        <div className="admin-appointments-summary-card">
          <div className="admin-appointments-summary-icon">
            CO
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {summary.completed}
            </strong>
            <small>
              Completed visits
            </small>
          </div>
        </div>

        <div className="admin-appointments-summary-card">
          <div className="admin-appointments-summary-icon">
            CA
          </div>

          <div>
            <span>Cancelled</span>
            <strong>
              {summary.cancelled}
            </strong>
            <small>
              Cancelled visits
            </small>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT */}

      {showForm && renderForm()}

      {/* SEARCH / FILTER */}

      <div className="admin-appointments-filter-card">

        <div className="admin-appointments-filter-header">

          <div>
            <p>
              APPOINTMENT DIRECTORY
            </p>

            <h2>
              Search & Filter
            </h2>
          </div>

          <span>
            {filteredAppointments.length}{" "}
            Result
            {filteredAppointments.length !==
            1
              ? "s"
              : ""}
          </span>

        </div>

        <div className="admin-appointments-filter-grid">

          <div className="admin-appointments-filter-group search">
            <label>Search</label>

            <div className="admin-appointments-filter-search">
              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Appointment ID, patient, doctor, room, reason..."
              />
            </div>
          </div>

          <div className="admin-appointments-filter-group">
            <label>Status</label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
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
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-appointments-filter-group">
            <label>Department</label>

            <select
              value={
                departmentFilter
              }
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Departments
              </option>

              {departmentOptions.map(
                ([
                  departmentId,
                  departmentName,
                ]) => (
                  <option
                    key={departmentId}
                    value={departmentId}
                  >
                    {departmentName}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="admin-appointments-filter-group">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="admin-appointments-filter-group">
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              min={
                fromDate ||
                undefined
              }
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />
          </div>

        </div>

        <div className="admin-appointments-filter-footer">

          <span>
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
          </span>

          <button
            type="button"
            onClick={
              handleClearFilters
            }
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* APPOINTMENT TABLE */}

      <div className="admin-appointments-table-card">

        <div className="admin-appointments-table-header">

          <div>
            <p>
              APPOINTMENT RECORDS
            </p>

            <h2>
              Appointment Directory
            </h2>
          </div>

          <span>
            {appointments.length} Total
          </span>

        </div>

        {filteredAppointments.length ===
        0 ? (
          <div className="admin-appointments-empty">

            <div className="admin-appointments-empty-icon">
              AP
            </div>

            <h3>
              {appointments.length ===
              0
                ? "No appointments found"
                : "No matching appointments"}
            </h3>

            <p>
              {appointments.length ===
              0
                ? "Create an appointment to get started."
                : "Try changing your search or filters."}
            </p>

            {appointments.length >
              0 && (
              <button
                type="button"
                className="admin-appointments-clear-btn"
                onClick={
                  handleClearFilters
                }
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (
          <div className="admin-appointments-table-wrapper">

            <table className="admin-appointments-table">

              <thead>
                <tr>
                  <th>Appointment</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Notes</th>
                  <th>Actions</th>
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
                        <div className="admin-appointments-id">
                          <strong>
                            {
                              appointment.appointment_id
                            }
                          </strong>

                          <small>
                            ID #
                            {
                              appointment.id
                            }
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-appointments-table-person">

                          <div className="admin-appointments-mini-avatar">
                            {(appointment.patient_name ||
                              "P")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                appointment.patient_name
                              }
                            </strong>

                            <span>
                              {
                                appointment.patient_id
                              }
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <div className="admin-appointments-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              appointment.doctor_name
                            }
                          </strong>

                          <span>
                            {
                              appointment.doctor_id
                            }
                          </span>

                        </div>
                      </td>

                      <td>
                        <span className="admin-appointments-department">
                          {
                            appointment.department_name ||
                            "-"
                          }
                        </span>
                      </td>

                      <td>
                        <span className="admin-appointments-room">
                          {appointment.consultation_room_number ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-appointments-date">
                          {formatDate(
                            appointment.appointment_date
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="admin-appointments-time">
                          {formatTime(
                            appointment.appointment_time
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-appointments-status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          <i />
                          {
                            appointment.status
                          }
                        </span>
                      </td>

                      <td>
                        <span className="admin-appointments-reason">
                          {
                            appointment.reason ||
                            "—"
                          }
                        </span>
                      </td>

                      <td>
                        <span className="admin-appointments-notes">
                          {
                            appointment.notes ||
                            "—"
                          }
                        </span>
                      </td>

                      <td>
                        <div className="admin-appointments-actions">

                          <button
                            type="button"
                            className="admin-appointments-edit-btn"
                            onClick={() =>
                              handleEdit(
                                appointment
                              )
                            }
                          >
                            Edit
                          </button>

                          {appointment.status !==
                            "CANCELLED" && (
                            <button
                              type="button"
                              className="admin-appointments-cancel-action"
                              onClick={() =>
                                handleCancelAppointment(
                                  appointment.id
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

export default AdminAppointments;