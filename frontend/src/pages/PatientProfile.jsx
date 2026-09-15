import { useEffect, useState } from "react";
import api from "../services/api";

function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
  });

  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("auth/profile/");
      setProfile(response.data);
    } catch (err) {
      console.error("Profile error:", err);
      setError("Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const handleEdit = () => {
    setError("");
    setSuccess("");

    setFormData({
      username: profile?.username || "",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      mobile_number: profile?.mobile_number || "",
    });

    setEditing(true);
  };

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const dataToSend = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
      };

      const response = await api.put(
        "auth/profile/update/",
        dataToSend
      );

      setProfile(response.data);

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );

    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      const responseData =
        err.response?.data;

      if (responseData) {
        const messages = [];

        Object.entries(responseData).forEach(
          ([field, value]) => {
            if (Array.isArray(value)) {
              messages.push(
                `${field}: ${value.join(", ")}`
              );
            } else {
              messages.push(
                `${field}: ${value}`
              );
            }
          }
        );

        setError(
          messages.length > 0
            ? messages.join(" ")
            : "Unable to update your profile."
        );
      } else {
        setError(
          "Unable to update your profile."
        );
      }

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="patient-profile-page">

        <div className="patient-profile-loading">

          <div className="patient-profile-spinner"></div>

          <h2>
            Loading your profile...
          </h2>

          <p>
            Please wait while we load your information.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !editing && !profile) {
    return (
      <div className="patient-profile-page">

        <div className="patient-profile-error">

          <h2>
            Unable to load profile
          </h2>

          <p>
            {error}
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-profile-page">

      {/* ========================================
          PROFILE HERO
      ======================================== */}

      <section className="patient-profile-hero">

        <div className="patient-profile-hero-content">

          <div className="patient-profile-avatar">
            👤
          </div>

          <div>

            <div className="patient-profile-label">
              PATIENT PROFILE
            </div>

            <h1>
              {profile?.first_name || "Patient"}{" "}
              {profile?.last_name || ""}
            </h1>

            <p>
              Manage your personal information
              and contact details.
            </p>

          </div>

        </div>

        {!editing && (
          <button
            type="button"
            className="patient-profile-edit-button"
            onClick={handleEdit}
          >
            ✏️ Edit Profile
          </button>
        )}

        <div className="patient-profile-hero-circle profile-circle-one"></div>

        <div className="patient-profile-hero-circle profile-circle-two"></div>

      </section>

      {/* ========================================
          SUCCESS MESSAGE
      ======================================== */}

      {success && (
        <div className="patient-profile-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* ========================================
          ERROR MESSAGE
      ======================================== */}

      {error && editing && (
        <div className="patient-profile-error">
          <span>!</span>
          {error}
        </div>
      )}

      {!editing ? (

        <>
          {/* ========================================
              PROFILE IDENTIFICATION
          ======================================== */}

          <section className="patient-profile-summary-grid">

            <div className="patient-profile-summary-card">

              <div className="patient-profile-summary-icon">
                🪪
              </div>

              <div>

                <span>
                  Patient ID
                </span>

                <strong>
                  {profile?.patient_id || "-"}
                </strong>

              </div>

            </div>

            <div className="patient-profile-summary-card">

              <div className="patient-profile-summary-icon">
                👤
              </div>

              <div>

                <span>
                  Username
                </span>

                <strong>
                  {profile?.username || "-"}
                </strong>

              </div>

            </div>

            <div className="patient-profile-summary-card">

              <div className="patient-profile-summary-icon">
                🩺
              </div>

              <div>

                <span>
                  Account Role
                </span>

                <strong>
                  {profile?.role || "-"}
                </strong>

              </div>

            </div>

          </section>

          {/* ========================================
              PERSONAL INFORMATION
          ======================================== */}

          <section className="patient-profile-section">

            <div className="patient-profile-section-header">

              <div>

                <h2>
                  Personal Information
                </h2>

                <p>
                  Your basic personal details
                </p>

              </div>

              <span>
                👤
              </span>

            </div>

            <div className="patient-profile-details-grid">

              <div className="patient-profile-detail">

                <span>
                  First Name
                </span>

                <strong>
                  {profile?.first_name || "-"}
                </strong>

              </div>

              <div className="patient-profile-detail">

                <span>
                  Last Name
                </span>

                <strong>
                  {profile?.last_name || "-"}
                </strong>

              </div>

              <div className="patient-profile-detail">

                <span>
                  Username
                </span>

                <strong>
                  {profile?.username || "-"}
                </strong>

              </div>

              <div className="patient-profile-detail">

                <span>
                  Aadhaar Number
                </span>

                <strong>
                  {profile?.aadhaar_number || "-"}
                </strong>

              </div>

            </div>

          </section>

          {/* ========================================
              CONTACT INFORMATION
          ======================================== */}

          <section className="patient-profile-section">

            <div className="patient-profile-section-header">

              <div>

                <h2>
                  Contact Information
                </h2>

                <p>
                  Your registered contact details
                </p>

              </div>

              <span>
                📱
              </span>

            </div>

            <div className="patient-profile-details-grid">

              <div className="patient-profile-detail">

                <span>
                  Email Address
                </span>

                <strong>
                  {profile?.email || "-"}
                </strong>

              </div>

              <div className="patient-profile-detail">

                <span>
                  Mobile Number
                </span>

                <strong>
                  {profile?.mobile_number || "-"}
                </strong>

              </div>

            </div>

          </section>

        </>

      ) : (

        /* ========================================
           EDIT PROFILE
           ======================================== */

        <form
          className="patient-profile-edit-card"
          onSubmit={handleSubmit}
        >

          <div className="patient-profile-section-header">

            <div>

              <h2>
                Edit Personal Information
              </h2>

              <p>
                Update your registered details below.
              </p>

            </div>

            <span>
              ✏️
            </span>

          </div>

          {/* NON-EDITABLE INFORMATION */}

          <div className="patient-profile-readonly-grid">

            <div className="patient-profile-readonly">

              <span>
                Patient ID
              </span>

              <strong>
                {profile?.patient_id || "-"}
              </strong>

            </div>

            <div className="patient-profile-readonly">

              <span>
                Aadhaar Number
              </span>

              <strong>
                {profile?.aadhaar_number || "-"}
              </strong>

            </div>

            <div className="patient-profile-readonly">

              <span>
                Role
              </span>

              <strong>
                {profile?.role || "-"}
              </strong>

            </div>

          </div>

          {/* EDITABLE FIELDS */}

          <div className="patient-profile-form-grid">

            <div className="patient-profile-form-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />

            </div>

            <div className="patient-profile-form-group">

              <label htmlFor="first_name">
                First Name
              </label>

              <input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="patient-profile-form-group">

              <label htmlFor="last_name">
                Last Name
              </label>

              <input
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="patient-profile-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

            </div>

            <div className="patient-profile-form-group">

              <label htmlFor="mobile_number">
                Mobile Number
              </label>

              <input
                id="mobile_number"
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div className="patient-profile-form-actions">

            <button
              type="submit"
              className="patient-profile-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "✓ Save Changes"}
            </button>

            <button
              type="button"
              className="patient-profile-cancel-button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

          </div>

        </form>

      )}

    </div>
  );
}

export default PatientProfile;