// import React from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios'; // ✅ Import axios
// import './Header.css';

// export default function Header({ setIsAuthenticated }) {
//   return (
//     <header className="header">
//       <h2>Admin Dashboard</h2>
//       <nav className="nav-links">
//         <button onClick={async () => {
//           try {
//             await axios.post('/api/logout');
//             setIsAuthenticated(false); // ✅ Works because it's passed from App
//           } catch (err) {
//             console.error('Logout failed:', err);
//           }
//         }}>
//           Logout
//         </button>

//         <Link to="/">🏠 Home</Link>
//         <Link to="/register">📝 Register</Link>

//         <Link to="/add-doctor">➕ Doctor</Link>
//         <Link to="/add-patient">➕ Patient</Link>
//         <Link to="/book-appointment">📅 Book</Link>
//         <Link to="/doctors">👨‍⚕️ View Doctors</Link>
//         <Link to="/appointments">📋 Appointments</Link>
//         <Link to="/chat">🤖 Chat</Link>
//       </nav>
//     </header>
//   );
// }
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import axios from 'axios';

export default function Header({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setIsAuthenticated(false);
      navigate('/');  // redirect to home
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">🏥 MCP Assistant</Link>
      </div>
      <div className="header-right">
        <Link to="/" className="header-btn">🏠 Home</Link>
        <button onClick={handleLogout} className="header-btn logout-btn">🚪 Logout</button>
      </div>
    </header>
  );
}
