'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SwipeDeck } from '@/components/IdeaCard/SwipeDeck';
import { Idea } from '@/types';

export default function Home() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIdeas, setLikedIdeas] = useState<{ title: string; category: string }[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  // Gespeicherte Likes laden
  useEffect(() => {
    fetch('/api/saved')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLikedIdeas(data.map((row: { idea: Idea }) => ({
            title: row.idea.title,
            category: row.idea.category,
          })));
          setSavedCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  const loadIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedIdeas }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (data.ideas?.length > 0) {
        setIdeas(data.ideas.map((idea: Idea, i: number) => ({
          ...idea,
          id: idea.id || `idea-${Date.now()}-${i}`,
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [likedIdeas, router]);

  useEffect(() => { loadIdeas(); }, []);

  const handleSave = useCallback(async (idea: Idea) => {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    });
    setLikedIdeas(prev => [{ title: idea.title, category: idea.category }, ...prev]);
    setSavedCount(c => c + 1);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span className="text-lg font-bold text-indigo-600">IdeaSwipe</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/saved" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <span>⭐</span>
            <span className="font-medium">{savedCount}</span>
            <span className="hidden sm:inline">gespeichert</span>
          </a>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        {likedIdeas.length > 0 && (
          <p className="text-xs text-indigo-400 mb-6 text-center">
            ✨ Personalisiert basierend auf {likedIdeas.length} gespeicherten Ideen
          </p>
        )}
        <SwipeDeck ideas={ideas} onLoadMore={loadIdeas} onSave={handleSave} isLoading={isLoading} />
        {!isLoading && ideas.length > 0 && (
          <div className="flex gap-5 mt-8">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white shadow-lg rounded-full px-4 py-3 text-xl border-2 border-red-100">✕</div>
              <span className="text-[10px] text-gray-400">Kein Interesse</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white shadow-lg rounded-full px-4 py-3 text-xl border-2 border-amber-100">★</div>
              <span className="text-[10px] text-gray-400">Speichern</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white shadow-lg rounded-full px-4 py-3 text-xl border-2 border-emerald-100">✓</div>
              <span className="text-[10px] text-gray-400">Gefällt mir</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
