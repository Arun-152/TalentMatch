import React, { useEffect, useRef, useState } from 'react';

/**
 * MatchDiagram
 *
 * Radial/bipartite node diagram showing how the compatibility score
 * was derived. Resume skills are nodes on the left, job requirements
 * on the right. Matched pairs are connected with a teal arc; missing
 * job skills show a dashed unfilled stub on the right.
 *
 * On mount: nodes appear → edges draw → score counts up.
 * After animation completes: everything is static and calm.
 */

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const W = 280;
const H = 280;
const CX = W / 2;
const CY = H / 2;
const RESUME_R = 98; // radius for resume skill nodes
const JOB_R    = 98; // radius for job skill nodes

// Spread nodes evenly across a 200° arc on left / right hemispheres
function layoutNodes(skills, side, totalSlots) {
  const arcSpan = Math.min(180, totalSlots * 30);
  const startDeg = side === 'left' ? 180 - arcSpan / 2 : 360 - arcSpan / 2;
  return skills.map((name, i) => {
    const fraction = totalSlots === 1 ? 0.5 : i / (totalSlots - 1);
    const deg = startDeg + fraction * arcSpan;
    const r = side === 'left' ? RESUME_R : JOB_R;
    const { x, y } = polarToCartesian(CX, CY, r, deg);
    return { name, x, y, id: `${side}-${i}` };
  });
}

const ANIM_DURATION = 1100; // ms for count-up

