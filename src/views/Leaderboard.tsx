import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { getAlignmentColor } from '@/systems/constants';
import type { LeaderboardEntry } from '@/systems/types';

// Mock leaderboard data — in production this queries a relay
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { npub: 'npub1alice', name: 'Solara', archetype: 'Lumis', stage: 3, elo: 1420, wins: 24, losses: 5, hue: 195 },
  { npub: 'npub1bob', name: 'Mordek', archetype: 'Umbra', stage: 4, elo: 1380, wins: 31, losses: 12, hue: 340 },
  { npub: 'npub1char', name: 'Glitnix', archetype: 'Vex', stage: 3, elo: 1310, wins: 18, losses: 8, hue: 120 },
  { npub: 'npub1dave', name: 'Vesperion', archetype: 'Wraith', stage: 5, elo: 1455, wins: 42, losses: 3, hue: 280 },
  { npub: 'npub1eve', name: 'Nyxara', archetype: 'Umbra', stage: 2, elo: 1200, wins: 15, losses: 10, hue: 20 },
  { npub: 'npub1frank', name: 'Aetherion', archetype: 'Wraith', stage: 3, elo: 1290, wins: 21, losses: 9, hue: 180 },
  { npub: 'npub1grace', name: 'Luminara', archetype: 'Lumis', stage: 4, elo: 1355, wins: 28, losses: 7, hue: 200 },
  { npub: 'npub1hank', name: 'Fluxion', archetype: 'Vex', stage: 3, elo: 1270, wins: 19, losses: 11, hue: 90 },
  { npub: 'npub1ivy', name: 'Terranox', archetype: 'Wraith', stage: 2, elo: 1180, wins: 13, losses: 8, hue: 150 },
  { npub: 'npub1jack', name: 'Vorath', archetype: 'Umbra', stage: 4, elo: 1320, wins: 26, losses: 14, hue: 320 },
];

function RankBadge({ position }: { position: number }) {
  if (position === 0)
    return (
      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
        <Crown className="w-4 h-4 text-amber-400" />
      </div>
    );
  if (position === 1)
    return (
      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center text-xs text-white/50 font-mono">
        2
      </div>
    );
  if (position === 2)
    return (
      <div className="w-8 h-8 rounded-full bg-amber-800/20 border border-amber-800/40 flex items-center justify-center text-xs text-amber-600 font-mono">
        3
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xs text-white/30 font-mono">
      {position + 1}
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#030508]" style={{ fontFamily: '"Space Mono", monospace' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#030508]/80 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-white/50 hover:text-white/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg text-white/80" style={{ fontFamily: '"Cinzel", serif' }}>
              Hall of Legends
            </h1>
            <p className="text-[10px] text-white/30 font-mono">season alpha · top creatures</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {MOCK_LEADERBOARD.map((entry, i) => {
          const winRate = entry.wins + entry.losses > 0
            ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
            : 0;
          return (
            <div
              key={entry.npub}
              className="flex items-center gap-3 p-3 rounded border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <RankBadge position={i} />

              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: getAlignmentColor(entry.hue < 180 ? entry.hue - 30 : entry.hue - 200),
                  boxShadow: `0 0 6px ${getAlignmentColor(entry.hue < 180 ? entry.hue - 30 : entry.hue - 200)}40`,
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-white/70 truncate">{entry.name}</span>
                  <span className="text-[10px] text-white/30 font-mono">{entry.archetype}</span>
                </div>
                <div className="text-[9px] text-white/20 font-mono">
                  {entry.wins}W · {entry.losses}L · {winRate}% · Stage {entry.stage}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm text-white/60 font-mono">{entry.elo}</div>
                <div className="text-[9px] text-white/20 font-mono">ELO</div>
              </div>
            </div>
          );
        })}

        {/* Season info */}
        <div className="text-center pt-6 pb-4">
          <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
            Season resets in 87 days
          </div>
          <div className="text-[9px] text-white/10 font-mono mt-1">
            Champions receive permanent cosmetic sigil
          </div>
        </div>
      </div>
    </div>
  );
}
