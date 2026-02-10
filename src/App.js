// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import SpendingInput from "./components/SpendingInput";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import BillsLoans from "./components/BillsLoans";

function App() {
  const [user, setUser] = useState(null);
  const [monthlyEarning, setMonthlyEarning] = useState(0);
  const [spending, setSpending] = useState([]);

  // Check if user is logged in from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedEarning = localStorage.getItem("monthlyEarning");
    const savedSpending = localStorage.getItem("spending");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedEarning) setMonthlyEarning(parseFloat(savedEarning));
    if (savedSpending) setSpending(JSON.parse(savedSpending));
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Update monthly earning
  const updateMonthlyEarning = (earning) => {
    setMonthlyEarning(earning);
    localStorage.setItem("monthlyEarning", earning.toString());
  };

  // Add new spending entry
  const addSpending = (entry) => {
    const newSpending = [...spending, { ...entry, id: Date.now() }];
    setSpending(newSpending);
    localStorage.setItem("spending", JSON.stringify(newSpending));
  };

  // Calculate total spent
  const totalSpent = spending.reduce((sum, item) => sum + item.amount, 0);

  // Check if 80% threshold is reached
  const isThresholdReached =
    monthlyEarning > 0 && totalSpent / monthlyEarning >= 0.8;

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <Container className="mt-4">
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/"
              element={
                user ? (
                  <Dashboard
                    monthlyEarning={monthlyEarning}
                    spending={spending}
                    totalSpent={totalSpent}
                    isThresholdReached={isThresholdReached}
                    onUpdateEarning={updateMonthlyEarning}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/add-spending"
              element={
                user ? (
                  <SpendingInput
                    onAddSpending={addSpending}
                    monthlyEarning={monthlyEarning}
                    totalSpent={totalSpent}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/analytics"
              element={
                user ? (
                  <Analytics
                    spending={spending}
                    monthlyEarning={monthlyEarning}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/profile"
              element={
                user ? (
                  <Profile user={user} monthlyEarning={monthlyEarning} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/bills-loans"
              element={
                user ? (
                  <BillsLoans spending={spending} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
