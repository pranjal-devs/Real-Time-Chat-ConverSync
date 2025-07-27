import { useState, useEffect } from "react";
import io from "socket.io-client";
import Chat from "./components/Chat";
import Auth from "./components/Auth";

const PORT = import.meta.env.PORT || '3001';
const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://localhost:${PORT}`;
const socket = io(VITE_SERVER_URL);

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    
    if (savedToken && savedUsername) {
      // Verify token is still valid
      fetch("http://localhost:3001/profile", {
        headers: {
          "Authorization": `Bearer ${savedToken}`
        }
      })
      .then(response => {
        if (response.ok) {
          setToken(savedToken);
          setUsername(savedUsername);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("username");
        }
      })
      .catch(() => {
        // Network error, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("username");
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (username: string, token: string) => {
    setUsername(username);
    setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowChat(false);
    setUsername("");
    setRoom("");
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    socket.disconnect();
    socket.connect();
  };

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {!isAuthenticated ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : !showChat ? (
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Header with logout */}
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">ConverSync</h1>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-500 font-medium focus:outline-none"
                >
                  Logout
                </button>
              </div>
              <p className="text-gray-600 text-sm">Welcome back, {username}!</p>
              <p className="text-gray-600 text-sm">Join a room to start chatting</p>
            </div>

            {/* Room Form */}
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Room ID"
                  onChange={(e) => setRoom(e.target.value)}
                  value={room}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={joinRoom}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {/* Chat Header with Back and Logout buttons */}
          <div className="bg-white rounded-t-lg shadow-lg border border-gray-300 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowChat(false)}
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none"
              >
                ← Back to Rooms
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {username}
              </h2>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-500 font-medium focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
          <Chat socket={socket} username={username} room={room} />
        </div>
      )}
    </div>
  );
}

export default App;