import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminLaboratory.css";

function AdminLaboratory() {
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // EDITING STATES
  // ==========================================

  const [editingTest, setEditingTest] =
    useState(null);

  const [editingResult, setEditingResult] =
    useState(null);

  const [testFormData, setTestFormData] =
    useState({
      test_name: "",
      test_type: "",
      status: "",
      test_date: "",
      notes: "",
    });

  const [resultFormData, setResultFormData] =
    useState({
      result: "",
      normal_range: "",
      remarks: "",
      result_date: "",
    });

  // ==========================================
  // TEST FILTERS
  // ==========================================

  const [testSearchTerm, setTestSearchTerm] =
    useState("");

  const [testStatusFilter, setTestStatusFilter] =
    useState("");

  const [testTypeFilter, setTestTypeFilter] =
    useState("");

  const [testFromDate, setTestFromDate] =
    useState("");

  const [testToDate, setTestToDate] =
    useState("");

  // ==========================================
  // RESULT FILTERS
  // ==========================================

  const [resultSearchTerm, setResultSearchTerm] =
    useState("");

  const [resultStatusFilter, setResultStatusFilter] =
    useState("");

  const [resultFromDate, setResultFromDate] =
    useState("");

  const [resultToDate, setResultToDate] =
    useState("");

  // ==========================================
  // MESSAGES
  // ==========================================

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getData = (response) => {
    return Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];
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

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    return new Date(
      dateTime
    ).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value.includes("completed") ||
      value.includes("normal")
    ) {
      return "completed";
    }

    if (
      value.includes("progress") ||
      value.includes("pending")
    ) {
      return "progress";
    }

    if (
      value.includes("cancelled") ||
      value.includes("failed")
    ) {
      return "cancelled";
    }

    if (value.includes("requested")) {
      return "requested";
    }

    return "default";
  };

  // ==========================================
  // FETCH LABORATORY DATA
  // ==========================================

  useEffect(() => {
    fetchLaboratoryData();
  }, []);

  const fetchLaboratoryData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        testsResponse,
        resultsResponse,
      ] = await Promise.all([
        api.get("lab-tests/"),
        api.get("lab-results/"),
      ]);

      const testsData =
        getData(testsResponse);

      const resultsData =
        getData(resultsResponse);

      // Latest tests first
      const sortedTests = [
        ...testsData,
      ].sort((a, b) => {
        if (
          a.test_date &&
          b.test_date
        ) {
          return (
            new Date(b.test_date) -
            new Date(a.test_date)
          );
        }

        return b.id - a.id;
      });

      // Latest results first
      const sortedResults = [
        ...resultsData,
      ].sort((a, b) => {
        const dateA =
          a.result_date ||
          a.test_date ||
          a.created_at ||
          "";

        const dateB =
          b.result_date ||
          b.test_date ||
          b.created_at ||
          "";

        if (dateA && dateB) {
          return (
            new Date(dateB) -
            new Date(dateA)
          );
        }

        return b.id - a.id;
      });

      setLabTests(sortedTests);
      setLabResults(sortedResults);
    } catch (err) {
      console.error(
        "Laboratory error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load laboratory data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DYNAMIC FILTER OPTIONS
  // ==========================================

  const testStatuses = useMemo(
    () => [
      ...new Set(
        labTests
          .map((test) => test.status)
          .filter(Boolean)
      ),
    ],
    [labTests]
  );

  const testTypes = useMemo(
    () => [
      ...new Set(
        labTests
          .map(
            (test) => test.test_type
          )
          .filter(Boolean)
      ),
    ],
    [labTests]
  );

  const resultStatuses = useMemo(
    () => [
      ...new Set(
        labResults
          .map(
            (result) =>
              result.lab_test_status
          )
          .filter(Boolean)
      ),
    ],
    [labResults]
  );

  // ==========================================
  // FILTER LAB TESTS
  // ==========================================

  const filteredLabTests = useMemo(() => {
    const search =
      testSearchTerm
        .trim()
        .toLowerCase();

    return labTests.filter((test) => {
      const searchableValues = [
        test.lab_test_id,
        test.patient_id,
        test.patient_name,
        test.doctor_id,
        test.doctor_name,
        test.test_name,
        test.test_type,
        test.notes,
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
        !testStatusFilter ||
        String(test.status || "") ===
          testStatusFilter;

      const matchesType =
        !testTypeFilter ||
        String(
          test.test_type || ""
        ) === testTypeFilter;

      const testDate =
        test.test_date || "";

      const matchesFromDate =
        !testFromDate ||
        (testDate &&
          testDate >=
            testFromDate);

      const matchesToDate =
        !testToDate ||
        (testDate &&
          testDate <=
            testToDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    labTests,
    testSearchTerm,
    testStatusFilter,
    testTypeFilter,
    testFromDate,
    testToDate,
  ]);

  // ==========================================
  // FILTER LAB RESULTS
  // ==========================================

  const filteredLabResults = useMemo(() => {
    const search =
      resultSearchTerm
        .trim()
        .toLowerCase();

    return labResults.filter(
      (result) => {
        const searchableValues = [
          result.lab_result_id,
          result.lab_test_id,
          result.patient_id,
          result.patient_name,
          result.doctor_id,
          result.doctor_name,
          result.lab_test_name,
          result.result,
          result.normal_range,
          result.remarks,
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
          !resultStatusFilter ||
          String(
            result.lab_test_status ||
              ""
          ) === resultStatusFilter;

        const resultDate =
          result.result_date ||
          result.test_date ||
          "";

        const matchesFromDate =
          !resultFromDate ||
          (resultDate &&
            resultDate >=
              resultFromDate);

        const matchesToDate =
          !resultToDate ||
          (resultDate &&
            resultDate <=
              resultToDate);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );
  }, [
    labResults,
    resultSearchTerm,
    resultStatusFilter,
    resultFromDate,
    resultToDate,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const completedTests =
      labTests.filter(
        (test) =>
          String(
            test.status || ""
          ).toLowerCase() ===
          "completed"
      ).length;

    const inProgressTests =
      labTests.filter((test) =>
        String(
          test.status || ""
        )
          .toLowerCase()
          .includes("progress")
      ).length;

    const completedResults =
      labResults.filter(
        (result) =>
          String(
            result.lab_test_status ||
              ""
          ).toLowerCase() ===
          "completed"
      ).length;

    return {
      tests: labTests.length,
      results: labResults.length,
      completedTests,
      inProgressTests,
      completedResults,
    };
  }, [labTests, labResults]);

  // ==========================================
  // TEST EDIT
  // ==========================================

  const handleEditTest = (test) => {
    setEditingTest(test);

    setTestFormData({
      test_name:
        test.test_name || "",
      test_type:
        test.test_type || "",
      status:
        test.status || "",
      test_date:
        test.test_date || "",
      notes:
        test.notes || "",
    });

    setEditingResult(null);
    setFormError("");
    setSuccessMessage("");

    setTimeout(() => {
      document
        .querySelector(
          ".admin-laboratory-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // TEST FORM CHANGE
  // ==========================================

  const handleTestChange = (event) => {
    setTestFormData(
      (previous) => ({
        ...previous,
        [event.target.name]:
          event.target.value,
      })
    );

    setFormError("");
  };

  // ==========================================
  // UPDATE TEST
  // ==========================================

  const handleUpdateTest = async (
    event
  ) => {
    event.preventDefault();

    if (!editingTest) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.patch(
        `lab-tests/${editingTest.id}/`,
        testFormData
      );

      setLabTests(
        (previousTests) =>
          previousTests
            .map((test) =>
              test.id ===
              editingTest.id
                ? response.data
                : test
            )
            .sort((a, b) => {
              if (
                a.test_date &&
                b.test_date
              ) {
                return (
                  new Date(
                    b.test_date
                  ) -
                  new Date(
                    a.test_date
                  )
                );
              }

              return b.id - a.id;
            })
      );

      setEditingTest(null);

      setSuccessMessage(
        "Lab test updated successfully."
      );
    } catch (err) {
      console.error(
        "Update lab test error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update lab test."
        )
      );
    }
  };

  // ==========================================
  // RESULT EDIT
  // ==========================================

  const handleEditResult = (result) => {
    setEditingResult(result);

    setResultFormData({
      result:
        result.result || "",
      normal_range:
        result.normal_range ||
        "",
      remarks:
        result.remarks || "",
      result_date:
        result.result_date ||
        "",
    });

    setEditingTest(null);
    setFormError("");
    setSuccessMessage("");

    setTimeout(() => {
      document
        .querySelector(
          ".admin-laboratory-edit-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // ==========================================
  // RESULT FORM CHANGE
  // ==========================================

  const handleResultChange = (
    event
  ) => {
    setResultFormData(
      (previous) => ({
        ...previous,
        [event.target.name]:
          event.target.value,
      })
    );

    setFormError("");
  };

  // ==========================================
  // UPDATE RESULT
  // ==========================================

  const handleUpdateResult = async (
    event
  ) => {
    event.preventDefault();

    if (!editingResult) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    try {
      const response = await api.patch(
        `lab-results/${editingResult.id}/`,
        resultFormData
      );

      setLabResults(
        (previousResults) =>
          previousResults
            .map((result) =>
              result.id ===
              editingResult.id
                ? response.data
                : result
            )
            .sort((a, b) => {
              const dateA =
                a.result_date ||
                a.test_date ||
                a.created_at ||
                "";

              const dateB =
                b.result_date ||
                b.test_date ||
                b.created_at ||
                "";

              if (dateA && dateB) {
                return (
                  new Date(dateB) -
                  new Date(dateA)
                );
              }

              return b.id - a.id;
            })
      );

      setEditingResult(null);

      setSuccessMessage(
        "Lab result updated successfully."
      );
    } catch (err) {
      console.error(
        "Update lab result error:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Unable to update lab result."
        )
      );
    }
  };

  // ==========================================
  // CLEAR TEST FILTERS
  // ==========================================

  const clearTestFilters = () => {
    setTestSearchTerm("");
    setTestStatusFilter("");
    setTestTypeFilter("");
    setTestFromDate("");
    setTestToDate("");
  };

  // ==========================================
  // CLEAR RESULT FILTERS
  // ==========================================

  const clearResultFilters = () => {
    setResultSearchTerm("");
    setResultStatusFilter("");
    setResultFromDate("");
    setResultToDate("");
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const cancelEdit = () => {
    setEditingTest(null);
    setEditingResult(null);
    setFormError("");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="admin-laboratory-page">
        <div className="admin-laboratory-state">

          <div className="admin-laboratory-spinner" />

          <p>
            Loading laboratory data...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="admin-laboratory-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="admin-laboratory-header">

        <div>

          <p className="admin-laboratory-eyebrow">
            DIAGNOSTIC MANAGEMENT
          </p>

          <h1>
            Laboratory
          </h1>

          <p>
            Review and manage laboratory
            tests and diagnostic results.
          </p>

        </div>

        <div className="admin-laboratory-header-count">

          <span>
            LAB ACTIVITY
          </span>

          <strong>
            {labTests.length +
              labResults.length}
          </strong>

          <small>
            Tests & results
          </small>

        </div>

      </div>

      {/* ======================================
          ERROR
          ====================================== */}

      {error && (
        <div className="admin-laboratory-error">

          <span>!</span>

          {error}

        </div>
      )}

      {/* ======================================
          SUCCESS
          ====================================== */}

      {successMessage && (
        <div className="admin-laboratory-success">

          <span>✓</span>

          {successMessage}

        </div>
      )}

      {/* ======================================
          SUMMARY
          ====================================== */}

      <div className="admin-laboratory-summary-grid">

        <div className="admin-laboratory-summary-card">

          <div className="admin-laboratory-summary-icon">
            LT
          </div>

          <div>

            <span>
              Lab Tests
            </span>

            <strong>
              {summary.tests}
            </strong>

            <small>
              Total requested tests
            </small>

          </div>

        </div>

        <div className="admin-laboratory-summary-card">

          <div className="admin-laboratory-summary-icon">
            LR
          </div>

          <div>

            <span>
              Lab Results
            </span>

            <strong>
              {summary.results}
            </strong>

            <small>
              Recorded results
            </small>

          </div>

        </div>

        <div className="admin-laboratory-summary-card">

          <div className="admin-laboratory-summary-icon">
            ✓
          </div>

          <div>

            <span>
              Completed Tests
            </span>

            <strong>
              {summary.completedTests}
            </strong>

            <small>
              Completed laboratory tests
            </small>

          </div>

        </div>

        <div className="admin-laboratory-summary-card">

          <div className="admin-laboratory-summary-icon">
            IP
          </div>

          <div>

            <span>
              In Progress
            </span>

            <strong>
              {summary.inProgressTests}
            </strong>

            <small>
              Tests currently processing
            </small>

          </div>

        </div>

      </div>

      {/* ======================================
          EDIT TEST / RESULT
          ====================================== */}

      {(editingTest ||
        editingResult) && (
        <div className="admin-laboratory-edit-card">

          <div className="admin-laboratory-edit-header">

            <div>

              <p>
                UPDATE RECORD
              </p>

              <h2>
                {editingTest
                  ? "Edit Lab Test"
                  : "Edit Lab Result"}
              </h2>

              <small>
                {editingTest
                  ? editingTest.lab_test_id
                  : editingResult?.lab_result_id}
              </small>

            </div>

            <button
              type="button"
              className="admin-laboratory-close-btn"
              onClick={cancelEdit}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="admin-laboratory-form-error">

              <span>!</span>

              {formError}

            </div>
          )}

          {/* ==================================
              EDIT TEST
              ================================== */}

          {editingTest && (
            <form
              onSubmit={
                handleUpdateTest
              }
              className="admin-laboratory-edit-form"
            >

              <div className="admin-laboratory-info-grid">

                <div className="admin-laboratory-info-box">

                  <span>
                    Patient
                  </span>

                  <strong>
                    {
                      editingTest.patient_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {
                      editingTest.patient_name ||
                      "-"
                    }
                  </small>

                </div>

                <div className="admin-laboratory-info-box">

                  <span>
                    Doctor
                  </span>

                  <strong>
                    {
                      editingTest.doctor_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {
                      editingTest.doctor_name ||
                      "-"
                    }
                  </small>

                </div>

                <div className="admin-laboratory-info-box">

                  <span>
                    Test ID
                  </span>

                  <strong>
                    {
                      editingTest.lab_test_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {formatDate(
                      editingTest.test_date
                    )}
                  </small>

                </div>

              </div>

              <div className="admin-laboratory-section-title">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Test Information
                  </h3>

                  <p>
                    Update laboratory test
                    details and status.
                  </p>

                </div>

              </div>

              <div className="admin-laboratory-edit-grid">

                <div className="admin-laboratory-form-group">

                  <label>
                    Test Name
                  </label>

                  <input
                    type="text"
                    name="test_name"
                    value={
                      testFormData.test_name
                    }
                    onChange={
                      handleTestChange
                    }
                    required
                  />

                </div>

                <div className="admin-laboratory-form-group">

                  <label>
                    Test Type
                  </label>

                  <input
                    type="text"
                    name="test_type"
                    value={
                      testFormData.test_type
                    }
                    onChange={
                      handleTestChange
                    }
                    required
                  />

                </div>

                <div className="admin-laboratory-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      testFormData.status
                    }
                    onChange={
                      handleTestChange
                    }
                  >

                    {testStatuses.length >
                    0 ? (
                      testStatuses.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )
                    ) : (
                      <>
                        <option value="REQUESTED">
                          REQUESTED
                        </option>

                        <option value="IN_PROGRESS">
                          IN_PROGRESS
                        </option>

                        <option value="COMPLETED">
                          COMPLETED
                        </option>

                        <option value="CANCELLED">
                          CANCELLED
                        </option>
                      </>
                    )}

                  </select>

                </div>

                <div className="admin-laboratory-form-group">

                  <label>
                    Test Date
                  </label>

                  <input
                    type="date"
                    name="test_date"
                    value={
                      testFormData.test_date ||
                      ""
                    }
                    onChange={
                      handleTestChange
                    }
                  />

                </div>

              </div>

              <div className="admin-laboratory-form-group full">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    testFormData.notes
                  }
                  onChange={
                    handleTestChange
                  }
                  placeholder="Additional laboratory notes..."
                  rows="4"
                />

              </div>

              <div className="admin-laboratory-edit-actions">

                <button
                  type="button"
                  className="admin-laboratory-cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-laboratory-save-btn"
                >
                  Update Lab Test
                </button>

              </div>

            </form>
          )}

          {/* ==================================
              EDIT RESULT
              ================================== */}

          {editingResult && (
            <form
              onSubmit={
                handleUpdateResult
              }
              className="admin-laboratory-edit-form"
            >

              <div className="admin-laboratory-info-grid">

                <div className="admin-laboratory-info-box">

                  <span>
                    Patient
                  </span>

                  <strong>
                    {
                      editingResult.patient_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {
                      editingResult.patient_name ||
                      "-"
                    }
                  </small>

                </div>

                <div className="admin-laboratory-info-box">

                  <span>
                    Doctor
                  </span>

                  <strong>
                    {
                      editingResult.doctor_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {
                      editingResult.doctor_name ||
                      "-"
                    }
                  </small>

                </div>

                <div className="admin-laboratory-info-box">

                  <span>
                    Lab Test
                  </span>

                  <strong>
                    {
                      editingResult.lab_test_id ||
                      "-"
                    }
                  </strong>

                  <small>
                    {
                      editingResult.lab_test_name ||
                      "-"
                    }
                  </small>

                </div>

              </div>

              <div className="admin-laboratory-section-title">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Diagnostic Result
                  </h3>

                  <p>
                    Update the laboratory
                    result information.
                  </p>

                </div>

              </div>

              <div className="admin-laboratory-edit-grid">

                <div className="admin-laboratory-form-group">

                  <label>
                    Result
                  </label>

                  <input
                    type="text"
                    name="result"
                    value={
                      resultFormData.result
                    }
                    onChange={
                      handleResultChange
                    }
                    required
                  />

                </div>

                <div className="admin-laboratory-form-group">

                  <label>
                    Normal Range
                  </label>

                  <input
                    type="text"
                    name="normal_range"
                    value={
                      resultFormData.normal_range
                    }
                    onChange={
                      handleResultChange
                    }
                    placeholder="Enter normal range"
                  />

                </div>

                <div className="admin-laboratory-form-group">

                  <label>
                    Result Date
                  </label>

                  <input
                    type="date"
                    name="result_date"
                    value={
                      resultFormData.result_date ||
                      ""
                    }
                    onChange={
                      handleResultChange
                    }
                  />

                </div>

              </div>

              <div className="admin-laboratory-form-group full">

                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={
                    resultFormData.remarks
                  }
                  onChange={
                    handleResultChange
                  }
                  placeholder="Additional diagnostic remarks..."
                  rows="4"
                />

              </div>

              <div className="admin-laboratory-edit-actions">

                <button
                  type="button"
                  className="admin-laboratory-cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-laboratory-save-btn"
                >
                  Update Lab Result
                </button>

              </div>

            </form>
          )}

        </div>
      )}

      {/* ======================================
          LAB TESTS SECTION
          ====================================== */}

      <div className="admin-laboratory-section">

        <div className="admin-laboratory-section-header">

          <div>

            <p>
              LABORATORY ORDERS
            </p>

            <h2>
              Lab Tests
            </h2>

            <span>
              {filteredLabTests.length} of{" "}
              {labTests.length} tests
            </span>

          </div>

          <div className="admin-laboratory-section-badge">
            {labTests.length}
          </div>

        </div>

        {/* TEST FILTERS */}

        <div className="admin-laboratory-filter-card">

          <div className="admin-laboratory-filter-grid">

            <div className="admin-laboratory-filter-group search">

              <label>
                Search Tests
              </label>

              <div className="admin-laboratory-search-box">

                <span>⌕</span>

                <input
                  type="text"
                  value={testSearchTerm}
                  onChange={(event) =>
                    setTestSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Test ID, patient, doctor, test name..."
                />

              </div>

            </div>

            <div className="admin-laboratory-filter-group">

              <label>
                Status
              </label>

              <select
                value={
                  testStatusFilter
                }
                onChange={(event) =>
                  setTestStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                {testStatuses.map(
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

            <div className="admin-laboratory-filter-group">

              <label>
                Test Type
              </label>

              <select
                value={
                  testTypeFilter
                }
                onChange={(event) =>
                  setTestTypeFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Test Types
                </option>

                {testTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="admin-laboratory-filter-group">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={
                  testFromDate
                }
                onChange={(event) =>
                  setTestFromDate(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="admin-laboratory-filter-group">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={
                  testToDate
                }
                min={
                  testFromDate ||
                  undefined
                }
                onChange={(event) =>
                  setTestToDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="admin-laboratory-filter-footer">

            <span>
              Showing{" "}
              <strong>
                {filteredLabTests.length}
              </strong>{" "}
              of{" "}
              <strong>
                {labTests.length}
              </strong>{" "}
              lab tests
            </span>

            <button
              type="button"
              onClick={
                clearTestFilters
              }
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* TEST TABLE */}

        {labTests.length === 0 ? (
          <div className="admin-laboratory-empty">

            <div className="admin-laboratory-empty-icon">
              LT
            </div>

            <h3>
              No lab tests found
            </h3>

            <p>
              Laboratory tests will appear
              here once created.
            </p>

          </div>
        ) : filteredLabTests.length ===
          0 ? (
          <div className="admin-laboratory-empty">

            <div className="admin-laboratory-empty-icon">
              ⌕
            </div>

            <h3>
              No matching lab tests
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              className="admin-laboratory-clear-btn"
              onClick={
                clearTestFilters
              }
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-laboratory-table-wrapper">

            <table className="admin-laboratory-table">

              <thead>

                <tr>

                  <th>
                    Test ID
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Test Name
                  </th>

                  <th>
                    Test Type
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Test Date
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

                {filteredLabTests.map(
                  (test) => (
                    <tr
                      key={test.id}
                    >

                      <td>

                        <div className="admin-laboratory-id">

                          <strong>
                            {
                              test.lab_test_id ||
                              "-"
                            }
                          </strong>

                          <small>
                            ID #{test.id}
                          </small>

                        </div>

                      </td>

                      <td>

                        <div className="admin-laboratory-person">

                          <div className="admin-laboratory-avatar">
                            {getInitial(
                              test.patient_name
                            )}
                          </div>

                          <div>

                            <strong>
                              {
                                test.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                test.patient_id ||
                                "-"
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="admin-laboratory-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              test.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              test.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <span className="admin-laboratory-test-name">
                          {
                            test.test_name ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-type">
                          {
                            test.test_type ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <span
                          className={`admin-laboratory-status ${getStatusClass(
                            test.status
                          )}`}
                        >
                          {
                            test.status ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-date">
                          {formatDate(
                            test.test_date
                          )}
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-notes">
                          {
                            test.notes ||
                            "—"
                          }
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="admin-laboratory-edit-btn"
                          onClick={() =>
                            handleEditTest(
                              test
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

      {/* ======================================
          LAB RESULTS SECTION
          ====================================== */}

      <div className="admin-laboratory-section results-section">

        <div className="admin-laboratory-section-header">

          <div>

            <p>
              DIAGNOSTIC REPORTS
            </p>

            <h2>
              Lab Results
            </h2>

            <span>
              {filteredLabResults.length} of{" "}
              {labResults.length} results
            </span>

          </div>

          <div className="admin-laboratory-section-badge">
            {labResults.length}
          </div>

        </div>

        {/* RESULT FILTERS */}

        <div className="admin-laboratory-filter-card">

          <div className="admin-laboratory-result-filter-grid">

            <div className="admin-laboratory-filter-group search">

              <label>
                Search Results
              </label>

              <div className="admin-laboratory-search-box">

                <span>⌕</span>

                <input
                  type="text"
                  value={
                    resultSearchTerm
                  }
                  onChange={(event) =>
                    setResultSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Result ID, test, patient, doctor, result..."
                />

              </div>

            </div>

            <div className="admin-laboratory-filter-group">

              <label>
                Test Status
              </label>

              <select
                value={
                  resultStatusFilter
                }
                onChange={(event) =>
                  setResultStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                {resultStatuses.map(
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

            <div className="admin-laboratory-filter-group">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={
                  resultFromDate
                }
                onChange={(event) =>
                  setResultFromDate(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="admin-laboratory-filter-group">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={
                  resultToDate
                }
                min={
                  resultFromDate ||
                  undefined
                }
                onChange={(event) =>
                  setResultToDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="admin-laboratory-filter-footer">

            <span>
              Showing{" "}
              <strong>
                {filteredLabResults.length}
              </strong>{" "}
              of{" "}
              <strong>
                {labResults.length}
              </strong>{" "}
              lab results
            </span>

            <button
              type="button"
              onClick={
                clearResultFilters
              }
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* RESULT TABLE */}

        {labResults.length === 0 ? (
          <div className="admin-laboratory-empty">

            <div className="admin-laboratory-empty-icon">
              LR
            </div>

            <h3>
              No lab results found
            </h3>

            <p>
              Laboratory results will
              appear here once recorded.
            </p>

          </div>
        ) : filteredLabResults.length ===
          0 ? (
          <div className="admin-laboratory-empty">

            <div className="admin-laboratory-empty-icon">
              ⌕
            </div>

            <h3>
              No matching lab results
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              className="admin-laboratory-clear-btn"
              onClick={
                clearResultFilters
              }
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="admin-laboratory-table-wrapper">

            <table className="admin-laboratory-table results-table">

              <thead>

                <tr>

                  <th>
                    Result ID
                  </th>

                  <th>
                    Patient
                  </th>

                  <th>
                    Doctor
                  </th>

                  <th>
                    Lab Test
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Result
                  </th>

                  <th>
                    Normal Range
                  </th>

                  <th>
                    Remarks
                  </th>

                  <th>
                    Result Date
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLabResults.map(
                  (result) => (
                    <tr
                      key={result.id}
                    >

                      <td>

                        <div className="admin-laboratory-id">

                          <strong>
                            {
                              result.lab_result_id ||
                              "-"
                            }
                          </strong>

                          <small>
                            ID #{result.id}
                          </small>

                        </div>

                      </td>

                      <td>

                        <div className="admin-laboratory-person">

                          <div className="admin-laboratory-avatar">
                            {getInitial(
                              result.patient_name
                            )}
                          </div>

                          <div>

                            <strong>
                              {
                                result.patient_name ||
                                "-"
                              }
                            </strong>

                            <span>
                              {
                                result.patient_id ||
                                "-"
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="admin-laboratory-doctor">

                          <strong>
                            Dr.{" "}
                            {
                              result.doctor_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              result.doctor_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="admin-laboratory-result-test">

                          <strong>
                            {
                              result.lab_test_name ||
                              "-"
                            }
                          </strong>

                          <span>
                            {
                              result.lab_test_id ||
                              "-"
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <span
                          className={`admin-laboratory-status ${getStatusClass(
                            result.lab_test_status
                          )}`}
                        >
                          {
                            result.lab_test_status ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-result-value">
                          {
                            result.result ||
                            "-"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-range">
                          {
                            result.normal_range ||
                            "—"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-notes">
                          {
                            result.remarks ||
                            "—"
                          }
                        </span>

                      </td>

                      <td>

                        <span className="admin-laboratory-date">
                          {formatDate(
                            result.result_date ||
                              result.test_date
                          )}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="admin-laboratory-edit-btn"
                          onClick={() =>
                            handleEditResult(
                              result
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

export default AdminLaboratory;