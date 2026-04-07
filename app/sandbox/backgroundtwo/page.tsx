export default function BackgroundTwo() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--carbon-black)] flex flex-col items-center justify-center">

      {/*
        BACKGROUND TWO: "Winter Canopy"
        Aesthetic: Organic / Natural + Editorial / Magazine
        DFII: Impact(5) + Fit(5) + Feasibility(4) + Performance(4) − Risk(1) = 17 → capped 15 (Excellent)

        Differentiator: Two opposing stag antler crowns emerge from opposite screen edges —
        left and right — reaching toward each other across the top of the viewport,
        creating a negative-space archway. The palette inverts to dark carbon, making the
        Charcoal Blue branches glow faintly like frost-lit winter silhouettes at dusk.

        This avoids generic UI by using compositional tension (two opposing masses framing 
        the center) rather than filling the space with decoration.
      */}

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 900 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* === LEFT ANTLER SYSTEM (grows from top-left corner inward) === */}

        {/* Left main trunk from corner */}
        <path
          d="M -20 -20 C 30 40 55 95 80 155 C 102 208 108 248 115 295"
          stroke="var(--charcoal-blue)"
          strokeWidth="2.0"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Left primary beam sweeping right */}
        <path
          d="M 115 295 C 140 260 178 232 218 200 C 255 170 288 148 325 120"
          stroke="var(--charcoal-blue)"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Left brow tine */}
        <path
          d="M 218 200 C 225 178 228 158 222 135 C 218 118 210 104 215 88"
          stroke="var(--charcoal-blue)"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Left brow tine split */}
        <path
          d="M 215 88 C 208 72 200 60 192 46"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d="M 215 88 C 228 74 240 62 252 50"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.22"
        />

        {/* Left bez tine reaching up-right */}
        <path
          d="M 325 120 C 345 98 360 78 372 55 C 380 38 385 22 390 5"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Left bez split A */}
        <path
          d="M 372 55 C 382 38 390 24 398 8"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* Left reaching tine — center-top */}
        <path
          d="M 325 120 C 350 100 380 85 412 72 C 435 62 455 56 470 45"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Left micro twigs */}
        <path d="M 80 155 C 62 142 45 130 28 118" stroke="var(--charcoal-blue)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 80 155 C 78 135 72 118 68 100" stroke="var(--charcoal-blue)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.2" />

        {/* === RIGHT ANTLER SYSTEM (mirror, grows from top-right corner) === */}

        {/* Right main trunk from corner */}
        <path
          d="M 920 -20 C 870 40 845 95 820 155 C 798 208 792 248 785 295"
          stroke="var(--charcoal-blue)"
          strokeWidth="2.0"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Right primary beam sweeping left */}
        <path
          d="M 785 295 C 760 260 722 232 682 200 C 645 170 612 148 575 120"
          stroke="var(--charcoal-blue)"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Right brow tine */}
        <path
          d="M 682 200 C 675 178 672 158 678 135 C 682 118 690 104 685 88"
          stroke="var(--charcoal-blue)"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Right brow tine split */}
        <path
          d="M 685 88 C 692 72 700 60 708 46"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d="M 685 88 C 672 74 660 62 648 50"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.22"
        />

        {/* Right bez tine */}
        <path
          d="M 575 120 C 555 98 540 78 528 55 C 520 38 515 22 510 5"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Right reaching tine — center-top */}
        <path
          d="M 575 120 C 550 100 520 85 488 72 C 465 62 445 56 430 45"
          stroke="var(--charcoal-blue)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Right micro twigs */}
        <path d="M 820 155 C 838 142 855 130 872 118" stroke="var(--charcoal-blue)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 820 155 C 822 135 828 118 832 100" stroke="var(--charcoal-blue)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.2" />

        {/* === Center-top negative space: tiny meeting twigs === */}
        <path d="M 470 45 C 475 30 478 18 480 5" stroke="var(--charcoal-blue)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 430 45 C 425 30 422 18 420 5" stroke="var(--charcoal-blue)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.15" />
      </svg>

      {/* Content label — sits in the archway negative space */}
      <div className="relative z-10 text-center space-y-2 pointer-events-none">
        <p className="text-[0.6rem] font-bold tracking-[0.4em] uppercase text-[var(--soft-linen)] opacity-20">Background</p>
        <h1 className="text-5xl font-black font-serif text-[var(--soft-linen)] opacity-10 tracking-widest">二</h1>
        <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-[var(--grey-olive)] opacity-30">Winter Canopy</p>
      </div>
    </div>
  );
}
