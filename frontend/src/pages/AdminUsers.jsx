import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AdminUsers.css";

function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const emptyForm = {
    username: "",
    email: "",
    mobile_number: "",
    aadhaar_number: "",
    first_name: "",
    last_name: "",
    password: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("admin/users/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setUsers(data);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (err, fallback) => {
    if (!err.response?.data) {
      return fallback;
    }

    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.error) {
      return data.error;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(", ")
            : messages;

          return `${field}: ${text}`;
        })
        .join(" | ");
    }

    return fallback;
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        if (search) {
          const values = [
            user.id,
            user.username,
            user.first_name,
            user.last_name,
            `${user.first_name || ""} ${
              user.last_name || ""
            }`,
            user.email,
            user.mobile_number,
            user.aadhaar_number,
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
          roleFilter &&
          String(user.role || "") !== roleFilter
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(b.id) - Number(a.id)
      );
  }, [users, searchTerm, roleFilter]);

  const roleCounts = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(
        (user) => user.role === "ADMIN"
      ).length,
      doctors: users.filter(
        (user) => user.role === "DOCTOR"
      ).length,
      patients: users.filter(
        (user) => user.role === "PATIENT"
      ).length,
      receptionists: users.filter(
        (user) => user.role === "RECEPTIONIST"
      ).length,
    };
  }, [users]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
  };

  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      username: user.username || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      aadhaar_number: user.aadhaar_number || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
    });

    setMessage("");
    setError("");

    setTimeout(() => {
      document
        .querySelector(".admin-users-form-card")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const updateData = {
        username: formData.username,
        email: formData.email || null,
        mobile_number:
          formData.mobile_number || null,
        aadhaar_number:
          formData.aadhaar_number.trim() || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      if (formData.password.trim() !== "") {
        updateData.password = formData.password;
      }

      const response = await api.put(
        `admin/users/${editingUser.id}/`,
        updateData
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === editingUser.id
            ? response.data
            : user
        )
      );

      setMessage(
        "User details updated successfully."
      );

      setError("");
      setEditingUser(null);
      setFormData({ ...emptyForm });
    } catch (err) {
      console.error(
        "Error updating user:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to update user."
        )
      );

      setMessage("");
    }
  };

  const handleDelete = async (user) => {
    if (currentUser?.id === user.id) {
      setError(
        "You cannot delete your own administrator account."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.delete(
        `admin/users/${user.id}/`
      );

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) => item.id !== user.id
        )
      );

      setMessage(
        `User "${user.username}" deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Error deleting user:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to delete user."
        )
      );
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setError("");
    setMessage("");
    setFormData({ ...emptyForm });
  };

  const getRoleClass = (role) => {
    switch (role) {
      case "ADMIN":
        return "admin-users-role admin";
      case "DOCTOR":
        return "admin-users-role doctor";
      case "PATIENT":
        return "admin-users-role patient";
      case "RECEPTIONIST":
        return "admin-users-role receptionist";
      default:
        return "admin-users-role";
    }
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-state">
          <div className="admin-users-spinner" />
          <p>Loading user accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">

      {/* HEADER */}

      <div className="admin-users-header">

        <div>
          <p className="admin-users-eyebrow">
            SYSTEM ADMINISTRATION
          </p>

          <h1>User Management</h1>

          <p>
            Manage hospital user accounts,
            profiles and access roles.
          </p>
        </div>

        <div className="admin-users-system-badge">
          <span />
          Account Directory
        </div>

      </div>

      {/* MESSAGES */}

      {message && (
        <div className="admin-users-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="admin-users-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="admin-users-summary-grid">

        <div className="admin-users-summary-card">

          <div className="admin-users-summary-icon">
            U
          </div>

          <div>
            <span>Total Users</span>
            <strong>{roleCounts.total}</strong>
            <small>Registered accounts</small>
          </div>

        </div>

        <div className="admin-users-summary-card">

          <div className="admin-users-summary-icon">
            A
          </div>

          <div>
            <span>Administrators</span>
            <strong>{roleCounts.admins}</strong>
            <small>Admin accounts</small>
          </div>

        </div>

        <div className="admin-users-summary-card">

          <div className="admin-users-summary-icon">
            D
          </div>

          <div>
            <span>Doctors</span>
            <strong>{roleCounts.doctors}</strong>
            <small>Doctor accounts</small>
          </div>

        </div>

        <div className="admin-users-summary-card">

          <div className="admin-users-summary-icon">
            P
          </div>

          <div>
            <span>Patients</span>
            <strong>{roleCounts.patients}</strong>
            <small>Patient accounts</small>
          </div>

        </div>

        <div className="admin-users-summary-card">

          <div className="admin-users-summary-icon">
            R
          </div>

          <div>
            <span>Receptionists</span>
            <strong>
              {roleCounts.receptionists}
            </strong>
            <small>Receptionist accounts</small>
          </div>

        </div>

      </div>

      {/* EDIT FORM */}

      {editingUser && (
        <div className="admin-users-form-card">

          <div className="admin-users-form-header">

            <div>
              <p>ACCOUNT PROFILE</p>
              <h2>Edit User</h2>
            </div>

            <button
              type="button"
              className="admin-users-close-btn"
              onClick={handleCancel}
            >
              ×
            </button>

          </div>

          <form onSubmit={handleUpdate}>

            <div className="admin-users-form-section">

              <div className="admin-users-section-title">
                <span>01</span>

                <div>
                  <h3>Account Information</h3>
                  <p>
                    Login credentials and contact
                    information
                  </p>
                </div>
              </div>

              <div className="admin-users-form-grid">

                <div className="admin-users-form-group">
                  <label>Username *</label>

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="admin-users-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="admin-users-form-group">
                  <label>Mobile Number</label>

                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-users-form-group">
                  <label>Aadhaar Number</label>

                  <input
                    type="text"
                    name="aadhaar_number"
                    value={formData.aadhaar_number}
                    onChange={handleChange}
                    maxLength="12"
                  />
                </div>

              </div>

            </div>

            <div className="admin-users-form-section">

              <div className="admin-users-section-title">
                <span>02</span>

                <div>
                  <h3>Personal Information</h3>
                  <p>
                    Basic profile information
                  </p>
                </div>
              </div>

              <div className="admin-users-form-grid">

                <div className="admin-users-form-group">
                  <label>First Name</label>

                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-users-form-group">
                  <label>Last Name</label>

                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>

              </div>

            </div>

            <div className="admin-users-form-section">

              <div className="admin-users-section-title">
                <span>03</span>

                <div>
                  <h3>Security</h3>
                  <p>
                    Update the user's password
                  </p>
                </div>
              </div>

              <div className="admin-users-form-grid">

                <div className="admin-users-form-group full">
                  <label>New Password</label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="8"
                    placeholder="Leave blank to keep current password"
                  />

                  <small>
                    Minimum 8 characters. Leave
                    blank if the password should
                    remain unchanged.
                  </small>
                </div>

              </div>

            </div>

            <div className="admin-users-form-actions">

              <button
                type="button"
                className="admin-users-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-users-save-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>
      )}

      {/* SEARCH */}

      <div className="admin-users-search-card">

        <div className="admin-users-search-header">

          <div>
            <p>USER DIRECTORY</p>
            <h2>Search & Filter Users</h2>
          </div>

          {(searchTerm || roleFilter) && (
            <button
              className="admin-users-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>

        <div className="admin-users-search-box">

          <span>⌕</span>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search ID, username, name, email, mobile or Aadhaar..."
          />

        </div>

        <div className="admin-users-filter-row">

          <div className="admin-users-filter-group">

            <label>Role</label>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
            >

              <option value="">
                All Roles
              </option>

              <option value="ADMIN">
                Admin
              </option>

              <option value="DOCTOR">
                Doctor
              </option>

              <option value="PATIENT">
                Patient
              </option>

              <option value="RECEPTIONIST">
                Receptionist
              </option>

            </select>

          </div>

        </div>

        <div className="admin-users-result-info">
          Showing{" "}
          <strong>{filteredUsers.length}</strong>{" "}
          of <strong>{users.length}</strong> users
        </div>

      </div>

      {/* USER TABLE */}

      <div className="admin-users-table-card">

        <div className="admin-users-table-header">

          <div>
            <p>ACCOUNT DIRECTORY</p>
            <h2>Hospital Users</h2>
          </div>

          <span>
            {filteredUsers.length} records
          </span>

        </div>

        {users.length === 0 ? (
          <div className="admin-users-empty">

            <div className="admin-users-empty-icon">
              U
            </div>

            <h3>No users found</h3>

            <p>
              There are currently no user accounts
              available.
            </p>

          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-users-empty">

            <div className="admin-users-empty-icon">
              ⌕
            </div>

            <h3>No matching users</h3>

            <p>
              Try changing your search or role
              filter.
            </p>

            <button
              className="admin-users-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-users-table-wrapper">

            <table className="admin-users-table">

              <thead>

                <tr>
                  <th>User</th>
                  <th>ID</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((user) => {

                  const fullName =
                    `${user.first_name || ""} ${
                      user.last_name || ""
                    }`.trim();

                  const displayName =
                    fullName ||
                    user.username ||
                    "User";

                  const initials =
                    displayName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(
                        (name) => name[0]
                      )
                      .join("")
                      .toUpperCase();

                  const isCurrentUser =
                    currentUser?.id === user.id;

                  return (
                    <tr key={user.id}>

                      <td>
                        <div className="admin-users-person">

                          <div className="admin-users-avatar">
                            {initials || "U"}
                          </div>

                          <div>
                            <strong>
                              {displayName}
                            </strong>

                            <span>
                              @{user.username || "-"}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="admin-users-id">
                          #{user.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-users-contact">

                          <span>
                            {user.email || "-"}
                          </span>

                          <small>
                            {user.mobile_number ||
                              "No mobile number"}
                          </small>

                        </div>
                      </td>

                      <td>
                        <span
                          className={getRoleClass(
                            user.role
                          )}
                        >
                          <i />
                          {user.role || "UNKNOWN"}
                        </span>
                      </td>

                      <td>

                        {isCurrentUser ? (
                          <span className="admin-users-account current">
                            <i />
                            Current account
                          </span>
                        ) : (
                          <span className="admin-users-account">
                            <i />
                            Active
                          </span>
                        )}

                      </td>

                      <td>

                        <div className="admin-users-actions">

                          <button
                            className="admin-users-edit-btn"
                            onClick={() =>
                              handleEdit(user)
                            }
                          >
                            Edit
                          </button>

                          {!isCurrentUser && (
                            <button
                              className="admin-users-delete-btn"
                              onClick={() =>
                                handleDelete(user)
                              }
                            >
                              Delete
                            </button>
                          )}

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

export default AdminUsers;