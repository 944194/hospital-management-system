import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./ReceptionistAdmissions.css";

function ReceptionistAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);

  // ==========================================
  // CREATE FORM SEARCH
  // ==========================================

  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    department: "",
    room: "",
    bed: "",
    admission_date: "",
    reason: "",
    notes: "",
  });

  // ==========================================
  // HELPERS
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

  const sortAdmissions = (items) => {
    return [...items].sort((a, b) => {
      const dateA = a.admission_date || "";
      const dateB = b.admission_date || "";

      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  };

  const filterAdmissions = (admissionList, value) => {
    const searchValue = value.trim().toLowerCase();

    if (!searchValue) {
      return admissionList;
    }

    return admissionList.filter((admission) => {
      const admissionId =
        admission.admission_id?.toLowerCase() || "";

      const patientId =
        admission.patient_id?.toLowerCase() || "";

      return (
        admissionId.includes(searchValue) ||
        patientId.includes(searchValue)
      );
    });
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

const maskAadhaar = (aadhaar) => {
  if (!aadhaar) {
    return "—";
  }

  const value = String(aadhaar).replace(/\D/g, "");

  if (value.length < 4) {
    return "XXXX-XXXX";
  }

  return `XXXX-XXXX-${value.slice(-4)}`;
};

  const getStatusClass = (status) => {
    switch (status) {
      case "ADMITTED":
        return "admitted";

      case "UNDER_TREATMENT":
        return "under-treatment";

      case "DISCHARGED":
        return "discharged";

      case "CANCELLED":
        return "cancelled";

      default:
        return "default";
    }
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        admissionsResponse,
        patientsResponse,
        doctorsResponse,
        departmentsResponse,
        roomsResponse,
        bedsResponse,
      ] = await Promise.all([
        api.get("admissions/"),
        api.get("patients/"),
        api.get("doctors/"),
        api.get("departments/"),
        api.get("rooms/"),
        api.get("beds/"),
      ]);

      const admissionData = sortAdmissions(
        getData(admissionsResponse)
      );

      setAdmissions(admissionData);

      setFilteredAdmissions(
        filterAdmissions(
          admissionData,
          searchTerm
        )
      );

      setPatients(getData(patientsResponse));
      setDoctors(getData(doctorsResponse));
      setDepartments(getData(departmentsResponse));
      setRooms(getData(roomsResponse));
      setBeds(getData(bedsResponse));
    } catch (err) {
      console.error(
        "Admissions data error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load admissions data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADMISSION SEARCH
  // ==========================================

  const handleAdmissionSearch = (e) => {
    const value = e.target.value;

    setSearchTerm(value);

    setFilteredAdmissions(
      filterAdmissions(
        admissions,
        value
      )
    );
  };

  const clearSearch = () => {
    setSearchTerm("");

    setFilteredAdmissions(admissions);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ------------------------------------------
    // DOCTOR CHANGE
    // ------------------------------------------

    if (name === "doctor") {
      const selectedDoctor = doctors.find(
        (doctor) =>
          String(doctor.id) === String(value)
      );

      setFormData({
        ...formData,
        doctor: value,
        department: selectedDoctor
          ? String(selectedDoctor.department)
          : "",
        room: "",
        bed: "",
      });

      setDoctorSearch(
        selectedDoctor?.doctor_id || ""
      );

      return;
    }

    // ------------------------------------------
    // DEPARTMENT CHANGE
    // ------------------------------------------

    if (name === "department") {
      setFormData({
        ...formData,
        department: value,
        doctor: "",
        room: "",
        bed: "",
      });

      setDoctorSearch("");

      return;
    }

    // ------------------------------------------
    // ROOM CHANGE
    // ------------------------------------------

    if (name === "room") {
      setFormData({
        ...formData,
        room: value,
        bed: "",
      });

      return;
    }

    // ------------------------------------------
    // NORMAL FIELD
    // ------------------------------------------

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // FILTER PATIENTS
  // Patient ID + Aadhaar Number
  // ==========================================

  const filteredPatients = useMemo(() => {
    const search = patientSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return [];
    }

    return patients.filter((patient) => {
      const patientId = String(
        patient.patient_id || ""
      ).toLowerCase();

      const aadhaarNumber = String(
        patient.aadhaar_number || ""
      ).toLowerCase();

      return (
        patientId.includes(search) ||
        aadhaarNumber.includes(search)
      );
    });
  }, [patients, patientSearch]);

  // ==========================================
  // FILTER DOCTORS
  // Department + Doctor ID
  // ==========================================

  const filteredDoctors = useMemo(() => {
    const search = doctorSearch
      .trim()
      .toLowerCase();

    if (!formData.department) {
      return [];
    }

    return doctors.filter((doctor) => {
      const matchesDepartment =
        String(doctor.department) ===
        String(formData.department);

      const doctorId = String(
        doctor.doctor_id || ""
      ).toLowerCase();

      const matchesSearch =
        !search ||
        doctorId.includes(search);

      return (
        matchesDepartment &&
        matchesSearch
      );
    });
  }, [
    doctors,
    doctorSearch,
    formData.department,
  ]);

  // ==========================================
  // FILTER ROOMS
  // ==========================================

  const filteredRooms = useMemo(() => {
    return rooms.filter(
      (room) =>
        String(room.department) ===
          String(formData.department) &&
        room.status === "ACTIVE"
    );
  }, [
    rooms,
    formData.department,
  ]);

  // ==========================================
  // FILTER BEDS
  // ==========================================

  const filteredBeds = useMemo(() => {
    return beds.filter(
      (bed) =>
        String(bed.room) ===
          String(formData.room) &&
        bed.status === "AVAILABLE"
    );
  }, [
    beds,
    formData.room,
  ]);

  // ==========================================
  // CREATE ADMISSION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.patient) {
      setError("Please select a patient.");
      return;
    }

    if (!formData.department) {
      setError("Please select a department.");
      return;
    }

    if (!formData.doctor) {
      setError("Please select a doctor.");
      return;
    }

    if (!formData.room) {
      setError("Please select a room.");
      return;
    }

    if (!formData.bed) {
      setError("Please select a bed.");
      return;
    }

    try {
      await api.post("admissions/", {
        patient: Number(formData.patient),
        doctor: Number(formData.doctor),
        department: Number(formData.department),
        room: Number(formData.room),
        bed: Number(formData.bed),
        admission_date:
          formData.admission_date,
        reason: formData.reason,
        notes: formData.notes,
      });

      setSuccess(
        "Admission created successfully."
      );

      setFormData({
        patient: "",
        doctor: "",
        department: "",
        room: "",
        bed: "",
        admission_date: "",
        reason: "",
        notes: "",
      });

      setPatientSearch("");
      setDoctorSearch("");

      setShowForm(false);

      await fetchData();
    } catch (err) {
      console.error(
        "Create admission error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to create admission."
        )
      );
    }
  };

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  const openCreateForm = () => {
    setEditingAdmission(null);

    setPatientSearch("");
    setDoctorSearch("");

    setFormData({
      patient: "",
      doctor: "",
      department: "",
      room: "",
      bed: "",
      admission_date: "",
      reason: "",
      notes: "",
    });

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

    setPatientSearch("");
    setDoctorSearch("");

    setFormData({
      patient: "",
      doctor: "",
      department: "",
      room: "",
      bed: "",
      admission_date: "",
      reason: "",
      notes: "",
    });
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const startEditing = (admission) => {
    setShowForm(false);

    setEditingAdmission({
      ...admission,
      discharge_date:
        admission.discharge_date || "",
      reason:
        admission.reason || "",
      notes:
        admission.notes || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UPDATE ADMISSION
  // ==========================================

  const handleUpdate = async () => {
    if (!editingAdmission) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const data = {
        status:
          editingAdmission.status,
        reason:
          editingAdmission.reason,
        notes:
          editingAdmission.notes,
      };

      if (
        editingAdmission.status ===
        "DISCHARGED"
      ) {
        data.discharge_date =
          editingAdmission.discharge_date ||
          "";
      }

      await api.patch(
        `admissions/${editingAdmission.id}/`,
        data
      );

      setSuccess(
        "Admission updated successfully."
      );

      setEditingAdmission(null);

      await fetchData();
    } catch (err) {
      console.error(
        "Update admission error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update admission."
        )
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="receptionist-admissions-page">
        <div className="receptionist-admissions-state">
          <div className="receptionist-admissions-spinner" />

          <p>
            Loading admissions...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="receptionist-admissions-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="receptionist-admissions-header">

        <div>

          <p className="receptionist-admissions-eyebrow">
            RECEPTIONIST PORTAL
          </p>

          <h1>
            Admissions
          </h1>

          <p className="receptionist-admissions-subtitle">
            Manage inpatient admissions,
            rooms, beds, and discharge
            information.
          </p>

        </div>

        <div className="receptionist-admissions-header-actions">

          <div className="receptionist-admissions-count">

            <span>
              Total Admissions
            </span>

            <strong>
              {admissions.length}
            </strong>

          </div>

          <button
            type="button"
            className="receptionist-admissions-primary-btn"
            onClick={
              showForm
                ? closeCreateForm
                : openCreateForm
            }
          >

            <span>
              {showForm ? "×" : "+"}
            </span>

            {showForm
              ? "Close Form"
              : "Add Admission"}

          </button>

        </div>

      </div>

      {/* ========================================
          SUCCESS
      ======================================== */}

      {success && (
        <div className="receptionist-admissions-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="receptionist-admissions-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ========================================
          SEARCH
      ======================================== */}

      <div className="receptionist-admissions-search-card">

        <div className="receptionist-admissions-search-header">

          <div>

            <h2>
              Find an Admission
            </h2>

            <p>
              Search using Admission ID
              or Patient ID.
            </p>

          </div>

          {searchTerm && (
            <button
              type="button"
              className="receptionist-admissions-clear-btn"
              onClick={clearSearch}
            >
              Clear
            </button>
          )}

        </div>

        <div className="receptionist-admissions-search-box">

          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={
              handleAdmissionSearch
            }
            placeholder="Search by Admission ID or Patient ID..."
          />

        </div>

      </div>

      {/* ========================================
          CREATE FORM
      ======================================== */}

      {showForm && (
        <div className="receptionist-admissions-form-card">

          <div className="receptionist-admissions-section-header">

            <div>

              <p className="receptionist-admissions-section-eyebrow">
                NEW ADMISSION
              </p>

              <h2>
                Create New Admission
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-admissions-close-btn"
              onClick={closeCreateForm}
            >
              ×
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            {/* ======================================
                SECTION 01
            ====================================== */}

            <div className="receptionist-admissions-form-section">

              <div className="receptionist-admissions-form-section-title">

                <span>01</span>

                <div>

                  <h3>
                    Patient & Doctor
                  </h3>

                  <p>
                    Search and select the
                    patient and responsible
                    doctor.
                  </p>

                </div>

              </div>

              <div className="receptionist-admissions-form-grid">

                {/* ==================================
                    PATIENT SEARCH
                ================================== */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Patient *
                  </label>

                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(
                        e.target.value
                      );

                      if (
                        formData.patient
                      ) {
                        setFormData({
                          ...formData,
                          patient: "",
                        });
                      }
                    }}
                    placeholder="Search Patient ID or Aadhaar number..."
                    autoComplete="off"
                  />

                  {patientSearch.trim() && (
                    <div className="receptionist-admissions-search-results">

                      {filteredPatients.length ===
                      0 ? (

                        <div className="receptionist-admissions-no-results">
                          No patient found
                        </div>

                      ) : (

                        filteredPatients
                          .slice(0, 10)
                          .map((patient) => (

                            <button
                              type="button"
                              key={patient.id}
                              className={`receptionist-admissions-search-result ${
                                String(
                                  formData.patient
                                ) ===
                                String(
                                  patient.id
                                )
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {

                                setFormData({
                                  ...formData,
                                  patient:
                                    String(
                                      patient.id
                                    ),
                                });

                                setPatientSearch(
                                  patient.patient_id ||
                                    ""
                                );

                              }}
                            >

                              <div>

                                <strong>
                                  {patient.patient_id ||
                                    "No Patient ID"}
                                </strong>

                                <span>
                                  {patient.first_name ||
                                    ""}{" "}
                                  {patient.last_name ||
                                    ""}
                                </span>

                              </div>

                              <small>
  Aadhaar:{" "}
  {maskAadhaar(
    patient.aadhaar_number
  )}
</small>

                            </button>

                          ))

                      )}

                    </div>
                  )}

                  {formData.patient && (
                    <div className="receptionist-admissions-selected-info">
                      ✓ Patient selected
                    </div>
                  )}

                </div>

                {/* ==================================
                    DEPARTMENT
                ================================== */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Department *
                  </label>

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

                    {departments.map(
                      (department) => (

                        <option
                          key={
                            department.id
                          }
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

                {/* ==================================
                    DOCTOR SEARCH
                ================================== */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Doctor *
                  </label>

                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => {
                      setDoctorSearch(
                        e.target.value
                      );

                      if (
                        formData.doctor
                      ) {
                        setFormData({
                          ...formData,
                          doctor: "",
                          room: "",
                          bed: "",
                        });
                      }
                    }}
                    placeholder={
                      formData.department
                        ? "Search Doctor ID..."
                        : "Select Department First"
                    }
                    disabled={
                      !formData.department
                    }
                    autoComplete="off"
                  />

                  {formData.department &&
                    doctorSearch.trim() && (
                      <div className="receptionist-admissions-search-results">

                        {filteredDoctors.length ===
                        0 ? (

                          <div className="receptionist-admissions-no-results">
                            No doctor found in
                            this department
                          </div>

                        ) : (

                          filteredDoctors
                            .slice(0, 10)
                            .map((doctor) => (

                              <button
                                type="button"
                                key={doctor.id}
                                className={`receptionist-admissions-search-result ${
                                  String(
                                    formData.doctor
                                  ) ===
                                  String(
                                    doctor.id
                                  )
                                    ? "selected"
                                    : ""
                                }`}
                                onClick={() => {

                                  handleChange({
                                    target: {
                                      name:
                                        "doctor",
                                      value:
                                        String(
                                          doctor.id
                                        ),
                                    },
                                  });

                                }}
                              >

                                <div>

                                  <strong>
                                    {doctor.doctor_id ||
                                      "No Doctor ID"}
                                  </strong>

                                  <span>
                                    Dr.{" "}
                                    {doctor.first_name ||
                                      ""}{" "}
                                    {doctor.last_name ||
                                      ""}
                                  </span>

                                </div>

                                <small>
                                  {doctor.department_name ||
                                    "Department not available"}
                                </small>

                              </button>

                            ))

                        )}

                      </div>
                    )}

                  {formData.doctor && (
                    <div className="receptionist-admissions-selected-info">
                      ✓ Doctor selected
                    </div>
                  )}

                </div>

                {/* ==================================
                    ADMISSION DATE
                ================================== */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Admission Date *
                  </label>

                  <input
                    type="date"
                    name="admission_date"
                    value={
                      formData.admission_date
                    }
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>

            {/* ======================================
                SECTION 02
            ====================================== */}

            <div className="receptionist-admissions-form-section">

              <div className="receptionist-admissions-form-section-title">

                <span>02</span>

                <div>

                  <h3>
                    Room & Bed
                  </h3>

                  <p>
                    Assign an active room
                    and available bed.
                  </p>

                </div>

              </div>

              <div className="receptionist-admissions-form-grid">

                {/* ROOM */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Room *
                  </label>

                  <select
                    name="room"
                    value={
                      formData.room
                    }
                    onChange={handleChange}
                    required
                    disabled={
                      !formData.department
                    }
                  >

                    <option value="">
                      {!formData.department
                        ? "Select Department First"
                        : filteredRooms.length === 0
                        ? "No Active Rooms"
                        : "Select Room"}
                    </option>

                    {filteredRooms.map(
                      (room) => (

                        <option
                          key={room.id}
                          value={room.id}
                        >
                          Room{" "}
                          {room.room_number}{" "}
                          —{" "}
                          {room.room_type}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* BED */}

                <div className="receptionist-admissions-form-group">

                  <label>
                    Bed *
                  </label>

                  <select
                    name="bed"
                    value={
                      formData.bed
                    }
                    onChange={handleChange}
                    required
                    disabled={
                      !formData.room
                    }
                  >

                    <option value="">
                      {!formData.room
                        ? "Select Room First"
                        : filteredBeds.length === 0
                        ? "No Available Beds"
                        : "Select Bed"}
                    </option>

                    {filteredBeds.map(
                      (bed) => (

                        <option
                          key={bed.id}
                          value={bed.id}
                        >
                          Bed{" "}
                          {bed.bed_number}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>

            </div>

            {/* ======================================
                SECTION 03
            ====================================== */}

            <div className="receptionist-admissions-form-section">

              <div className="receptionist-admissions-form-section-title">

                <span>03</span>

                <div>

                  <h3>
                    Admission Details
                  </h3>

                  <p>
                    Add the reason and
                    additional notes.
                  </p>

                </div>

              </div>

              <div className="receptionist-admissions-form-grid">

                <div className="receptionist-admissions-form-group form-full">

                  <label>
                    Admission Reason *
                  </label>

                  <textarea
                    name="reason"
                    value={
                      formData.reason
                    }
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter reason for admission..."
                    required
                  />

                </div>

                <div className="receptionist-admissions-form-group form-full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes..."
                  />

                </div>

              </div>

            </div>

            {/* ======================================
                ACTIONS
            ====================================== */}

            <div className="receptionist-admissions-form-actions">

              <button
                type="button"
                className="receptionist-admissions-cancel-btn"
                onClick={closeCreateForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="receptionist-admissions-save-btn"
              >
                Create Admission
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ========================================
          EDIT FORM
      ======================================== */}

      {editingAdmission && (
        <div className="receptionist-admissions-form-card">

          <div className="receptionist-admissions-section-header">

            <div>

              <p className="receptionist-admissions-section-eyebrow">
                UPDATE ADMISSION
              </p>

              <h2>
                Edit Admission
              </h2>

            </div>

            <button
              type="button"
              className="receptionist-admissions-close-btn"
              onClick={() =>
                setEditingAdmission(null)
              }
            >
              ×
            </button>

          </div>

          <div className="receptionist-admissions-edit-summary">

            <div>

              <span>
                Admission
              </span>

              <strong>
                {editingAdmission.admission_id ||
                  "-"}
              </strong>

            </div>

            <div>

              <span>
                Patient
              </span>

              <strong>
                {editingAdmission.patient_id ||
                  "-"}{" "}
                —{" "}
                {editingAdmission.patient_name ||
                  "-"}
              </strong>

            </div>

            <div>

              <span>
                Doctor
              </span>

              <strong>
                {editingAdmission.doctor_id ||
                  "-"}{" "}
                —{" "}
                {editingAdmission.doctor_name ||
                  "-"}
              </strong>

            </div>

            <div>

              <span>
                Room / Bed
              </span>

              <strong>
                {editingAdmission.room_number ||
                  "-"}{" "}
                /{" "}
                {editingAdmission.bed_number ||
                  "-"}
              </strong>

            </div>

          </div>

          <div className="receptionist-admissions-form-grid">

            {/* STATUS */}

            <div className="receptionist-admissions-form-group">

              <label>
                Status *
              </label>

              <select
                value={
                  editingAdmission.status
                }
                onChange={(e) =>
                  setEditingAdmission({
                    ...editingAdmission,
                    status:
                      e.target.value,
                  })
                }
              >

                <option value="ADMITTED">
                  ADMITTED
                </option>

                <option value="UNDER_TREATMENT">
                  UNDER TREATMENT
                </option>

                <option value="DISCHARGED">
                  DISCHARGED
                </option>

                <option value="CANCELLED">
                  CANCELLED
                </option>

              </select>

            </div>

            {/* DISCHARGE DATE */}

            <div className="receptionist-admissions-form-group">

              <label>
                Discharge Date
              </label>

              <input
                type="date"
                value={
                  editingAdmission.discharge_date ||
                  ""
                }
                onChange={(e) =>
                  setEditingAdmission({
                    ...editingAdmission,
                    discharge_date:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* REASON */}

            <div className="receptionist-admissions-form-group form-full">

              <label>
                Reason
              </label>

              <textarea
                value={
                  editingAdmission.reason ||
                  ""
                }
                onChange={(e) =>
                  setEditingAdmission({
                    ...editingAdmission,
                    reason:
                      e.target.value,
                  })
                }
                rows="3"
              />

            </div>

            {/* NOTES */}

            <div className="receptionist-admissions-form-group form-full">

              <label>
                Notes
              </label>

              <textarea
                value={
                  editingAdmission.notes ||
                  ""
                }
                onChange={(e) =>
                  setEditingAdmission({
                    ...editingAdmission,
                    notes:
                      e.target.value,
                  })
                }
                rows="3"
              />

            </div>

          </div>

          <div className="receptionist-admissions-form-actions">

            <button
              type="button"
              className="receptionist-admissions-cancel-btn"
              onClick={() =>
                setEditingAdmission(null)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="receptionist-admissions-save-btn"
              onClick={handleUpdate}
            >
              Save Changes
            </button>

          </div>

        </div>
      )}

      {/* ========================================
          ADMISSION DIRECTORY
      ======================================== */}

      <div className="receptionist-admissions-table-section">

        <div className="receptionist-admissions-table-header">

          <div>

            <h2>
              Admission Directory
            </h2>

            <p>
              {filteredAdmissions.length}{" "}
              admission
              {filteredAdmissions.length !==
              1
                ? "s"
                : ""}{" "}
              displayed
            </p>

          </div>

        </div>

        {filteredAdmissions.length === 0 ? (

          <div className="receptionist-admissions-empty">

            <div className="receptionist-admissions-empty-icon">
              +
            </div>

            <h3>
              {searchTerm
                ? "No admission found"
                : "No admissions found"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with another Admission ID or Patient ID."
                : "Create an admission to get started."}
            </p>

            {searchTerm && (
              <button
                type="button"
                className="receptionist-admissions-clear-btn"
                onClick={clearSearch}
              >
                Clear Search
              </button>
            )}

          </div>

        ) : (

          <div className="receptionist-admissions-table-wrapper">

            <table className="receptionist-admissions-table">

              <thead>

                <tr>

                  <th>
                    Admission
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
                    Bed
                  </th>

                  <th>
                    Admission Date
                  </th>

                  <th>
                    Discharge Date
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

                {filteredAdmissions.map(
                  (admission) => (

                    <tr
                      key={
                        admission.id
                      }
                    >

                      {/* ADMISSION */}

                      <td>

                        <div className="receptionist-admission-id-cell">

                          <strong>
                            {admission.admission_id ||
                              "-"}
                          </strong>

                          <span>
                            Inpatient
                          </span>

                        </div>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="receptionist-admission-person">

                          <div className="receptionist-admission-avatar">

                            {(
                              admission.patient_name ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>
                              {admission.patient_name ||
                                "-"}
                            </strong>

                            <span>
                              {admission.patient_id ||
                                "-"}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="receptionist-admission-doctor">

                          <strong>
                            Dr.{" "}
                            {admission.doctor_name ||
                              "-"}
                          </strong>

                          <span>
                            {admission.doctor_id ||
                              "-"}
                          </span>

                        </div>

                      </td>

                      {/* DEPARTMENT */}

                      <td>

                        <span className="receptionist-admission-department">
                          {admission.department_name ||
                            "-"}
                        </span>

                      </td>

                      {/* ROOM */}

                      <td>

                        <span className="receptionist-admission-room">

                          {admission.room_number
                            ? `Room ${admission.room_number}`
                            : "Not Assigned"}

                        </span>

                      </td>

                      {/* BED */}

                      <td>

                        <span className="receptionist-admission-bed">

                          {admission.bed_number
                            ? `Bed ${admission.bed_number}`
                            : "Not Assigned"}

                        </span>

                      </td>

                      {/* ADMISSION DATE */}

                      <td>

                        <div className="receptionist-admission-date">

                          {formatDate(
                            admission.admission_date
                          )}

                        </div>

                      </td>

                      {/* DISCHARGE DATE */}

                      <td>

                        <div className="receptionist-admission-date">

                          {formatDate(
                            admission.discharge_date
                          )}

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`receptionist-admission-status ${getStatusClass(
                            admission.status
                          )}`}
                        >
                          {admission.status}
                        </span>

                      </td>

                      {/* REASON */}

                      <td>

                        <div className="receptionist-admission-reason">

                          <span>
                            {admission.reason ||
                              "No reason provided"}
                          </span>

                          {admission.notes && (
                            <small>
                              Notes:{" "}
                              {admission.notes}
                            </small>
                          )}

                        </div>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="receptionist-admissions-edit-btn"
                          onClick={() =>
                            startEditing(
                              admission
                            )
                          }
                        >

                          <span>
                            ✎
                          </span>

                          Edit

                        </button>

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

export default ReceptionistAdmissions;