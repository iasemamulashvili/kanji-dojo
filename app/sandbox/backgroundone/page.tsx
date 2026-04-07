export default function BackgroundOne() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--soft-linen)]">

      {/* 
        SVG uses viewBox + preserveAspectRatio="xMidYMid slice" so it always fills
        the viewport on any screen size. All coordinates are within a 500×900 unit
        space — chosen to match a typical mobile portrait ratio.
      */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 500 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/*
          INTERTWINING STRATEGY:
          - 6 structures root at different edge positions, grow diagonally inward
          - Where two systems approach each other they curve to "near miss" (20-35 units apart)
          - Slight opacity variance creates depth: foreground structures slightly bolder
          
          NEAR-MISS ZONES (where structures weave between each other):
          A: ~(180–220, 330–370): S1-right meets S3-descending — S1 dips below, S3 veers left
          B: ~(280–320, 450–490): S1-right meets S5-left — S1 crown rises above, S5 slips under
          C: ~(120–160, 480–520): S4-horizontal meets S1-trunk  — S4 arcs over trunk zone
          D: ~(360–400, 180–220): S6-descent meets S2-interior — S6 passes right, S2 stays left
          E: ~(240–270, 580–620): S5-col meets S3-right-fork — S5 stays right lane, S3 veers left
        */}

        {/* ===================================================
            S1 — Root bottom-left (80, 900), diagonal rise NE
        =================================================== */}
        {/* Main trunk */}
        <path d="M 80 900 C 88 840 84 778 92 718 C 98 668 96 625 105 578" stroke="var(--charcoal-brown)" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.52" />
        {/* Trunk roots */}
        <path d="M 80 900 C 62 882 40 872 18 878" stroke="var(--charcoal-brown)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 80 900 C 98 884 120 878 142 885" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.22" />
        {/* Left fork — sweeps W then NW, stays left page lane */}
        <path d="M 105 578 C 82 540 55 510 30 478 C 10 452 -5 428 -8 400" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.44" />
        <path d="M 30 478 C 18 454 8 430 5 405" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.3" />
        <path d="M -8 400 C -5 375 5 352 2 328" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.24" />
        <path d="M 2 328 C -4 308 -8 288 -5 266" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
        {/* Right fork — rises NE toward center, DIPS at y=350 to pass below S3 (zone A) */}
        <path d="M 105 578 C 130 538 162 505 195 470 C 222 440 245 412 255 378" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.44" />
        {/* Near-miss zone A: S3 is around (200-220, 345-365) — S1 curves BELOW at y=378 then veers E */}
        <path d="M 255 378 C 268 355 278 330 290 305 C 300 285 308 265 312 242" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.36" />
        <path d="M 312 242 C 318 220 320 198 316 175" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 316 175 C 308 152 300 132 295 110" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
        {/* S1 crown terminal splits */}
        <path d="M 295 110 C 285 90 278 70 275 50" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 295 110 C 308 92 320 76 330 58" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.14" />
        {/* S1 mid brow tine (off right fork) */}
        <path d="M 195 470 C 205 445 210 420 205 395 C 200 374 192 358 196 340" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 196 340 C 188 320 180 302 175 282" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 196 340 C 206 322 218 308 230 292" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />

        {/* ===================================================
            S2 — Root right edge (500, 310), sweeps W into interior
        =================================================== */}
        <path d="M 500 310 C 468 298 438 282 408 268 C 382 256 358 245 332 236" stroke="var(--charcoal-brown)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
        {/* Near-miss zone D: S6 descends around (360-400, 180-220) — S2 stays at y=230-250 passing left lane */}
        <path d="M 332 236 C 308 228 285 222 262 218 C 242 214 222 212 202 210" stroke="var(--charcoal-brown)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.34" />
        <path d="M 202 210 C 180 208 158 208 136 210 C 118 212 102 216 82 220" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 82 220 C 62 224 44 230 25 236" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
        {/* S2 upward tines from main beam */}
        <path d="M 408 268 C 415 244 415 220 408 198 C 402 180 394 165 398 148" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 398 148 C 390 128 382 110 378 90" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 398 148 C 410 130 422 114 432 96" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
        {/* S2 downward tines — droop into lower-right page */}
        <path d="M 408 268 C 420 295 428 322 424 350 C 420 372 412 390 418 412" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.24" />
        <path d="M 418 412 C 424 432 428 452 422 472" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />
        <path d="M 332 236 C 342 260 348 285 342 310 C 336 330 326 346 330 365" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 500 350 C 475 340 452 328 432 315" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.22" />

        {/* ===================================================
            S3 — Root top center-left (210, 0), descends SE
        =================================================== */}
        <path d="M 210 0 C 208 35 210 68 215 100 C 220 128 222 152 225 180" stroke="var(--charcoal-brown)" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.42" />
        {/* Left fan from junction — sweeps toward upper-left */}
        <path d="M 225 180 C 205 162 182 146 158 132 C 138 120 118 110 95 100" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
        <path d="M 158 132 C 148 112 142 92 145 72 C 147 56 152 42 148 26" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 148 26 C 140 10 132 -2 126 -14" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 95 100 C 78 86 62 72 45 58" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 95 100 C 85 80 78 60 78 38" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.18" />
        {/* Right fork — descends SE, near-miss zone A: passes ABOVE S1 right fork at y=345-365 */}
        <path d="M 225 180 C 238 205 248 232 250 260 C 252 284 248 305 252 328" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
        {/* Zone A: S1 at y=378 x=255 — S3 veers LEFT to (215, 355), keeping 40 units above */}
        <path d="M 252 328 C 248 348 238 362 222 372 C 208 380 195 385 178 392" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 178 392 C 160 400 142 408 122 415" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.2" />
        {/* Zone E near-miss: S3 right fork continues down, VEERS LEFT of S5 (which is at x=340-365) */}
        <path d="M 252 328 C 262 360 268 392 262 422 C 256 448 245 468 240 495" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 240 495 C 232 520 225 545 220 572" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />

        {/* ===================================================
            S4 — Root left edge (0, 480), horizontal arc NE
        =================================================== */}
        {/* Zone C: S1 trunk is at ~(92-105, 578-640) — S4 arcs above it at y=480-520 */}
        <path d="M 0 480 C 28 468 55 458 82 452 C 108 446 132 443 158 440" stroke="var(--charcoal-brown)" strokeWidth="0.68" fill="none" strokeLinecap="round" opacity="0.35" />
        <path d="M 158 440 C 188 436 218 434 248 432 C 272 430 295 428 318 426" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.28" />
        {/* Zone B near-miss: S5 is at ~(340,480) — S4 veers slightly below at (318-340, 426-440) */}
        <path d="M 318 426 C 342 424 365 425 388 428 C 408 430 428 433 450 436" stroke="var(--charcoal-brown)" strokeWidth="0.42" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 450 436 C 468 438 484 440 500 442" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.16" />
        {/* S4 upward sprigs */}
        <path d="M 82 452 C 88 428 90 404 85 380 C 80 360 72 342 76 322" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 76 322 C 68 302 60 284 55 264" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 76 322 C 88 305 100 290 112 275" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 158 440 C 162 415 162 390 155 366 C 150 346 140 330 144 312" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 144 312 C 138 294 132 278 128 260" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.15" />
        {/* S4 downward sprigs */}
        <path d="M 248 432 C 252 455 252 478 246 500 C 240 518 232 532 236 550" stroke="var(--charcoal-brown)" strokeWidth="0.32" fill="none" strokeLinecap="round" opacity="0.18" />
        <path d="M 0 518 C 22 512 42 505 60 496" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.2" />

        {/* ===================================================
            S5 — Root bottom-right (420, 900), rises NW then N
        =================================================== */}
        <path d="M 420 900 C 412 848 408 795 400 742 C 394 698 390 660 382 618" stroke="var(--charcoal-brown)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.46" />
        {/* Roots */}
        <path d="M 420 900 C 440 882 462 872 485 878" stroke="var(--charcoal-brown)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 420 900 C 400 882 378 875 355 880" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.2" />
        {/* Right arm — extends toward right edge */}
        <path d="M 382 618 C 408 598 435 580 462 562 C 480 548 496 535 510 520" stroke="var(--charcoal-brown)" strokeWidth="0.58" fill="none" strokeLinecap="round" opacity="0.34" />
        <path d="M 462 562 C 472 538 475 514 468 490 C 462 470 452 455 456 436" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 456 436 C 460 418 462 400 458 382" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
        {/* Left arm — sweeps toward center-left, stays RIGHT of S3 (zone E) */}
        <path d="M 382 618 C 360 592 340 565 322 538 C 306 514 292 490 280 465" stroke="var(--charcoal-brown)" strokeWidth="0.58" fill="none" strokeLinecap="round" opacity="0.34" />
        {/* Zone E: S3 at x=220-240 — S5 stays x=265-285, curving just right */}
        <path d="M 280 465 C 272 440 268 415 272 390 C 275 368 282 350 278 328" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.28" />
        {/* Zone B near-miss with S1: S1 crown at (312,242), S5 column stays at x=278-285 */}
        <path d="M 278 328 C 280 305 285 282 288 258 C 290 238 290 218 286 198" stroke="var(--charcoal-brown)" strokeWidth="0.36" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 286 198 C 282 178 276 160 272 140" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 272 140 C 265 120 260 100 258 80" stroke="var(--charcoal-brown)" strokeWidth="0.23" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 272 140 C 282 122 292 105 300 86" stroke="var(--charcoal-brown)" strokeWidth="0.22" fill="none" strokeLinecap="round" opacity="0.12" />
        {/* Off right arm mid tines */}
        <path d="M 322 538 C 315 515 312 492 318 468" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />

        {/* ===================================================
            S6 — Root top-right (468, 0), descends SW
        =================================================== */}
        <path d="M 468 0 C 462 32 458 65 452 98 C 446 128 442 155 438 185" stroke="var(--charcoal-brown)" strokeWidth="0.72" fill="none" strokeLinecap="round" opacity="0.38" />
        {/* Zone D near-miss: S2 horizontal at y=210-245 x=330-410 — S6 stays at x=390-438, passes ABOVE */}
        <path d="M 438 185 C 428 208 418 230 408 252 C 398 272 386 290 375 310" stroke="var(--charcoal-brown)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.32" />
        <path d="M 375 310 C 362 332 348 352 335 372 C 322 390 308 408 296 428" stroke="var(--charcoal-brown)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 296 428 C 282 450 268 470 256 492" stroke="var(--charcoal-brown)" strokeWidth="0.36" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 256 492 C 245 512 236 535 230 558" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />
        {/* S6 right sprig — stays near right edge */}
        <path d="M 438 185 C 452 162 462 138 468 112 C 472 92 472 72 478 50" stroke="var(--charcoal-brown)" strokeWidth="0.38" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 478 50 C 483 32 485 15 486 -2" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.15" />
        {/* S6 left tines */}
        <path d="M 408 252 C 395 238 380 225 365 212" stroke="var(--charcoal-brown)" strokeWidth="0.35" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 365 212 C 350 198 336 185 320 174" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 375 310 C 392 300 410 290 428 278" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.18" />
        <path d="M 428 278 C 444 265 458 252 470 238" stroke="var(--charcoal-brown)" strokeWidth="0.24" fill="none" strokeLinecap="round" opacity="0.14" />
        {/* S6 top-right micro scatter */}
        <path d="M 468 0 C 485 18 498 36 505 56" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 452 98 C 468 88 482 76 494 62" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.14" />

        {/* ===================================================
            MICRO-TWIGS — scattered fillers in negative zones
        =================================================== */}
        {/* Lower-center void fill */}
        <path d="M 188 750 C 198 730 204 708 200 686" stroke="var(--charcoal-brown)" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 188 750 C 175 732 160 718 143 706" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.12" />
        <path d="M 295 810 C 285 790 276 770 272 748" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.12" />
        <path d="M 295 810 C 308 792 318 772 322 750" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.11" />
        {/* Upper-center breathers */}
        <path d="M 360 65 C 368 48 375 30 378 12" stroke="var(--charcoal-brown)" strokeWidth="0.26" fill="none" strokeLinecap="round" opacity="0.13" />
        <path d="M 360 65 C 348 48 336 34 325 20" stroke="var(--charcoal-brown)" strokeWidth="0.24" fill="none" strokeLinecap="round" opacity="0.12" />
        {/* Mid void — between S4 and S1 */}
        <path d="M 42 560 C 50 540 55 518 52 495" stroke="var(--charcoal-brown)" strokeWidth="0.28" fill="none" strokeLinecap="round" opacity="0.13" />
        <path d="M 42 560 C 30 540 18 522 5 510" stroke="var(--charcoal-brown)" strokeWidth="0.25" fill="none" strokeLinecap="round" opacity="0.12" />

      </svg>

      {/* =====================================================
          REFERENCE UI CONTAINERS
          Mirrors real app layout: header + kanji-stone + 2 stat cards + wabi-card 
      ===================================================== */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-8 pb-24 flex flex-col items-center gap-6">

        {/* Header Reference */}
        <header className="flex flex-col items-center w-full py-6 space-y-4 bg-white/20 imperfect-border backdrop-blur-sm px-4">
          <h1 className="text-xl font-serif font-black tracking-[0.2em] uppercase text-[var(--charcoal-brown)]">
            Path of Mastery
          </h1>
          <div className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[var(--soft-linen)] bg-[var(--charcoal-blue)] px-5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[var(--rich-mahogany)] rounded-full"></span>
            <span>Session Active</span>
          </div>
        </header>

        {/* Hero Cards Row */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square bg-white/10 border border-[rgba(var(--rgb-grey-olive),0.3)]">
            <span className="text-3xl font-black text-[var(--ebony)]">14</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--grey-olive)] mt-1">Day Streak</span>
          </div>
          <div className="kanji-stone p-6 flex flex-col items-center justify-center aspect-square bg-white/10 border border-[rgba(var(--rgb-grey-olive),0.3)]">
            <span className="text-3xl font-black text-[var(--ebony)]">382</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--grey-olive)] mt-1">Correct</span>
          </div>
        </div>

        {/* Filter Bar Reference */}
        <div className="w-full flex justify-between items-center py-3 border-b border-[rgba(var(--rgb-grey-olive),0.3)]">
          <div className="flex gap-6">
            <span className="text-xs font-black uppercase tracking-widest pb-1 border-b-2 border-[var(--charcoal-blue)] text-[var(--charcoal-blue)]">Overview</span>
            <span className="text-xs font-black uppercase tracking-widest pb-1 border-b-2 border-transparent text-[var(--charcoal-brown)] opacity-50">History</span>
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--charcoal-brown)] opacity-50">All Types</span>
        </div>

        {/* Mastery Grid Reference */}
        <div className="kanji-stone w-full p-6 grid grid-cols-3 gap-6 border-2 border-[var(--grey-olive)] bg-transparent">
          {['85%', '70%', '65%', '91%', '42%', '70%'].map((pct, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--charcoal-blue)] flex items-center justify-center opacity-60">
                <span className="text-xs font-black text-[var(--ebony)]">{pct}</span>
              </div>
              <span className="text-[0.55rem] uppercase font-bold tracking-widest text-[var(--grey-olive)]">Type {i+1}</span>
            </div>
          ))}
        </div>

        {/* History Ledger Reference */}
        <div className="w-full">
          {[{d:'Apr 7', t:'09:33 PM', s:'18', tot:'21', acc:'86%'}, {d:'Apr 6', t:'09:33 PM', s:'15', tot:'17', acc:'88%'}, {d:'Apr 5', t:'09:33 PM', s:'10', tot:'13', acc:'77%'}].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-[rgba(var(--rgb-grey-olive),0.2)] px-2">
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-0.5 w-20">
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[var(--charcoal-brown)]">{row.d}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--grey-olive)]">{row.t}</span>
                </div>
                <span className="text-[0.6rem] font-black uppercase px-1 text-[var(--palm-leaf)]">{row.acc} Acc</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-serif font-black text-[var(--ebony)]">{row.s}</span>
                <span className="text-[0.65rem] font-bold text-[var(--grey-olive)]">/{row.tot}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
