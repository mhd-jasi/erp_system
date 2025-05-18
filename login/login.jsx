import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import logn from "../photos/lgo.png";
import logo from "../photos/logo.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Forgot password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
  
    // Show loading state
    setLoading(true);
  
    // Send the login request to the backend
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          // Successfully logged in
          setSuccess(true);
          setError("");
          
          // Save the token to localStorage (you can use it for further API requests)
          localStorage.setItem("token", data.token);
  
          // Optional: Save email and password if "Remember me" is checked
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
            localStorage.setItem("rememberedPassword", password);
          } else {
            localStorage.removeItem("rememberedEmail");
            localStorage.removeItem("rememberedPassword");
          }
  
          // Call the onLogin function to update app state after successful login
          setTimeout(() => {
            setLoading(false);
            // Decode JWT token to get user role
            try {
              const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
              const role = tokenPayload.role || null;
              onLogin(role);
            } catch (e) {
              onLogin(null);
            }
          }, 3000);
        } else {
          // Show error message if credentials are invalid
          setError(data.message || "Login failed. Please try again.");
          setSuccess(false);
          setLoading(false);
        }
      })
      .catch((err) => {
        // Handle unexpected errors
        setError("An error occurred. Please try again later.");
        setSuccess(false);
        setLoading(false);
      });
  };

  // Handle forgot password email submission to request OTP
  const handleForgotPasswordRequest = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    fetch('http://localhost:5000/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === 'OTP sent') {
          setSuccess(true);
          setError("");
        } else {
          setError(data.message || 'Failed to send OTP');
          setSuccess(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('An error occurred. Please try again later.');
        setSuccess(false);
        setLoading(false);
      });
  };

  // Handle OTP and new password submission to reset password
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    fetch('http://localhost:5000/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === 'Password reset successful') {
          setSuccess(true);
          setError("");
          setForgotPasswordMode(false);
          setOtp("");
          setNewPassword("");
          setConfirmNewPassword("");
          setForgotEmail("");
        } else {
          setError(data.message || 'Failed to reset password');
          setSuccess(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('An error occurred. Please try again later.');
        setSuccess(false);
        setLoading(false);
      });
  };
  

  const handleSignupSubmit = (e) => {
    e.preventDefault();
  
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    // Determine role (can be based on form input or preset logic)
    const role = email === 'jasimp412@gmail.com' ? 'admin' : 'user';
  
    // Show loading state
    setLoading(true);
  
    // Send the signup request to the backend
    fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, role }), // Send role as part of the signup data
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'User registered successfully') {
          // Successfully registered
          setSuccess(true);
          setError("");
  
          // Optionally, you can log the user in immediately after signup by sending login request
          setTimeout(() => {
            setShowSignup(false); // Hide the signup form
          }, 3000);
        } else {
          // Show error message if signup fails
          setError(data.message || "Signup failed. Please try again.");
          setSuccess(false);
        }
  
        setLoading(false);
      })
      .catch((err) => {
        setError("An error occurred. Please try again later.");
        setSuccess(false);
        setLoading(false);
      });
  };
  

  return (
    <div className="admin-login-page">
      {loading && <div className="background-blur-overlay"></div>}
      <div className="login-form-container">
        {!loading && !showSignup && !forgotPasswordMode && (
          <form className="login-form" onSubmit={handleSubmit}>
            <img src={logn} alt="Logo" className="login-logo" />
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Login successful! Welcome, Admin.</p>}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter  email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-group" style={{ position: "relative" }}>
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "32px",
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "15px",
                  color: "#666",
                }}
              >
                {showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
              </span>
            </div>

            <div className="input-group-remember-me">
              <label htmlFor="rememberMe">Remember me</label>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            </div>

            <button className="login-btn" type="submit">Login</button>

            <div className="signup-option">
              <p>
                New customer?{" "}
                <button
                  type="button"
                  onClick={() => {
                    // Clear login fields
                    setEmail("");
                    setPassword("");
                    setRememberMe(false);
                    setError("");
                    setSuccess(false);
                    setShowSignup(true);
                  }}style={{background:'none',color:'blue',border:'none',fontSize:'17px'}}
                >
                  Sign up here
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setError("");
                    setSuccess(false);
                    setForgotEmail("");
                    setOtp("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, marginTop: '10px' }}
                >
                  Forgot Password?
                </button>
              </p>
            </div>
          </form>
        )}

        {!loading && showSignup && (
          <form className="login-form" onSubmit={handleSignupSubmit}>
            <img src={logn} alt="Logo" className="login-logo" />
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Signup successful!</p>}

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group password-group" style={{ position: "relative" }}>
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "32px",
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '15px',
                  color: '#666',
                }}
              >
                {showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
              </span>
            </div>

            <div className="input-group" style={{ position: "relative" }}>
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "32px",
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '15px',
                  color: '#666',
                }}
              >
                {showConfirmPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
              </span>
            </div>

            <button className="login-btn" type="submit" >Sign Up</button>

            <div className="signup-option">
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    // Clear signup fields
                    setUsername("");
                    setConfirmPassword("");
                    setError("");
                    setSuccess(false);
                    setShowSignup(false);
                  }} style={{background:'none',color:'blue',border:'none',fontSize:'17px'}}
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        )}

        {!loading && forgotPasswordMode && (
          <div className="login-form">
            <img src={logn} alt="Logo" className="login-logo" />
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Success! Please check your email.</p>}

            {!success && (
              <form onSubmit={handleForgotPasswordRequest}>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="login-btn" type="submit">Send OTP</button>
              </form>
            )}

            {success && (
              <form onSubmit={handleResetPassword}>
                <div className="input-group">
                  <label>OTP</label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group password-group" style={{ position: "relative" }}>
                  <label>New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "18px",
                      top: "32px",
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "15px",
                      color: "#666",
                    }}
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                  </span>
                </div>
                <div className="input-group password-group" style={{ position: "relative" }}>
                  <label>Confirm New Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "18px",
                      top: "32px",
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: "15px",
                      color: "#666",
                    }}
                  >
                    {showConfirmPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                  </span>
                </div>
                <button className="login-btn" type="submit">Reset Password</button>
              </form>
            )}

            <div className="signup-option">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setError("");
                  setSuccess(false);
                  setForgotEmail("");
                  setOtp("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }} style={{
                  backgroundColor: "#4CAF50",border:'none',margin:'10px',padding:'5px',color:'white'
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-img">
            <h2>
              <img src={logo} alt="Loading" />
              <span>LogiGo</span>
            </h2>
          </div>
          <div className="loading-circle"></div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
