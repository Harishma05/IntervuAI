import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  }

  return (
    <nav className="site-nav">
      <Link className="brand" to="/" aria-label="IntervuAI home">
        <span className="brand-mark">i.</span>IntervuAI
      </Link>
      <div className="nav-links">
        <Link to="/interview" aria-current={pathname === "/interview" ? "page" : undefined}>Practice</Link>
        <Link to="/history" aria-current={pathname === "/history" ? "page" : undefined}>My progress</Link>
        <span className="nav-user">{user?.displayName}</span>
        <button className="nav-logout" onClick={handleLogout}>Sign out</button>
        {pathname !== "/interview" && <Link className="nav-cta" to="/interview">Start practicing <span aria-hidden="true">↗</span></Link>}
      </div>
    </nav>
  );
}

export default Navbar;
