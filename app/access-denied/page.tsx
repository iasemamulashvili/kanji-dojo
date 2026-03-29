export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EB] p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 p-12 bg-white/30 border border-slate-200 rounded-sm shadow-sm">
        <div className="text-4xl animate-pulse">🏮</div>
        <h1 className="text-2xl font-light tracking-widest text-[#343D46] uppercase">
          Access Denied
        </h1>
        <p className="text-[#343D46]/80 leading-relaxed font-serif italic">
          "The path is narrow, and the gate is 12locked to those without the key."
        </p>
        <div className="h-px bg-slate-300 w-16 mx-auto" />
        <p className="text-sm text-[#343D46] tracking-wide">
          Please use the secure link provided in the 
          <span className="font-bold underline decoration-slate-400 underline-offset-4 ml-1">
            Kanji Dojo Telegram
          </span> group to enter.
        </p>
        <div className="pt-4">
          <a 
            href="https://t.me/kanji_dojo_bot" 
            className="text-xs uppercase tracking-[0.2em] text-[#343D46]/60 hover:text-[#343D46] transition-colors"
          >
            ← Return to the Bot
          </a>
        </div>
      </div>
    </div>
  );
}
