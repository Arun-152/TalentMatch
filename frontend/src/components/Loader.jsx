import React from 'react';

const ARC_R = 18;
const CIRC = 2 * Math.PI * ARC_R;

const Loader = ({ message = 'Loading...' }) => (
  <div className="loader-overlay" role="status" aria-live="polite">
    <div className="loader-content">
      <svg
        className="loader-arc"
        width="44"
        height="44"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="22" cy="22" r={ARC_R}
          fill="none"
          stroke="var(--border-sub)"
          strokeWidth="3"
        />
        {/* Spinning fill — ~75% of circumference */}
        <circle
          cx="22" cy="22" r={ARC_R}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${CIRC * 0.75} ${CIRC * 0.25}`}
          strokeDashoffset={CIRC * 0.25}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <p className="loader-message">{message}</p>
    </div>
  </div>
);

export default Loader;
