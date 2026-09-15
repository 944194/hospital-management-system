import { useEffect, useState } from "react";
import api from "../services/api";

function ReceptionistPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [formData, setFormData] = useState({
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
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const getData = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data?.results || [];
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
          const formattedMessage = Array.isArray(message)
            ? message.join(", ")
            : String(message);

          return `${field}: ${formattedMessage}`;
        })
        .join(" ");
    }

    return fallback;
  };

  const formatGender = (gender) => {
    if (!gender) return "-";

    return gender
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // ============================================================
  // FETCH PATIENTS
  // ============================================================

  const fetchPatients = async () => {
    try {
      setError("");

      const response = await api.get("patients/");
      const data = getData(response);

      const sortedPatients = [...data].sort(
        (a, b) => b.id - a.id
      );

      setPatients(sortedPatients);
      setFilteredPatients(sortedPatients);
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

  // ============================================================
  // SEARCH PATIENTS
  // ============================================================

  useEffect(() => {
    const value = searchTerm.trim().toLowerCase();

    if (!value) {
      setFilteredPatients(patients);
      return;
    }

    const results = patients.filter((patient) => {
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

      const username = String(
        patient.username || ""
      ).toLowerCase();

      const mobileNumber = String(
        patient.mobile_number || ""
      ).toLowerCase();

      return (
        patientId.includes(value) ||
        aadhaarNumber.includes(value) ||
        firstName.includes(value) ||
        lastName.includes(value) ||
        username.includes(value) ||
        mobileNumber.includes(value)
      );
    });

    setFilteredPatients(results);
  }, [patients, searchTerm]);

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setFormData({
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
    });
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================================
  // OPEN CREATE FORM
  // ============================================================

  const handleAddPatient = () => {
    setEditingPatient(null);
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ============================================================
  // EDIT PATIENT
  // ============================================================

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
      guardian_name:
        patient.guardian_name || "",
      guardian_mobile:
        patient.guardian_mobile || "",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ============================================================
  // UPDATE PATIENT
  // ============================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const updateData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        aadhaar_number: formData.aadhaar_number,
        patient_id: formData.patient_id,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        address: formData.address,
        emergency_contact_name:
          formData.emergency_contact_name,
        emergency_contact_number:
          formData.emergency_contact_number,
        guardian_name:
          formData.guardian_name,
        guardian_mobile:
          formData.guardian_mobile,
      };

      if (formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      const response = await api.put(
        `patients/${editingPatient.id}/`,
        updateData
      );

      const updatedPatients = patients.map(
        (patient) =>
          patient.id === editingPatient.id
            ? response.data
            : patient
      );

      setPatients(updatedPatients);

      setEditingPatient(null);
      setShowForm(false);
      resetForm();

      setSuccess(
        "Patient updated successfully."
      );
    } catch (err) {
      console.error(
        "Update patient error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update patient."
        )
      );
    }
  };

  // ============================================================
  // CREATE PATIENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await api.post(
        "patients/",
        formData
      );

      setSuccess(
        "Patient created successfully."
      );

      resetForm();
      setShowForm(false);

      await fetchPatients();
    } catch (err) {
      console.error(
        "Create patient error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to create patient."
        )
      );
    }
  };

  // ============================================================
  // CANCEL FORM
  // ============================================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingPatient(null);
    resetForm();
    setError("");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="receptionist-patients-page">
        <div className="receptionist-patients-state">
          <div className="receptionist-patients-spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="receptionist-patients-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="receptionist-patients-header">

        <div>
          <p className="receptionist-patients-eyebrow">
            Patient Management
          </p>

          <h1>Patients</h1>

          <p>
            View and manage hospital patient
            information.
          </p>
        </div>

        <div className="receptionist-patients-header-actions">

          <div className="receptionist-patients-count">
            <span>Total Patients</span>
            <strong>{patients.length}</strong>
          </div>

          <button
            type="button"
            className="receptionist-patients-primary-btn"
            onClick={
              showForm
                ? handleCancel
                : handleAddPatient
            }
          >
            {showForm
              ? "Close Form"
              : "+ Add Patient"}
          </button>

        </div>

      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {success && (
        <div className="receptionist-patients-success">
          {success}
        </div>
      )}

      {error && (
        <div className="receptionist-patients-error">
          {error}
        </div>
      )}

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="receptionist-patients-search-card">

        <div className="receptionist-patients-search-header">

          <div>
            <h2>Search Patients</h2>
            <p>
              Search by Patient ID, Aadhaar,
              name or mobile number.
            </p>
          </div>

          <span>
            {filteredPatients.length} Results
          </span>

        </div>

        <div className="receptionist-patients-search-box">

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Patient ID, Aadhaar Number, Name or Mobile Number"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </button>
          )}

        </div>

      </div>

      {/* ======================================================
          PATIENT FORM
      ====================================================== */}

      {showForm && (
        <div className="receptionist-patients-form-card">

          <div className="receptionist-patients-section-header">

            <div>
              <h2>
                {editingPatient
                  ? "Edit Patient"
                  : "Create New Patient"}
              </h2>

              <p>
                {editingPatient
                  ? "Update patient account and personal information."
                  : "Enter the patient's account and personal information."}
              </p>
            </div>

            <button
              type="button"
              className="receptionist-patients-close-btn"
              onClick={handleCancel}
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

            <div className="receptionist-patients-form-grid">

              <div className="receptionist-patients-form-group">
                <label>Username *</label>

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>
                  Password{" "}
                  {editingPatient
                    ? "(leave blank to keep current)"
                    : "*"}
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="8"
                  required={!editingPatient}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>First Name *</label>

                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Last Name *</label>

                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Mobile Number</label>

                <input
                  type="text"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Aadhaar Number</label>

                <input
                  type="text"
                  name="aadhaar_number"
                  value={formData.aadhaar_number}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Patient ID</label>

                <input
                  type="text"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Date of Birth</label>

                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Gender</label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Gender
                  </option>

                  <option value="MALE">
                    Male
                  </option>

                  <option value="FEMALE">
                    Female
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div className="receptionist-patients-form-group">
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

              <div className="receptionist-patients-form-group full">
                <label>Address</label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Emergency Contact Name</label>

                <input
                  type="text"
                  name="emergency_contact_name"
                  value={
                    formData.emergency_contact_name
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Emergency Contact Number</label>

                <input
                  type="text"
                  name="emergency_contact_number"
                  value={
                    formData.emergency_contact_number
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Guardian Name</label>

                <input
                  type="text"
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                />
              </div>

              <div className="receptionist-patients-form-group">
                <label>Guardian Mobile</label>

                <input
                  type="text"
                  name="guardian_mobile"
                  value={formData.guardian_mobile}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="receptionist-patients-form-actions">

              <button
                type="submit"
                className="receptionist-patients-save-btn"
              >
                {editingPatient
                  ? "Save Changes"
                  : "Create Patient"}
              </button>

              <button
                type="button"
                className="receptionist-patients-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================================
          PATIENT TABLE
      ====================================================== */}

      {filteredPatients.length === 0 ? (

        <div className="receptionist-patients-empty">

          <div className="receptionist-patients-empty-icon">
            P
          </div>

          <h3>
            {searchTerm
              ? "No Patients Found"
              : "No Patients Available"}
          </h3>

          <p>
            {searchTerm
              ? "No patient matches your search criteria."
              : "There are currently no patients registered."}
          </p>

          {searchTerm && (
            <button
              type="button"
              className="receptionist-patients-clear-btn"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          )}

        </div>

      ) : (

        <div className="receptionist-patients-table-section">

          <div className="receptionist-patients-table-header">

            <div>
              <h2>Patient Records</h2>

              <p>
                Patient records are shown with
                the latest entries first.
              </p>
            </div>

            <span>
              {filteredPatients.length} Records
            </span>

          </div>

          <div className="receptionist-patients-table-wrapper">

            <table className="receptionist-patients-table">

              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredPatients.map(
                  (patient) => (

                    <tr key={patient.id}>

                      <td>
                        <span className="receptionist-patient-id">
                          {patient.patient_id || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="receptionist-patient-person">
                          <strong>
                            {patient.first_name || ""}{" "}
                            {patient.last_name || ""}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {patient.username || "-"}
                      </td>

                      <td>
                        {patient.email || "-"}
                      </td>

                      <td>
                        {patient.mobile_number || "-"}
                      </td>

                      <td>
                        {patient.date_of_birth || "-"}
                      </td>

                      <td>
                        {formatGender(patient.gender)}
                      </td>

                      <td>
                        <span className="receptionist-blood-group">
                          {patient.blood_group || "-"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="receptionist-patient-edit-btn"
                          onClick={() =>
                            handleEdit(patient)
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

        </div>
      )}

    </div>
  );
}

export default ReceptionistPatients;