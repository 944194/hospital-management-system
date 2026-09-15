import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminAuditLogs.css";

function getData(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getErrorMessage(err, fallback) {
  if (err.response?.data) {
    const data = err.response.data;

    if (typeof data === "string") {
      return data;
    }

    return Object.values(data)
      .flat()
      .map((item) =>
        typeof item === "string"
          ? item
          : JSON.stringify(item)
      )
      .join(" ");
  }

  return fallback;
}

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ==========================================
   SAFE INITIALS
   ========================================== */

function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const cleanedName = name.trim();

  if (!cleanedName) {
    return "U";
  }

  const parts = cleanedName
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() || "U";
  }

  return `${parts[0][0] || ""}${
    parts[parts.length - 1][0] || ""
  }`.toUpperCase();
}

/* ==========================================
   SAFE ACTION CLASS
   ========================================== */

function getActionClass(action) {
  if (!action || typeof action !== "string") {
    return "default";
  }

  const value = action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("remove")
  ) {
    return "danger";
  }

  if (
    value.includes("create") ||
    value.includes("add")
  ) {
    return "create";
  }

  if (
    value.includes("update") ||
    value.includes("edit")
  ) {
    return "update";
  }

  if (
    value.includes("login") ||
    value.includes("logout")
  ) {
    return "auth";
  }

  return "default";
}

function AdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================
  // SEARCH / FILTERS
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");

  const [actionFilter, setActionFilter] = useState("");

  const [moduleFilter, setModuleFilter] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  // ==========================================
  // FETCH AUDIT LOGS
  // ==========================================

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("audit-logs/");

      const logs = getData(response.data);

      const sortedLogs = [...logs].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at) -
            new Date(a.created_at)
          );
        }

        return (
          Number(b.id || 0) -
          Number(a.id || 0)
        );
      });

      setAuditLogs(sortedLogs);
    } catch (err) {
      console.error("Audit logs error:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load audit logs."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const actions = useMemo(
    () =>
      [
        ...new Set(
          auditLogs
            .map((log) => log.action)
            .filter(Boolean)
        ),
      ].sort(),
    [auditLogs]
  );

  const modules = useMemo(
    () =>
      [
        ...new Set(
          auditLogs
            .map((log) => log.module)
            .filter(Boolean)
        ),
      ].sort(),
    [auditLogs]
  );

  // ==========================================
  // FILTER LOGS
  // ==========================================

  const filteredAuditLogs = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return auditLogs.filter((log) => {
      const searchableValues = [
        log.id,
        log.user_identifier,
        log.username,
        log.action,
        log.module,
        log.description,
        log.ip_address,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );

      const matchesAction =
        !actionFilter ||
        String(log.action || "") ===
          actionFilter;

      const matchesModule =
        !moduleFilter ||
        String(log.module || "") ===
          moduleFilter;

      const logDate = log.created_at
        ? new Date(log.created_at)
            .toISOString()
            .split("T")[0]
        : "";

      const matchesFromDate =
        !fromDate ||
        (logDate && logDate >= fromDate);

      const matchesToDate =
        !toDate ||
        (logDate && logDate <= toDate);

      return (
        matchesSearch &&
        matchesAction &&
        matchesModule &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    auditLogs,
    searchTerm,
    actionFilter,
    moduleFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const uniqueUsers = new Set(
      auditLogs
        .map(
          (log) =>
            log.user_identifier ||
            log.username
        )
        .filter(Boolean)
    ).size;

    const uniqueModules = new Set(
      auditLogs
        .map((log) => log.module)
        .filter(Boolean)
    ).size;

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayLogs = auditLogs.filter((log) => {
      if (!log.created_at) {
        return false;
      }

      const logDate = new Date(log.created_at);

      if (Number.isNaN(logDate.getTime())) {
        return false;
      }

      return (
        logDate
          .toISOString()
          .split("T")[0] === today
      );
    }).length;

    return {
      uniqueUsers,
      uniqueModules,
      todayLogs,
    };
  }, [auditLogs]);

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("");
    setModuleFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    searchTerm ||
    actionFilter ||
    moduleFilter ||
    fromDate ||
    toDate;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-audit-logs-page">
        <div className="admin-audit-logs-state">
          <div className="admin-audit-logs-spinner" />

          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="admin-audit-logs-page">
        <div className="admin-audit-logs-state">
          <div className="admin-audit-logs-state-icon">
            !
          </div>

          <h2>
            Unable to load audit logs
          </h2>

          <p>{error}</p>

          <button
            className="admin-audit-logs-primary-btn"
            onClick={fetchAuditLogs}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-audit-logs-page">

      {/* ========================================
          HEADER
          ======================================== */}

      <div className="admin-audit-logs-header">
        <div>
          <p className="admin-audit-logs-eyebrow">
            SYSTEM SECURITY
          </p>

          <h1>Audit Logs</h1>

          <p>
            Monitor system activities and
            user actions across the hospital
            management system.
          </p>
        </div>

        <button
          type="button"
          className="admin-audit-logs-refresh-btn"
          onClick={fetchAuditLogs}
        >
          ↻ Refresh Logs
        </button>
      </div>

      {/* ========================================
          SUMMARY
          ======================================== */}

      <div className="admin-audit-logs-summary-grid">

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            LG
          </div>

          <div>
            <span>Total Logs</span>

            <strong>
              {auditLogs.length}
            </strong>

            <small>
              Recorded activities
            </small>
          </div>
        </div>

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            US
          </div>

          <div>
            <span>Active Users</span>

            <strong>
              {summary.uniqueUsers}
            </strong>

            <small>
              Unique users recorded
            </small>
          </div>
        </div>

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            MD
          </div>

          <div>
            <span>Modules</span>

            <strong>
              {summary.uniqueModules}
            </strong>

            <small>
              System modules
            </small>
          </div>
        </div>

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            TD
          </div>

          <div>
            <span>Today's Logs</span>

            <strong>
              {summary.todayLogs}
            </strong>

            <small>
              Activities today
            </small>
          </div>
        </div>

      </div>

      {/* ========================================
          FILTER CARD
          ======================================== */}

      <div className="admin-audit-logs-filter-card">

        <div className="admin-audit-logs-filter-header">
          <div>
            <p>SEARCH & FILTER</p>

            <h2>Activity Records</h2>
          </div>

          <span>
            {filteredAuditLogs.length} shown
          </span>
        </div>

        <div className="admin-audit-logs-filter-grid">

          {/* SEARCH */}

          <div className="admin-audit-logs-filter-group search">
            <label>Search</label>

            <div className="admin-audit-logs-search-box">
              <span>⌕</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Log ID, user, username, action, module, description, IP..."
              />
            </div>
          </div>

          {/* ACTION */}

          <div className="admin-audit-logs-filter-group">
            <label>Action</label>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Actions
              </option>

              {actions.map((action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* MODULE */}

          <div className="admin-audit-logs-filter-group">
            <label>Module</label>

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Modules
              </option>

              {modules.map((module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ))}
            </select>
          </div>

          {/* FROM */}

          <div className="admin-audit-logs-filter-group">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />
          </div>

          {/* TO */}

          <div className="admin-audit-logs-filter-group">
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className="admin-audit-logs-clear-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* ========================================
          LOG TABLE
          ======================================== */}

      <div className="admin-audit-logs-table-card">

        <div className="admin-audit-logs-table-header">
          <div>
            <p>SECURITY ACTIVITY</p>

            <h2>System Audit Trail</h2>
          </div>

          <span className="admin-audit-logs-table-count">
            {filteredAuditLogs.length}
          </span>
        </div>

        {auditLogs.length === 0 ? (

          <div className="admin-audit-logs-empty">
            <div className="admin-audit-logs-empty-icon">
              LG
            </div>

            <h3>
              No audit logs found
            </h3>

            <p>
              System activities will appear
              here when they are recorded.
            </p>
          </div>

        ) : filteredAuditLogs.length === 0 ? (

          <div className="admin-audit-logs-empty">
            <div className="admin-audit-logs-empty-icon">
              ?
            </div>

            <h3>
              No matching logs
            </h3>

            <p>
              Try changing your search or
              filter criteria.
            </p>

            <button
              type="button"
              className="admin-audit-logs-clear-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

        ) : (

          <div className="admin-audit-logs-table-wrapper">

            <table className="admin-audit-logs-table">

              <thead>
                <tr>
                  <th>Log</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>Created At</th>
                </tr>
              </thead>

              <tbody>

                {filteredAuditLogs.map((log) => (

                  <tr key={log.id}>

                    {/* LOG */}

                    <td>
                      <div className="admin-audit-logs-log-cell">

                        <strong>
                          LOG-
                          {String(
                            log.id ?? "0"
                          ).padStart(5, "0")}
                        </strong>

                        <span>
                          ID {log.id ?? "—"}
                        </span>

                      </div>
                    </td>

                    {/* USER */}

                    <td>
                      <div className="admin-audit-logs-user-cell">

                        <div className="admin-audit-logs-avatar">
                          {getInitials(
                            log.username ||
                              log.user_identifier
                          )}
                        </div>

                        <div>

                          <strong>
                            {log.username ||
                              "Unknown User"}
                          </strong>

                          <span>
                            {log.user_identifier ||
                              "—"}
                          </span>

                        </div>

                      </div>
                    </td>

                    {/* ACTION */}

                    <td>
                      <span
                        className={`admin-audit-logs-action ${getActionClass(
                          log.action
                        )}`}
                      >
                        {log.action || "—"}
                      </span>
                    </td>

                    {/* MODULE */}

                    <td>
                      <span className="admin-audit-logs-module">
                        {log.module || "—"}
                      </span>
                    </td>

                    {/* DESCRIPTION */}

                    <td>
                      <div className="admin-audit-logs-description">

                        <span>
                          {log.description ||
                            "No description available"}
                        </span>

                      </div>
                    </td>

                    {/* IP */}

                    <td>
                      <code className="admin-audit-logs-ip">
                        {log.ip_address || "—"}
                      </code>
                    </td>

                    {/* DATE */}

                    <td>
                      <span className="admin-audit-logs-created">
                        {formatDateTime(
                          log.created_at
                        )}
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminAuditLogs;