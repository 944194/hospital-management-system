import { useEffect, useState } from "react";
import api from "../services/api";

function DoctorLaboratory() {
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showTestForm, setShowTestForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [editingTest, setEditingTest] = useState(null);
  const [editingResult, setEditingResult] = useState(null);

  const [testFormData, setTestFormData] = useState({
    medical_record: "",
    test_name: "",
    test_type: "",
    status: "REQUESTED",
    test_date: "",
    notes: "",
  });

  const [resultFormData, setResultFormData] = useState({
    lab_test: "",
    result: "",
    normal_range: "",
    remarks: "",
    result_date: "",
  });

  // ==========================================
  // SEARCH / FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [filteredTests, setFilteredTests] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  // ==========================================
  // GET ARRAY DATA
  // ==========================================

  const getData = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    return [];
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    try {
      setError("");

      const [
        testsResponse,
        resultsResponse,
        recordsResponse,
      ] = await Promise.all([
        api.get("lab-tests/"),
        api.get("lab-results/"),
        api.get("medical-records/"),
      ]);

      const testData = getData(testsResponse);
      const resultData = getData(resultsResponse);
      const recordData = getData(recordsResponse);

      const sortedTests = [...testData].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );

      const sortedResults = [...resultData].sort(
        (a, b) => Number(b.id) - Number(a.id)
      );

      setLabTests(sortedTests);
      setLabResults(sortedResults);
      setMedicalRecords(recordData);

      setFilteredTests(sortedTests);
      setFilteredResults(sortedResults);
    } catch (err) {
      console.error(
        "Laboratory error:",
        err
      );

      setError(
        "Unable to load laboratory data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SEARCH / FILTER LAB TESTS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = labTests.filter((test) => {
      const labTestId =
        String(test.lab_test_id || "").toLowerCase();

      const patientId =
        String(test.patient_id || "").toLowerCase();

      const patientName =
        String(test.patient_name || "").toLowerCase();

      const doctorId =
        String(test.doctor_id || "").toLowerCase();

      const doctorName =
        String(test.doctor_name || "").toLowerCase();

      const testName =
        String(test.test_name || "").toLowerCase();

      const testType =
        String(test.test_type || "").toLowerCase();

      const notes =
        String(test.notes || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        labTestId.includes(searchValue) ||
        patientId.includes(searchValue) ||
        patientName.includes(searchValue) ||
        doctorId.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        testName.includes(searchValue) ||
        testType.includes(searchValue) ||
        notes.includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        test.status === statusFilter;

      const testDate =
        test.test_date || "";

      const matchesFromDate =
        !fromDate ||
        testDate >= fromDate;

      const matchesToDate =
        !toDate ||
        testDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });

    results.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );

    setFilteredTests(results);
  }, [
    labTests,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // SEARCH / FILTER LAB RESULTS
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm.trim().toLowerCase();

    const results = labResults.filter((result) => {
      const labResultId =
        String(
          result.lab_result_id || ""
        ).toLowerCase();

      const labTestId =
        String(
          result.lab_test || ""
        ).toLowerCase();

      const patientId =
        String(
          result.patient_id || ""
        ).toLowerCase();

      const patientName =
        String(
          result.patient_name || ""
        ).toLowerCase();

      const doctorId =
        String(
          result.doctor_id || ""
        ).toLowerCase();

      const doctorName =
        String(
          result.doctor_name || ""
        ).toLowerCase();

      const labTestName =
        String(
          result.lab_test_name || ""
        ).toLowerCase();

      const resultValue =
        String(
          result.result || ""
        ).toLowerCase();

      const normalRange =
        String(
          result.normal_range || ""
        ).toLowerCase();

      const remarks =
        String(
          result.remarks || ""
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        labResultId.includes(searchValue) ||
        labTestId.includes(searchValue) ||
        patientId.includes(searchValue) ||
        patientName.includes(searchValue) ||
        doctorId.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        labTestName.includes(searchValue) ||
        resultValue.includes(searchValue) ||
        normalRange.includes(searchValue) ||
        remarks.includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        result.lab_test_status === statusFilter;

      const resultDate =
        result.result_date ||
        result.test_date ||
        "";

      const matchesFromDate =
        !fromDate ||
        resultDate >= fromDate;

      const matchesToDate =
        !toDate ||
        resultDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });

    results.sort(
      (a, b) => Number(b.id) - Number(a.id)
    );

    setFilteredResults(results);
  }, [
    labResults,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const completedTests = labTests.filter(
    (test) => test.status === "COMPLETED"
  ).length;

  const pendingTests = labTests.filter(
    (test) =>
      test.status === "REQUESTED" ||
      test.status === "IN_PROGRESS"
  ).length;

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
  };

  // ==========================================
  // LAB TEST FORM
  // ==========================================

  const handleAddTest = () => {
    setEditingTest(null);

    setTestFormData({
      medical_record: "",
      test_name: "",
      test_type: "",
      status: "REQUESTED",
      test_date: "",
      notes: "",
    });

    setFormError("");
    setShowResultForm(false);
    setShowTestForm(true);
  };

  const handleEditTest = (test) => {
    setEditingTest(test);

    setTestFormData({
      medical_record:
        test.medical_record || "",

      test_name:
        test.test_name || "",

      test_type:
        test.test_type || "",

      status:
        test.status || "REQUESTED",

      test_date:
        test.test_date || "",

      notes:
        test.notes || "",
    });

    setFormError("");
    setShowResultForm(false);
    setShowTestForm(true);
  };

  const handleTestChange = (e) => {
    setTestFormData({
      ...testFormData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      if (!testFormData.medical_record && !editingTest) {
        setFormError(
          "Please select a medical record."
        );
        return;
      }

      if (!testFormData.test_name.trim()) {
        setFormError(
          "Please enter the test name."
        );
        return;
      }

      if (!testFormData.test_type.trim()) {
        setFormError(
          "Please enter the test type."
        );
        return;
      }

      if (editingTest) {
        const payload = {
          test_name:
            testFormData.test_name,

          test_type:
            testFormData.test_type,

          status:
            testFormData.status,

          test_date:
            testFormData.test_date || null,

          notes:
            testFormData.notes,
        };

        await api.put(
          `lab-tests/${editingTest.id}/`,
          payload
        );
      } else {
        const payload = {
          medical_record:
            testFormData.medical_record,

          test_name:
            testFormData.test_name,

          test_type:
            testFormData.test_type,

          test_date:
            testFormData.test_date || null,

          notes:
            testFormData.notes,
        };

        await api.post(
          "lab-tests/",
          payload
        );
      }

      setShowTestForm(false);
      setEditingTest(null);
      setFormError("");

      await fetchData();
    } catch (err) {
      console.error(
        "Lab test save error:",
        err
      );

      if (err.response?.data) {
        const errorData =
          err.response.data;

        if (errorData.error) {
          setFormError(
            errorData.error
          );
        } else {
          setFormError(
            Object.values(errorData)
              .flat()
              .join(" ") ||
              "Unable to save lab test."
          );
        }
      } else {
        setFormError(
          "Unable to save lab test."
        );
      }
    }
  };

  const handleCancelTest = () => {
    setShowTestForm(false);
    setEditingTest(null);
    setFormError("");
  };

  // ==========================================
  // LAB RESULT FORM
  // ==========================================

  const handleAddResult = () => {
    setEditingResult(null);

    setResultFormData({
      lab_test: "",
      result: "",
      normal_range: "",
      remarks: "",
      result_date: "",
    });

    setFormError("");
    setShowTestForm(false);
    setShowResultForm(true);
  };

  const handleEditResult = (result) => {
    setEditingResult(result);

    setResultFormData({
      lab_test:
        result.lab_test || "",

      result:
        result.result || "",

      normal_range:
        result.normal_range || "",

      remarks:
        result.remarks || "",

      result_date:
        result.result_date || "",
    });

    setFormError("");
    setShowTestForm(false);
    setShowResultForm(true);
  };

  const handleResultChange = (e) => {
    setResultFormData({
      ...resultFormData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      if (
        !editingResult &&
        !resultFormData.lab_test
      ) {
        setFormError(
          "Please select a completed lab test."
        );
        return;
      }

      if (!resultFormData.result.trim()) {
        setFormError(
          "Please enter the test result."
        );
        return;
      }

      if (editingResult) {
        const payload = {
          result:
            resultFormData.result,

          normal_range:
            resultFormData.normal_range,

          remarks:
            resultFormData.remarks,

          result_date:
            resultFormData.result_date ||
            null,
        };

        await api.put(
          `lab-results/${editingResult.id}/`,
          payload
        );
      } else {
        const payload = {
          lab_test:
            resultFormData.lab_test,

          result:
            resultFormData.result,

          normal_range:
            resultFormData.normal_range,

          remarks:
            resultFormData.remarks,

          result_date:
            resultFormData.result_date ||
            null,
        };

        await api.post(
          "lab-results/",
          payload
        );
      }

      setShowResultForm(false);
      setEditingResult(null);
      setFormError("");

      await fetchData();
    } catch (err) {
      console.error(
        "Lab result save error:",
        err
      );

      if (err.response?.data) {
        const errorData =
          err.response.data;

        if (errorData.error) {
          setFormError(
            errorData.error
          );
        } else {
          setFormError(
            Object.values(errorData)
              .flat()
              .join(" ") ||
              "Unable to save lab result."
          );
        }
      } else {
        setFormError(
          "Unable to save lab result."
        );
      }
    }
  };

  const handleCancelResult = () => {
    setShowResultForm(false);
    setEditingResult(null);
    setFormError("");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (status) => {
    if (!status) {
      return "-";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "completed";

      case "IN_PROGRESS":
        return "progress";

      case "CANCELLED":
        return "cancelled";

      case "REQUESTED":
        return "requested";

      default:
        return "";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-laboratory-page">

        <div className="doctor-laboratory-state">

          <div className="doctor-laboratory-spinner" />

          <h2>
            Loading laboratory data...
          </h2>

          <p>
            Please wait while we load
            laboratory information.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="doctor-laboratory-page">

        <div className="doctor-laboratory-state error">

          <h2>
            Unable to Load Laboratory
          </h2>

          <p>{error}</p>

          <button
            className="doctor-laboratory-primary-btn"
            onClick={fetchData}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // TESTS AVAILABLE FOR RESULT
  // ==========================================

  const testsAvailableForResult =
    labTests.filter(
      (test) =>
        test.status === "COMPLETED" &&
        !labResults.some(
          (result) =>
            String(result.lab_test) ===
            String(test.id)
        )
    );

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="doctor-laboratory-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="doctor-laboratory-header">

        <div>

          <span className="doctor-laboratory-eyebrow">
            Diagnostic Management
          </span>

          <h1>
            Laboratory
          </h1>

          <p>
            Manage laboratory tests and
            results for your patients.
          </p>

        </div>

        <div className="doctor-laboratory-header-actions">

          <button
            className="doctor-laboratory-secondary-btn"
            onClick={handleAddResult}
          >
            + Add Result
          </button>

          <button
            className="doctor-laboratory-primary-btn"
            onClick={handleAddTest}
          >
            + Add Lab Test
          </button>

        </div>

      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="doctor-laboratory-summary">

        <div className="doctor-laboratory-summary-card">

          <div className="lab-summary-icon purple">
            T
          </div>

          <div>
            <span>
              Total Tests
            </span>

            <strong>
              {labTests.length}
            </strong>
          </div>

        </div>

        <div className="doctor-laboratory-summary-card">

          <div className="lab-summary-icon orange">
            !
          </div>

          <div>
            <span>
              Pending Tests
            </span>

            <strong>
              {pendingTests}
            </strong>
          </div>

        </div>

        <div className="doctor-laboratory-summary-card">

          <div className="lab-summary-icon green">
            ✓
          </div>

          <div>
            <span>
              Completed Tests
            </span>

            <strong>
              {completedTests}
            </strong>
          </div>

        </div>

        <div className="doctor-laboratory-summary-card">

          <div className="lab-summary-icon blue">
            R
          </div>

          <div>
            <span>
              Lab Results
            </span>

            <strong>
              {labResults.length}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================
          TEST FORM
      ====================================== */}

      {showTestForm && (

        <div className="doctor-laboratory-form-card">

          <div className="doctor-laboratory-section-header">

            <div>

              <h2>
                {editingTest
                  ? "Edit Lab Test"
                  : "Create Lab Test"}
              </h2>

              <p>
                Enter the laboratory test
                details below.
              </p>

            </div>

            <button
              type="button"
              className="doctor-laboratory-close-btn"
              onClick={handleCancelTest}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="doctor-laboratory-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleTestSubmit}>

            <div className="doctor-laboratory-form-grid">

              {/* MEDICAL RECORD */}

              <div className="doctor-laboratory-form-group full">

                <label>
                  Medical Record
                </label>

                <select
                  name="medical_record"
                  value={
                    testFormData.medical_record
                  }
                  onChange={
                    handleTestChange
                  }
                  disabled={
                    !!editingTest
                  }
                  required={!editingTest}
                >

                  <option value="">
                    Select Medical Record
                  </option>

                  {medicalRecords.map(
                    (record) => (

                      <option
                        key={record.id}
                        value={record.id}
                      >
                        {record.patient_id ||
                          "-"}{" "}
                        -{" "}
                        {record.patient_name ||
                          "-"}{" "}
                        -{" "}
                        {record.doctor_id ||
                          "-"}{" "}
                        - Record #
                        {record.medical_record_id ||
                          record.id}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* TEST NAME */}

              <div className="doctor-laboratory-form-group">

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
                  placeholder="Example: Blood Test"
                  required
                />

              </div>

              {/* TEST TYPE */}

              <div className="doctor-laboratory-form-group">

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
                  placeholder="Example: Hematology"
                  required
                />

              </div>

              {/* STATUS */}

              <div className="doctor-laboratory-form-group">

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
                  disabled={
                    editingTest &&
                    [
                      "COMPLETED",
                      "CANCELLED",
                    ].includes(
                      editingTest.status
                    )
                  }
                >

                  <option value="REQUESTED">
                    Requested
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                </select>

              </div>

              {/* TEST DATE */}

              <div className="doctor-laboratory-form-group">

                <label>
                  Test Date
                </label>

                <input
                  type="date"
                  name="test_date"
                  value={
                    testFormData.test_date
                  }
                  onChange={
                    handleTestChange
                  }
                />

              </div>

              {/* NOTES */}

              <div className="doctor-laboratory-form-group full">

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
                  rows="4"
                  placeholder="Enter laboratory notes"
                />

              </div>

            </div>

            <div className="doctor-laboratory-form-actions">

              <button
                type="submit"
                className="doctor-laboratory-save-btn"
              >
                {editingTest
                  ? "Update Lab Test"
                  : "Create Lab Test"}
              </button>

              <button
                type="button"
                className="doctor-laboratory-cancel-btn"
                onClick={handleCancelTest}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          RESULT FORM
      ====================================== */}

      {showResultForm && (

        <div className="doctor-laboratory-form-card">

          <div className="doctor-laboratory-section-header">

            <div>

              <h2>
                {editingResult
                  ? "Edit Lab Result"
                  : "Create Lab Result"}
              </h2>

              <p>
                Enter the laboratory result
                details below.
              </p>

            </div>

            <button
              type="button"
              className="doctor-laboratory-close-btn"
              onClick={handleCancelResult}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="doctor-laboratory-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleResultSubmit}>

            <div className="doctor-laboratory-form-grid">

              {/* LAB TEST */}

              <div className="doctor-laboratory-form-group full">

                <label>
                  Lab Test
                </label>

                <select
                  name="lab_test"
                  value={
                    resultFormData.lab_test
                  }
                  onChange={
                    handleResultChange
                  }
                  disabled={
                    !!editingResult
                  }
                  required
                >

                  <option value="">
                    Select Completed Lab Test
                  </option>

                  {editingResult ? (

                    <option
                      value={
                        editingResult.lab_test
                      }
                    >
                      {editingResult.lab_test_name ||
                        `Lab Test #${editingResult.lab_test}`}
                    </option>

                  ) : (

                    testsAvailableForResult.map(
                      (test) => (

                        <option
                          key={test.id}
                          value={test.id}
                        >
                          {test.test_name ||
                            "-"}{" "}
                          -{" "}
                          {test.patient_name ||
                            "-"}{" "}
                          - Test #
                          {test.lab_test_id ||
                            test.id}
                        </option>

                      )
                    )

                  )}

                </select>

              </div>

              {/* RESULT */}

              <div className="doctor-laboratory-form-group full">

                <label>
                  Result
                </label>

                <textarea
                  name="result"
                  value={
                    resultFormData.result
                  }
                  onChange={
                    handleResultChange
                  }
                  rows="4"
                  placeholder="Enter test result"
                  required
                />

              </div>

              {/* NORMAL RANGE */}

              <div className="doctor-laboratory-form-group">

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
                  placeholder="Example: 70 - 100 mg/dL"
                />

              </div>

              {/* RESULT DATE */}

              <div className="doctor-laboratory-form-group">

                <label>
                  Result Date
                </label>

                <input
                  type="date"
                  name="result_date"
                  value={
                    resultFormData.result_date
                  }
                  onChange={
                    handleResultChange
                  }
                />

              </div>

              {/* REMARKS */}

              <div className="doctor-laboratory-form-group full">

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
                  rows="3"
                  placeholder="Enter remarks"
                />

              </div>

            </div>

            <div className="doctor-laboratory-form-actions">

              <button
                type="submit"
                className="doctor-laboratory-save-btn"
              >
                {editingResult
                  ? "Update Lab Result"
                  : "Create Lab Result"}
              </button>

              <button
                type="button"
                className="doctor-laboratory-cancel-btn"
                onClick={handleCancelResult}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ======================================
          FILTER CARD
      ====================================== */}

      <div className="doctor-laboratory-filter-card">

        <div className="doctor-laboratory-filter-header">

          <div>

            <h2>
              Laboratory Records
            </h2>

            <p>
              Tests:{" "}
              <strong>
                {filteredTests.length}
              </strong>
              {" / "}
              {labTests.length}
              {"  •  "}
              Results:{" "}
              <strong>
                {filteredResults.length}
              </strong>
              {" / "}
              {labResults.length}
            </p>

          </div>

          <button
            type="button"
            className="doctor-laboratory-filter-toggle"
            onClick={() =>
              setShowFilters(!showFilters)
            }
          >
            {showFilters
              ? "Hide Filters"
              : "Search & Filter"}
          </button>

        </div>

        {showFilters && (

          <div className="doctor-laboratory-filters">

            {/* SEARCH */}

            <div className="doctor-laboratory-filter-group search">

              <label>
                Search Laboratory
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Test ID, Result ID, Patient, Doctor, Test Name, Result..."
              />

            </div>

            {/* STATUS */}

            <div className="doctor-laboratory-filter-group">

              <label>
                Test Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Statuses
                </option>

                <option value="REQUESTED">
                  Requested
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

              </select>

            </div>

            {/* FROM DATE */}

            <div className="doctor-laboratory-filter-group">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* TO DATE */}

            <div className="doctor-laboratory-filter-group">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate || undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* CLEAR */}

            <button
              type="button"
              className="doctor-laboratory-clear-btn"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        )}

      </div>

      {/* ======================================
          LAB TESTS
      ====================================== */}

      <div className="doctor-laboratory-table-section">

        <div className="doctor-laboratory-table-title">

          <div>

            <h2>
              Lab Tests
            </h2>

            <p>
              Laboratory tests requested
              for your patients.
            </p>

          </div>

          <span>
            {filteredTests.length} records
          </span>

        </div>

        {labTests.length === 0 ? (

          <div className="doctor-laboratory-empty">
            <h3>
              No Lab Tests
            </h3>

            <p>
              No laboratory tests have
              been created yet.
            </p>
          </div>

        ) : filteredTests.length === 0 ? (

          <div className="doctor-laboratory-empty">
            <h3>
              No Matching Tests
            </h3>

            <p>
              No lab tests match the
              selected filters.
            </p>
          </div>

        ) : (

          <div className="doctor-laboratory-table-card">

            <div className="doctor-laboratory-table-wrapper">

              <table className="doctor-laboratory-table">

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
                      Test
                    </th>

                    <th>
                      Type
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

                  {filteredTests.map(
                    (test) => (

                      <tr key={test.id}>

                        <td>
                          <span className="doctor-lab-id">
                            {test.lab_test_id ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <div className="doctor-lab-person">

                            <strong>
                              {test.patient_name ||
                                "-"}
                            </strong>

                            <span>
                              {test.patient_id ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        <td>
                          <div className="doctor-lab-person">

                            <strong>
                              {test.doctor_name ||
                                "-"}
                            </strong>

                            <span>
                              {test.doctor_id ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        <td>
                          <strong className="doctor-lab-test-name">
                            {test.test_name ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {test.test_type ||
                            "-"}
                        </td>

                        <td>

                          <span
                            className={`doctor-lab-status ${getStatusClass(
                              test.status
                            )}`}
                          >
                            {formatStatus(
                              test.status
                            )}
                          </span>

                        </td>

                        <td>
                          {formatDate(
                            test.test_date
                          )}
                        </td>

                        <td>
                          <div className="doctor-lab-notes">
                            {test.notes ||
                              "-"}
                          </div>
                        </td>

                        <td>

                          <button
                            type="button"
                            className="doctor-lab-edit-btn"
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

          </div>
        )}

      </div>

      {/* ======================================
          LAB RESULTS
      ====================================== */}

      <div className="doctor-laboratory-table-section results-section">

        <div className="doctor-laboratory-table-title">

          <div>

            <h2>
              Lab Results
            </h2>

            <p>
              Results recorded for completed
              laboratory tests.
            </p>

          </div>

          <span>
            {filteredResults.length} records
          </span>

        </div>

        {labResults.length === 0 ? (

          <div className="doctor-laboratory-empty">

            <h3>
              No Lab Results
            </h3>

            <p>
              No laboratory results have
              been recorded yet.
            </p>

          </div>

        ) : filteredResults.length === 0 ? (

          <div className="doctor-laboratory-empty">

            <h3>
              No Matching Results
            </h3>

            <p>
              No lab results match the
              selected filters.
            </p>

          </div>

        ) : (

          <div className="doctor-laboratory-table-card">

            <div className="doctor-laboratory-table-wrapper">

              <table className="doctor-laboratory-table">

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
                      Test Status
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

                  {filteredResults.map(
                    (result) => (

                      <tr key={result.id}>

                        <td>
                          <span className="doctor-lab-id">
                            {result.lab_result_id ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <div className="doctor-lab-person">

                            <strong>
                              {result.patient_name ||
                                "-"}
                            </strong>

                            <span>
                              {result.patient_id ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        <td>
                          <div className="doctor-lab-person">

                            <strong>
                              {result.doctor_name ||
                                "-"}
                            </strong>

                            <span>
                              {result.doctor_id ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        <td>
                          <strong className="doctor-lab-test-name">
                            {result.lab_test_name ||
                              "-"}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`doctor-lab-status ${getStatusClass(
                              result.lab_test_status
                            )}`}
                          >
                            {formatStatus(
                              result.lab_test_status
                            )}
                          </span>

                        </td>

                        <td>

                          <div className="doctor-lab-result-value">
                            {result.result ||
                              "-"}
                          </div>

                        </td>

                        <td>
                          {result.normal_range ||
                            "-"}
                        </td>

                        <td>

                          <div className="doctor-lab-notes">
                            {result.remarks ||
                              "-"}
                          </div>

                        </td>

                        <td>
                          {formatDate(
                            result.result_date ||
                              result.test_date
                          )}
                        </td>

                        <td>

                          <button
                            type="button"
                            className="doctor-lab-edit-btn"
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

          </div>
        )}

      </div>

    </div>
  );
}

export default DoctorLaboratory;