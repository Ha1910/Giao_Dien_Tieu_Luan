import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import Header from "./components/layout/Header";
import MovieList from "./components/Movie/MovieManagement";
import InputField from "./components/Login/InputField";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null); // Giả sử có state user

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      {/* Header sẽ hiển thị trên các trang cần thiết */}
      <Routes>
        {/* Trang không cần Header */}
        <Route path="/" element={<Login />} />
        <Route path="/input-file" element={<InputField />} />

        {/* Trang cần Header */}
        <Route
          path="/home"
          element={
            <div>
              <Header
                user={user}
                onMenuToggle={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              <Home />
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div>
              <Header
                user={user}
                onMenuToggle={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              <Profile />
            </div>
          }
        />
        <Route
          path="/movielist"
          element={
            <div>
              <Header
                user={user}
                onMenuToggle={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              <MovieList />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;