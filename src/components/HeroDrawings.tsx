type DrawingKind = 'receipt' | 'carbon' | 'salvage' | 'passport'

export function HeroDrawing({ kind }: { kind: DrawingKind }) {
  return (
    <svg className="hero-drawing" viewBox="0 0 400 520" fill="none" aria-hidden="true">
      {kind === 'receipt' && <FrameDrawing />}
      {kind === 'carbon' && <SectionDrawing />}
      {kind === 'salvage' && <RiserDrawing />}
      {kind === 'passport' && <ElevationDrawing />}
    </svg>
  )
}

function FrameDrawing() {
  return (
    <g className="hero-draw-set">
      <g className="hero-draw-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 40} y1={36} x2={40 + i * 40} y2={470} pathLength={1} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`h${i}`} x1={32} y1={40 + i * 40} x2={368} y2={40 + i * 40} pathLength={1} />
        ))}
      </g>
      <g className="hero-draw-mass">
        <polygon points="88,360 188,312 300,360 300,188 188,140 88,188" pathLength={1} />
        <polyline points="88,188 188,236 300,188" pathLength={1} />
        <line x1={188} y1={140} x2={188} y2={236} pathLength={1} />
        <line x1={88} y1={274} x2={188} y2={322} pathLength={1} />
        <line x1={188} y1={322} x2={300} y2={274} pathLength={1} />
        <line x1={128} y1={208} x2={128} y2={336} pathLength={1} />
        <line x1={248} y1={208} x2={248} y2={336} pathLength={1} />
      </g>
      <g className="hero-draw-dim">
        <line x1={88} y1={392} x2={300} y2={392} pathLength={1} />
        <line x1={88} y1={384} x2={88} y2={400} pathLength={1} />
        <line x1={300} y1={384} x2={300} y2={400} pathLength={1} />
      </g>
    </g>
  )
}

function SectionDrawing() {
  return (
    <g className="hero-draw-set">
      <rect className="hero-draw-hatch" x={108} y={86} width={184} height={328} pathLength={1} />
      <line x1={108} y1={414} x2={292} y2={414} pathLength={1} />
      <line x1={96} y1={430} x2={304} y2={430} pathLength={1} />
      <polyline points="108,86 108,414 292,414 292,86" pathLength={1} />
      <line x1={108} y1={168} x2={292} y2={168} pathLength={1} />
      <line x1={108} y1={250} x2={292} y2={250} pathLength={1} />
      <line x1={108} y1={332} x2={292} y2={332} pathLength={1} />
      <rect x={148} y={108} width={28} height={44} pathLength={1} />
      <rect x={224} y={108} width={28} height={44} pathLength={1} />
      <rect x={148} y={190} width={28} height={44} pathLength={1} />
      <rect x={224} y={190} width={28} height={44} pathLength={1} />
      <rect x={148} y={272} width={28} height={44} pathLength={1} />
      <rect x={224} y={272} width={28} height={44} pathLength={1} />
      <line x1={78} y1={86} x2={78} y2={414} pathLength={1} />
      <line x1={70} y1={86} x2={86} y2={86} pathLength={1} />
      <line x1={70} y1={414} x2={86} y2={414} pathLength={1} />
    </g>
  )
}

function RiserDrawing() {
  return (
    <g className="hero-draw-set hero-draw-copper">
      <path
        d="M92 420 V268 C92 248 108 236 128 236 H176 C196 236 208 220 208 200 V92"
        pathLength={1}
      />
      <path d="M208 92 H286" pathLength={1} />
      <circle cx={92} cy={420} r={7} pathLength={1} />
      <circle cx={208} cy={92} r={7} pathLength={1} />
      <circle cx={286} cy={92} r={7} pathLength={1} />
      <circle cx={128} cy={236} r={5} pathLength={1} />
      <path d="M176 236 V188 H248" pathLength={1} />
      <circle cx={248} cy={188} r={6} pathLength={1} />
      <line x1={70} y1={268} x2={114} y2={268} pathLength={1} />
      <line x1={70} y1={420} x2={114} y2={420} pathLength={1} />
      <rect x={248} y={300} width={72} height={88} rx={2} pathLength={1} />
      <line x1={260} y1={322} x2={308} y2={322} pathLength={1} />
      <line x1={260} y1={344} x2={308} y2={344} pathLength={1} />
      <line x1={260} y1={366} x2={296} y2={366} pathLength={1} />
    </g>
  )
}

function ElevationDrawing() {
  return (
    <g className="hero-draw-set">
      <rect x={86} y={72} width={228} height={348} pathLength={1} />
      <line x1={86} y1={128} x2={314} y2={128} pathLength={1} />
      <line x1={86} y1={420} x2={314} y2={420} pathLength={1} />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={108 + col * 50}
            y={148 + row * 50}
            width={32}
            height={32}
            pathLength={1}
          />
        )),
      )}
      <rect x={178} y={392} width={44} height={28} pathLength={1} />
      <line x1={200} y1={72} x2={200} y2={48} pathLength={1} />
      <line x1={178} y1={48} x2={222} y2={48} pathLength={1} />
    </g>
  )
}
