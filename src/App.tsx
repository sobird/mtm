import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path='/login' element={<Login />}></Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
