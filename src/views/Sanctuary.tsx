import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CreatureRenderer } from '@/engine/CreatureRenderer';
import { useCreatureStore, useCreature, useCreatureActions } from '@/stores/creature';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGodDecreeStore } from '@/stores/god';
import { cn } from '@/lib/utils';
import {
  NEEDS_DECAY_RATES,
  DEFAULT_FOODS,
  EVOLUTION_STAGES,
  getAlignmentColor,
  getCreatureStageByDays,
  GENESIS_PHRASES,
} from '@/systems/constants';
import type { Emotion } from '@/systems/types';
import {
  Heart,
  Zap,
  Sparkles,
  Swords,
  BookOpen,
  Trophy,
  Coffee,
  Hand,
  ShieldAlert,
  Activity,
  Clock,
} from 'lucide-react';

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 font-mono">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}

function AlignmentDial({ alignment }: { alignment: number }) {
  const angle = ((alignment + 100) / 200) * 180; // -100 to 100 maps to 0-180
  return (
    <div className="relative w-20 h-10 overflow-hidden">
      <div className="absolute bottom-0 w-20 h-20 rounded-full border border-white/[0.08]">
        <div
          className="absolute bottom-0 left-1/2 w-[2px] h-9 origin-bottom transition-transform duration-1000"
          style={{
            transform: `rotate(${angle - 90}deg)`,
            backgroundColor: getAlignmentColor(alignment),
            boxShadow: `0 0 8px ${getAlignmentColor(alignment)}`,
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-white/30" />
      </div>
      <div className="flex justify-between text-[8px] text-white/20 font-mono pt-1">
        <span>◄ Shadow</span>
        <span>Light ►</span>
      </div>
    </div>
  );
}

function FloatingButton({
  onClick,
  label,
  icon,
  glowColor,
  disabled,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  glowColor: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex flex-col items-center gap-1.5 transition-all duration-300',
        disabled ? 'opacity-30 pointer-events-none' : 'hover:scale-110 cursor-pointer'
      )}
    >
      <div
        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-white/30"
        style={{
          boxShadow: `inset 0 0 12px ${glowColor}20, 0 0 16px ${glowColor}15`,
        }}
      >
        <div className="text-white/60 group-hover:text-white/90 transition-colors">
          {icon}
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono group-hover:text-white/70 transition-colors">
        {label}
      </span>
    </button>
  );
}

