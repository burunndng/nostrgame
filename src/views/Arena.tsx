import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreature } from '@/stores/creature';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BattleEngine, createBattleParticipant } from '@/engine/BattleEngine';
import { CreatureRenderer } from '@/engine/CreatureRenderer';
import { ArrowLeft, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAlignmentColor } from '@/systems/constants';
import type { BattleLogEntry } from '@/systems/types';

export default function Arena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CreatureRenderer | null>(null);
  const rafRef = useRef<number>(0);

  const creature = useCreature();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [battleState, setBattleState] = useState<ReturnType<BattleEngine['simulateAIBattle']> | null>(null);
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [isInBattle, setIsInBattle] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);

  const npub = user?.pubkey ? `npub1${user.pubkey}` : 'npc';

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
        renderer.emotion = isInBattle ? 'breathing' : 'neutral';
      }
      renderer.render(ts);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    const handleResize = () => renderer.resize(canvas.offsetWidth, canvas.offsetHeight);
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
    };
  }, [creature, isInBattle]);

  // Generate AI opponent
  const generateAI = useCallback(() => {
    if (!creature) return null;

    // Create a slightly different version as AI opponent
    const aiCreature = {
      ...creature,
      genome: { ...creature.genome, baseHue: (creature.genome.baseHue + 180) % 360 },
      stats: {
        vitality: Math.max(20, creature.stats.vitality + (Math.random() * 20 - 10)),
        force: Math.max(20, creature.stats.force + (Math.random() * 20 - 10)),
        resonance: Math.max(20, creature.stats.resonance + (Math.random() * 20 - 10)),
        reflex: Math.max(20, creature.stats.reflex + (Math.random() * 20 - 10)),
        presence: Math.max(20, creature.stats.presence + (Math.random() * 20 - 10)),
        bond: Math.max(20, creature.stats.bond + (Math.random() * 20 - 10)),
      },
      name: creature.name + '-\u03b1', // alpha clone
    };
    return createBattleParticipant('ai-npub', aiCreature, true);
  }, [creature]);

  const startBattle = useCallback(() => {
    if (!creature) return;
    const player = createBattleParticipant(npub, creature);
    const ai = generateAI();
    if (!ai) return;

    const engine = new BattleEngine([player, ai], { public: false });
    engine.onStateChange = (s) => {
      setBattleState(s);
      setLog([...s.battleLog]);
    };

    setBattleState(engine.state);
    setLog([]);
    setIsInBattle(true);
    setCurrentTurn(0);
    setSelectedMove(null);
  }, [creature, npub, generateAI]);

  const playerMove = useCallback(
    (moveIdx: number) => {
      if (!battleState || battleState.isComplete || isResolving) return;
      setIsResolving(true);

      // Clone existing battle to apply move
      const player = battleState.participants[0];
      const ai = battleState.participants[1];
      const engine = new BattleEngine([{ ...player }, { ...ai }] as [typeof player, typeof ai], { public: false });
      engine.state = { ...battleState };
      engine.state.participants = [
        { ...player },
        { ...ai },
      ];
      // Manually set current HP to preserve state
      engine.state.participants[0].currentHp = battleState.participants[0].currentHp;
      engine.state.participants[1].currentHp = battleState.participants[1].currentHp;
      engine.state.isComplete = battleState.isComplete;

      const entry = engine.resolveMove(moveIdx, 0);

      if (entry && !engine.state.isComplete) {
        // AI responds after a delay
        setTimeout(() => {
          const aiMoveIdx = Math.floor(Math.random() * ai.moves.length);
          engine.resolveMove(aiMoveIdx, 1);
          setBattleState(engine.state);
          setLog([...engine.state.battleLog]);
          setCurrentTurn(engine.state.turn);
          setIsResolving(false);

          if (engine.state.isComplete) {
            rendererRef.current?.triggerAdrenaline();
          }
        }, 1200);
      } else {
        setBattleState(engine.state);
        setLog([...engine.state.battleLog]);
        setCurrentTurn(engine.state.turn);
        setIsResolving(false);
      }
    },
    [battleState, isResolving]
  );

  // Auto-start battle if not in one
  useEffect(() => {
    if (creature && !isInBattle && !battleState) {
      setTimeout(() => startBattle(), 0);
    }
  }, [creature, isInBattle, battleState, startBattle]);

  const playerHp = battleState?.participants[0]?.currentHp ?? 0;
  const playerMax = battleState?.participants[0]?.creature
    ? Math.floor(battleState.participants[0].creature.stats.vitality * 4.5)
    : 100;
  const aiHp = battleState?.participants[1]?.currentHp ?? 0;
  const aiMax = battleState?.participants[1]?.creature
    ? Math.floor(battleState.participants[1].creature.stats.vitality * 4.5)
    : 100;

  return (
    <div className="w-full h-screen bg-[#030508] flex flex-col" style={{ fontFamily: '"Space Mono", monospace' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-white/50 hover:text-white/80 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg text-white/80" style={{ fontFamily: '"Cinzel", serif' }}>
            The Arena
          </h1>
          <p className="text-[10px] text-white/30 font-mono">shine your light in battle</p>
        </div>
      </div>

      {/* Battle canvas area */}
      <div className="relative flex-1 min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Screen flash on crit */}
        {log.length > 0 && log[log.length - 1]?.crit && (
          <div className="absolute inset-0 bg-white/[0.03] animate-pulse pointer-events-none" />
        )}

        {/* Battle info overlay */}
        {battleState && !battleState.isComplete && (
          <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
            {/* Player health */}
            <div className="space-y-1">
              <div className="text-[10px] text-white/50 font-mono">{creature?.name}</div>
              <div className="w-32 h-[3px] bg-white/[0.1] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(playerHp / Math.max(1, playerMax)) * 100}%`,
                    backgroundColor: playerHp < playerMax * 0.3 ? '#e63946' : getAlignmentColor(creature?.alignment ?? 0),
                  }}
                />
              </div>
              <div className="text-[9px] text-white/30 font-mono">
                {playerHp}/{playerMax} HP
              </div>
            </div>

            {/* Turn indicator */}
            <div className="text-center">
              <div className="text-[10px] text-white/30 font-mono uppercase">Turn {currentTurn}</div>
            </div>

            {/* AI health */}
            <div className="space-y-1 text-right">
              <div className="text-[10px] text-white/50 font-mono">{battleState.participants[1].creature.name}</div>
              <div className="w-32 h-[3px] bg-white/[0.1] rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(aiHp / Math.max(1, aiMax)) * 100}%`,
                    backgroundColor: aiHp < aiMax * 0.3 ? '#e63946' : getAlignmentColor(0),
                  }}
                />
              </div>
              <div className="text-[9px] text-white/30 font-mono">
                {aiHp}/{aiMax} HP
              </div>
            </div>
          </div>
        )}

        {/* Battle log */}
        {log.length > 0 && !battleState?.isComplete && (
          <div className="absolute top-20 left-4 right-4 z-10 flex flex-col items-center pointer-events-none">
            {log.slice(-2).map((entry, i) => (
              <div
                key={`${entry.turn}-${i}`}
                className="text-xs text-white/60 text-center font-mono mb-1 animate-pulse"
              >
                {entry.dodged
                  ? `${entry.actor.slice(0, 8)}... dodged!`
                  : `${entry.actor.slice(0, 8)}... used ${entry.move} for ${entry.damage} ${entry.crit ? 'CRIT!' : ''}`}
              </div>
            ))}
          </div>
        )}

        {/* Victory / Defeat overlay */}
        {battleState?.isComplete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
            <div className="text-center space-y-4">
              <div
                className="text-3xl"
                style={{ fontFamily: '"Cinzel", serif' }}
              >
                {battleState.winner === npub ? (
                  <span className="text-emerald-400/80">Victory</span>
                ) : (
                  <span className="text-red-400/60">Defeat</span>
                )}
              </div>
              <div className="text-sm text-white/50 font-mono">
                {log.length} turns · {battleState.winner === npub ? '+15 XP · +25 Lumens' : '+5 XP · +10 Lumens'}
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={startBattle}
                  className="px-6 py-2 text-xs uppercase tracking-widest border border-white/20 rounded-full text-white/70 hover:border-white/40 transition-all"
                >
                  Battle Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 text-xs uppercase tracking-widest border border-white/10 rounded-full text-white/40 hover:border-white/20 transition-all"
                >
                  Sanctuary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Move selector */}
      {battleState && !battleState.isComplete && (
        <div className="shrink-0 border-t border-white/[0.06] p-4 bg-[#030508]/90 backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {battleState.participants[0].moves.map((move, idx) => (
                <button
                  key={move.id}
                  onClick={() => {
                    if (!isResolving) {
                      setSelectedMove(idx);
                      playerMove(idx);
                    }
                  }}
                  disabled={isResolving}
                  className={cn(
                    'relative p-3 rounded border text-left transition-all',
                    selectedMove === idx
                      ? 'border-white/30 bg-white/[0.05]'
                      : 'border-white/[0.08] hover:border-white/20',
                    isResolving && 'opacity-40 pointer-events-none'
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono mb-1">
                    {move.category}
                  </div>
                  <div className="text-sm text-white/80 font-medium">{move.name}</div>
                  <div className="text-[9px] text-white/20 font-mono mt-0.5">PWR {move.power}</div>
                  <div className="absolute top-2 right-2 text-[9px] text-white/20 font-mono">
                    {move.accuracy}%
                  </div>
                </button>
              ))}
            </div>

            {/* Zap button */}
            <button
              className="w-full mt-2 py-2 text-[10px] uppercase tracking-widest text-amber-400/50 border border-amber-500/10 rounded hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
              onClick={() => alert('Spectator zap coming soon!')}
            >
              <Zap className="w-3 h-3" />
              Zap to Boost (WebLN)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
