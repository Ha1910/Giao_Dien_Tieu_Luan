import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";             // Trang chủ khi chưa login
import Login from "./pages/Auth/Login";

import Profile from "./pages/Auth/Profile";
// Trang chủ sau khi login
import Header from "./components/layout/Header";
import MovieList from "./components/Movie/MovieManagement";
import InputField from "./components/Login/InputField";




function App() {
  return (

    <BrowserRouter>
      <Routes>
        {/* Trang chủ (guest) */}
        <Route path="/" element={<Home />} />
        <Route path="/header" element={<Header></Header>}></Route>
        <Route path="/movielist" element={<MovieList></MovieList>}></Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/input-file" element={<InputField></InputField>} />

        {/* User */}

        <Route path="/profile" element={<Profile />} />


        {/* Products */}

      </Routes>
    </BrowserRouter>

  );
}

export default App;
