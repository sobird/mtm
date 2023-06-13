import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/register' element={<Register />}></Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
