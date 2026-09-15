import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile_number: "",
    aadhaar_number: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const password = formData.password;

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        "Password must contain at least 1 uppercase letter."
      );
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(
        "Password must contain at least 1 lowercase letter."
      );
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(
        "Password must contain at least 1 number."
      );
      setLoading(false);
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError(
        "Password must contain at least 1 special character."
      );
      setLoading(false);
      return;
    }

    try {
      await api.post(
        "auth/register/",
        formData
      );

      setSuccess(
        "Registration successful. You can now login."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);

      if (err.response?.data) {
        const data = err.response.data;

        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : value;

            return `${field}: ${message}`;
          })
          .join(" | ");

        setError(
          messages || "Registration failed."
        );
      } else {
        setError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* ==================================================
          LEFT HEALTHCARE IMAGE
      ================================================== */}

      <div className="register-image-section">

        <img
          src="/login-hospital.png"
          alt="Hospital Management System"
          className="register-background-image"
        />

      </div>

      {/* ==================================================
          RIGHT REGISTER SECTION
      ================================================== */}

      <div className="register-form-section">

        <div className="register-card">

          {/* ==================================================
              LOGO
          ================================================== */}

          <div className="register-logo">

            <div className="register-logo-icon">
              ✚
            </div>

            <div className="register-logo-text">

              <strong>
                Hospital Management
              </strong>

              <span>
                System
              </span>

            </div>

          </div>

          {/* ==================================================
              HEADING
          ================================================== */}

          <div className="register-heading">

            <span className="register-welcome">
              GET STARTED
            </span>

            <h1>
              Create your account
            </h1>

            <p>
              Register as a patient to
              access your healthcare portal.
            </p>

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="register-error">

              <span className="register-error-icon">
                !
              </span>

              <div>

                <strong>
                  Registration failed
                </strong>

                <p>
                  {error}
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div className="register-success">

              <span className="register-success-icon">
                ✓
              </span>

              <div>

                <strong>
                  Success
                </strong>

                <p>
                  {success}
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              REGISTRATION FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >

            {/* ==================================================
                PERSONAL INFORMATION
            ================================================== */}

            <div className="register-section-title">

              <span>
                01
              </span>

              <div>

                <h3>
                  Personal Information
                </h3>

                <p>
                  Enter your basic details.
                </p>

              </div>

            </div>

            <div className="register-form-grid">

              {/* FIRST NAME */}

              <div className="register-input-group">

                <label htmlFor="first_name">
                  First Name
                </label>

                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  placeholder="Enter first name"
                  value={
                    formData.first_name
                  }
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />

              </div>

              {/* LAST NAME */}

              <div className="register-input-group">

                <label htmlFor="last_name">
                  Last Name
                </label>

                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  placeholder="Enter last name"
                  value={
                    formData.last_name
                  }
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />

              </div>

              {/* DATE OF BIRTH */}

              <div className="register-input-group">

                <label htmlFor="date_of_birth">
                  Date of Birth
                </label>

                <input
                  id="date_of_birth"
                  type="date"
                  name="date_of_birth"
                  value={
                    formData.date_of_birth
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              {/* GENDER */}

              <div className="register-input-group">

                <label htmlFor="gender">
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={
                    formData.gender
                  }
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select gender
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

            </div>

            {/* ==================================================
                ACCOUNT INFORMATION
            ================================================== */}

            <div className="register-section-title">

              <span>
                02
              </span>

              <div>

                <h3>
                  Account Information
                </h3>

                <p>
                  Create your login credentials.
                </p>

              </div>

            </div>

            <div className="register-form-grid">

              {/* USERNAME */}

              <div className="register-input-group">

                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  value={
                    formData.username
                  }
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="register-input-group">

                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={
                    formData.email
                  }
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

              </div>

              {/* MOBILE */}

              <div className="register-input-group">

                <label htmlFor="mobile_number">
                  Mobile Number
                </label>

                <input
                  id="mobile_number"
                  type="tel"
                  name="mobile_number"
                  placeholder="Enter mobile number"
                  value={
                    formData.mobile_number
                  }
                  onChange={handleChange}
                  autoComplete="tel"
                  maxLength="15"
                  required
                />

              </div>

              {/* AADHAAR */}

              <div className="register-input-group">

                <label htmlFor="aadhaar_number">
                  Aadhaar Number
                </label>

                <input
                  id="aadhaar_number"
                  type="text"
                  name="aadhaar_number"
                  placeholder="Enter 12-digit Aadhaar"
                  value={
                    formData.aadhaar_number
                  }
                  onChange={handleChange}
                  maxLength="12"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />

                <small>
                  Your Aadhaar number is kept
                  confidential.
                </small>

              </div>

            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div className="register-section-title">

              <span>
                03
              </span>

              <div>

                <h3>
                  Security
                </h3>

                <p>
                  Create a strong password
                  for your account.
                </p>

              </div>

            </div>

            <div className="register-password-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="register-password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter strong password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  minLength="8"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {/* ==================================================
                PASSWORD RULES
            ================================================== */}

            <div className="register-password-rules">

              <p>
                Password must contain:
              </p>

              <div className="register-password-rules-grid">

                <span
                  className={
                    formData.password.length >= 8
                      ? "valid"
                      : ""
                  }
                >
                  <b>✓</b>
                  8+ characters
                </span>

                <span
                  className={
                    /[A-Z]/.test(
                      formData.password
                    )
                      ? "valid"
                      : ""
                  }
                >
                  <b>✓</b>
                  Uppercase letter
                </span>

                <span
                  className={
                    /[a-z]/.test(
                      formData.password
                    )
                      ? "valid"
                      : ""
                  }
                >
                  <b>✓</b>
                  Lowercase letter
                </span>

                <span
                  className={
                    /[0-9]/.test(
                      formData.password
                    )
                      ? "valid"
                      : ""
                  }
                >
                  <b>✓</b>
                  Number
                </span>

                <span
                  className={
                    /[^A-Za-z0-9]/.test(
                      formData.password
                    )
                      ? "valid"
                      : ""
                  }
                >
                  <b>✓</b>
                  Special character
                </span>

              </div>

            </div>

            {/* ==================================================
                REGISTER BUTTON
            ================================================== */}

            <button
              type="submit"
              className="register-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="register-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <span>
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              LOGIN LINK
          ================================================== */}

          <div className="register-login-link">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Sign in
            </button>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="register-footer">

            Secure Hospital Management System

            <span>
              •
            </span>

            © {new Date().getFullYear()}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;