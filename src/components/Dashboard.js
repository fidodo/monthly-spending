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
} from "react-bootstrap";
import { Link } from "react-router-dom";

const Dashboard = ({
  monthlyEarning,
  spending,
  totalSpent,
  isThresholdReached,
  onUpdateEarning,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newEarning, setNewEarning] = useState(monthlyEarning);

  const handleSaveEarning = () => {
    onUpdateEarning(parseFloat(newEarning) || 0);
    setShowModal(false);
  };

  const remaining = monthlyEarning - totalSpent;
  const percentage =
    monthlyEarning > 0 ? (totalSpent / monthlyEarning) * 100 : 0;

  // Get recent spending (last 5 entries)
  const recentSpending = [...spending].reverse().slice(0, 5);

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h2>Monthly Overview</h2>
          <p className="text-muted">
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

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Monthly Earning</Card.Title>
              <h2 className="text-primary">£{monthlyEarning.toFixed(2)}</h2>
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

        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Total Spent</Card.Title>
              <h2 className="text-danger">£{totalSpent.toFixed(2)}</h2>
              <div className="mt-3">
                <ProgressBar
                  now={percentage > 100 ? 100 : percentage}
                  variant={percentage >= 80 ? "warning" : "success"}
                  label={`${percentage.toFixed(1)}%`}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
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
              <Card.Title>Recent Spending</Card.Title>
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
                        <small className="text-muted">{item.category}</small>
                      </div>
                      <div className="text-danger">
                        £{item.amount.toFixed(2)}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No spending recorded yet</p>
              )}
            </Card.Body>
          </Card>
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
