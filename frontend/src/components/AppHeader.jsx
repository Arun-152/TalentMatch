import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const AppHeader = () => (
  <header className="app-header">
    <Link to="/" className="wordmark" aria-label="TalentMatch AI — Home">
      <span className="wordmark-dot" aria-hidden="true" />
      TalentMatch
    </Link>
    <nav className="nav-links" aria-label="Main navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        New Analysis
      </NavLink>
      <NavLink
        to="/history"
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        History
      </NavLink>
    </nav>
  </header>
);

export default AppHeader;
