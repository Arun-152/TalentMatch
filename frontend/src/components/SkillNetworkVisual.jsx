import React, { useEffect, useRef } from 'react';

/**
 * SkillNetworkVisual
 *
 * Animated SVG showing resume skill-nodes on the left resolving via
 * connection lines into a job-requirements cluster on the right.
 * Plays once on mount; stays static afterward.
 *
 * Pure SVG + CSS animation — no external libs.
 */

const RESUME_SKILLS = ['Python', 'React', 'SQL', 'Docker', 'TypeScript'];
const JOB_SKILLS    = ['React', 'Docker', 'AWS', 'SQL', 'Node.js'];

// Fixed layout coordinates (relative to 360×260 viewBox)
const RESUME_NODES = [
  { id: 'r0', label: 'Python',     x: 60,  y: 48  },
  { id: 'r1', label: 'React',      x: 60,  y: 100 },
  { id: 'r2', label: 'SQL',        x: 60,  y: 152 },
  { id: 'r3', label: 'Docker',     x: 60,  y: 204 },
  { id: 'r4', label: 'TypeScript', x: 60,  y: 256 - 26 },
];

const JOB_NODES = [
  { id: 'j0', label: 'React',   x: 300, y: 48  },
  { id: 'j1', label: 'Docker',  x: 300, y: 100 },
  { id: 'j2', label: 'AWS',     x: 300, y: 152 },
  { id: 'j3', label: 'SQL',     x: 300, y: 204 },
  { id: 'j4', label: 'Node.js', x: 300, y: 256 - 26 },
];

// Which resume → job pairs are "matched"
const EDGES = [
  { from: 'r1', to: 'j0', type: 'matched' }, // React  → React
  { from: 'r3', to: 'j1', type: 'matched' }, // Docker → Docker
  { from: 'r2', to: 'j3', type: 'matched' }, // SQL    → SQL
];

const CENTER_X = 180;
const CENTER_Y = 130;

const SkillNetworkVisual = () => {
  // Each edge gets a staggered dash-animation delay
  const edgeDelays = [0.3, 0.55, 0.8];

  return (
    <div className="skill-network-container" aria-hidden="true">
      <svg
        viewBox="0 0 360 260"
        preserveAspectRatio="xMidYMid meet"
        className="skill-network-svg"
      >
        <defs>
          {/* Gradient for matched edges */}
          <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--matched)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--signal)"  stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter for matched nodes */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip for the fade-in effect on connecting lines */}
          <style>{`
            @keyframes drawEdge {
              from { stroke-dashoffset: 300; opacity: 0; }
              to   { stroke-dashoffset: 0;   opacity: 1; }
            }
            @keyframes nodeAppear {
              from { opacity: 0; transform: scale(0.5); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes labelFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes centerPulse {
              0%   { r: 20; opacity: 0; }
              40%  { r: 24; opacity: 1; }
              70%  { r: 22; opacity: 1; }
              100% { r: 22; opacity: 1; }
            }
            @keyframes scoreReveal {
              from { opacity: 0; }
              to   { opacity: 1; }
            }

            .sn-node-resume {
              animation: nodeAppear 0.35s ease-out both;
            }
            .sn-node-job {
              animation: nodeAppear 0.35s ease-out both;
            }
            .sn-label {
              animation: labelFadeIn 0.3s ease-out both;
            }
            .sn-center {
              animation: centerPulse 0.5s ease-out 1.1s both;
            }
            .sn-score-text {
              animation: scoreReveal 0.4s ease-out 1.4s both;
            }
          `}</style>
        </defs>

        {/* ── Background grid lines (subtle) ── */}
        {[0,1,2,3,4,5].map(i => (
          <line
            key={i}
            x1={0} y1={i * 52 + 4} x2={360} y2={i * 52 + 4}
            stroke="var(--border)" strokeWidth="0.5" opacity="0.4"
          />
        ))}

        {/* ── Connector lines (matched edges) ── */}
        {EDGES.map(({ from, to, type }, i) => {
          const rn = RESUME_NODES.find(n => n.id === from);
          const jn = JOB_NODES.find(n => n.id === to);
          const delay = `${edgeDelays[i]}s`;
          // Cubic bezier through center area
          const d = `M ${rn.x + 14} ${rn.y} C ${CENTER_X - 20} ${rn.y}, ${CENTER_X + 20} ${jn.y}, ${jn.x - 14} ${jn.y}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="url(#matchGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset="300"
              style={{
                animation: `drawEdge 0.5s ease-out ${delay} forwards`,
              }}
            />
          );
        })}

        {/* ── Resume skill nodes (left) ── */}
        {RESUME_NODES.map((node, i) => {
          const isMatched = EDGES.some(e => e.from === node.id);
          const delay = `${i * 0.07}s`;
          return (
            <g key={node.id} style={{ transformOrigin: `${node.x}px ${node.y}px` }}>
              <rect
                x={node.x - 36} y={node.y - 11}
                width={72} height={22}
                rx={4}
                fill={isMatched ? 'var(--matched-bg)' : 'var(--surface-2)'}
                stroke={isMatched ? 'var(--matched-border)' : 'var(--border-sub)'}
                strokeWidth="1"
                className="sn-node-resume"
                style={{ animationDelay: delay, transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <text
                x={node.x} y={node.y + 4.5}
                textAnchor="middle"
                fontSize="8.5"
                fill={isMatched ? '#3FB950' : 'var(--text-muted)'}
                fontFamily="var(--font-sans)"
                fontWeight={isMatched ? '600' : '400'}
                className="sn-label"
                style={{ animationDelay: `${parseFloat(delay) + 0.08}s` }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* ── Job skill nodes (right) ── */}
        {JOB_NODES.map((node, i) => {
          const isMatched = EDGES.some(e => e.to === node.id);
          const delay = `${i * 0.07 + 0.1}s`;
          return (
            <g key={node.id} style={{ transformOrigin: `${node.x}px ${node.y}px` }}>
              <rect
                x={node.x - 36} y={node.y - 11}
                width={72} height={22}
                rx={4}
                fill={isMatched ? 'var(--signal-dim)' : 'var(--surface-2)'}
                stroke={isMatched ? 'rgba(45,212,191,0.35)' : 'var(--border-sub)'}
                strokeWidth="1"
                className="sn-node-job"
                style={{ animationDelay: delay, transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <text
                x={node.x} y={node.y + 4.5}
                textAnchor="middle"
                fontSize="8.5"
                fill={isMatched ? 'var(--signal)' : 'var(--text-muted)'}
                fontFamily="var(--font-sans)"
                fontWeight={isMatched ? '600' : '400'}
                className="sn-label"
                style={{ animationDelay: `${parseFloat(delay) + 0.08}s` }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* ── Center convergence node ── */}
        <circle
          cx={CENTER_X} cy={CENTER_Y}
          fill="var(--surface)"
          stroke="var(--signal)"
          strokeWidth="1.5"
          filter="url(#glow)"
          className="sn-center"
        />
        <text
          x={CENTER_X} y={CENTER_Y + 4}
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill="var(--signal)"
          fontFamily="var(--font-mono)"
          className="sn-score-text"
        >
          match
        </text>

        {/* ── Column labels ── */}
        <text x="60" y="12" textAnchor="middle" fontSize="7" fill="var(--text-subtle)" fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="0.08em">RESUME</text>
        <text x="300" y="12" textAnchor="middle" fontSize="7" fill="var(--text-subtle)" fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="0.08em">JOB ROLE</text>
      </svg>
    </div>
  );
};

export default SkillNetworkVisual;