const MatchDiagram = React.memo(({ matchedSkills = [], missingSkills = [], score = 0 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const allJobSkills = [...matchedSkills, ...missingSkills];
  const allResumeSkills = [...matchedSkills]; // resume shows only its matched ones for clarity + extras
  // Add a few "extras" from resume that don't appear in job
  const resumeExtras = missingSkills.slice(0, Math.min(2, missingSkills.length));
  const resumeNodes = layoutNodes([...matchedSkills, ...resumeExtras], 'left', Math.max(matchedSkills.length + resumeExtras.length, 1));
  const jobNodes    = layoutNodes(allJobSkills, 'right', Math.max(allJobSkills.length, 1));

  // Animate count-up on mount
  useEffect(() => {
    const target = Math.min(100, Math.max(0, score));
    startRef.current = null;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    // Delay to let nodes appear first
    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, 500);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const edgeDelay = (i) => `${0.25 + i * 0.12}s`;

  return (
    <div className="match-diagram-container" aria-hidden="true">
      <style>{`
        @keyframes mdNodeIn {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes mdEdgeDraw {
          from { stroke-dashoffset: 400; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes mdCenterIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .md-node { animation: mdNodeIn 0.3s ease-out both; }
        .md-edge { animation: mdEdgeDraw 0.45s ease-out both; }
        .md-center { animation: mdCenterIn 0.4s ease-out 0.9s both; }
      `}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="match-diagram-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--matched)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--signal)"  stopOpacity="0.9" />
          </linearGradient>
          <filter id="diagramGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background orbit ring ── */}
        <circle
          cx={CX} cy={CY} r={RESUME_R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.75"
          strokeDasharray="4 6"
          opacity="0.4"
        />

        {/* ── Matched edges ── */}
        {matchedSkills.map((skill, i) => {
          const rn = resumeNodes.find(n => n.name === skill);
          const jn = jobNodes.find(n => n.name === skill);
          if (!rn || !jn) return null;
          // Cubic bezier through center
          const d = `M ${rn.x} ${rn.y} C ${CX - 20} ${rn.y}, ${CX + 20} ${jn.y}, ${jn.x} ${jn.y}`;
          return (
            <path
              key={`edge-${i}`}
              d={d}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="400"
              className="md-edge"
              style={{ animationDelay: edgeDelay(i) }}
            />
          );
        })}

        {/* ── Resume skill nodes (left hemisphere) ── */}
        {resumeNodes.map((node, i) => {
          const isMatched = matchedSkills.includes(node.name);
          const delay = `${i * 0.06}s`;
          return (
            <g
              key={node.id}
              className="md-node"
              style={{ animationDelay: delay, transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle
                cx={node.x} cy={node.y} r={18}
                fill={isMatched ? 'var(--matched-bg)' : 'var(--surface-2)'}
                stroke={isMatched ? 'var(--matched-border)' : 'var(--border-sub)'}
                strokeWidth="1.25"
                filter={isMatched ? 'url(#diagramGlow)' : undefined}
              />
              <text
                x={node.x} y={node.y + 3.5}
                textAnchor="middle"
                fontSize="7.5"
                fill={isMatched ? '#3FB950' : 'var(--text-muted)'}
                fontFamily="var(--font-sans)"
                fontWeight={isMatched ? '600' : '400'}
              >
                {node.name.length > 6 ? node.name.slice(0, 6) + '…' : node.name}
              </text>
            </g>
          );
        })}

        {/* ── Job skill nodes (right hemisphere) ── */}
        {jobNodes.map((node, i) => {
          const isMatched = matchedSkills.includes(node.name);
          const isMissing = missingSkills.includes(node.name);
          const delay = `${i * 0.06 + 0.08}s`;
          return (
            <g
              key={node.id}
              className="md-node"
              style={{ animationDelay: delay, transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle
                cx={node.x} cy={node.y} r={18}
                fill={isMatched ? 'var(--signal-dim)' : isMissing ? 'var(--missing-bg)' : 'var(--surface-2)'}
                stroke={isMatched ? 'rgba(45,212,191,0.4)' : isMissing ? 'var(--missing-border)' : 'var(--border-sub)'}
                strokeWidth={isMissing ? '1.25' : '1.25'}
                strokeDasharray={isMissing ? '3 2' : undefined}
              />
              <text
                x={node.x} y={node.y + 3.5}
                textAnchor="middle"
                fontSize="7.5"
                fill={isMatched ? 'var(--signal)' : isMissing ? '#D29922' : 'var(--text-muted)'}
                fontFamily="var(--font-sans)"
                fontWeight={isMatched || isMissing ? '600' : '400'}
              >
                {node.name.length > 6 ? node.name.slice(0, 6) + '…' : node.name}
              </text>
            </g>
          );
        })}

        {/* ── Center score node ── */}
        <g className="md-center" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <circle
            cx={CX} cy={CY} r={30}
            fill="var(--surface)"
            stroke="var(--signal)"
            strokeWidth="2"
            filter="url(#diagramGlow)"
          />
          <text
            x={CX} y={CY - 4}
            textAnchor="middle"
            fontSize="16"
            fontWeight="500"
            fill="var(--text-primary)"
            fontFamily="var(--font-mono)"
          >
            {displayScore}%
          </text>
          <text
            x={CX} y={CY + 12}
            textAnchor="middle"
            fontSize="6.5"
            fill="var(--text-muted)"
            fontFamily="var(--font-sans)"
            fontWeight="600"
            letterSpacing="0.07em"
          >
            MATCH
          </text>
        </g>

        {/* ── Legend ── */}
        <g transform={`translate(${CX - 60}, ${H - 14})`}>
          <circle cx="6" cy="0" r="4" fill="var(--matched-bg)" stroke="var(--matched-border)" strokeWidth="1" />
          <text x="14" y="3.5" fontSize="7" fill="var(--text-muted)" fontFamily="var(--font-sans)">Resume</text>
          <circle cx="68" cy="0" r="4" fill="var(--signal-dim)" stroke="rgba(45,212,191,0.4)" strokeWidth="1" />
          <text x="76" y="3.5" fontSize="7" fill="var(--text-muted)" fontFamily="var(--font-sans)">Job req.</text>
        </g>
      </svg>
    </div>
  );
});

export default MatchDiagram;
