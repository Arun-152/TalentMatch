import React from 'react';
import { Link, NavLink } from 'react-router-dom';

/**
 * AppHeader — sticky frosted navigation bar.
 * History link has been removed; the app is now a single-flow tool
 * (upload → analyze → result) with no shared listing.
 */
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
    </nav>
  </header>
);

export default AppHeader;
