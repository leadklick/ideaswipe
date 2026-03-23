'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { Idea, SwipeDirection } from '@/types';

interface SwipeDeckProps {
  ideas: Idea[];
  onLoadMore: () => void;
  onSave: (idea: Idea) => void;
  isLoading: boolean;
}

export function SwipeDeck({ ideas, onLoadMore, onSave, isLoading }: SwipeDeckProps) {
  const [remaining, setRemaining] = useState<Idea[]>(ideas);

  useEffect(() => {
    setRemaining(ideas);
  }, [ideas]);

  const handleSwipe = useCallback((idea: Idea, direction: SwipeDirection) => {
    if (direction === 'right' || direction === 'up') {
      onSave(idea);
    }
    setRemaining(prev => {
      const next = prev.filter(i => i.id !== idea.id);
      if (next.length === 0) {
        setTimeout(onLoadMore, 600);
      }
      return next;
    });
  }, [onSave, onLoadMore]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[560px] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-indigo-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">Ideen werden analysiert...</p>
          <p className="text-sm text-gray-400 mt-1">30 personalisierte Ideen werden generiert...</p>
        </div>
      </div>
    );
  }

  if (remaining.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[560px] gap-4">
        <div className="text-5xl">🔄</div>
        <p className="font-semibold text-gray-700">Lade neue Ideen...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: '600px' }}>
      {/* Zähler */}
      <div className="absolute -top-8 right-0 text-sm text-gray-400">
        {remaining.length} übrig
      </div>

      <AnimatePresence>
        {remaining.slice(0, 3).map((idea, index) => (
          <SwipeCard
            key={idea.id}
            idea={idea}
            onSwipe={handleSwipe}
            isTop={index === 0}
            stackIndex={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
