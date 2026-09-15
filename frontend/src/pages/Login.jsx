import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(username, password);

      switch (userData.role) {
        case "ADMIN":
          navigate("/admin");
          break;

        case "DOCTOR":
          navigate("/doctor");
          break;

        case "PATIENT":
          navigate("/patient");
          break;

        case "RECEPTIONIST":
          navigate("/receptionist");
          break;

        default:
          setError("Unknown user role.");
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ==========================================
          LEFT IMAGE SECTION
      ========================================== */}

      <div className="login-image-section">

        <img
          src="/login-hospital.png"
          alt="Hospital Management System"
          className="login-background-image"
        />

      </div>

      {/* ==========================================
          RIGHT LOGIN SECTION
      ========================================== */}

      <div className="login-form-section">

        <div className="login-container">

          {/* Logo */}

          <div className="login-logo">

            <div className="login-logo-icon">
              ✚
            </div>

            <div>
              <strong>
                Hospital Management
              </strong>

              <span>
                System
              </span>
            </div>

          </div>

          {/* Heading */}

          <div className="login-heading">

            <span className="login-welcome">
              WELCOME BACK
            </span>

            <h1>
              Sign in to your account
            </h1>

            <p>
              Enter your credentials to
              access the hospital portal.
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="login-error">

              <span className="login-error-icon">
                !
              </span>

              <div>
                <strong>
                  Login failed
                </strong>

                <p>
                  {error}
                </p>
              </div>

            </div>
          )}

          {/* Form */}

          <form onSubmit={handleSubmit}>

            {/* Username */}

            <div className="login-input-group">

              <label htmlFor="username">
                Username
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  ◉
                </span>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />

              </div>

            </div>

            {/* Password */}

            <div className="login-input-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  ◆
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {/* Login Button */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="login-button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* Register */}

          <div className="login-register">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Create an account
            </button>

          </div>

          {/* Footer */}

          <div className="login-footer">
            Secure Hospital Management System
            <span>•</span>
            © {new Date().getFullYear()}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;