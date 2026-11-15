import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import Logo from './Logo'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <a href="#main" className="visually-hidden-focusable btn btn-light position-absolute m-2">
        Skip to content
      </a>
      <nav className="navbar navbar-expand-md navbar-dark bg-brand" aria-label="Main">
        <div className="container">
          <NavLink to="/search" className="navbar-brand p-0">
            <Logo light />
          </NavLink>
          <ul className="navbar-nav flex-row gap-3 me-auto ms-md-4">
            <li className="nav-item">
              <NavLink to="/search" className="nav-link">Search</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/shortlist" className="nav-link">My shortlist</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/profile" className="nav-link">Profile</NavLink>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 d-none d-md-inline">Hi, {user?.firstName}</span>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>
      <main id="main" className="container py-4">
        <Outlet />
      </main>
    </>
  )
}
