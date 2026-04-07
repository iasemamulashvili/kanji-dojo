export default function BackgroundThree() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--charcoal-brown)] flex flex-col items-center justify-center">

      {/*
        BACKGROUND THREE: "Scattered Grove" — Expanded Edition
        SVG viewBox 900×900, preserveAspectRatio slice for full-bleed mobile.
        Five antler structures now instead of four — added a mid-page centre-bottom
        rising anchor and a second mid-left secondary structure.
      */}

      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 900 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >

        {/* ================================================
            STRUCTURE 1 — TOP-LEFT: Tall, narrow, closest
        ================================================ */}
        <path d="M 40 0 C 42 60 38 120 45 180 C 50 230 48 268 52 318" stroke="var(--ebony)" strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.62" />
        <path d="M 52 318 C 38 285 18 260 0 238" stroke="var(--ebony)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.52" />
        <path d="M 52 318 C 68 278 92 252 118 222 C 138 200 155 182 170 158" stroke="var(--ebony)" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M 118 222 C 128 200 130 178 125 155 C 121 138 112 125 116 108" stroke="var(--ebony)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.38" />
        <path d="M 116 108 C 108 88 100 72 92 56" stroke="var(--ebony)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 116 108 C 126 90 138 78 150 62" stroke="var(--ebony)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.25" />
        <path d="M 170 158 C 185 132 198 112 210 90 C 218 76 224 62 228 46" stroke="var(--ebony)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.32" />
        <path d="M 210 90 C 220 72 232 60 244 46" stroke="var(--ebony)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.22" />
        {/* Extra tines on structure 1 */}
        <path d="M 45 180 C 30 165 15 152 0 140" stroke="var(--ebony)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.35" />
        <path d="M 52 318 C 40 340 35 362 32 385 C 30 402 28 418 32 435" stroke="var(--ebony)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 32 435 C 20 420 8 408 -5 395" stroke="var(--ebony)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.18" />

        {/* ================================================
            STRUCTURE 2 — BOTTOM-RIGHT: Wide, low, second closest
        ================================================ */}
        <path d="M 900 900 C 858 848 820 800 798 748 C 778 700 772 660 762 615" stroke="var(--ebony)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M 762 615 C 740 578 712 555 680 530 C 655 508 630 492 605 470" stroke="var(--ebony)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.44" />
        <path d="M 762 615 C 785 582 812 562 840 542 C 862 526 882 514 900 500" stroke="var(--ebony)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
        <path d="M 680 530 C 668 508 660 488 665 466 C 668 450 675 436 670 420" stroke="var(--ebony)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.32" />
        <path d="M 670 420 C 658 402 646 388 635 372" stroke="var(--ebony)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.24" />
        <path d="M 670 420 C 680 400 695 386 710 372" stroke="var(--ebony)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 605 470 C 588 448 575 428 568 405" stroke="var(--ebony)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.26" />
        <path d="M 840 542 C 858 520 872 500 882 480" stroke="var(--ebony)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.22" />
        {/* Extra from bottom-right */}
        <path d="M 762 615 C 750 640 742 665 740 692 C 738 710 740 728 735 745" stroke="var(--ebony)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 605 470 C 585 450 562 433 540 418" stroke="var(--ebony)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 540 418 C 528 400 518 385 512 368" stroke="var(--ebony)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.15" />

        {/* ================================================
            STRUCTURE 3 — TOP-RIGHT: Medium, faded (far distance)  
        ================================================ */}
        <path d="M 900 80 C 860 100 830 128 808 165 C 788 198 782 228 775 268" stroke="var(--palm-leaf)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.3" />
        <path d="M 775 268 C 755 240 728 218 700 198 C 678 182 658 168 638 150" stroke="var(--palm-leaf)" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.24" />
        <path d="M 700 198 C 692 178 690 158 695 138 C 698 122 705 110 700 95" stroke="var(--palm-leaf)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 700 95 C 692 78 684 64 676 50" stroke="var(--palm-leaf)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 700 95 C 710 78 722 65 732 52" stroke="var(--palm-leaf)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 638 150 C 622 128 610 110 602 90" stroke="var(--palm-leaf)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.18" />
        <path d="M 808 165 C 825 142 840 122 855 100" stroke="var(--palm-leaf)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.2" />
        {/* Extra tines structure 3 */}
        <path d="M 775 268 C 788 295 795 322 790 350" stroke="var(--palm-leaf)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 790 350 C 800 372 808 392 808 415" stroke="var(--palm-leaf)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.13" />

        {/* ================================================
            STRUCTURE 4 — BOTTOM-LEFT: Small, furthest (ghostly)
        ================================================ */}
        <path d="M 0 800 C 30 762 52 725 68 685 C 82 648 88 618 95 580" stroke="var(--palm-leaf)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.25" />
        <path d="M 95 580 C 78 552 58 530 35 512 C 18 498 2 488 -12 472" stroke="var(--palm-leaf)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 95 580 C 112 550 132 528 155 508 C 172 492 188 480 202 464" stroke="var(--palm-leaf)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 155 508 C 165 488 168 468 162 448 C 158 432 150 420 155 405" stroke="var(--palm-leaf)" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 155 405 C 148 388 140 375 132 360" stroke="var(--palm-leaf)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 202 464 C 215 445 225 428 230 410" stroke="var(--palm-leaf)" strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.13" />
        <path d="M 68 685 C 50 665 32 648 12 635" stroke="var(--palm-leaf)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.18" />
        {/* Extra twig structure 4 */}
        <path d="M 95 580 C 88 558 80 540 72 522" stroke="var(--palm-leaf)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.14" />

        {/* ================================================
            STRUCTURE 5 — NEW: Centre-bottom ascending anchor
            Grows from the very bottom-centre, mid-ground depth
        ================================================ */}
        <path d="M 450 900 C 445 855 442 812 448 770 C 453 735 452 708 458 675" stroke="var(--grey-olive)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.28" />
        <path d="M 458 675 C 440 642 418 618 392 595 C 370 575 350 558 328 538" stroke="var(--grey-olive)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 458 675 C 478 642 502 618 525 598 C 545 580 562 565 580 548" stroke="var(--grey-olive)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.22" />
        <path d="M 392 595 C 380 572 372 552 376 530 C 378 514 385 502 380 488" stroke="var(--grey-olive)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 380 488 C 370 470 360 455 350 440" stroke="var(--grey-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.13" />
        <path d="M 525 598 C 538 575 545 552 540 528 C 536 512 528 500 532 485" stroke="var(--grey-olive)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 532 485 C 542 466 550 450 558 434" stroke="var(--grey-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.13" />
        <path d="M 328 538 C 312 518 298 500 285 480" stroke="var(--grey-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 580 548 C 595 528 608 510 618 490" stroke="var(--grey-olive)" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d="M 448 770 C 430 748 410 730 390 718" stroke="var(--grey-olive)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.16" />
        <path d="M 448 770 C 468 748 488 732 508 720" stroke="var(--grey-olive)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.16" />

        {/* ================================================
            STRUCTURE 6 — NEW: Mid-left secondary antler
            Horizontal, spreads across lower-middle left
        ================================================ */}
        <path d="M 0 480 C 32 460 62 438 88 415 C 110 395 128 378 148 358" stroke="var(--grey-olive)" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.2" />
        <path d="M 88 415 C 92 390 88 368 80 348 C 74 333 66 320 70 305" stroke="var(--grey-olive)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 70 305 C 62 288 54 274 48 258" stroke="var(--grey-olive)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.12" />
        <path d="M 70 305 C 80 288 90 275 100 260" stroke="var(--grey-olive)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.12" />
        <path d="M 148 358 C 162 335 172 315 178 292 C 182 275 184 260 188 244" stroke="var(--grey-olive)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d="M 148 358 C 162 380 170 402 168 425" stroke="var(--grey-olive)" strokeWidth="0.45" fill="none" strokeLinecap="round" opacity="0.12" />

      </svg>

      {/* Label */}
      <div className="relative z-10 text-center space-y-2 pointer-events-none">
        <p className="text-[0.6rem] font-bold tracking-[0.4em] uppercase text-[var(--soft-linen)] opacity-20">Background</p>
        <h1 className="text-5xl font-black font-serif text-[var(--soft-linen)] opacity-10 tracking-widest">三</h1>
        <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-[var(--grey-olive)] opacity-30">Scattered Grove</p>
      </div>
    </div>
  );
}