export default function Sanctuary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CreatureRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  const creature = useCreature();
  const { summon, tick, feed, pet, train, cureSickness, setName, completeEvolution } = useCreatureActions();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [feedMenuOpen, setFeedMenuOpen] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showGenesis, setShowGenesis] = useState(false);

  const npub = user?.pubkey ? `npub1${user.pubkey}` : null;

  // Summon creature if missing
  useEffect(() => {
    if (!creature && npub) {
      summon(npub);
      setShowGenesis(true);
      setTimeout(() => setShowGenesis(false), 4000);
    }
  }, [creature, npub, summon]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CreatureRenderer(canvas);
    renderer.resize(canvas.offsetWidth, canvas.offsetHeight);
    rendererRef.current = renderer;

    const animate = (ts: number) => {
      if (creature) {
        renderer.creature = creature;
        renderer.emotion = getEmotion(creature);
        renderer.glowIntensity = 0.5 + (creature.stats.bond / 100) * 0.5;
      }
      renderer.render(ts);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      renderer.resize(canvas.offsetWidth, canvas.offsetHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
    };
  }, []);

  // Real-time tick
  useEffect(() => {
    const interval = setInterval(() => {
      tick(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  function getEmotion(c: typeof creature): Emotion {
    if (!c) return 'breathing';
    if (c.needs.health === 0) return 'sick';
    if (c.isSleeping) return 'sleeping';
    if (c.needs.hunger < 20) return 'hungry';
    if (c.needs.happiness > 85 && c.needs.energy > 60) return 'happy';
    if (c.needs.energy < 20) return 'sleeping';
    if (c.needs.happiness < 20) return 'breathing';
    if (c.stats.bond > 80 && c.needs.happiness > 70) return 'excited';
    return 'breathing';
  }

  const daysAlive = creature
    ? Math.floor((Date.now() / 1000 - creature.birthTimestamp) / 86400)
    : 0;
  const currentStage = getCreatureStageByDays(daysAlive);
  const nextStage = EVOLUTION_STAGES.find((s) => s.id > currentStage.id);

  const canEvolve =
    creature &&
    nextStage &&
    daysAlive >= nextStage.minDays &&
    (nextStage.id !== 2 || creature.wins >= 3) &&
    (nextStage.id !== 3 || Math.abs(creature.alignment) >= 60) &&
    (nextStage.id !== 5 || creature.stats.bond >= 95);

  const handlePet = useCallback(() => {
    pet();
    rendererRef.current?.triggerAdrenaline();
  }, [pet]);

  const handleFeed = useCallback(
    (foodId: string) => {
      const food = DEFAULT_FOODS.find((f) => f.id === foodId);
      if (food) feed(food);
      setFeedMenuOpen(false);
    },
    [feed]
  );

  if (!creature) {
    return (
      <div className="w-full h-screen bg-[#030508] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-white/10 animate-pulse mx-auto" />
          <p className="text-white/40 text-sm font-mono tracking-wider uppercase">
            Summoning your creature...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#030508] overflow-hidden" style={{ fontFamily: '"Space Mono", monospace' }}>
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'auto' }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4">
        {/* Left: creature identity */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempName(creature.name);
                setShowNameEdit(true);
              }}
              className="text-lg text-white/80 tracking-wide hover:text-white transition-colors"
              style={{ fontFamily: '"Cinzel", serif' }}
            >
              {creature.name}
            </button>
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest border border-white/10 rounded text-white/40 font-mono">
              {currentStage.name}
            </span>
          </div>
          <div className="text-[10px] text-white/30 font-mono">
            {creature.genome.archetype} · {creature.genome.innateAffinity}
          </div>
          {/* XP bar */}
          <div className="w-40 h-[2px] bg-white/[0.06] rounded-full mt-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(creature.xp / creature.xpToNext) * 100}%`,
                backgroundColor: getAlignmentColor(creature.alignment),
                boxShadow: `0 0 4px ${getAlignmentColor(creature.alignment)}60`,
              }}
            />
          </div>
        </div>

        {/* Right: alignment + bond */}
        <div className="flex flex-col items-end gap-3">
          <AlignmentDial alignment={creature.alignment} />
          <div className="text-[10px] text-white/30 font-mono">Day {daysAlive}</div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30 font-mono">{Math.round(creature.stats.bond)}/100</span>
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
        {/* Evolution button */}
        {canEvolve && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => {
                completeEvolution();
              }}
              className="px-6 py-2 text-xs uppercase tracking-widest border rounded-full animate-pulse"
              style={{
                borderColor: getAlignmentColor(creature.alignment),
                color: getAlignmentColor(creature.alignment),
                boxShadow: `0 0 20px ${getAlignmentColor(creature.alignment)}30`,
                fontFamily: '"Cinzel", serif',
              }}
            >
              Prepare to Evolve
            </button>
          </div>
        )}

        {/* Need bars */}
        <div className="max-w-md mx-auto mb-5 space-y-2">
          <NeedBar label="Hunger" value={creature.needs.hunger} color="#e63946" />
          <NeedBar label="Energy" value={creature.needs.energy} color="#457b9d" />
          <NeedBar label="Happiness" value={creature.needs.happiness} color="#a8e6cf" />
          <NeedBar label="Health" value={creature.needs.health} color="#ffd700" />
          <NeedBar label="Stimulation" value={creature.needs.stimulation} color="#b8ff6e" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 pb-2">
          <FloatingButton
            onClick={() => setFeedMenuOpen(!feedMenuOpen)}
            label="Feed"
            icon={<Zap className="w-5 h-5" />}
            glowColor="#ffd700"
            disabled={creature.isSleeping}
          />
          <FloatingButton
            onClick={handlePet}
            label="Pet"
            icon={<Hand className="w-5 h-5" />}
            glowColor="#ff99c8"
            disabled={creature.isSleeping}
          />
          <FloatingButton
            onClick={() => train()}
            label="Train"
            icon={<Activity className="w-5 h-5" />}
            glowColor="#a8e6ff"
            disabled={creature.isSleeping || creature.needs.energy < 10}
          />
          <FloatingButton
            onClick={() => navigate('/codex')}
            label="Codex"
            icon={<BookOpen className="w-5 h-5" />}
            glowColor="#7fffd4"
          />
          <FloatingButton
            onClick={() => navigate('/arena')}
            label="Arena"
            icon={<Swords className="w-5 h-5" />}
            glowColor="#e63946"
            disabled={creature.isSleeping || creature.needs.health === 0}
          />
        </div>
      </div>

      {/* Feed menu overlay */}
      {feedMenuOpen && (
        <div className="absolute bottom-44 left-0 right-0 z-30 flex justify-center">
          <div className="bg-[#080d14]/95 border border-white/[0.08] rounded-lg p-3 backdrop-blur-sm max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Lumens: {creature.lumens}</span>
              <button onClick={() => setFeedMenuOpen(false)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_FOODS.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleFeed(food.id)}
                  disabled={creature.lumens < food.cost}
                  className="flex items-center justify-between p-2 rounded border border-white/[0.05] hover:border-white/20 transition-all disabled:opacity-30 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: food.glowColor,
                        boxShadow: `0 0 8px ${food.glowColor}60`,
                      }}
                    />
                    <div>
                      <div className="text-xs text-white/70">{food.name}</div>
                      <div className="text-[9px] text-white/30">{food.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">{food.cost}L</span>
                </button>
              ))}
              {/* Zap to feed */}
              <button
                className="flex items-center justify-between p-2 rounded border border-amber-500/20 hover:border-amber-500/40 transition-all text-left"
                onClick={() => {
                  alert('WebLN zap integration coming soon — for now, feed from your Lumens!');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-amber-200/70">Zap to Feed</div>
                    <div className="text-[9px] text-white/30">Send sats via WebLN (1 sat = 10 Lumens)</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400/60 font-mono">⚡</span>
              </button>
            </div>
            {creature.needs.health === 0 && (
              <button
                onClick={() => {
                  cureSickness();
                  setFeedMenuOpen(false);
                }}
                className="w-full mt-2 p-2 text-xs text-red-300/80 border border-red-500/20 rounded hover:border-red-500/40 transition-all"
              >
                Cure Sickness (100L / 100 sats)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Name editor */}
      {showNameEdit && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#080d14] border border-white/[0.08] rounded-lg p-6 w-80">
            <h3 className="text-sm text-white/70 mb-3" style={{ fontFamily: '"Cinzel", serif' }}>Name Your Creature</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-white/30 font-mono"
              maxLength={24}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setName(tempName);
                  setShowNameEdit(false);
                }}
                className="flex-1 py-2 text-xs uppercase tracking-widest border border-white/20 rounded text-white/70 hover:border-white/40 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 py-2 text-xs uppercase tracking-widest border border-white/10 rounded text-white/40 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Genesis cinematic overlay */}
      {showGenesis && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-pulse">
          <div className="text-center space-y-3">
            <div
              className="text-2xl text-white/80"
              style={{ fontFamily: '"EB Garamond", serif', fontStyle: 'italic' }}
            >
              {GENESIS_PHRASES[Math.floor(Math.random() * GENESIS_PHRASES.length)]}
            </div>
            <div className="text-xs text-white/30 font-mono tracking-widest uppercase">
              Summoning from your soul...
            </div>
          </div>
        </div>
      )}

      {/* Sleep overlay */}
      {creature.isSleeping && !showGenesis && (
        <div className="absolute inset-0 z-10 pointer-events-none bg-[#030508]/30" />
      )}

      {/* Vibed with Shakespeare */}
      <div className="absolute bottom-2 right-2 z-20">
        <a
          href="https://shakespeare.diy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-white/10 hover:text-white/30 transition-colors font-mono tracking-wider"
        >
          Vibed with Shakespeare
        </a>
      </div>
    </div>
  );
}
