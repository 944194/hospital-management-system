import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminAdmissions.css";

function AdminAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [editingAdmission, setEditingAdmission] =
    useState(null);

  // ==========================================
  // CREATE FORM SEARCH
  // ==========================================

  const [patientSearch, setPatientSearch] =
    useState("");

  const [doctorSearch, setDoctorSearch] =
    useState("");

  // ==========================================
  // CREATE FORM DATA
  // ==========================================

  const [createFormData, setCreateFormData] =
    useState({
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
  // EDIT FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    status: "",
    discharge_date: "",
    reason: "",
    notes: "",
  });

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================
  // SEARCH / FILTERS
  // ==========================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getData = (response) => {
    return Array.isArray(response?.data)
      ? response.data
      : response?.data?.results || [];
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

  const getInitial = (name) => {
    return String(name || "P")
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  // ==========================================
  // MASK AADHAAR
  // ==========================================

  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) {
      return "—";
    }

    const value = String(aadhaar).replace(
      /\D/g,
      ""
    );

    if (value.length < 4) {
      return "XXXX-XXXX";
    }

    return `XXXX-XXXX-${value.slice(-4)}`;
  };

  // ==========================================
  // TODAY
  // ==========================================

  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(
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
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "discharged") {
      return "discharged";
    }

    if (value === "cancelled") {
      return "cancelled";
    }

    if (
      value.includes("treatment")
    ) {
      return "treatment";
    }

    if (value === "admitted") {
      return "admitted";
    }

    return "default";
  };

  // ==========================================
  // SORT ADMISSIONS
  // Latest admission first
  // ==========================================

  const sortAdmissions = (data) => {
    return [...data].sort((a, b) => {
      const dateA =
        a.admission_date || "";

      const dateB =
        b.admission_date || "";

      if (dateA !== dateB) {
        return dateB.localeCompare(
          dateA
        );
      }

      const createdA =
        a.created_at || "";

      const createdB =
        b.created_at || "";

      if (createdA !== createdB) {
        return createdB.localeCompare(
          createdA
        );
      }

      return (
        Number(b.id || 0) -
        Number(a.id || 0)
      );
    });
  };

  // ==========================================
  // FETCH ALL DATA
  // ==========================================

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
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

      setAdmissions(
        sortAdmissions(
          getData(admissionsResponse)
        )
      );

      setPatients(
        getData(patientsResponse)
      );

      setDoctors(
        getData(doctorsResponse)
      );

      setDepartments(
        getData(departmentsResponse)
      );

      setRooms(
        getData(roomsResponse)
      );

      setBeds(
        getData(bedsResponse)
      );
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
  // CREATE FORM CHANGE
  // ==========================================

  const handleCreateChange = (event) => {
    const { name, value } =
      event.target;

    setCreateFormData(
      (previous) => {
        const updatedData = {
          ...previous,
          [name]: value,
        };

        // -------------------------------
        // DEPARTMENT / BRANCH CHANGE
        // -------------------------------

        if (name === "department") {
          updatedData.doctor = "";
          updatedData.room = "";
          updatedData.bed = "";

          setDoctorSearch("");
        }

        // -------------------------------
        // ROOM CHANGE
        // -------------------------------

        if (name === "room") {
          updatedData.bed = "";
        }

        return updatedData;
      }
    );

    setFormError("");
  };

  // ==========================================
  // FILTER PATIENTS
  // Patient ID + Aadhaar + Name
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

      const firstName = String(
        patient.first_name || ""
      ).toLowerCase();

      const lastName = String(
        patient.last_name || ""
      ).toLowerCase();

      const fullName =
        `${firstName} ${lastName}`.trim();

      return (
        patientId.includes(search) ||
        aadhaarNumber.includes(search) ||
        fullName.includes(search)
      );
    });
  }, [
    patients,
    patientSearch,
  ]);

  // ==========================================
  // FILTER DOCTORS
  // Department + Doctor ID + Name
  // ==========================================

  const filteredDoctors = useMemo(() => {
    const search = doctorSearch
      .trim()
      .toLowerCase();

    if (!createFormData.department) {
      return [];
    }

    return doctors.filter((doctor) => {
      const matchesDepartment =
        String(
          doctor.department
        ) ===
        String(
          createFormData.department
        );

      if (!matchesDepartment) {
        return false;
      }

      const doctorId = String(
        doctor.doctor_id || ""
      ).toLowerCase();

      const firstName = String(
        doctor.first_name || ""
      ).toLowerCase();

      const lastName = String(
        doctor.last_name || ""
      ).toLowerCase();

      const fullName =
        `${firstName} ${lastName}`.trim();

      const matchesSearch =
        !search ||
        doctorId.includes(search) ||
        fullName.includes(search);

      return matchesSearch;
    });
  }, [
    doctors,
    doctorSearch,
    createFormData.department,
  ]);

  // ==========================================
  // FILTER ROOMS
  // ==========================================

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          String(
            room.department
          ) ===
            String(
              createFormData.department
            ) &&
          room.status === "ACTIVE"
      ),
    [
      rooms,
      createFormData.department,
    ]
  );

  // ==========================================
  // FILTER AVAILABLE BEDS
  // ==========================================

  const filteredBeds = useMemo(
    () =>
      beds.filter(
        (bed) =>
          String(bed.room) ===
            String(
              createFormData.room
            ) &&
          bed.status === "AVAILABLE"
      ),
    [
      beds,
      createFormData.room,
    ]
  );

  // ==========================================
  // CREATE ADMISSION
  // ==========================================

  const handleCreate = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!createFormData.patient) {
      setFormError(
        "Please search and select a patient."
      );
      return;
    }

    if (!createFormData.department) {
      setFormError(
        "Please select a department."
      );
      return;
    }

    if (!createFormData.doctor) {
      setFormError(
        "Please search and select a doctor."
      );
      return;
    }

    if (!createFormData.room) {
      setFormError(
        "Please select a room."
      );
      return;
    }

    if (!createFormData.bed) {
      setFormError(
        "Please select an available bed."
      );
      return;
    }

    if (!createFormData.admission_date) {
      setFormError(
        "Please select an admission date."
      );
      return;
    }

    if (
      createFormData.admission_date <
      getToday()
    ) {
      setFormError(
        "Admission date cannot be in the past."
      );
      return;
    }

    try {
      const response = await api.post(
        "admissions/",
        createFormData
      );

      setAdmissions(
        (previous) =>
          sortAdmissions([
            ...previous,
            response.data,
          ])
      );

      setCreateFormData({
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

      setShowCreateForm(false);

      setSuccessMessage(
        "Admission created successfully."
      );

      const [
        roomsResponse,
        bedsResponse,
      ] = await Promise.all([
        api.get("rooms/"),
        api.get("beds/"),
      ]);

      setRooms(
        getData(roomsResponse)
      );

      setBeds(
        getData(bedsResponse)
      );
    } catch (err) {
      console.error(
        "Create admission error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to create admission."
        )
      );
    }
  };

  // ==========================================
  // EDIT ADMISSION
  // ==========================================

  const handleEdit = (admission) => {
    setEditingAdmission(admission);
    setShowCreateForm(false);

    setFormData({
      status:
        admission.status || "",
      discharge_date:
        admission.discharge_date || "",
      reason:
        admission.reason || "",
      notes:
        admission.notes || "",
    });

    setFormError("");
    setSuccessMessage("");

    setTimeout(() => {
      document
        .querySelector(
          ".admin-admissions-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // EDIT FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    setFormData(
      (previous) => ({
        ...previous,
        [event.target.name]:
          event.target.value,
      })
    );

    setFormError("");
  };

  // ==========================================
  // UPDATE ADMISSION
  // ==========================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingAdmission) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.patch(
        `admissions/${editingAdmission.id}/`,
        formData
      );

      setAdmissions(
        (previous) =>
          sortAdmissions(
            previous.map(
              (admission) =>
                admission.id ===
                editingAdmission.id
                  ? response.data
                  : admission
            )
          )
      );

      setEditingAdmission(null);

      setSuccessMessage(
        "Admission updated successfully."
      );

      const bedsResponse =
        await api.get("beds/");

      setBeds(
        getData(bedsResponse)
      );
    } catch (err) {
      console.error(
        "Update admission error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update admission."
        )
      );
    }
  };

  // ==========================================
  // ADMISSION FILTERING
  // ==========================================

  const filteredAdmissions = useMemo(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    return admissions.filter(
      (admission) => {
        const searchableValues = [
          admission.admission_id,
          admission.patient_id,
          admission.patient_name,
          admission.doctor_id,
          admission.doctor_name,
          admission.department_name,
          admission.room_number,
          admission.bed_number,
          admission.reason,
          admission.notes,
        ];

        const matchesSearch =
          !search ||
          searchableValues.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(search)
          );

        const matchesStatus =
          !statusFilter ||
          String(
            admission.status || ""
          ) === statusFilter;

        const matchesDepartment =
          !departmentFilter ||
          String(
            admission.department_name ||
              ""
          ) === departmentFilter;

        const admissionDate =
          admission.admission_date ||
          "";

        const matchesFromDate =
          !fromDate ||
          (admissionDate &&
            admissionDate >=
              fromDate);

        const matchesToDate =
          !toDate ||
          (admissionDate &&
            admissionDate <=
              toDate);

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
    admissions,
    searchTerm,
    statusFilter,
    departmentFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const admissionStatuses =
    useMemo(
      () => [
        ...new Set(
          admissions
            .map(
              (admission) =>
                admission.status
            )
            .filter(Boolean)
        ),
      ],
      [admissions]
    );

  const admissionDepartments =
    useMemo(
      () => [
        ...new Set(
          admissions
            .map(
              (admission) =>
                admission.department_name
            )
            .filter(Boolean)
        ),
      ],
      [admissions]
    );

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const admitted =
      admissions.filter(
        (item) =>
          String(
            item.status || ""
          ).toUpperCase() ===
          "ADMITTED"
      ).length;

    const underTreatment =
      admissions.filter(
        (item) =>
          String(
            item.status || ""
          ).toUpperCase() ===
          "UNDER_TREATMENT"
      ).length;

    const discharged =
      admissions.filter(
        (item) =>
          String(
            item.status || ""
          ).toUpperCase() ===
          "DISCHARGED"
      ).length;

    return {
      total: admissions.length,
      admitted,
      underTreatment,
      discharged,
    };
  }, [admissions]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDepartmentFilter("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // CANCEL FORMS
  // ==========================================

  const cancelCreate = () => {
    setShowCreateForm(false);

    setPatientSearch("");
    setDoctorSearch("");

    setCreateFormData({
      patient: "",
      doctor: "",
      department: "",
      room: "",
      bed: "",
      admission_date: "",
      reason: "",
      notes: "",
    });

    setFormError("");
  };

  const cancelEdit = () => {
    setEditingAdmission(null);
    setFormError("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-admissions-page">

        <div className="admin-admissions-state">

          <div className="admin-admissions-spinner" />

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
    <div className="admin-admissions-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="admin-admissions-header">

        <div>

          <p className="admin-admissions-eyebrow">
            INPATIENT MANAGEMENT
          </p>

          <h1>
            Admissions
          </h1>

          <p>
            Manage patient admissions,
            rooms, beds, treatment status,
            and discharge information.
          </p>

        </div>

        <button
          type="button"
          className="admin-admissions-primary-btn"
          onClick={() => {
            setShowCreateForm(
              (previous) => !previous
            );

            setEditingAdmission(null);
            setFormError("");
            setSuccessMessage("");

            if (!showCreateForm) {
              setPatientSearch("");
              setDoctorSearch("");

              setCreateFormData({
                patient: "",
                doctor: "",
                department: "",
                room: "",
                bed: "",
                admission_date: "",
                reason: "",
                notes: "",
              });
            }
          }}
        >
          {showCreateForm
            ? "Close Form"
            : "+ Add Admission"}
        </button>

      </div>

      {/* ======================================
          MESSAGES
      ====================================== */}

      {successMessage && (
        <div className="admin-admissions-success">

          <span>✓</span>

          {successMessage}

        </div>
      )}

      {error && (
        <div className="admin-admissions-error">

          <span>!</span>

          {error}

        </div>
      )}

      {formError && (
        <div className="admin-admissions-form-error">

          <span>!</span>

          {formError}

        </div>
      )}

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="admin-admissions-summary-grid">

        <div className="admin-admissions-summary-card">

          <div className="admin-admissions-summary-icon">
            AD
          </div>

          <div>

            <span>
              Total Admissions
            </span>

            <strong>
              {summary.total}
            </strong>

            <small>
              All admission records
            </small>

          </div>

        </div>

        <div className="admin-admissions-summary-card">

          <div className="admin-admissions-summary-icon">
            IN
          </div>

          <div>

            <span>
              Admitted
            </span>

            <strong>
              {summary.admitted}
            </strong>

            <small>
              Currently admitted
            </small>

          </div>

        </div>

        <div className="admin-admissions-summary-card">

          <div className="admin-admissions-summary-icon">
            TR
          </div>

          <div>

            <span>
              Under Treatment
            </span>

            <strong>
              {summary.underTreatment}
            </strong>

            <small>
              Receiving treatment
            </small>

          </div>

        </div>

        <div className="admin-admissions-summary-card">

          <div className="admin-admissions-summary-icon">
            DC
          </div>

          <div>

            <span>
              Discharged
            </span>

            <strong>
              {summary.discharged}
            </strong>

            <small>
              Completed admissions
            </small>

          </div>

        </div>

      </div>

      {/* ======================================
          CREATE FORM
      ====================================== */}

      {showCreateForm &&
        !editingAdmission && (
          <div className="admin-admissions-form-card">

            <div className="admin-admissions-form-header">

              <div>

                <p>
                  NEW ADMISSION
                </p>

                <h2>
                  Add Patient Admission
                </h2>

                <span>
                  Assign a patient to a
                  department, room, and
                  available bed.
                </span>

              </div>

              <button
                type="button"
                className="admin-admissions-close-btn"
                onClick={cancelCreate}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleCreate}
            >

              {/* ==================================
                  SECTION 01
              ================================== */}

              <div className="admin-admissions-form-section-title">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Patient & Assignment
                  </h3>

                  <p>
                    Search for a patient,
                    select the branch, and
                    assign a doctor.
                  </p>

                </div>

              </div>

              <div className="admin-admissions-form-grid">

                {/* ==================================
                    PATIENT SEARCH
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Patient *
                  </label>

                  <input
                    type="text"
                    value={
                      patientSearch
                    }
                    onChange={(event) => {

                      setPatientSearch(
                        event.target.value
                      );

                      if (
                        createFormData.patient
                      ) {
                        setCreateFormData(
                          (previous) => ({
                            ...previous,
                            patient: "",
                          })
                        );
                      }
                    }}
                    placeholder="Search Patient ID, Aadhaar, or name..."
                    autoComplete="off"
                  />

                  {patientSearch.trim() && (
                    <div className="admin-admissions-search-results">

                      {filteredPatients.length ===
                      0 ? (

                        <div className="admin-admissions-no-results">
                          No patient found
                        </div>

                      ) : (

                        filteredPatients
                          .slice(0, 10)
                          .map((patient) => (

                            <button
                              type="button"
                              key={patient.id}
                              className={`admin-admissions-search-result ${
                                String(
                                  createFormData.patient
                                ) ===
                                String(
                                  patient.id
                                )
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {

                                setCreateFormData(
                                  (previous) => ({
                                    ...previous,
                                    patient:
                                      String(
                                        patient.id
                                      ),
                                  })
                                );

                                setPatientSearch(
                                  patient.patient_id ||
                                    ""
                                );

                              }}
                            >

                              <div>

                                <strong>
                                  {patient.patient_id ||
                                    `Patient #${patient.id}`}
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

                  {createFormData.patient && (
                    <div className="admin-admissions-selected-info">
                      ✓ Patient selected
                    </div>
                  )}

                </div>

                {/* ==================================
                    DEPARTMENT / BRANCH
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Branch / Department *
                  </label>

                  <select
                    name="department"
                    value={
                      createFormData.department
                    }
                    onChange={
                      handleCreateChange
                    }
                    required
                  >

                    <option value="">
                      Select Branch / Department
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
                          {
                            department.name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* ==================================
                    DOCTOR SEARCH
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Doctor *
                  </label>

                  <input
                    type="text"
                    value={
                      doctorSearch
                    }
                    onChange={(event) => {

                      setDoctorSearch(
                        event.target.value
                      );

                      if (
                        createFormData.doctor
                      ) {
                        setCreateFormData(
                          (previous) => ({
                            ...previous,
                            doctor: "",
                            room: "",
                            bed: "",
                          })
                        );
                      }

                    }}
                    placeholder={
                      createFormData.department
                        ? "Search Doctor ID or name..."
                        : "Select Branch / Department First"
                    }
                    disabled={
                      !createFormData.department
                    }
                    autoComplete="off"
                  />

                  {createFormData.department &&
                    doctorSearch.trim() && (

                      <div className="admin-admissions-search-results">

                        {filteredDoctors.length ===
                        0 ? (

                          <div className="admin-admissions-no-results">
                            No doctor found in this branch
                          </div>

                        ) : (

                          filteredDoctors
                            .slice(0, 10)
                            .map((doctor) => (

                              <button
                                type="button"
                                key={doctor.id}
                                className={`admin-admissions-search-result ${
                                  String(
                                    createFormData.doctor
                                  ) ===
                                  String(
                                    doctor.id
                                  )
                                    ? "selected"
                                    : ""
                                }`}
                                onClick={() => {

                                  setCreateFormData(
                                    (previous) => ({
                                      ...previous,
                                      doctor:
                                        String(
                                          doctor.id
                                        ),
                                    })
                                  );

                                  setDoctorSearch(
                                    doctor.doctor_id ||
                                      ""
                                  );

                                }}
                              >

                                <div>

                                  <strong>
                                    {doctor.doctor_id ||
                                      `Doctor #${doctor.id}`}
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
                                    "Department"}
                                </small>

                              </button>

                            ))

                        )}

                      </div>
                    )}

                  {createFormData.doctor && (
                    <div className="admin-admissions-selected-info">
                      ✓ Doctor selected
                    </div>
                  )}

                </div>

                {/* ==================================
                    ROOM
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Room *
                  </label>

                  <select
                    name="room"
                    value={
                      createFormData.room
                    }
                    onChange={
                      handleCreateChange
                    }
                    disabled={
                      !createFormData.department
                    }
                    required
                  >

                    <option value="">
                      {createFormData.department
                        ? filteredRooms.length === 0
                          ? "No Active Rooms"
                          : "Select Room"
                        : "Select Branch / Department First"}
                    </option>

                    {filteredRooms.map(
                      (room) => (

                        <option
                          key={room.id}
                          value={room.id}
                        >
                          Room{" "}
                          {
                            room.room_number
                          }{" "}
                          —{" "}
                          {
                            room.room_type
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* ==================================
                    BED
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Available Bed *
                  </label>

                  <select
                    name="bed"
                    value={
                      createFormData.bed
                    }
                    onChange={
                      handleCreateChange
                    }
                    disabled={
                      !createFormData.room
                    }
                    required
                  >

                    <option value="">
                      {createFormData.room
                        ? filteredBeds.length === 0
                          ? "No Available Beds"
                          : "Select Available Bed"
                        : "Select Room First"}
                    </option>

                    {filteredBeds.map(
                      (bed) => (

                        <option
                          key={bed.id}
                          value={bed.id}
                        >
                          Bed{" "}
                          {
                            bed.bed_number
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* ==================================
                    ADMISSION DATE
                ================================== */}

                <div className="admin-admissions-form-group">

                  <label>
                    Admission Date *
                  </label>

                  <input
                    type="date"
                    name="admission_date"
                    value={
                      createFormData.admission_date
                    }
                    min={getToday()}
                    onChange={
                      handleCreateChange
                    }
                    required
                  />

                  <small className="admin-admissions-field-hint">
                    Past dates are not allowed.
                  </small>

                </div>

              </div>

              {/* ==================================
                  SECTION 02
              ================================== */}

              <div className="admin-admissions-form-section-title">

                <span>
                  02
                </span>

                <div>

                  <h3>
                    Clinical Details
                  </h3>

                  <p>
                    Record the reason and
                    additional admission notes.
                  </p>

                </div>

              </div>

              <div className="admin-admissions-textarea-grid">

                <div className="admin-admissions-form-group">

                  <label>
                    Admission Reason *
                  </label>

                  <textarea
                    name="reason"
                    value={
                      createFormData.reason
                    }
                    onChange={
                      handleCreateChange
                    }
                    placeholder="Enter admission reason..."
                    rows="4"
                    required
                  />

                </div>

                <div className="admin-admissions-form-group">

                  <label>
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      createFormData.notes
                    }
                    onChange={
                      handleCreateChange
                    }
                    placeholder="Additional admission notes..."
                    rows="4"
                  />

                </div>

              </div>

              {/* ==================================
                  ACTIONS
              ================================== */}

              <div className="admin-admissions-form-actions">

                <button
                  type="button"
                  className="admin-admissions-cancel-btn"
                  onClick={
                    cancelCreate
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-admissions-save-btn"
                >
                  Create Admission
                </button>

              </div>

            </form>

          </div>
        )}

      {/* ======================================
          EDIT FORM
      ====================================== */}

      {editingAdmission && (
        <div className="admin-admissions-form-card admin-admissions-edit-card">

          <div className="admin-admissions-form-header">

            <div>

              <p>
                UPDATE ADMISSION
              </p>

              <h2>
                Edit Admission
              </h2>

              <span>
                {
                  editingAdmission.admission_id ||
                  `Admission #${editingAdmission.id}`
                }
              </span>

            </div>

            <button
              type="button"
              className="admin-admissions-close-btn"
              onClick={cancelEdit}
            >
              ×
            </button>

          </div>

          <div className="admin-admissions-patient-banner">

            <div className="admin-admissions-avatar">

              {getInitial(
                editingAdmission.patient_name
              )}

            </div>

            <div>

              <span>
                Patient
              </span>

              <strong>
                {
                  editingAdmission.patient_name ||
                  "-"
                }
              </strong>

              <small>
                {
                  editingAdmission.patient_id ||
                  "-"
                }
              </small>

            </div>

            <div className="admin-admissions-banner-info">

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

            <div className="admin-admissions-banner-info">

              <span>
                Department
              </span>

              <strong>
                {
                  editingAdmission.department_name ||
                  "-"
                }
              </strong>

            </div>

          </div>

          <form
            onSubmit={handleUpdate}
          >

            <div className="admin-admissions-form-section-title">

              <span>
                01
              </span>

              <div>

                <h3>
                  Admission Status
                </h3>

                <p>
                  Update treatment and
                  discharge information.
                </p>

              </div>

            </div>

            <div className="admin-admissions-form-grid">

              <div className="admin-admissions-form-group">

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
                  required
                >

                  <option value="">
                    Select Status
                  </option>

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

              <div className="admin-admissions-form-group">

                <label>
                  Discharge Date
                </label>

                <input
                  type="date"
                  name="discharge_date"
                  value={
                    formData.discharge_date
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>

            <div className="admin-admissions-textarea-grid">

              <div className="admin-admissions-form-group">

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
                  rows="4"
                />

              </div>

              <div className="admin-admissions-form-group">

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
                />

              </div>

            </div>

            <div className="admin-admissions-form-actions">

              <button
                type="button"
                className="admin-admissions-cancel-btn"
                onClick={
                  cancelEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-admissions-save-btn"
              >
                Update Admission
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          FILTER SECTION
      ====================================== */}

      <div className="admin-admissions-filter-card">

        <div className="admin-admissions-filter-header">

          <div>

            <p>
              RECORD SEARCH
            </p>

            <h2>
              Search & Filter Admissions
            </h2>

          </div>

          <span>
            {filteredAdmissions.length}{" "}
            matching
          </span>

        </div>

        <div className="admin-admissions-filter-grid">

          <div className="admin-admissions-filter-group search">

            <label>
              Search
            </label>

            <div className="admin-admissions-search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                value={
                  searchTerm
                }
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Admission ID, patient, doctor, room, bed..."
              />

            </div>

          </div>

          <div className="admin-admissions-filter-group">

            <label>
              Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Statuses
              </option>

              {admissionStatuses.map(
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

          <div className="admin-admissions-filter-group">

            <label>
              Department
            </label>

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

              {admissionDepartments.map(
                (department) => (

                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>

                )
              )}

            </select>

          </div>

          <div className="admin-admissions-filter-group">

            <label>
              From Date
            </label>

            <input
              type="date"
              value={
                fromDate
              }
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />

          </div>

          <div className="admin-admissions-filter-group">

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
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        <div className="admin-admissions-filter-footer">

          <span>
            Showing{" "}
            <strong>
              {filteredAdmissions.length}
            </strong>{" "}
            of{" "}
            <strong>
              {admissions.length}
            </strong>{" "}
            admissions
          </span>

          <button
            type="button"
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="admin-admissions-table-card">

        <div className="admin-admissions-table-header">

          <div>

            <p>
              INPATIENT RECORDS
            </p>

            <h2>
              Admissions
            </h2>

          </div>

          <span className="admin-admissions-table-count">
            {filteredAdmissions.length}
          </span>

        </div>

        {admissions.length === 0 ? (

          <div className="admin-admissions-empty">

            <div className="admin-admissions-empty-icon">
              AD
            </div>

            <h3>
              No admissions found
            </h3>

            <p>
              Create an admission to
              start managing inpatient
              records.
            </p>

          </div>

        ) : filteredAdmissions.length ===
          0 ? (

          <div className="admin-admissions-empty">

            <div className="admin-admissions-empty-icon">
              ⌕
            </div>

            <h3>
              No matching admissions
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              className="admin-admissions-clear-btn"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="admin-admissions-table-wrapper">

            <table className="admin-admissions-table">

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
                    Discharge
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Status
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

                {filteredAdmissions.map(
                  (admission) => (

                    <tr
                      key={
                        admission.id
                      }
                    >

                      {/* ADMISSION */}

                      <td>

                        <div className="admin-admissions-id">

                          <strong>
                            {
                              admission.admission_id ||
                              "-"
                            }
                          </strong>

                          <small>
                            ID #{admission.id}
                          </small>

                        </div>

                      </td>

                      {/* PATIENT */}

                      <td>

                        <div className="admin-admissions-person">

                          <div className="admin-admissions-avatar small">

                            {getInitial(
                              admission.patient_name
                            )}

                          </div>

                          <div>

                            <strong>
                              {
                                admission.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                admission.patient_id ||
                                "-"
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* DOCTOR */}

                      <td>

                        <div className="admin-admissions-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              admission.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              admission.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      {/* DEPARTMENT */}

                      <td>

                        <span className="admin-admissions-department">

                          {
                            admission.department_name ||
                            "-"
                          }

                        </span>

                      </td>

                      {/* ROOM */}

                      <td>

                        <span className="admin-admissions-location">

                          {admission.room_number
                            ? `Room ${admission.room_number}`
                            : "—"}

                        </span>

                      </td>

                      {/* BED */}

                      <td>

                        <span className="admin-admissions-location">

                          {admission.bed_number
                            ? `Bed ${admission.bed_number}`
                            : "—"}

                        </span>

                      </td>

                      {/* ADMISSION DATE */}

                      <td>

                        <span className="admin-admissions-date">

                          {formatDate(
                            admission.admission_date
                          )}

                        </span>

                      </td>

                      {/* DISCHARGE */}

                      <td>

                        <span className="admin-admissions-date">

                          {formatDate(
                            admission.discharge_date
                          )}

                        </span>

                      </td>

                      {/* REASON */}

                      <td>

                        <span className="admin-admissions-reason">

                          {
                            admission.reason ||
                            "—"
                          }

                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`admin-admissions-status ${getStatusClass(
                            admission.status
                          )}`}
                        >

                          {
                            admission.status ||
                            "-"
                          }

                        </span>

                      </td>

                      {/* NOTES */}

                      <td>

                        <span className="admin-admissions-notes">

                          {
                            admission.notes ||
                            "—"
                          }

                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-admissions-edit-btn"
                          onClick={() =>
                            handleEdit(
                              admission
                            )
                          }
                        >
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

export default AdminAdmissions;