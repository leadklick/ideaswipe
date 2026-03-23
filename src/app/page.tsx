'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SwipeDeck } from '@/components/IdeaCard/SwipeDeck';
import { createClient } from '@/lib/supabase';
import { Idea } from '@/types';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIdeas, setLikedIdeas] = useState<{ title: string; category: string }[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });
  }, []);

  // Gespeicherte Likes aus Supabase laden (für Personalisierung)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_ideas')
      .select('idea')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          const liked = data.map((row: { idea: Idea }) => ({
            title: row.idea.title,
            category: row.idea.category,
          }));
          setLikedIdeas(liked);
          setSavedCount(data.length);
        }
      });
  }, [user]);

  const loadIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedIdeas }),
      });
      const data = await res.json();
      if (data.ideas) {
        // IDs sicherstellen
        const withIds = data.ideas.map((idea: Idea, i: number) => ({
          ...idea,
          id: idea.id || `idea-${Date.now()}-${i}`,
        }));
        setIdeas(withIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [likedIdeas]);

  // Ideen laden sobald User bekannt
  useEffect(() => {
    if (user) loadIdeas();
  }, [user]);

  const handleSave = useCallback(async (idea: Idea) => {
    if (!user) return;
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, userId: user.id }),
    });
    setLikedIdeas(prev => [{ title: idea.title, category: idea.category }, ...prev]);
    setSavedCount(c => c + 1);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span className="text-lg font-bold text-indigo-600">IdeaSwipe</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/saved"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <span>⭐</span>
            <span className="font-medium">{savedCount}</span>
            <span className="hidden sm:inline">gespeichert</span>
          </a>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        {likedIdeas.length > 0 && (
          <p className="text-xs text-indigo-400 mb-6 text-center">
            ✨ Personalisiert basierend auf {likedIdeas.length} gespeicherten Ideen
          </p>
        )}

        <SwipeDeck
          ideas={ideas}
          onLoadMore={loadIdeas}
          onSave={handleSave}
          isLoading={isLoading}
        />

        {/* Button-Legende */}
        {!isLoading && ideas.length > 0 && (
          <div className="flex gap-5 mt-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-13 h-13 rounded-full bg-white shadow-lg flex items-center justify-center text-xl border-2 border-red-100 px-4 py-3">✕</div>
              <span className="text-[10px] text-gray-400">Kein Interesse</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-13 h-13 rounded-full bg-white shadow-lg flex items-center justify-center text-xl border-2 border-amber-100 px-4 py-3">★</div>
              <span className="text-[10px] text-gray-400">Speichern</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-13 h-13 rounded-full bg-white shadow-lg flex items-center justify-center text-xl border-2 border-emerald-100 px-4 py-3">✓</div>
              <span className="text-[10px] text-gray-400">Gefällt mir</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
