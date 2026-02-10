// components/Login.js - FIXED VERSION
import React, { useState } from "react";
import { Card, Button, Container, Row, Col, Alert } from "react-bootstrap";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const Login = ({ onLogin }) => {
  const [showAlert, setShowAlert] = useState(false);

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  console.log("Google Client ID available:", !!clientId);

  const handleLoginSuccess = (credentialResponse) => {
    console.log("Google login success:", credentialResponse);

    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const userData = JSON.parse(jsonPayload);

      const formattedUser = {
        id: userData.sub,
        name: userData.name,
        email: userData.email,
        imageUrl: userData.picture,
        token: credentialResponse.credential,
      };

      onLogin(formattedUser);
    } catch (error) {
      console.error("Error decoding token:", error);
      handleDemoLogin();
    }
  };

  const handleLoginFailure = () => {
    console.error("Google Login Failed");
    setShowAlert(true);

    // Auto-fallback to demo mode after 3 seconds
    setTimeout(() => {
      handleDemoLogin();
    }, 3000);
  };

  const handleDemoLogin = () => {
    const mockUser = {
      id: "demo-user-" + Date.now(),
      name: "Demo User",
      email: "demo@example.com",
      imageUrl: `https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff&bold=true&size=150`,
      token: "demo-token-" + Date.now(),
    };
    onLogin(mockUser);
  };

  // If no client ID, show only demo mode
  if (
    !clientId ||
    clientId === "your_actual_client_id_here.apps.googleusercontent.com"
  ) {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow">
              <Card.Body className="text-center">
                <h2 className="mb-4">💰 Monthly Spending Tracker</h2>
                <Alert variant="warning" className="mb-4">
                  <strong>Google Login Not Configured</strong>
                  <div className="mt-2 small">
                    Please add your Google Client ID to <code>.env</code> file
                  </div>
                </Alert>

                <p className="theme-text-muted mb-4">
                  Track your expenses and analyze your spending habits
                </p>

                <Button
                  variant="primary"
                  className="w-100 mb-4 py-3"
                  onClick={handleDemoLogin}
                >
                  🚀 Start Demo Mode
                </Button>

                <div className="mt-4 theme-text-muted small">
                  <p>To enable Google login:</p>
                  <ol className="text-start small">
                    <li>Get client ID from Google Cloud Console</li>
                    <li>
                      Add to <code>.env</code> as REACT_APP_GOOGLE_CLIENT_ID
                    </li>
                    <li>Restart the app</li>
                  </ol>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow">
              <Card.Body className="text-center">
                <h2 className="mb-4">Monthly Spending Tracker</h2>

                {showAlert && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setShowAlert(false)}
                  >
                    Google login failed. Switching to demo mode...
                  </Alert>
                )}

                <p className="theme-text-muted mb-4">
                  Track your expenses and analyze your spending habits
                </p>

                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginFailure}
                  theme="filled_blue"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  width="100%"
                  className="w-100 mb-3"
                />

                <hr />

                <Button
                  variant="outline-primary"
                  className="w-100"
                  onClick={handleDemoLogin}
                >
                  Try Demo Mode Instead
                </Button>

                <div className="mt-4 theme-text-muted small">
                  <p>Use "Try Demo Mode" for instant access without Google</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </GoogleOAuthProvider>
  );
};

export default Login;
