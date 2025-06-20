// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import './App.css';

// import Header from './components/Header';
// import Home from './components/Home';  // 👈 Add your styled home page
// import AddDoctor from './components/AddDoctor';
// import AddPatient from './components/AddPatient';
// import BookAppointment from './components/BookAppointment';
// import DoctorList from './components/DoctorList';
// import AppointmentList from './components/AppointmentList';
// import LLMChat from './components/LLMChat';
// const [isAuthenticated, setIsAuthenticated] = useState(false);

// export default function App() {
//   return (
//     <Router>
//       <Header /> {/* Always visible */}
//       <div style={{ padding: '1rem' }}>
//         <Routes>
          
//           <Route path="/" element={<Home />} />
//           <Route path="/add-doctor" element={<AddDoctor />} />
//           <Route path="/add-patient" element={<AddPatient />} />
//           <Route path="/book-appointment" element={<BookAppointment />} />
//           <Route path="/doctors" element={<DoctorList />} />
//           <Route path="/appointments" element={<AppointmentList />} />
//           <Route path="/chat" element={<LLMChat />} />
          
//         </Routes>
//       </div>
//     </Router>
//   );
// }
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import AddDoctor from './components/AddDoctor';
import AddPatient from './components/AddPatient';
import BookAppointment from './components/BookAppointment';
import DoctorList from './components/DoctorList';
import AppointmentList from './components/AppointmentList';
import LLMChat from './components/LLMChat';
import Register from './components/Register';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
       
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />

        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-doctor" element={isAuthenticated ? <AddDoctor /> : <Navigate to="/login" />} />
        <Route path="/add-patient" element={isAuthenticated ? <AddPatient /> : <Navigate to="/login" />} />
        <Route path="/book-appointment" element={isAuthenticated ? <BookAppointment /> : <Navigate to="/login" />} />
        <Route path="/doctors" element={isAuthenticated ? <DoctorList /> : <Navigate to="/login" />} />
        <Route path="/appointments" element={isAuthenticated ? <AppointmentList /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <LLMChat /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
