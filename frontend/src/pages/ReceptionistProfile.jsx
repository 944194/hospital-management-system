import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistProfile.css";

function ReceptionistProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="receptionist-profile-page">
        <div className="receptionist-profile-state">
          <div className="receptionist-profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receptionist-profile-page">
        <div className="receptionist-profile-error-state">
          <div className="receptionist-profile-error-icon">
            !
          </div>
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  const fullName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

  const initials =
    fullName
      ? fullName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((name) => name[0])
          .join("")
          .toUpperCase()
      : "R";

  return (
    <div className="receptionist-profile-page">

      {/* ==========================================
          HEADER
          ========================================== */}

      <div className="receptionist-profile-header">

        <div>
          <p className="receptionist-profile-eyebrow">
            RECEPTIONIST PORTAL
          </p>

          <h1>My Profile</h1>

          <p>
            View your personal information and
            account details.
          </p>
        </div>

      </div>

      {/* ==========================================
          PROFILE HERO
          ========================================== */}

      <div className="receptionist-profile-hero">

        <div className="receptionist-profile-avatar">
          {initials}
        </div>

        <div className="receptionist-profile-identity">

          <h2>
            {fullName || profile?.username || "Receptionist"}
          </h2>

          <p>
            @{profile?.username || "-"}
          </p>

          <span className="receptionist-profile-role">
            {profile?.role || "RECEPTIONIST"}
          </span>

        </div>

        <div className="receptionist-profile-id-box">

          <span>
            Receptionist ID
          </span>

          <strong>
            {profile?.receptionist_id || "-"}
          </strong>

        </div>

      </div>

      {/* ==========================================
          INFORMATION CARD
          ========================================== */}

      <div className="receptionist-profile-card">

        <div className="receptionist-profile-card-header">

          <div>
            <p className="receptionist-profile-section-eyebrow">
              ACCOUNT INFORMATION
            </p>

            <h2>Personal Details</h2>
          </div>

        </div>

        <div className="receptionist-profile-grid">

          {/* NAME */}

          <div className="receptionist-profile-info">

            <span>Name</span>

            <strong>
              {fullName || "-"}
            </strong>

          </div>

          {/* RECEPTIONIST ID */}

          <div className="receptionist-profile-info">

            <span>Receptionist ID</span>

            <strong>
              {profile?.receptionist_id || "-"}
            </strong>

          </div>

          {/* USERNAME */}

          <div className="receptionist-profile-info">

            <span>Username</span>

            <strong>
              {profile?.username || "-"}
            </strong>

          </div>

          {/* EMAIL */}

          <div className="receptionist-profile-info">

            <span>Email</span>

            <strong>
              {profile?.email || "-"}
            </strong>

          </div>

          {/* MOBILE */}

          <div className="receptionist-profile-info">

            <span>Mobile Number</span>

            <strong>
              {profile?.mobile_number || "-"}
            </strong>

          </div>

          {/* AADHAAR */}

          <div className="receptionist-profile-info">

            <span>Aadhaar Number</span>

            <strong>
              {profile?.aadhaar_number || "-"}
            </strong>

          </div>

          {/* ROLE */}

          <div className="receptionist-profile-info">

            <span>Role</span>

            <strong className="receptionist-profile-role-text">
              {profile?.role || "-"}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ReceptionistProfile;