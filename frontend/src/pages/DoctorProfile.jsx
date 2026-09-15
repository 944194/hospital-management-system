import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        // Get logged-in user profile
        const profileResponse =
          await api.get("auth/profile/");

        const user =
          profileResponse.data;

        // Get all doctors
        const doctorsResponse =
          await api.get("doctors/");

        const doctors = Array.isArray(
          doctorsResponse.data
        )
          ? doctorsResponse.data
          : doctorsResponse.data.results || [];

        // Find doctor belonging to logged-in user
        const doctorProfile =
          doctors.find(
            (item) =>
              item.username ===
              user.username
          );

        if (!doctorProfile) {
          setError(
            "Doctor profile not found."
          );
          return;
        }

        setDoctor(doctorProfile);
      } catch (err) {
        console.error(
          "Doctor profile error:",
          err
        );

        setError(
          "Unable to load doctor profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-profile-loading">
        <div className="doctor-profile-spinner"></div>

        <h2>
          Loading doctor profile...
        </h2>

        <p>
          Please wait while we load your
          professional information.
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="doctor-profile-error">
        <div className="doctor-profile-error-icon">
          !
        </div>

        <h2>
          Unable to load profile
        </h2>

        <p>
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // FULL NAME
  // ==========================================

  const fullName =
    `${doctor.first_name || ""} ${
      doctor.last_name || ""
    }`.trim() ||
    doctor.username;

  return (
    <div className="doctor-profile-page">

      {/* ========================================
          PROFILE HERO
      ======================================== */}

      <section className="doctor-profile-hero">

        <div className="doctor-profile-hero-content">

          <div className="doctor-profile-avatar">
            {doctor.first_name
              ? doctor.first_name
                  .charAt(0)
                  .toUpperCase()
              : "D"}
          </div>

          <div className="doctor-profile-hero-info">

            <span className="doctor-profile-eyebrow">
              DOCTOR PROFILE
            </span>

            <h1>
              Dr. {fullName}
            </h1>

            <p>
              {doctor.specialization ||
                "Medical Professional"}
            </p>

            <div className="doctor-profile-hero-meta">

              <span>
                🩺{" "}
                {doctor.doctor_id ||
                  "-"}
              </span>

              <span>
                🏥{" "}
                {doctor.department_name ||
                  "-"}
              </span>

              <span>
                🚪 Room{" "}
                {doctor.consultation_room_number ||
                  "-"}
              </span>

            </div>

          </div>

        </div>

        <div className="doctor-profile-hero-decoration doctor-profile-decoration-one"></div>

        <div className="doctor-profile-hero-decoration doctor-profile-decoration-two"></div>

      </section>

      {/* ========================================
          PROFESSIONAL SUMMARY
      ======================================== */}

      <section className="doctor-profile-summary-grid">

        <div className="doctor-profile-summary-card">

          <div className="doctor-profile-summary-icon">
            🎓
          </div>

          <div>
            <span>
              Qualification
            </span>

            <strong>
              {doctor.qualification ||
                "-"}
            </strong>
          </div>

        </div>

        <div className="doctor-profile-summary-card">

          <div className="doctor-profile-summary-icon">
            ⏱
          </div>

          <div>
            <span>
              Experience
            </span>

            <strong>
              {doctor.experience_years ??
                "-"}
              {doctor.experience_years !==
                null &&
              doctor.experience_years !==
                undefined
                ? " years"
                : ""}
            </strong>
          </div>

        </div>

        <div className="doctor-profile-summary-card">

          <div className="doctor-profile-summary-icon">
            💰
          </div>

          <div>
            <span>
              Consultation Fee
            </span>

            <strong>
              ₹
              {Number(
                doctor.consultation_fee ||
                  0
              ).toFixed(2)}
            </strong>
          </div>

        </div>

      </section>

      {/* ========================================
          PERSONAL INFORMATION
      ======================================== */}

      <section className="doctor-profile-section">

        <div className="doctor-profile-section-header">

          <div className="doctor-profile-section-icon">
            👤
          </div>

          <div>
            <h2>
              Personal Information
            </h2>

            <p>
              Your basic account and contact
              information.
            </p>
          </div>

        </div>

        <div className="doctor-profile-details-grid">

          <div className="doctor-profile-detail">

            <span>
              Full Name
            </span>

            <strong>
              {fullName}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Username
            </span>

            <strong>
              {doctor.username ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Email
            </span>

            <strong>
              {doctor.email ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Mobile Number
            </span>

            <strong>
              {doctor.mobile_number ||
                "-"}
            </strong>

          </div>

        </div>

      </section>

      {/* ========================================
          PROFESSIONAL INFORMATION
      ======================================== */}

      <section className="doctor-profile-section">

        <div className="doctor-profile-section-header">

          <div className="doctor-profile-section-icon">
            🩺
          </div>

          <div>
            <h2>
              Professional Information
            </h2>

            <p>
              Your medical and professional
              details.
            </p>
          </div>

        </div>

        <div className="doctor-profile-details-grid">

          <div className="doctor-profile-detail">

            <span>
              Doctor ID
            </span>

            <strong className="doctor-profile-highlight">
              {doctor.doctor_id ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Department
            </span>

            <strong>
              {doctor.department_name ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Specialization
            </span>

            <strong>
              {doctor.specialization ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Qualification
            </span>

            <strong>
              {doctor.qualification ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              License Number
            </span>

            <strong>
              {doctor.license_number ||
                "-"}
            </strong>

          </div>

          <div className="doctor-profile-detail">

            <span>
              Experience
            </span>

            <strong>
              {doctor.experience_years ??
                "-"}
              {doctor.experience_years !==
                null &&
              doctor.experience_years !==
                undefined
                ? " years"
                : ""}
            </strong>

          </div>

        </div>

      </section>

      {/* ========================================
          CONSULTATION DETAILS
      ======================================== */}

      <section className="doctor-profile-section">

        <div className="doctor-profile-section-header">

          <div className="doctor-profile-section-icon">
            🏥
          </div>

          <div>
            <h2>
              Consultation Details
            </h2>

            <p>
              Your assigned consultation
              location and fee.
            </p>
          </div>

        </div>

        <div className="doctor-profile-consultation-grid">

          <div className="doctor-profile-consultation-card">

            <span className="doctor-profile-consultation-icon">
              🚪
            </span>

            <div>
              <span>
                Consultation Room
              </span>

              <strong>
                {doctor.consultation_room_number ||
                  "Not Assigned"}
              </strong>
            </div>

          </div>

          <div className="doctor-profile-consultation-card">

            <span className="doctor-profile-consultation-icon">
              💳
            </span>

            <div>
              <span>
                Consultation Fee
              </span>

              <strong>
                ₹
                {Number(
                  doctor.consultation_fee ||
                    0
                ).toFixed(2)}
              </strong>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default DoctorProfile;