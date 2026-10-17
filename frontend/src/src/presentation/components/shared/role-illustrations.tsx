function ParliamentIllustration() {
  const rows = [
    { r: 118, count: 15, span: 200 },
    { r: 98, count: 13, span: 200 },
    { r: 78, count: 11, span: 200 },
    { r: 58, count: 9, span: 200 },
  ];

  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="presentation">
      <defs>
        <radialGradient id="pf-floor" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#1a3f66" />
          <stop offset="100%" stopColor="#0c2338" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#pf-floor)" />

      {rows.map((row, ri) =>
        Array.from({ length: row.count }).map((_, i) => {
          const t = i / (row.count - 1);
          const angle = (180 - row.span) / 2 + t * row.span;
          const rad = (angle * Math.PI) / 180;
          const cx = 160 + row.r * Math.cos(rad);
          const cy = 172 - row.r * Math.sin(rad);
          const isAisle = i === Math.floor(row.count / 2);
          return isAisle ? null : (
            <circle
              key={`${ri}-${i}`}
              cx={cx}
              cy={cy}
              r={ri === 0 ? 3.4 : 3}
              fill={ri % 2 === 0 ? "#f2b705" : "#c3d0e0"}
              opacity={0.15 + ri * 0.09}
            />
          );
        }),
      )}

      <rect x="146" y="168" width="28" height="14" rx="2" fill="#f2b705" opacity="0.9" />
      <rect x="152" y="160" width="16" height="10" rx="1.5" fill="#fadd7a" opacity="0.8" />
      <line x1="160" y1="182" x2="160" y2="56" stroke="#f2b705" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="1 5" />
    </svg>
  );
}

function MinistryIllustration() {
  const nodes = [
    { x: 62, y: 60 }, { x: 132, y: 40 }, { x: 200, y: 66 }, { x: 258, y: 44 },
    { x: 90, y: 118 }, { x: 168, y: 104 }, { x: 236, y: 128 },
    { x: 58, y: 168 }, { x: 208, y: 172 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [1, 5], [4, 5], [5, 6], [4, 0], [4, 7], [5, 8], [6, 8], [2, 6],
  ];

  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="presentation">
      <defs>
        <linearGradient id="mf-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#12304a" />
          <stop offset="100%" stopColor="#0c2338" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#mf-ground)" />

      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${-20 + i * 8} 200 Q 160 ${20 + i * 34} 340 ${190 - i * 6}`}
          fill="none"
          stroke="#5a7ca3"
          strokeOpacity={0.14}
          strokeWidth="1"
        />
      ))}

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#f2b705"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={i === 5 ? 7 : 4.5} fill={i === 5 ? "#f2b705" : "#e8edf3"} opacity={i === 5 ? 1 : 0.85} />
          {i === 5 && <circle cx={n.x} cy={n.y} r="12" fill="none" stroke="#f2b705" strokeOpacity="0.5" strokeWidth="1" />}
        </g>
      ))}
    </svg>
  );
}

function DomainOfficerIllustration() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="presentation">
      <defs>
        <linearGradient id="df-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f2a44" />
          <stop offset="100%" stopColor="#0c2338" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#df-ground)" />

      <g transform="translate(74 34) rotate(-6)">
        <rect width="118" height="150" rx="4" fill="#e8edf3" opacity="0.94" />
        {[26, 42, 58, 74, 90, 106, 122, 136].map((y, i) => (
          <rect key={i} x="14" y={y} width={i % 3 === 0 ? 62 : 90} height="4" rx="2" fill="#5a7ca3" opacity="0.4" />
        ))}
      </g>

      <g transform="translate(128 46) rotate(4)">
        <rect width="118" height="150" rx="4" fill="#ffffff" />
        <rect x="14" y="16" width="90" height="4" rx="2" fill="#12304a" opacity="0.55" />
        {[30, 46, 62].map((y, i) => (
          <rect key={i} x="14" y={y} width={78 - i * 10} height="4" rx="2" fill="#91a9c5" opacity="0.5" />
        ))}
        <circle cx="59" cy="104" r="30" fill="none" stroke="#278a57" strokeWidth="2.5" />
        <path d="M46 104 l9 9 l17 -19" fill="none" stroke="#278a57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(206 92)">
        <circle cx="0" cy="0" r="17" fill="none" stroke="#f2b705" strokeWidth="3" />
        <line x1="12" y1="12" x2="26" y2="26" stroke="#f2b705" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function AdministratorIllustration() {
  const rings = [46, 34, 22];
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="presentation">
      <defs>
        <linearGradient id="af-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a0e0e" />
          <stop offset="100%" stopColor="#160707" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#af-ground)" />

      {rings.map((r, i) => (
        <circle
          key={r}
          cx="160" cy="100" r={r}
          fill="none"
          stroke={i === rings.length - 1 ? "#f7cc45" : "#c66109"}
          strokeOpacity={0.35 + i * 0.15}
          strokeWidth="1.5"
          strokeDasharray={i === 1 ? "3 4" : undefined}
        />
      ))}

      <g transform="translate(160 100)">
        <rect x="-13" y="-4" width="26" height="22" rx="4" fill="#f7cc45" />
        <path d="M -8 -4 v-9 a8 8 0 0 1 16 0 v9" fill="none" stroke="#f7cc45" strokeWidth="3.5" />
        <circle cx="0" cy="7" r="3" fill="#160707" />
      </g>

      {[[-72, -46], [78, -30], [-58, 52], [86, 44]].map(([x, y], i) => (
        <g key={i} transform={`translate(${160 + x} ${100 + y})`}>
          <rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="none" stroke="#e8750c" strokeOpacity="0.6" strokeWidth="1.5" />
          <circle cx={i % 2 === 0 ? -3 : 3} cy="0" r="2" fill="#f2b705" />
        </g>
      ))}
    </svg>
  );
}

export const ROLE_ILLUSTRATIONS = {
  parliamentary: ParliamentIllustration,
  ministry: MinistryIllustration,
  "domain-officer": DomainOfficerIllustration,
  admin: AdministratorIllustration,
} as const;
