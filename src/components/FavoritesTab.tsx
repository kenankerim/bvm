import { Heart } from 'lucide-react';
import type { FeedItem } from '@/lib/supabase';
import { FeedCard, type CardActions } from './HomeTab';

/* ============ FAVORITES TAB ============ */

export function FavoritesTab({
  items, favorites, toggleFavorite, role, actions,
}: {
  items: FeedItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  role: 'jobseeker' | 'employer';
  actions: CardActions;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center space-x-2 pb-2">
        <Heart className="w-5 h-5 text-rose-400" />
        <h2 className="text-lg font-bold tracking-tight">Seçilmiş Vakansiyalar</h2>
        <span className="text-xs text-slate-400 font-medium">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-rose-400/50" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Seçilmiş vakansiya yoxdur</p>
          <p className="text-xs text-slate-400">Vakansiyalardakı ürək ikonu ilə bura əlavə edin</p>
        </div>
      ) : (
        items.map((item, idx) => (
          <FeedCard
            key={item.id}
            item={item}
            index={idx}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            role={role}
            actions={actions}
          />
        ))
      )}
    </div>
  );
}
