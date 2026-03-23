'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Idea, SwipeDirection } from '@/types';

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  idea: Idea;
  onSwipe: (idea: Idea, direction: SwipeDirection) => void;
  isTop: boolean;
  stackIndex: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  SaaS: 'bg-indigo-100 text-indigo-700',
  'KI-Tool': 'bg-violet-100 text-violet-700',
  Marketplace: 'bg-amber-100 text-amber-700',
  B2B: 'bg-blue-100 text-blue-700',
  B2C: 'bg-pink-100 text-pink-700',
  FinTech: 'bg-emerald-100 text-emerald-700',
  RegTech: 'bg-orange-100 text-orange-700',
  HealthTech: 'bg-red-100 text-red-700',
  EdTech: 'bg-cyan-100 text-cyan-700',
};

export function SwipeCard({ idea, onSwipe, isTop, stackIndex }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.5]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.5, 0]);

  const handleDragEnd = () => {
    const cx = x.get();
    const cy = y.get();
    if (cx > SWIPE_THRESHOLD) {
      animate(x, 700, { duration: 0.25 });
      onSwipe(idea, 'right');
    } else if (cx < -SWIPE_THRESHOLD) {
      animate(x, -700, { duration: 0.25 });
      onSwipe(idea, 'left');
    } else if (cy < -SWIPE_THRESHOLD) {
      animate(y, -900, { duration: 0.25 });
      onSwipe(idea, 'up');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  const categoryColor = CATEGORY_COLORS[idea.category] || 'bg-gray-100 text-gray-600';

  return (
    <motion.div
      className="absolute w-full"
      style={{
        x, y, rotate,
        scale: 1 - stackIndex * 0.04,
        translateY: stackIndex * 14,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
    >
      {/* Overlays */}
      <motion.div className="absolute inset-0 rounded-2xl bg-emerald-400 pointer-events-none z-10" style={{ opacity: greenOpacity }} />
      <motion.div className="absolute inset-0 rounded-2xl bg-red-400 pointer-events-none z-10" style={{ opacity: redOpacity }} />

      <div className={`bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[560px] ${isTop ? 'cursor-grab active:cursor-grabbing select-none' : 'pointer-events-none'}`}>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 pb-6 relative">
          <div className="flex items-start justify-between gap-2 mt-1">
            <div className="flex-1">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
                {idea.category}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{idea.title}</h2>
              <p className="text-indigo-200 text-sm mt-0.5">{idea.tagline}</p>
            </div>
            <div className="flex flex-col items-center bg-white/20 backdrop-blur rounded-xl px-3 py-2 shrink-0">
              <span className="text-2xl font-black text-white">{idea.score}</span>
              <span className="text-indigo-200 text-[10px]">Score</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex flex-col gap-3 overflow-hidden">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Problem</p>
            <p className="text-gray-700 text-sm mt-1 line-clamp-3">{idea.problem}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lösung</p>
            <p className="text-gray-700 text-sm mt-1 line-clamp-3">{idea.solution}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Warum jetzt?</p>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2 italic">{idea.why_now}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-auto pt-2">
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">🗺️ {idea.regions.join(', ')}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">⏱️ MVP {idea.mvp_weeks}W</span>
            {idea.competitors[0] && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">⚔️ {idea.competitors[0]}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        {isTop && (
          <div className="border-t bg-gray-50 px-5 py-2.5 flex justify-between text-xs text-gray-400">
            <span>✕ Kein Interesse</span>
            <span>★ Speichern</span>
            <span>✓ Gefällt mir</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
