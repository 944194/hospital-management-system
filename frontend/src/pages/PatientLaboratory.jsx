import { useEffect, useState } from "react";
import api from "../services/api";

function PatientLaboratory() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);

  const [filteredTests, setFilteredTests] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH LABORATORY DATA
  // ==========================================

  useEffect(() => {
    const fetchLaboratoryData = async () => {
      try {
        const [testsResponse, resultsResponse] =
          await Promise.all([
            api.get("lab-tests/"),
            api.get("lab-results/"),
          ]);

        // Latest tests first
        const sortedTests = [
          ...testsResponse.data,
        ].sort((a, b) => b.id - a.id);

        // Latest results first
        const sortedResults = [
          ...resultsResponse.data,
        ].sort((a, b) => b.id - a.id);

        setTests(sortedTests);
        setResults(sortedResults);

        setFilteredTests(sortedTests);
        setFilteredResults(sortedResults);
      } catch (err) {
        console.error(
          "Laboratory error:",
          err
        );

        setError(
          "Unable to load laboratory data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratoryData();
  }, []);

  // ==========================================
  // SEARCH / FILTER LABORATORY DATA
  // ==========================================

  useEffect(() => {
    const searchValue =
      searchTerm
        .trim()
        .toLowerCase();

    // ========================================
    // FILTER LAB TESTS
    // ========================================

    const testResults = tests.filter(
      (test) => {
        const labTestId = String(
          test.lab_test_id || ""
        ).toLowerCase();

        const patientId = String(
          test.patient_id || ""
        ).toLowerCase();

        const patientName = String(
          test.patient_name || ""
        ).toLowerCase();

        const doctorId = String(
          test.doctor_id || ""
        ).toLowerCase();

        const doctorName = String(
          test.doctor_name || ""
        ).toLowerCase();

        const testName = String(
          test.test_name || ""
        ).toLowerCase();

        const testType = String(
          test.test_type || ""
        ).toLowerCase();

        const notes = String(
          test.notes || ""
        ).toLowerCase();

        const testStatus = String(
          test.status || ""
        ).toLowerCase();

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
          testStatus ===
            statusFilter.toLowerCase();

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
      }
    );

    // ========================================
    // FILTER LAB RESULTS
    // ========================================

    const resultResults = results.filter(
      (result) => {
        const labResultId = String(
          result.lab_result_id || ""
        ).toLowerCase();

        const labTestName = String(
          result.lab_test_name || ""
        ).toLowerCase();

        const patientId = String(
          result.patient_id || ""
        ).toLowerCase();

        const patientName = String(
          result.patient_name || ""
        ).toLowerCase();

        const doctorId = String(
          result.doctor_id || ""
        ).toLowerCase();

        const doctorName = String(
          result.doctor_name || ""
        ).toLowerCase();

        const resultValue = String(
          result.result || ""
        ).toLowerCase();

        const normalRange = String(
          result.normal_range || ""
        ).toLowerCase();

        const remarks = String(
          result.remarks || ""
        ).toLowerCase();

        const resultStatus = String(
          result.lab_test_status || ""
        ).toLowerCase();

        const matchesSearch =
          !searchValue ||
          labResultId.includes(searchValue) ||
          labTestName.includes(searchValue) ||
          patientId.includes(searchValue) ||
          patientName.includes(searchValue) ||
          doctorId.includes(searchValue) ||
          doctorName.includes(searchValue) ||
          resultValue.includes(searchValue) ||
          normalRange.includes(searchValue) ||
          remarks.includes(searchValue);

        const matchesStatus =
          !statusFilter ||
          resultStatus ===
            statusFilter.toLowerCase();

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
      }
    );

    setFilteredTests(testResults);
    setFilteredResults(resultResults);
  }, [
    tests,
    results,
    searchTerm,
    statusFilter,
    fromDate,
    toDate,
  ]);

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
  // GET STATUS OPTIONS
  // ==========================================

  const statusOptions = [
    ...new Set([
      ...tests
        .map((test) => test.status)
        .filter(Boolean),

      ...results
        .map(
          (result) =>
            result.lab_test_status
        )
        .filter(Boolean),
    ]),
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="patient-laboratory-loading">

        <div className="patient-laboratory-spinner"></div>

        <p>
          Loading laboratory data...
        </p>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="patient-laboratory-error">

        <h2>
          Unable to Load Laboratory
        </h2>

        <p>
          {error}
        </p>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="patient-laboratory-page">

      {/* ======================================
          HEADER
          ====================================== */}

      <div className="patient-laboratory-header">

        <div>

          <span className="patient-laboratory-eyebrow">
            DIAGNOSTICS
          </span>

          <h1>
            My Laboratory
          </h1>

          <p>
            View your laboratory tests and
            results.
          </p>

        </div>

        <div className="patient-laboratory-summary">

          <div className="patient-laboratory-summary-card">

            <span>
              Lab Tests
            </span>

            <strong>
              {tests.length}
            </strong>

          </div>

          <div className="patient-laboratory-summary-card">

            <span>
              Lab Results
            </span>

            <strong>
              {results.length}
            </strong>

          </div>

        </div>

      </div>

      {/* ======================================
          FILTER TOGGLE
          ====================================== */}

      <div className="patient-laboratory-filter-toggle">

        <button
          type="button"
          className="patient-laboratory-filter-button"
          onClick={() =>
            setShowFilters(
              !showFilters
            )
          }
        >
          {showFilters
            ? "✕ Hide Search & Filters"
            : "☰ Search & Filter"}
        </button>

        <span>
          {showFilters
            ? "Search and filter your laboratory records"
            : `${filteredTests.length} test${
                filteredTests.length !==
                1
                  ? "s"
                  : ""
              } and ${filteredResults.length} result${
                filteredResults.length !==
                1
                  ? "s"
                  : ""
              } available`}
        </span>

      </div>

      {/* ======================================
          SEARCH / FILTER CARD
          ====================================== */}

      {showFilters && (
        <div className="patient-laboratory-filter-card">

          <div className="patient-laboratory-section-title">

            <h2>
              Search & Filter Laboratory
            </h2>

            <p>
              Find tests and results by ID,
              doctor, test name, status or date.
            </p>

          </div>

          <div className="patient-laboratory-filter-grid">

            {/* Search */}

            <div className="patient-laboratory-filter-field">

              <label>
                Search Laboratory Records
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Lab Test ID, Lab Result ID, Patient, Doctor, Test Name, Result or Remarks"
              />

            </div>

            {/* Status */}

            <div className="patient-laboratory-filter-field">

              <label>
                Status
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

                {statusOptions.map(
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

            {/* From Date */}

            <div className="patient-laboratory-filter-field">

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

            {/* To Date */}

            <div className="patient-laboratory-filter-field">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={
                  fromDate ||
                  undefined
                }
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="patient-laboratory-filter-actions">

            <button
              type="button"
              className="patient-laboratory-clear-button"
              onClick={
                handleClearFilters
              }
            >
              Clear Filters
            </button>

            <span className="patient-laboratory-result-count">

              Showing{" "}

              <strong>
                {filteredTests.length}
              </strong>

              {" "}of{" "}

              <strong>
                {tests.length}
              </strong>

              {" "}lab tests and{" "}

              <strong>
                {filteredResults.length}
              </strong>

              {" "}of{" "}

              <strong>
                {results.length}
              </strong>

              {" "}lab results

            </span>

          </div>

        </div>
      )}

      {/* ======================================
          LAB TESTS
          ====================================== */}

      <section className="patient-laboratory-section">

        <div className="patient-laboratory-section-header">

          <div>

            <h2>
              Lab Tests
            </h2>

            <p>
              Laboratory tests requested for
              your care.
            </p>

          </div>

          <span>
            {filteredTests.length} Records
          </span>

        </div>

        {filteredTests.length === 0 ? (

          <div className="patient-laboratory-empty-state">

            <div className="patient-laboratory-empty-icon">
              LAB
            </div>

            <h3>
              No Lab Tests Found
            </h3>

            <p>
              {tests.length === 0
                ? "No laboratory tests are currently available."
                : "No lab tests match the selected search or filters."}
            </p>

          </div>

        ) : (

          <div className="patient-laboratory-table-card">

            <div className="patient-laboratory-table-wrapper">

              <table className="patient-laboratory-table">

                <thead>

                  <tr>

                    <th>
                      Lab Test ID
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

                  </tr>

                </thead>

                <tbody>

                  {filteredTests.map(
                    (test) => (

                      <tr
                        key={test.id}
                      >

                        <td>

                          <span className="patient-laboratory-id">
                            {
                              test.lab_test_id ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <strong>
                            {
                              test.patient_id ||
                              "-"
                            }
                          </strong>

                          <br />

                          <span className="patient-laboratory-secondary-text">
                            {
                              test.patient_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <strong>
                            {
                              test.doctor_id ||
                              "-"
                            }
                          </strong>

                          <br />

                          <span className="patient-laboratory-secondary-text">
                            {
                              test.doctor_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <span className="patient-laboratory-test-name">
                            {
                              test.test_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>
                          {
                            test.test_type ||
                            "-"
                          }
                        </td>

                        <td>

                          <span className="patient-laboratory-status">
                            {
                              test.status ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>
                          {
                            test.test_date ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            test.notes ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </section>

      {/* ======================================
          LAB RESULTS
          ====================================== */}

      <section className="patient-laboratory-section">

        <div className="patient-laboratory-section-header">

          <div>

            <h2>
              Lab Results
            </h2>

            <p>
              View results recorded for your
              laboratory tests.
            </p>

          </div>

          <span>
            {filteredResults.length} Records
          </span>

        </div>

        {filteredResults.length === 0 ? (

          <div className="patient-laboratory-empty-state">

            <div className="patient-laboratory-empty-icon">
              RES
            </div>

            <h3>
              No Lab Results Found
            </h3>

            <p>
              {results.length === 0
                ? "No laboratory results are currently available."
                : "No lab results match the selected search or filters."}
            </p>

          </div>

        ) : (

          <div className="patient-laboratory-table-card">

            <div className="patient-laboratory-table-wrapper">

              <table className="patient-laboratory-table">

                <thead>

                  <tr>

                    <th>
                      Lab Result ID
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

                  </tr>

                </thead>

                <tbody>

                  {filteredResults.map(
                    (result) => (

                      <tr
                        key={result.id}
                      >

                        <td>

                          <span className="patient-laboratory-id">
                            {
                              result.lab_result_id ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <strong>
                            {
                              result.patient_id ||
                              "-"
                            }
                          </strong>

                          <br />

                          <span className="patient-laboratory-secondary-text">
                            {
                              result.patient_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <strong>
                            {
                              result.doctor_id ||
                              "-"
                            }
                          </strong>

                          <br />

                          <span className="patient-laboratory-secondary-text">
                            {
                              result.doctor_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <span className="patient-laboratory-test-name">
                            {
                              result.lab_test_name ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <span className="patient-laboratory-status">
                            {
                              result.lab_test_status ||
                              "-"
                            }
                          </span>

                        </td>

                        <td>

                          <strong>
                            {
                              result.result ||
                              "-"
                            }
                          </strong>

                        </td>

                        <td>
                          {
                            result.normal_range ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            result.remarks ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </section>

    </div>
  );
}

export default PatientLaboratory;