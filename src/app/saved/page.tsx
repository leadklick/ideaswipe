'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Idea } from '@/types';

interface SavedRow { id: string; idea: Idea; created_at: string; }

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

export default function SavedPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/save')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(data => { if (data) setSaved(data); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (ideaId: string) => {
    await fetch('/api/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId }),
    });
    setSaved(prev => prev.filter(r => r.idea.id !== ideaId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-700 text-lg">←</button>
        <span className="font-bold text-gray-800">⭐ Gespeicherte Ideen</span>
        <span className="ml-auto text-sm text-gray-400">{saved.length} Ideen</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Lade...</div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💡</div>
            <p className="text-gray-600 font-medium">Noch keine Ideen gespeichert</p>
            <p className="text-gray-400 text-sm mt-1">Swipe rechts oder ★ um Ideen zu speichern</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
              Zum Feed
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map(row => (
              <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setExpanded(expanded === row.idea.id ? null : row.idea.id)} className="w-full text-left p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[row.idea.category] || 'bg-gray-100 text-gray-600'}`}>{row.idea.category}</span>
                      <span className="text-xs text-gray-400">Score {row.idea.score}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{row.idea.title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{row.idea.tagline}</p>
                  </div>
                  <span className="text-gray-300 text-lg mt-1">{expanded === row.idea.id ? '▲' : '▼'}</span>
                </button>

                {expanded === row.idea.id && (
                  <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Problem</p>
                      <p className="text-gray-700 text-sm mt-1">{row.idea.problem}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lösung</p>
                      <p className="text-gray-700 text-sm mt-1">{row.idea.solution}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Markt</p>
                      <p className="text-gray-700 text-sm mt-1">{row.idea.market}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Warum jetzt?</p>
                      <p className="text-gray-600 text-sm mt-1 italic">{row.idea.why_now}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">⏱️ MVP {row.idea.mvp_weeks}W</span>
                      {row.idea.competitors?.map(c => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">⚔️ {c}</span>
                      ))}
                    </div>
                    <button onClick={() => handleDelete(row.idea.id)} className="text-xs text-red-400 hover:text-red-600 text-left mt-1">Entfernen</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
