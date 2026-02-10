// components/Analytics.js
import { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  ProgressBar,
  Button,
  Collapse,
} from "react-bootstrap";
import { FaPrint, FaChartPie, FaList } from "react-icons/fa";
import PieChartComponent from "./PieChartComponent";

const Analytics = ({ spending, monthlyEarning }) => {
  const [showPieChart, setShowPieChart] = useState(false);
  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals = {};
    spending.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + item.amount;
    });
    return totals;
  }, [spending]);

  // Calculate percentages
  const categoryPercentages = useMemo(() => {
    const percentages = {};
    Object.keys(categoryTotals).forEach((category) => {
      percentages[category] =
        monthlyEarning > 0
          ? (categoryTotals[category] / monthlyEarning) * 100
          : 0;
    });
    return percentages;
  }, [categoryTotals, monthlyEarning]);

  // Get top categories
  const topCategories = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [categoryTotals]);

  const pieChartData = useMemo(() => {
    return {
      labels: topCategories.map(([category]) => category),
      amounts: topCategories.map(([, amount]) => amount),
    };
  }, [topCategories]);

  // Calculate total spent
  const totalSpent = spending.reduce((sum, item) => sum + item.amount, 0);
  const overallPercentage =
    monthlyEarning > 0 ? (totalSpent / monthlyEarning) * 100 : 0;

  const handleSpendingPrint = () => {
    if (!spending || spending.length === 0) {
      alert("No spending data to print!");
      return;
    }
    const printContent = `
      <html>
        <head>
          <title>Spending Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }  
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #2c3e50; color: white; padding: 12px; text-align: left; justify-content: space-between; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; background-color: #f8f9fa; }
            .amount { text-align: right; }
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Spending Report</h1>
          <p><strong>Report Date:</strong> ${new Date().toLocaleDateString(
            "en-GB",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          )}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>    
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${spending
                .map(
                  (item) => `
                  <tr>

                    <td>${item.date}</td>
                    <td>${item.description}</td>
                    <td>${item.category}</td>
                    <td class="amount">£${item.amount.toFixed(2)}</td>
                  </tr>
                `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="3"><strong>Total Spending</strong></td>
                <td class="amount">£${totalSpent.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>    
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Spending Analytics</h2>
          <p className="theme-text-muted">Analyze your spending by category</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Overall Spending</Card.Title>
              <div className="text-center mb-3">
                <h3 className="text-primary">£{totalSpent.toFixed(2)}</h3>
                <p className="text-muted">
                  of £{monthlyEarning.toFixed(2)} monthly earning
                </p>
              </div>
              <ProgressBar
                now={overallPercentage > 100 ? 100 : overallPercentage}
                variant={overallPercentage >= 80 ? "warning" : "success"}
                label={`${overallPercentage.toFixed(1)}%`}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Top Categories</Card.Title>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowPieChart(!showPieChart)}
                  className="d-flex align-items-center gap-2"
                >
                  {showPieChart ? (
                    <>
                      <FaList /> Show List
                    </>
                  ) : (
                    <>
                      <FaChartPie /> Show Chart
                    </>
                  )}
                </Button>
              </div>

              <Collapse in={!showPieChart}>
                <div>
                  {topCategories.length > 0 ? (
                    topCategories.map(([category, amount]) => (
                      <div key={category} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-medium">{category}</span>
                          <span className="text-primary fw-bold">
                            £{amount.toFixed(2)}
                          </span>
                        </div>
                        <ProgressBar
                          now={categoryPercentages[category] || 0}
                          variant="info"
                          label={`${(categoryPercentages[category] || 0).toFixed(1)}%`}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center">
                      No spending data available
                    </p>
                  )}
                </div>
              </Collapse>

              <Collapse in={showPieChart}>
                <div>
                  {topCategories.length > 0 ? (
                    <PieChartComponent
                      data={pieChartData.amounts}
                      labels={pieChartData.labels}
                    />
                  ) : (
                    <p className="text-muted text-center">No data for chart</p>
                  )}
                </div>
              </Collapse>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Detailed Spending</Card.Title>
              {spending.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...spending].reverse().map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{item.description}</td>
                        <td>
                          <span className="badge bg-info">{item.category}</span>
                        </td>
                        <td className="text-danger">
                          £{item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="theme-text-muted text-center">
                  No spending records found
                </p>
              )}
            </Card.Body>
          </Card>
          <Button
            variant="outline-primary mt-1"
            onClick={handleSpendingPrint}
            disabled={!spending || spending.length === 0}
          >
            <FaPrint className="me-2" /> Print recent spending
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default Analytics;
