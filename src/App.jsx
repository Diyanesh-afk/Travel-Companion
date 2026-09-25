import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Stories from "./pages/Stories";
import Ask from "./pages/Ask";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NewStory from "./pages/NewStory";
import DestinationDetail from "./pages/DestinationDetail";
import Admin from "./pages/Admin";

import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/explore"
                    element={<Explore />}
                />

                <Route
                    path="/stories"
                    element={<Stories />}
                />

                <Route
                    path="/stories/new"
                    element={<NewStory />}
                />

                <Route
                    path="/ask"
                    element={<Ask />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />
                <Route path="/destinations/:id" element={<DestinationDetail/>} />
                <Route path="/admin-dashboard" element={<Admin />} />


                <Route
                path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}