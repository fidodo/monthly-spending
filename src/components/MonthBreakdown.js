// components/MonthBreakdown.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  ListGroup,
} from "react-bootstrap";
import {
  FaCalendarAlt,
  FaArrowDown,
  FaArrowUp,
  FaEuroSign,
  FaArchive,
  FaCreditCard,
  FaHome,
  FaCar,
  FaUtensils,
  FaShoppingCart,
  FaFilm,
  FaHeart,
  FaGraduationCap,
  FaSync,
} from "react-icons/fa";
import { spendingAPI, earningsAPI, billsAPI, loansAPI } from "../services/api";

const MonthBreakdown = () => {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(months, "months state in MonthBreakdown");

  // Helper function to extract month reliably from any date format
  const extractMonth = (dateValue) => {
    if (!dateValue) return null;

    try {
      // If it's already in YYYY-MM-DD format
      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        return dateValue;
      }

      // Create Date object (handles ISO strings)
      const date = new Date(dateValue);

      // Check if valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateValue);
        return null;
      }

      // Get UTC year and month to avoid timezone issues
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");

      return `${year}-${month}-01`;
    } catch (e) {
      console.error("Error parsing date:", dateValue, e);
      return null;
    }
  };

  const fetchAllHistoricalData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📥 Fetching historical data...");

      // Fetch all data in parallel
      const [spendingRes, earningsRes, billsRes, loansRes] = await Promise.all([
        spendingAPI.getAll(),
        earningsAPI.getHistory(),
        billsAPI.getAll(),
        loansAPI.getAll(),
      ]);

      console.log("✅ Historical data received:", {
        spending: spendingRes.data?.length || 0,
        earnings: earningsRes.data?.length || 0,
        bills: billsRes.data?.length || 0,
        loans: loansRes.data?.length || 0,
      });

      // Log raw data for debugging
      console.log("🔍 Raw spending data:", spendingRes.data);
      console.log("🔍 Raw earnings data:", earningsRes.data);
      console.log("🔍 Raw bills data:", billsRes.data);
      console.log("🔍 Raw loans data:", loansRes.data);

      // Organize data by month
      const dataByMonth = {};

      // Process spending entries
      (spendingRes.data || []).forEach((item) => {
        // Try to get month from item.month first, then calculate from date
        let month = item.month;

        if (!month && item.date) {
          month = extractMonth(item.date);
        }

        if (!month) {
          console.warn("Could not determine month for spending item:", item);
          return;
        }

        console.log(`📅 Spending item month:`, month, "from date:", item.date);

        if (!dataByMonth[month]) {
          dataByMonth[month] = {
            spending: [],
            bills: [],
            loans: [],
            monthlyEarning: 0,
          };
        }
        dataByMonth[month].spending.push(item);
      });

      // Process earnings
      (earningsRes.data || []).forEach((item) => {
        let month = item.month;

        if (!month && item.date) {
          month = extractMonth(item.date);
        }

        if (!month) {
          console.warn("Could not determine month for earnings item:", item);
          return;
        }

        if (!dataByMonth[month]) {
          dataByMonth[month] = {
            spending: [],
            bills: [],
            loans: [],
            monthlyEarning: 0,
          };
        }
        dataByMonth[month].monthlyEarning = parseFloat(item.amount) || 0;
      });

      // Process bills
      (billsRes.data || []).forEach((item) => {
        // Try to get month from item.month first, then calculate from due_date
        let month = item.month;

        if (!month && item.due_date) {
          month = extractMonth(item.due_date);
        }

        if (!month) {
          console.warn("Could not determine month for bill:", item);
          return;
        }

        console.log(`📅 Bill month:`, month, "from due_date:", item.due_date);

        if (!dataByMonth[month]) {
          dataByMonth[month] = {
            spending: [],
            bills: [],
            loans: [],
            monthlyEarning: 0,
          };
        }
        dataByMonth[month].bills.push(item);
      });

      // Process loans
      (loansRes.data || []).forEach((item) => {
        // Try to get month from item.month first, then calculate from due_date
        let month = item.month;

        if (!month && item.due_date) {
          month = extractMonth(item.due_date);
        }

        if (!month) {
          console.warn("Could not determine month for loan:", item);
          return;
        }

        console.log(`📅 Loan month:`, month, "from due_date:", item.due_date);

        if (!dataByMonth[month]) {
          dataByMonth[month] = {
            spending: [],
            bills: [],
            loans: [],
            monthlyEarning: 0,
          };
        }
        dataByMonth[month].loans.push(item);
      });

      // Convert to array and sort by month (newest first)
      const monthsArray = Object.entries(dataByMonth)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      console.log("📊 Organized by month:", monthsArray);
      setMonths(monthsArray);
    } catch (err) {
      console.error("❌ Error fetching historical data:", err);
      setError("Failed to load historical data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllHistoricalData();
    setRefreshing(false);
  };

  // Calculate stats for each month
  useEffect(() => {
    const stats = {};
    months.forEach((monthData) => {
      const totalSpending = monthData.spending.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
      );
      const totalBills = monthData.bills.reduce(
        (sum, bill) => sum + (parseFloat(bill.amount) || 0),
        0,
      );
      const totalLoans = monthData.loans.reduce(
        (sum, loan) => sum + (parseFloat(loan.amount) || 0),
        0,
      );
      const totalExpenses = totalSpending + totalBills + totalLoans;
      const savings = monthData.monthlyEarning - totalExpenses;

      stats[monthData.month] = {
        totalSpending,
        totalBills,
        totalLoans,
        totalExpenses,
        savings,
        savingsRate:
          monthData.monthlyEarning > 0
            ? ((savings / monthData.monthlyEarning) * 100).toFixed(1)
            : 0,
      };
    });
    setMonthlyStats(stats);
  }, [months]);

  const formatMonth = (monthKey) => {
    // Handle different month key formats
    let year, month;

    if (monthKey.includes("T")) {
      // It's an ISO string
      [year, month] = monthKey.split("T")[0].split("-");
    } else if (monthKey.includes("-")) {
      // It's YYYY-MM-DD format
      [year, month] = monthKey.split("-");
    } else {
      return "Unknown";
    }

    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "food":
      case "groceries":
        return <FaUtensils className="text-success" />;
      case "shopping":
        return <FaShoppingCart className="text-primary" />;
      case "entertainment":
        return <FaFilm className="text-warning" />;
      case "health":
        return <FaHeart className="text-danger" />;
      case "education":
        return <FaGraduationCap className="text-info" />;
      case "rent":
      case "mortgage":
        return <FaHome className="text-secondary" />;
      case "car":
      case "transport":
        return <FaCar className="text-info" />;
      default:
        return <FaCreditCard className="text-muted" />;
    }
  };

  const toggleExpand = (month) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="theme-text-muted">Loading your financial history...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          <FaArchive size={48} className="mb-3 text-danger" />
          <p className="mb-3">{error}</p>
          <Button variant="danger" onClick={handleRefresh}>
            <FaSync className="me-2" /> Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="d-flex align-items-center gap-2">
              <FaArchive className="text-primary" />
              Monthly Breakdown
            </h2>
            <p className="theme-text-muted">
              View your spending history month by month
            </p>
          </div>
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={`me-2 ${refreshing ? "fa-spin" : ""}`} />
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center h-100 bg-light">
            <Card.Body>
              <FaArchive size={24} className="text-primary mb-2" />
              <Card.Title className="h6">Total Months</Card.Title>
              <h3 className="text-primary">{months.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 bg-light">
            <Card.Body>
              <FaArrowUp size={24} className="text-success mb-2" />
              <Card.Title className="h6">Best Savings</Card.Title>
              <h3 className="text-success">
                {Object.values(monthlyStats).length > 0
                  ? `€${Math.max(
                      ...Object.values(monthlyStats).map((s) => s.savings || 0),
                    ).toLocaleString()}`
                  : "$0"}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 bg-light">
            <Card.Body>
              <FaEuroSign size={24} className="text-warning mb-2" />
              <Card.Title className="h6">Avg Spending</Card.Title>
              <h3 className="text-warning">
                {months.length > 0
                  ? `€${(
                      Object.values(monthlyStats).reduce(
                        (sum, s) => sum + s.totalExpenses,
                        0,
                      ) / months.length
                    ).toFixed(0)}`
                  : "€0"}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 bg-light">
            <Card.Body>
              <FaCalendarAlt size={24} className="text-info mb-2" />
              <Card.Title className="h6">Avg Savings Rate</Card.Title>
              <h3 className="text-info">
                {months.length > 0
                  ? `${(
                      Object.values(monthlyStats).reduce(
                        (sum, s) => sum + parseFloat(s.savingsRate || 0),
                        0,
                      ) / months.length
                    ).toFixed(1)}%`
                  : "0%"}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Breakdown List */}
      {months.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaArchive size={64} className="text-muted mb-3" />
            <Card.Title>No Monthly Data Found</Card.Title>
            <Card.Text className="theme-text-muted">
              Start adding expenses to see your monthly breakdown here!
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        months.map((monthData) => (
          <Card key={monthData.month} className="mb-3">
            {/* Month Header - Always Visible */}
            <Card.Header
              className="bg-light d-flex flex-wrap align-items-center justify-content-between cursor-pointer"
              onClick={() => toggleExpand(monthData.month)}
              style={{ cursor: "pointer" }}
            >
              <div className="d-flex align-items-center gap-3">
                <FaCalendarAlt className="text-secondary" />
                <h5 className="mb-0">{formatMonth(monthData.month)}</h5>
              </div>

              <div className="d-flex gap-4 flex-wrap">
                <Badge bg="success" className="p-2">
                  Income: €{monthData.monthlyEarning?.toLocaleString() || 0}
                </Badge>
                <Badge bg="danger" className="p-2">
                  Spent: €
                  {monthlyStats[
                    monthData.month
                  ]?.totalExpenses?.toLocaleString() || 0}
                </Badge>
                <Badge
                  bg={
                    monthlyStats[monthData.month]?.savings >= 0
                      ? "success"
                      : "danger"
                  }
                  className="p-2"
                >
                  Saved: €
                  {monthlyStats[monthData.month]?.savings?.toLocaleString() ||
                    0}
                </Badge>
              </div>
            </Card.Header>

            {/* Expanded Details */}
            {expandedMonth === monthData.month && (
              <Card.Body>
                <Row className="g-3">
                  {/* Spending Breakdown */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-danger text-white">
                        <FaArrowDown className="me-2" />
                        Spending Details
                      </Card.Header>
                      <ListGroup
                        variant="flush"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        {monthData.spending.length > 0 ? (
                          <>
                            {monthData.spending.map((item, idx) => (
                              <ListGroup.Item
                                key={idx}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <div className="d-flex align-items-center gap-2">
                                    {getCategoryIcon(item.category)}
                                    <strong>
                                      {item.description ||
                                        item.category ||
                                        "Item"}
                                    </strong>
                                  </div>
                                  <small className="text-muted">
                                    {item.date
                                      ? new Date(item.date).toLocaleDateString()
                                      : "No date"}
                                  </small>
                                </div>
                                <span className="text-danger fw-bold">
                                  €
                                  {parseFloat(
                                    item.amount || 0,
                                  ).toLocaleString()}
                                </span>
                              </ListGroup.Item>
                            ))}
                            <ListGroup.Item className="d-flex justify-content-between bg-light fw-bold">
                              <span>Total Spending</span>
                              <span className="text-danger">
                                €
                                {monthlyStats[
                                  monthData.month
                                ]?.totalSpending?.toLocaleString() || 0}
                              </span>
                            </ListGroup.Item>
                          </>
                        ) : (
                          <ListGroup.Item className="text-center text-muted py-4">
                            No spending this month
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  </Col>

                  {/* Bills Breakdown */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-warning text-white">
                        <FaEuroSign className="me-2" />
                        Bills
                      </Card.Header>
                      <ListGroup
                        variant="flush"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        {monthData.bills.length > 0 ? (
                          <>
                            {monthData.bills.map((bill, idx) => (
                              <ListGroup.Item
                                key={idx}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <div className="d-flex align-items-center gap-2">
                                    {getCategoryIcon(bill.category)}
                                    <strong>
                                      {bill.name || bill.category || "Bill"}
                                    </strong>
                                  </div>
                                  <small className="text-muted">
                                    Due:{" "}
                                    {bill.due_date
                                      ? new Date(
                                          bill.due_date,
                                        ).toLocaleDateString()
                                      : "No date"}
                                  </small>
                                </div>
                                <span className="text-warning fw-bold">
                                  €
                                  {parseFloat(
                                    bill.amount || 0,
                                  ).toLocaleString()}
                                </span>
                              </ListGroup.Item>
                            ))}
                            <ListGroup.Item className="d-flex justify-content-between bg-light fw-bold">
                              <span>Total Bills</span>
                              <span className="text-warning">
                                €
                                {monthlyStats[
                                  monthData.month
                                ]?.totalBills?.toLocaleString() || 0}
                              </span>
                            </ListGroup.Item>
                          </>
                        ) : (
                          <ListGroup.Item className="text-center text-muted py-4">
                            No bills this month
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  </Col>

                  {/* Loans Breakdown */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-info text-white">
                        <FaEuroSign className="me-2" />
                        Loans
                      </Card.Header>
                      <ListGroup
                        variant="flush"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        {monthData.loans.length > 0 ? (
                          <>
                            {monthData.loans.map((loan, idx) => (
                              <ListGroup.Item
                                key={idx}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <div className="d-flex align-items-center gap-2">
                                    {getCategoryIcon(loan.category)}
                                    <strong>
                                      {loan.name || loan.category || "Loan"}
                                    </strong>
                                  </div>
                                  <small className="text-muted">
                                    Due:{" "}
                                    {loan.due_date
                                      ? new Date(
                                          loan.due_date,
                                        ).toLocaleDateString()
                                      : "No date"}
                                  </small>
                                </div>
                                <span className="text-info fw-bold">
                                  €
                                  {parseFloat(
                                    loan.amount || 0,
                                  ).toLocaleString()}
                                </span>
                              </ListGroup.Item>
                            ))}
                            <ListGroup.Item className="d-flex justify-content-between bg-light fw-bold">
                              <span>Total Loans</span>
                              <span className="text-info">
                                €
                                {monthlyStats[
                                  monthData.month
                                ]?.totalLoans?.toLocaleString() || 0}
                              </span>
                            </ListGroup.Item>
                          </>
                        ) : (
                          <ListGroup.Item className="text-center text-muted py-4">
                            No loans this month
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Card>
                  </Col>

                  {/* Monthly Summary */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-success text-white">
                        <FaArrowUp className="me-2" />
                        Monthly Summary
                      </Card.Header>
                      <Card.Body>
                        <ListGroup variant="flush">
                          <ListGroup.Item className="d-flex justify-content-between">
                            <span>Income:</span>
                            <span className="text-success fw-bold">
                              €{monthData.monthlyEarning?.toLocaleString() || 0}
                            </span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between">
                            <span>Total Expenses:</span>
                            <span className="text-danger fw-bold">
                              €
                              {monthlyStats[
                                monthData.month
                              ]?.totalExpenses?.toLocaleString() || 0}
                            </span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between">
                            <span>Savings:</span>
                            <span
                              className={`fw-bold ${
                                monthlyStats[monthData.month]?.savings >= 0
                                  ? "text-success"
                                  : "text-danger"
                              }`}
                            >
                              €
                              {monthlyStats[
                                monthData.month
                              ]?.savings?.toLocaleString() || 0}
                            </span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between">
                            <span>Savings Rate:</span>
                            <span className="text-primary fw-bold">
                              {monthlyStats[monthData.month]?.savingsRate || 0}%
                            </span>
                          </ListGroup.Item>
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            )}
          </Card>
        ))
      )}
    </Container>
  );
};

export default MonthBreakdown;
