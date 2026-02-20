// components/Dashboard.js
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  ProgressBar,
  Button,
  Modal,
  Form,
  Alert,
  ListGroup,
  Collapse,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaMoneyBill, FaMoneyCheck, FaPrint, FaTrash } from "react-icons/fa";
import { getBillsAndLoansAsSpending } from "../helper/getBillsAndLoansAsSpending";

const Dashboard = ({
  monthlyEarning,
  spending,
  totalSpent,
  isThresholdReached,
  onUpdateEarning,
  bills,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newEarning, setNewEarning] = useState(monthlyEarning);
  const [isRecentSpending, setIsRecentSpending] = useState(false);

  const handleSaveEarning = () => {
    onUpdateEarning(parseFloat(newEarning) || 0);
    setShowModal(false);
  };
  console.log(bills, "bills in dashboard");
  const amountOfBillsandLoans = bills.reduce(
    (sum, bill) => sum + Number(bill.amount),
    0,
  );

  const totalSpending = totalSpent + amountOfBillsandLoans;
  const remaining = monthlyEarning - totalSpending;
  const percentage =
    monthlyEarning > 0 ? (totalSpent / monthlyEarning) * 100 : 0;

  // Get recent spending (last 5 entries)
  const recentSpending = [...spending].reverse().slice(0, 5);
  console.log(recentSpending, "recent spending");

  const billsAndLoansAsSpending = getBillsAndLoansAsSpending(bills);
  console.log(billsAndLoansAsSpending, "bills and loans as spending");

  const allSpending = [...recentSpending, ...billsAndLoansAsSpending];
  console.log(allSpending, "all spending combined");

  const handlePrint = () => {
    const dataToPrint = isRecentSpending ? recentSpending : allSpending;

    // Check if data exists
    if (!dataToPrint || dataToPrint.length === 0) {
      alert(
        `No ${isRecentSpending ? "recent spending" : "spending"} data to print!`,
      );
      return;
    }

    // Calculate total based on the data being printed
    const totalAmount = dataToPrint.reduce((sum, item) => {
      const amount =
        typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
      return sum + (amount || 0);
    }, 0);

    const printContent = `
    <html>
      <head>
        <title>Spending Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
          h2 { text-align: center; color: #666; font-size: 18px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #2c3e50; color: white; padding: 12px; text-align: left; }
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
        <h1>Monthly Spending Report</h1>
        <h2>${isRecentSpending ? "Recent Spending" : "All Spending (Including Bills & Loans)"}</h2>
        <p><strong>Report Date:</strong> ${new Date().toLocaleDateString(
          "en-GB",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        )}</p>
        <p><strong>Items:</strong> ${dataToPrint.length}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th class="amount">Amount (£)</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint
              .map((item) => {
                let amount = item.amount;
                if (typeof amount === "string") {
                  amount = parseFloat(amount) || 0;
                }

                const itemDate = item.date || item.due_date || "N/A";

                let category = item.category || "";
                if (!category && item.type) {
                  category = item.type === "bill" ? "Bill" : "Loan";
                }

                return `
                  <tr>
                    <td>${itemDate}</td>
                    <td>${category}</td>
                    <td>${item.description || item.name || "No description"}</td>
                    <td class="amount">£${typeof amount === "number" ? amount.toFixed(2) : "0.00"}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3"><strong>Total Spending</strong></td>
              <td class="amount"><strong>£${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <!-- Summary Section -->
        <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
          <p><strong>Summary:</strong></p>
          <ul>
            <li>Total Items: ${dataToPrint.length}</li>
            <li>Average per Item: £${(totalAmount / dataToPrint.length).toFixed(2)}</li>
            <li>Report Type: ${isRecentSpending ? "Recent Spending" : "All Spending"}</li>
          </ul>
        </div>
        
        <p style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          Generated by Monthly Spending Tracker
        </p>
      </body>
    </html>
  `;

    // Open print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Monthly Overview</h2>
          <p className="theme-text-muted">
            Track your spending and stay within budget
          </p>
        </Col>
      </Row>

      {isThresholdReached && (
        <Alert variant="warning" className="mb-4">
          ⚠️ <strong>Warning:</strong> You've reached {percentage.toFixed(1)}%
          of your monthly earning! Consider slowing down your spending.
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title>Remaining</Card.Title>
              <h2 className={remaining >= 0 ? "text-success" : "text-danger"}>
                £{remaining.toFixed(2)}
              </h2>
              <p className="text-muted">
                {remaining >= 0 ? "Available to spend" : "Over budget"}
              </p>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Contains two cards stacked vertically */}
        <Col md={8}>
          {/* First Row - Top card */}
          <Row className="mb-3">
            <Col md={12}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Monthly Earning</Card.Title>
                  <h2 className="text-primary">
                    £
                    {typeof monthlyEarning === "number"
                      ? monthlyEarning.toFixed(2)
                      : "0.00"}
                  </h2>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowModal(true)}
                  >
                    Update
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Second Row - Bottom card */}
          <Row>
            <Col md={12}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Total Spent</Card.Title>
                  <h2 className="text-danger">
                    £
                    {typeof totalSpent === "number"
                      ? totalSpent.toFixed(2)
                      : "0.00"}
                  </h2>
                  <div className="mt-3">
                    <ProgressBar
                      now={percentage > 100 ? 100 : percentage}
                      variant={percentage >= 80 ? "warning" : "success"}
                      label={`${typeof percentage === "number" ? percentage.toFixed(1) : "0.0"}%`}
                    />
                    <p className="text-muted mt-2">
                      {typeof percentage === "number"
                        ? percentage.toFixed(1)
                        : "0.0"}
                      % of your monthly earning
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Total Spending Row */}
      <Row className="mb-3">
        <Col md={12}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">
                Total Spending (Bills & Loans Included)
              </Card.Title>
              <h2 className="text-warning display-6">
                £
                {typeof totalSpending === "number"
                  ? totalSpending.toFixed(2)
                  : "0.00"}
              </h2>
              <p className="text-muted mt-3 mb-0">
                This includes all your bills and loan payments for the current
                month
              </p>
              Optional breakdown
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to="/add-spending"
                  variant="primary"
                  size="lg"
                >
                  + Add New Spending
                </Button>
                <Button as={Link} to="/analytics" variant="outline-secondary">
                  View Analytics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>
                  {isRecentSpending
                    ? "Spending"
                    : "All Spending (including Bills & Loans)"}
                </Card.Title>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setIsRecentSpending(!isRecentSpending)}
                  className="d-flex align-items-center gap-2 mx-1"
                >
                  {isRecentSpending ? (
                    <>
                      <FaMoneyCheck /> Show Spending with Bills/Loans
                    </>
                  ) : (
                    <>
                      <FaMoneyBill /> Show Only Spending
                    </>
                  )}
                </Button>
              </div>

              <Collapse in={!isRecentSpending}>
                <div>
                  {allSpending.length > 0 ? (
                    <ListGroup variant="flush">
                      {allSpending.map((item) => (
                        <ListGroup.Item
                          key={item.date + item.description + item.amount}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <strong>{item.description}</strong>
                            <br />
                            <small className="text-muted">
                              {/* Handle both original spending and converted bills/loans */}
                              {item.category || item.type} •
                              {item.date
                                ? new Date(item.date).toLocaleDateString()
                                : "No date"}
                              {item.status && ` • ${item.status}`}
                            </small>
                          </div>
                          <div
                            className={
                              item.category === "Bill"
                                ? "text-primary"
                                : item.category === "Loan"
                                  ? "text-warning"
                                  : "text-danger"
                            }
                          >
                            £
                            {typeof item.amount === "number"
                              ? item.amount.toFixed(2)
                              : parseFloat(item.amount).toFixed(2)}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="ms-2"
                              onClick={() => {
                                // handleDeleteSpending(item.id);
                              }}
                            >
                              {" "}
                              <FaTrash />
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}

                      {/* Show total */}
                      <ListGroup.Item className="d-flex justify-content-between bg-light">
                        <strong>Total:</strong>
                        <strong>
                          £
                          {allSpending
                            .reduce((sum, item) => {
                              const amount =
                                typeof item.amount === "number"
                                  ? item.amount
                                  : parseFloat(item.amount) || 0;
                              return sum + amount;
                            }, 0)
                            .toFixed(2)}
                        </strong>
                      </ListGroup.Item>
                    </ListGroup>
                  ) : (
                    <p className="text-muted">No spending recorded yet</p>
                  )}
                </div>
              </Collapse>

              <Collapse in={isRecentSpending}>
                <div>
                  <h5>Recent Spending</h5>
                  {recentSpending.length > 0 ? (
                    <ListGroup variant="flush">
                      {recentSpending.map((item) => (
                        <ListGroup.Item
                          key={item.id}
                          className="d-flex justify-content-between"
                        >
                          <div>
                            <strong>{item.description}</strong>
                            <br />
                            <small className="text-muted">
                              {item.category}
                            </small>
                          </div>
                          <div className="text-danger fw-bold mx-2">
                            £{Number(item.amount).toFixed(2)}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="ms-2"
                              onClick={() => {
                                // handleDeleteSpending(item.id);
                              }}
                            >
                              {" "}
                              <FaTrash />
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <p className="text-muted">No spending recorded yet</p>
                  )}
                </div>
              </Collapse>
            </Card.Body>
          </Card>
          {isRecentSpending ? (
            <Button
              variant="outline-primary mt-1"
              onClick={handlePrint}
              disabled={!recentSpending || recentSpending.length === 0}
            >
              <FaPrint className="me-2" /> Print recent spending
            </Button>
          ) : (
            <Button
              variant="outline-primary mt-1"
              onClick={handlePrint}
              disabled={!allSpending || allSpending.length === 0}
            >
              <FaPrint className="me-2" /> Print all spending
            </Button>
          )}
        </Col>
      </Row>

      {/* Update Earning Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Monthly Earning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Monthly Earning Amount (£)</Form.Label>
            <Form.Control
              type="number"
              value={newEarning}
              onChange={(e) => setNewEarning(e.target.value)}
              placeholder="Enter your monthly earning"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEarning}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard;
