import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminPatients.css";

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const emptyForm = {
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    aadhaar_number: "",
    patient_id: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    guardian_name: "",
    guardian_mobile: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchPatients = async () => {
    try {
      const response = await api.get("patients/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setPatients(data);
    } catch (err) {
      console.error("Patients error:", err);
      setError("Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const resetForm = () => {
    setFormData({ ...emptyForm });
  };

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");

    setTimeout(() => {
      document
        .querySelector(".admin-patients-form-card")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);

    setFormData({
      username: patient.username || "",
      password: "",
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      email: patient.email || "",
      mobile_number: patient.mobile_number || "",
      aadhaar_number: patient.aadhaar_number || "",
      patient_id: patient.patient_id || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      blood_group: patient.blood_group || "",
      address: patient.address || "",
      emergency_contact_name:
        patient.emergency_contact_name || "",
      emergency_contact_number:
        patient.emergency_contact_number || "",
      guardian_name: patient.guardian_name || "",
      guardian_mobile: patient.guardian_mobile || "",
    });

    setShowForm(true);
    setError("");
    setSuccess("");

    setTimeout(() => {
      document
        .querySelector(".admin-patients-form-card")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const getErrorMessage = (err, fallback) => {
    if (!err.response?.data) {
      return fallback;
    }

    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data.error) {
      return data.error;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, message]) => {
          const value = Array.isArray(message)
            ? message.join(", ")
            : message;

          return `${field}: ${value}`;
        })
        .join(" ");
    }

    return fallback;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const updateData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        mobile_number: formData.mobile_number || null,
        aadhaar_number:
          formData.aadhaar_number.trim() || null,
        patient_id: formData.patient_id,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_group: formData.blood_group || null,
        address: formData.address,
        emergency_contact_name:
          formData.emergency_contact_name,
        emergency_contact_number:
          formData.emergency_contact_number,
        guardian_name: formData.guardian_name,
        guardian_mobile: formData.guardian_mobile,
      };

      if (formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      const response = await api.put(
        `patients/${editingPatient.id}/`,
        updateData
      );

      setPatients((previous) =>
        previous.map((patient) =>
          patient.id === editingPatient.id
            ? response.data
            : patient
        )
      );

      setEditingPatient(null);
      setShowForm(false);
      resetForm();

      setSuccess("Patient updated successfully.");
    } catch (err) {
      console.error("Update patient error:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to update patient."
        )
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const createData = {
        ...formData,
        email: formData.email || null,
        mobile_number: formData.mobile_number || null,
        aadhaar_number:
          formData.aadhaar_number.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_group: formData.blood_group || null,
      };

      await api.post("patients/", createData);

      setSuccess("Patient created successfully.");

      resetForm();
      setShowForm(false);

      await fetchPatients();
    } catch (err) {
      console.error("Create patient error:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to create patient."
        )
      );
    }
  };

  const handleDelete = async (patient) => {
    const patientName =
      `${patient.first_name || ""} ${
        patient.last_name || ""
      }`.trim() || patient.username;

    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${patientName}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`patients/${patient.id}/`);

      setPatients((previous) =>
        previous.filter(
          (item) => item.id !== patient.id
        )
      );

      setSuccess("Patient deleted successfully.");
    } catch (err) {
      console.error("Delete patient error:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete patient."
        )
      );
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
    resetForm();
    setError("");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setGenderFilter("");
    setBloodGroupFilter("");
    setFromDate("");
    setToDate("");
  };

  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...patients]
      .filter((patient) => {
        if (search) {
          const values = [
            patient.patient_id,
            patient.first_name,
            patient.last_name,
            `${patient.first_name || ""} ${
              patient.last_name || ""
            }`,
            patient.username,
            patient.email,
            patient.mobile_number,
            patient.aadhaar_number,
          ];

          const matchesSearch = values.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search)
          );

          if (!matchesSearch) {
            return false;
          }
        }

        if (
          genderFilter &&
          String(patient.gender || "") !== genderFilter
        ) {
          return false;
        }

        if (
          bloodGroupFilter &&
          String(patient.blood_group || "") !==
            bloodGroupFilter
        ) {
          return false;
        }

        if (
          fromDate &&
          patient.date_of_birth &&
          patient.date_of_birth < fromDate
        ) {
          return false;
        }

        if (
          toDate &&
          patient.date_of_birth &&
          patient.date_of_birth > toDate
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.id - a.id);
  }, [
    patients,
    searchTerm,
    genderFilter,
    bloodGroupFilter,
    fromDate,
    toDate,
  ]);

  const maleCount = patients.filter(
    (patient) => patient.gender === "MALE"
  ).length;

  const femaleCount = patients.filter(
    (patient) => patient.gender === "FEMALE"
  ).length;

  const bloodGroupCount = patients.filter(
    (patient) => patient.blood_group
  ).length;

  if (loading) {
    return (
      <div className="admin-patients-page">
        <div className="admin-patients-state">
          <div className="admin-patients-spinner" />
          <p>Loading patient records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-patients-page">

      {/* Header */}

      <div className="admin-patients-header">
        <div>
          <p className="admin-patients-eyebrow">
            PATIENT MANAGEMENT
          </p>

          <h1>Patients</h1>

          <p>
            Manage patient profiles, demographics and
            emergency contact information.
          </p>
        </div>

        <button
          className="admin-patients-primary-btn"
          onClick={handleAddPatient}
        >
          <span>+</span>
          Add Patient
        </button>
      </div>

      {/* Messages */}

      {success && (
        <div className="admin-patients-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {error && (
        <div className="admin-patients-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* Summary */}

      <div className="admin-patients-summary-grid">

        <div className="admin-patients-summary-card">
          <div className="admin-patients-summary-icon">
            P
          </div>

          <div>
            <span>Total Patients</span>
            <strong>{patients.length}</strong>
            <small>Registered records</small>
          </div>
        </div>

        <div className="admin-patients-summary-card">
          <div className="admin-patients-summary-icon">
            M
          </div>

          <div>
            <span>Male Patients</span>
            <strong>{maleCount}</strong>
            <small>Male registrations</small>
          </div>
        </div>

        <div className="admin-patients-summary-card">
          <div className="admin-patients-summary-icon">
            F
          </div>

          <div>
            <span>Female Patients</span>
            <strong>{femaleCount}</strong>
            <small>Female registrations</small>
          </div>
        </div>

        <div className="admin-patients-summary-card">
          <div className="admin-patients-summary-icon">
            B
          </div>

          <div>
            <span>Blood Group Data</span>
            <strong>{bloodGroupCount}</strong>
            <small>Records with blood group</small>
          </div>
        </div>

      </div>

      {/* Search & Filters */}

      <div className="admin-patients-search-card">

        <div className="admin-patients-search-header">
          <div>
            <p>FIND PATIENTS</p>
            <h2>Search & Filters</h2>
          </div>

          {(searchTerm ||
            genderFilter ||
            bloodGroupFilter ||
            fromDate ||
            toDate) && (
            <button
              className="admin-patients-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="admin-patients-search-main">

          <div className="admin-patients-search-box">
            <span>⌕</span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search Patient ID, name, username, mobile, Aadhaar or email..."
            />
          </div>

        </div>

        <div className="admin-patients-filter-grid">

          <div className="admin-patients-filter-group">
            <label>Gender</label>

            <select
              value={genderFilter}
              onChange={(event) =>
                setGenderFilter(event.target.value)
              }
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="admin-patients-filter-group">
            <label>Blood Group</label>

            <select
              value={bloodGroupFilter}
              onChange={(event) =>
                setBloodGroupFilter(event.target.value)
              }
            >
              <option value="">
                All Blood Groups
              </option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="admin-patients-filter-group">
            <label>Date of Birth From</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
            />
          </div>

          <div className="admin-patients-filter-group">
            <label>Date of Birth To</label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
            />
          </div>

        </div>

        <div className="admin-patients-result-info">
          Showing <strong>{filteredPatients.length}</strong>{" "}
          of <strong>{patients.length}</strong> patients
        </div>

      </div>

      {/* Form */}

      {showForm && (
        <div className="admin-patients-form-card">

          <div className="admin-patients-form-header">

            <div>
              <p>
                {editingPatient
                  ? "PATIENT PROFILE"
                  : "NEW REGISTRATION"}
              </p>

              <h2>
                {editingPatient
                  ? "Edit Patient"
                  : "Create New Patient"}
              </h2>
            </div>

            <button
              className="admin-patients-close-btn"
              type="button"
              onClick={handleCancel}
              aria-label="Close form"
            >
              ×
            </button>

          </div>

          <form
            onSubmit={
              editingPatient
                ? handleUpdate
                : handleSubmit
            }
          >

            {/* Account */}

            <div className="admin-patients-form-section">

              <div className="admin-patients-section-title">
                <span>01</span>
                <div>
                  <h3>Account Information</h3>
                  <p>Login and identity details</p>
                </div>
              </div>

              <div className="admin-patients-form-grid">

                <div className="admin-patients-form-group">
                  <label>Username *</label>

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>
                    Password{" "}
                    {editingPatient
                      ? "(optional)"
                      : "*"}
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="8"
                    required={!editingPatient}
                    placeholder={
                      editingPatient
                        ? "Leave blank to keep current"
                        : "Minimum 8 characters"
                    }
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Patient ID</label>

                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    placeholder="Patient ID"
                  />
                </div>

              </div>

            </div>

            {/* Personal */}

            <div className="admin-patients-form-section">

              <div className="admin-patients-section-title">
                <span>02</span>
                <div>
                  <h3>Personal Information</h3>
                  <p>Patient demographic details</p>
                </div>
              </div>

              <div className="admin-patients-form-grid">

                <div className="admin-patients-form-group">
                  <label>First Name *</label>

                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Last Name *</label>

                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Mobile Number</label>

                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="Mobile number"
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Aadhaar Number</label>

                  <input
                    type="text"
                    name="aadhaar_number"
                    value={formData.aadhaar_number}
                    onChange={handleChange}
                    maxLength="12"
                    placeholder="12-digit Aadhaar"
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Date of Birth</label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Gender</label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Gender
                    </option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">
                      Female
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <div className="admin-patients-form-group">
                  <label>Blood Group</label>

                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Blood Group
                    </option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="admin-patients-form-group full">
                  <label>Address</label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Patient residential address"
                  />
                </div>

              </div>

            </div>

            {/* Emergency */}

            <div className="admin-patients-form-section">

              <div className="admin-patients-section-title">
                <span>03</span>
                <div>
                  <h3>Emergency & Guardian</h3>
                  <p>Emergency contact information</p>
                </div>
              </div>

              <div className="admin-patients-form-grid">

                <div className="admin-patients-form-group">
                  <label>
                    Emergency Contact Name
                  </label>

                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={
                      formData.emergency_contact_name
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>
                    Emergency Contact Number
                  </label>

                  <input
                    type="text"
                    name="emergency_contact_number"
                    value={
                      formData.emergency_contact_number
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Guardian Name</label>

                  <input
                    type="text"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-patients-form-group">
                  <label>Guardian Mobile</label>

                  <input
                    type="text"
                    name="guardian_mobile"
                    value={formData.guardian_mobile}
                    onChange={handleChange}
                  />
                </div>

              </div>

            </div>

            {/* Form Actions */}

            <div className="admin-patients-form-actions">

              <button
                type="button"
                className="admin-patients-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-patients-save-btn"
              >
                {editingPatient
                  ? "Save Changes"
                  : "Create Patient"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Patient Table */}

      <div className="admin-patients-table-card">

        <div className="admin-patients-table-header">

          <div>
            <p>PATIENT DIRECTORY</p>
            <h2>Registered Patients</h2>
          </div>

          <span>
            {filteredPatients.length} records
          </span>

        </div>

        {patients.length === 0 ? (
          <div className="admin-patients-empty">
            <div className="admin-patients-empty-icon">
              P
            </div>

            <h3>No patients found</h3>

            <p>
              Start by adding a new patient record.
            </p>

            <button
              className="admin-patients-primary-btn"
              onClick={handleAddPatient}
            >
              + Add Patient
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="admin-patients-empty">
            <div className="admin-patients-empty-icon">
              ⌕
            </div>

            <h3>No matching patients</h3>

            <p>
              Try changing your search or filter
              criteria.
            </p>

            <button
              className="admin-patients-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="admin-patients-table-wrapper">

            <table className="admin-patients-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Contact</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredPatients.map((patient) => {

                  const fullName =
                    `${patient.first_name || ""} ${
                      patient.last_name || ""
                    }`.trim();

                  const initials =
                    fullName
                      ? fullName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(
                            (name) => name[0]
                          )
                          .join("")
                          .toUpperCase()
                      : "P";

                  return (
                    <tr key={patient.id}>

                      <td>
                        <div className="admin-patient-person">

                          <div className="admin-patient-avatar">
                            {initials}
                          </div>

                          <div>
                            <strong>
                              {fullName ||
                                patient.username ||
                                "-"}
                            </strong>

                            <span>
                              @{patient.username ||
                                "-"}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="admin-patient-id">
                          {patient.patient_id || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-patient-contact">
                          <span>
                            {patient.mobile_number ||
                              "-"}
                          </span>

                          <small>
                            {patient.email || "-"}
                          </small>
                        </div>
                      </td>

                      <td>
                        {patient.date_of_birth || "-"}
                      </td>

                      <td>
                        <span className="admin-patient-gender">
                          {patient.gender || "-"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-patient-blood">
                          {patient.blood_group || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-patient-actions">

                          <button
                            className="admin-patient-edit-btn"
                            onClick={() =>
                              handleEdit(patient)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="admin-patient-delete-btn"
                            onClick={() =>
                              handleDelete(patient)
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AdminPatients;