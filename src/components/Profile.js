// components/Profile.js
import React from "react";
import { Card, Image, Row, Col, ListGroup } from "react-bootstrap";

const Profile = ({ user, monthlyEarning }) => {
  return (
    <Row className="justify-content-center">
      <Col md={8} lg={6}>
        <Card className="shadow">
          <Card.Body className="text-center">
            <Image
              src={user.imageUrl}
              roundedCircle
              width="150"
              height="150"
              className="mb-3"
            />

            <h2>{user.name}</h2>
            <p className="theme-text-muted">{user.email}</p>

            <hr />

            <Row className="mt-4">
              <Col>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Monthly Budget</Card.Title>
                    <h3 className="text-primary">
                      £{monthlyEarning.toFixed(2)}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card className="mt-4">
              <Card.Body>
                <Card.Title>Account Information</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>User ID:</strong> {user.id}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Login Method:</strong>{" "}
                    {user.token === "demo-token" ? "Demo Mode" : "Google"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Account Type:</strong> Personal
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Profile;
