// components/Login.js
import React, { useState } from "react";
import {
  Card,
  Button,
  Container,
  Row,
  Col,
  Form,
  Alert,
  Tab,
  Tabs,
} from "react-bootstrap";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import SimpleThemeSwitcher from "./SimpleThemeSwitcher";
import { authAPI } from "../services/api";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("google");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginError, setLoginError] = useState("");

  // Get Google Client ID from environment variables
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = clientId && clientId !== "GOOGLE_CLIENT_ID";

  // Handle Google Login Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoginError("");
      setIsSubmitting(true);
      // Decode JWT token
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
      console.log("📤 Sending Google login to backend...");
      const response = await authAPI.googleLogin({
        googleId: userData.sub,
        email: userData.email,
        name: userData.name,
        imageUrl: userData.picture,
      });

      console.log("📥 Google login response:", response.data);

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);
      navigate("/");
    } catch (error) {
      console.error("Error decoding token:", error);
      setLoginError("Google login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google Login Error
  const handleGoogleError = () => {
    setLoginError(
      "Google login failed. Please try again or use email sign up.",
    );
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
    setLoginError("");
  };

  // Handle Form Submit (Sign Up / Login)
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      console.log("📤 Sending registration request...");

      // Call backend API
      const response = await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log("📥 Registration response:", response.data);

      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Update app state
      onLogin(user);

      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("❌ Registration error:", error);

      // Handle specific error messages from backend
      const errorMessage =
        error.response?.data?.error || "Registration failed. Please try again.";

      if (errorMessage.includes("already exists")) {
        setErrors({
          ...errors,
          email: "Email already registered. Please login instead.",
        });
      } else {
        setLoginError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 👇 FIXED: Handle Login with REAL API
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setErrors({
        email: formData.email.trim() === "" ? "Email is required" : "",
        password: formData.password === "" ? "Password is required" : "",
      });
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      console.log("📤 Sending login request...");

      // Call backend API
      const response = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log("📥 Login response:", response.data);

      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Update app state
      onLogin(user);

      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("❌ Login error:", error);

      const errorMessage =
        error.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isLoginMode, setIsLoginMode] = useState(false);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="mb-1">
            {" "}
            <SimpleThemeSwitcher />{" "}
          </div>

          <Card className="shadow border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="display-4 mb-3">💰</div>
                <h1 className="h2 fw-bold">Monthly Spending Tracker</h1>
                <p className="text-muted mt-2">
                  Sign in to track your expenses, bills, and loans
                </p>
              </div>

              {/* Error Alert */}
              {loginError && (
                <Alert
                  variant="danger"
                  className="mb-4"
                  onClose={() => setLoginError("")}
                  dismissible
                >
                  {loginError}
                </Alert>
              )}

              {/* Google Not Configured Warning */}
              {!isGoogleConfigured && (
                <Alert variant="warning" className="mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-3">⚠️</div>
                    <div className="flex-grow-1">
                      <strong>Google Login Not Configured</strong>
                      <div className="small mt-1">
                        Add <code>REACT_APP_GOOGLE_CLIENT_ID</code> to your .env
                        file to enable Google login.
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Login Options Tabs */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                fill
              >
                {/* Google Login Tab */}
                <Tab eventKey="google" title="Sign in with Google">
                  <div className="text-center py-4">
                    {isGoogleConfigured ? (
                      <GoogleOAuthProvider clientId={clientId}>
                        <div className="d-flex justify-content-center">
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            shape="rectangular"
                            size="large"
                            text="signin_with"
                            width="300"
                            disabled={isSubmitting}
                          />
                        </div>
                      </GoogleOAuthProvider>
                    ) : (
                      <div className="py-4">
                        <Button
                          variant="outline-secondary"
                          size="lg"
                          disabled
                          className="px-5"
                        >
                          <i className="fab fa-google me-2"></i>
                          Google Login Unavailable
                        </Button>
                        <p className="text-muted small mt-3">
                          Configure Google Client ID to enable this option
                        </p>
                      </div>
                    )}
                    {isSubmitting && activeTab === "google" && (
                      <div className="mt-3">
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing in with Google...
                      </div>
                    )}
                    <p className="text-muted small mt-3">
                      Securely sign in with your Google account
                    </p>
                  </div>
                </Tab>

                {/* Email Sign Up / Login Tab */}
                <Tab
                  eventKey="email"
                  title={
                    isLoginMode ? "Sign in with Email" : "Sign up with Email"
                  }
                >
                  <Form
                    onSubmit={isLoginMode ? handleLogin : handleRegister}
                    className="py-3"
                  >
                    {!isLoginMode && (
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Full Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className={`py-2 ${errors.name ? "is-invalid" : ""}`}
                          disabled={isSubmitting}
                        />
                        {errors.name && (
                          <Form.Control.Feedback type="invalid">
                            {errors.name}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={`py-2 ${errors.email ? "is-invalid" : ""}`}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Password <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={
                          isLoginMode
                            ? "Enter your password"
                            : "Create a password"
                        }
                        className={`py-2 ${errors.password ? "is-invalid" : ""}`}
                        disabled={isSubmitting}
                      />
                      {errors.password && (
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      )}
                      {!isLoginMode && (
                        <Form.Text className="text-muted">
                          Minimum 6 characters
                        </Form.Text>
                      )}
                    </Form.Group>

                    {!isLoginMode && (
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">
                          Confirm Password{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className={`py-2 ${errors.confirmPassword ? "is-invalid" : ""}`}
                          disabled={isSubmitting}
                        />
                        {errors.confirmPassword && (
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    )}

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-3 fw-bold"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {isLoginMode
                            ? "Signing in..."
                            : "Creating Account..."}
                        </>
                      ) : isLoginMode ? (
                        "Sign In"
                      ) : (
                        "Create Account & Sign In"
                      )}
                    </Button>

                    {!isLoginMode && (
                      <p className="text-center text-muted small mt-4 mb-0">
                        By creating an account, you agree to our Terms of
                        Service and Privacy Policy
                      </p>
                    )}
                  </Form>
                </Tab>
              </Tabs>

              {/* Toggle between Login and Register */}
              {activeTab === "email" && (
                <div className="text-center mt-3">
                  <span className="text-muted">
                    {isLoginMode
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </span>
                  <Button
                    variant="link"
                    className="p-0 fw-semibold ms-1"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      setFormData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                      });
                      setErrors({});
                      setLoginError("");
                    }}
                  >
                    {isLoginMode ? "Sign Up" : "Sign In"}
                  </Button>
                </div>
              )}

              {/* Features Summary */}
              <div className="mt-5 pt-4 border-top">
                <Row className="text-center g-4">
                  <Col xs={6}>
                    <div className="bg-light p-3 rounded">
                      <div className="fs-4 mb-2">💰</div>
                      <h6 className="mb-1">Budget Tracking</h6>
                      <small className="text-muted">Set monthly limits</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="bg-light p-3 rounded">
                      <div className="fs-4 mb-2">📊</div>
                      <h6 className="mb-1">Analytics</h6>
                      <small className="text-muted">Visual insights</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="bg-light p-3 rounded">
                      <div className="fs-4 mb-2">📄</div>
                      <h6 className="mb-1">Bills & Loans</h6>
                      <small className="text-muted">Track payments</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="bg-light p-3 rounded">
                      <div className="fs-4 mb-2">🔔</div>
                      <h6 className="mb-1">Smart Alerts</h6>
                      <small className="text-muted">80% warnings</small>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Local Storage Notice */}
              <div className="mt-4 text-center">
                <small className="text-muted">
                  🔒 All data is stored locally in your browser for demo
                  purposes.
                  {isGoogleConfigured &&
                    " Google login provides secure authentication."}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
