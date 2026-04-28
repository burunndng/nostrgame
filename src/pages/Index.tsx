import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreature } from '@/stores/creature';
import { Sparkles, Swords, BookOpen, ArrowRight } from 'lucide-react';

export default function Index() {
  useSeoMeta({
    title: 'LUMINAE — Nostr Creature God Game',
    description: 'Summon, nurture, and battle with a creature born from your Nostr soul. A bioluminescent god game on the open social protocol.',
  });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const creature = useCreature();

  // Redirect to sanctuary if already in-game
  useEffect(() => {
    if (creature) {
      navigate('/sanctuary');
    }
  }, [creature, navigate]);

  return (
    <div
      className="w-full min-h-screen bg-[#030508] text-white/80 flex flex-col"
      style={{ fontFamily: '"Space Mono", monospace' }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(127,255,212,0.15) 0%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(168,230,255,0.12) 0%, transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Sigil */}
        <div className="text-4xl text-white/10 font-mono mb-6 tracking-[0.3em]">
          ◇ · ✦ · ◉
        </div>

        {/* Title */}
        <h1
          className="text-5xl md:text-7xl text-white/90 mb-4 tracking-wider"
          style={{ fontFamily: '"Cinzel", serif' }}
        >
          LUMINAE
        </h1>

        <p
          className="text-lg text-white/40 mb-2 italic"
          style={{ fontFamily: '"EB Garamond", serif' }}
        >
          The void awakens, and it breathes.
        </p>

        <p className="text-[11px] text-white/20 font-mono uppercase tracking-[0.3em] mb-12">
          A Nostr-native creature god game
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mb-12">
          <div className="border border-white/[0.08] rounded p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Sparkles className="w-5 h-5 text-emerald-300/50 mx-auto mb-2" />
            <div className="text-xs text-white/60 mb-1">The Sanctuary</div>
            <div className="text-[10px] text-white/20 font-mono">Nurture your creature in real time</div>
          </div>
          <div className="border border-white/[0.08] rounded p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <BookOpen className="w-5 h-5 text-cyan-300/50 mx-auto mb-2" />
            <div className="text-xs text-white/60 mb-1">Divine Decrees</div>
            <div className="text-[10px] text-white/20 font-mono">Shape its soul through choices</div>
          </div>
          <div className="border border-white/[0.08] rounded p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Swords className="w-5 h-5 text-red-300/50 mx-auto mb-2" />
            <div className="text-xs text-white/60 mb-1">The Arena</div>
            <div className="text-[10px] text-white/20 font-mono">Battle other Nostr souls</div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            if (user) {
              navigate('/sanctuary');
            } else {
              navigate('/sanctuary');
            }
          }}
          className="group px-8 py-3 text-sm uppercase tracking-[0.2em] border border-white/20 rounded-full text-white/70 hover:border-white/40 hover:text-white/90 transition-all flex items-center gap-3"
        >
          Enter the Sanctuary
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {!user && (
          <p className="text-[10px] text-white/15 font-mono mt-4">
            Login with Nostr to summon your creature — or explore as a guest
          </p>
        )}

        <a
          href="/leaderboard"
          className="text-[10px] text-white/20 hover:text-white/40 font-mono mt-8 transition-colors uppercase tracking-widest"
        >
          View Hall of Legends
        </a>
      </div>

      {/* Bottom attribution */}
      <div className="relative z-10 text-center pb-4">
        <a
          href="https://shakespeare.diy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-white/10 hover:text-white/25 font-mono tracking-wider transition-colors"
        >
          Vibed with Shakespeare
        </a>
      </div>

      {/* Tailwind keyframes injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, 0) scale(1.1); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
