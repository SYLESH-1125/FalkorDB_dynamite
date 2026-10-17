const SUBSIDIARIES = [
  "Bharat Coking Coal", "Central Coalfields", "Eastern Coalfields", "South Eastern Coalfields",
  "Western Coalfields", "Northern Coalfields", "Mahanadi Coalfields", "Central Mine Planning", "SECL",
];

export function LogoMarquee() {
  const track = [...SUBSIDIARIES, ...SUBSIDIARIES];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-[marquee_32s_linear_infinite] items-center gap-10 py-1">
        {track.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 text-[13px] font-semibold tracking-wide text-muted-soft/80 uppercase"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
