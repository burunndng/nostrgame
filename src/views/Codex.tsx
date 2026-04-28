import { useNavigate } from 'react-router-dom';
import { useCreature } from '@/stores/creature';
import {
  ArrowLeft,
  Heart,
  Wind,
  Users,
  Crown,
  Crosshair,
} from 'lucide-react';
import {
  AFFINITY_COLORS,
  getCreatureStageByDays,
  getAlignmentColor,
  TRAIT_DEFINITIONS,
} from '@/systems/constants';

function StatBlock({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-white/40 font-mono uppercase tracking-wider">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-[2px] bg-white/[0.06] rounded-full">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(value / max) * 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

export default function Codex() {
  const creature = useCreature();
  const navigate = useNavigate();

  if (!creature) {
    return (
      <div className="w-full h-screen bg-[#030508] flex items-center justify-center">
        <div className="text-white/40 text-sm font-mono">No creature to inspect...</div>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/purity
  const daysAlive = Math.floor((Date.now() / 1000 - creature.birthTimestamp) / 86400);
  const stage = getCreatureStageByDays(daysAlive);
  const hp = Math.floor(creature.stats.vitality * 4.5);
  const speed = Math.floor(creature.stats.reflex * 0.8 + creature.stats.bond * 0.2);
  const critChance = Math.round((creature.stats.bond / 100) * 0.35 * 100);
  const wins = creature.wins;
  const losses = creature.losses;
  const ratio = losses > 0 ? (wins / (wins + losses)) * 100 : wins > 0 ? 100 : 0;

  const affinityColor = AFFINITY_COLORS[creature.genome.innateAffinity];

  return (
    <div
      className="w-full min-h-screen bg-[#030508] text-white/80"
      style={{ fontFamily: '"Space Mono", monospace' }}
    >
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
              The Codex
            </h1>
            <p className="text-[10px] text-white/30 font-mono">arcane record of your creature</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Identity Card */}
        <div className="relative border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <div
            className="absolute top-0 left-4 -translate-y-1/2 px-2 text-[10px] uppercase tracking-widest font-mono"
            style={{
              background: '#030508',
              color: affinityColor,
              border: `1px solid ${affinityColor}30`,
            }}
          >
            {stage.name}
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl text-white/90" style={{ fontFamily: '"Cinzel", serif' }}>
                {creature.name}
              </h2>
              <p className="text-[11px] text-white/30 font-mono mt-1">
                {creature.genome.archetype} · {creature.genome.innateAffinity} · Day {daysAlive}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: getAlignmentColor(creature.alignment),
                boxShadow: `0 0 12px ${getAlignmentColor(creature.alignment)}40`,
              }}
            >
              <span className="text-[10px] font-mono text-white/60">
                {creature.alignment > 0 ? '+' : ''}{creature.alignment}
              </span>
            </div>
          </div>

          {/* Sigil */}
          <div className="text-center py-4">
            <div className="text-2xl text-white/20 font-mono tracking-[0.5em]">
              {creature.genome.birthmark}
            </div>
          </div>
        </div>

        {/* Core Stats */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02] space-y-4">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono">Core Stats</h3>
          <StatBlock label="Vitality (HP Pool)" value={creature.stats.vitality} max={100} color="#e63946" />
          <StatBlock label="Force (Attack)" value={creature.stats.force} max={100} color="#ff6d6d" />
          <StatBlock label="Resonance (Magic)" value={creature.stats.resonance} max={100} color="#ffd700" />
          <StatBlock label="Reflex (Speed)" value={creature.stats.reflex} max={100} color="#a8e6ff" />
          <StatBlock label="Presence (Social)" value={creature.stats.presence} max={100} color="#b8ff6e" />
          <StatBlock label="Bond (Loyalty)" value={creature.stats.bond} max={100} color="#ff99c8" />
        </div>

        {/* Derived Stats */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-4">Derived Combat</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-white/20" />
              <div>
                <div className="text-xs text-white/60">{hp} HP</div>
                <div className="text-[9px] text-white/20 font-mono">Vitality × 4.5</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-white/20" />
              <div>
                <div className="text-xs text-white/60">{speed} Speed</div>
                <div className="text-[9px] text-white/20 font-mono">Reflex weighted</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-white/20" />
              <div>
                <div className="text-xs text-white/60">{critChance}% Crit</div>
                <div className="text-[9px] text-white/20 font-mono">Bond-based</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-white/20" />
              <div>
                <div className="text-xs text-white/60">{Math.round(creature.stats.presence * 0.15)} Boost</div>
                <div className="text-[9px] text-white/20 font-mono">Social %15</div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Record */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-3">Battle Record</h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl text-emerald-400/80">{wins}</div>
              <div className="text-[9px] text-white/30 font-mono uppercase">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-red-400/60">{losses}</div>
              <div className="text-[9px] text-white/30 font-mono uppercase">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white/60">{Math.round(ratio)}%</div>
              <div className="text-[9px] text-white/30 font-mono uppercase">Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-amber-400/70">{creature.lumens}</div>
              <div className="text-[9px] text-white/30 font-mono uppercase">Lumens</div>
            </div>
          </div>
          {wins >= 3 && (
            <div className="mt-3 text-[10px] text-amber-300/50 font-mono border border-amber-500/10 rounded px-2 py-1 inline-block">
              ✦ Win streak bonus active
            </div>
          )}
        </div>

        {/* Traits */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-3">Active Traits</h3>
          {creature.traits.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {creature.traits.map((trait) => {
                const def = TRAIT_DEFINITIONS[trait];
                if (!def || trait === 'None') return null;
                return (
                  <div
                    key={trait}
                    className="px-3 py-1.5 rounded border border-white/[0.08] text-[11px] text-white/60"
                  >
                    <span className="font-semibold">{trait}</span>
                    <span className="text-white/30"> — {def.description}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/20 italic" style={{ fontFamily: '"EB Garamond", serif' }}>
              Your creature has yet to reveal its nature...
            </p>
          )}
        </div>

        {/* Evolution Timeline */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-4">Evolution Path</h3>
          <div className="space-y-3">
            {[
              { id: 1, name: 'Wisp', days: '0–6' },
              { id: 2, name: 'Sprite', days: '7–20' },
              { id: 3, name: 'Familiar', days: '21–49' },
              { id: 4, name: 'Guardian', days: '50–99' },
              { id: 5, name: 'Eternal', days: '100+' },
            ].map((s) => {
              const reached = creature.stage >= s.id;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: reached ? getAlignmentColor(creature.alignment) : 'rgba(255,255,255,0.1)',
                      boxShadow: reached ? `0 0 6px ${getAlignmentColor(creature.alignment)}60` : 'none',
                    }}
                  />
                  <div className={`text-xs ${reached ? 'text-white/70' : 'text-white/20'}`}>
                    {s.name}
                    <span className="text-white/20 font-mono text-[10px] ml-2">({s.days})</span>
                  </div>
                  {reached && (
                    <Crown className="w-3 h-3 text-white/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Summary */}
        <div className="border border-white/[0.08] rounded-lg p-5 bg-white/[0.02]">
          <h3 className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-3">Current Condition</h3>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
            <div className={`${creature.needs.hunger < 25 ? 'text-red-300/50' : 'text-white/30'}`}>
              ● Hunger: {Math.round(creature.needs.hunger)}/100
            </div>
            <div className={`${creature.needs.energy < 25 ? 'text-red-300/50' : 'text-white/30'}`}>
              ● Energy: {Math.round(creature.needs.energy)}/100
            </div>
            <div className={`${creature.needs.happiness < 25 ? 'text-red-300/50' : 'text-white/30'}`}>
              ● Happiness: {Math.round(creature.needs.happiness)}/100
            </div>
            <div className={`${creature.needs.health < 25 ? 'text-red-300/50' : 'text-white/30'}`}>
              ● Health: {Math.round(creature.needs.health)}/100
            </div>
            <div className={`${creature.needs.stimulation < 25 ? 'text-red-300/50' : 'text-white/30'}`}>
              ● Stimulation: {Math.round(creature.needs.stimulation)}/100
            </div>
            <div className={`${creature.isSleeping ? 'text-blue-300/50' : 'text-white/30'}`}>
              ● State: {creature.isSleeping ? 'Sleeping' : 'Awake'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer padding */}
      <div className="h-10" />
    </div>
  );
}
