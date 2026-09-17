import React, { useEffect, useRef, useState } from 'react';

// 240° arc from 210° (bottom-left) to 330° (bottom-right), sweeping clockwise
// This gives a speedometer "gauge" look rather than a full donut.
const ARC_START_DEG = 210;
const ARC_END_DEG   = 330; // going clockwise, so the open gap is 120° at the bottom

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startDeg, endDeg, clockwise = true) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end   = polarToCartesian(cx, cy, r, endDeg);
  const sweep = clockwise ? 1 : 0;
  // large-arc flag: 1 if arc > 180°
  const large = clockwise
    ? (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0
    : (startDeg - endDeg + 360) % 360 > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

const TIER_LABELS = [
  { min: 90, label: 'Exceptional Match' },
  { min: 75, label: 'Strong Match'      },
  { min: 55, label: 'Good Start'        },
  { min: 35, label: 'Partial Fit'       },
  { min: 0,  label: 'Needs Work'        },
];

function getTier(pct) {
  return TIER_LABELS.find(t => pct >= t.min)?.label ?? 'Needs Work';
}

const SIZE = 180;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 70;
const STROKE_W = 10;

// Total angular span of the arc (240°, leaving a 120° gap at bottom)
const TOTAL_SPAN = 240;

const CircularProgress = React.memo(({ percentage }) => {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const duration = 1200; // ms

  // Animate from 0 → percentage on mount
  useEffect(() => {
    const target = Math.min(100, Math.max(0, percentage));
    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [percentage]);

  // The arc starts at 210° and sweeps TOTAL_SPAN degrees clockwise.
  // Fill is proportional to displayed/100.
  const fillSpan = (displayed / 100) * TOTAL_SPAN;
  const fillEndDeg = ARC_START_DEG + fillSpan;

  const trackPath = describeArc(CX, CY, RADIUS, ARC_START_DEG, ARC_START_DEG + TOTAL_SPAN, true);
  const fillPath  = fillSpan > 0
    ? describeArc(CX, CY, RADIUS, ARC_START_DEG, fillEndDeg, true)
    : null;

  return (
    <div className="score-arc-wrapper" style={{ width: SIZE, height: SIZE }}>
      <svg
        className="score-arc-svg"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`Compatibility score: ${Math.round(percentage)}%`}
        role="img"
      >
        {/* Track */}
        <path
          d={trackPath}
          className="arc-track"
          strokeWidth={STROKE_W}
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            className="arc-fill"
            strokeWidth={STROKE_W}
          />
        )}
      </svg>

      <div className="score-center">
        <span className="score-number">
          {displayed}
          <span className="score-unit">%</span>
        </span>
        <span className="score-tier">{getTier(percentage)}</span>
      </div>
    </div>
  );
});

export default CircularProgress;
