import { useState } from 'react';
import { Search, SlidersHorizontal, Send, Phone, Eye, MapPin, Clock, Heart, Star, PlusCircle, CheckCircle2 } from 'lucide-react';
import type { Company, FeedItem } from '@/lib/supabase';

/* ============ HOME TAB ============ */

export type CardActions = {
  appliedIds: string[];
  viewedIds: string[];
  onApply: (item: FeedItem) => void;
  onView: (item: FeedItem) => void;
  onNewVacancy: () => void;
};

export function HomeTab({
  companies, feedItems, loading, searchQuery, setSearchQuery,
  setShowFilterModal, favorites, toggleFavorite, role, actions,
}: {
  companies: Company[];
  feedItems: FeedItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  setShowFilterModal: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  role: 'jobseeker' | 'employer';
  actions: CardActions;
}) {
  return (
    <>
      {/* Stories Carousel */}
      <section className="space-y-1">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar py-1">
          {companies.map((item, idx) => (
            <div key={item.id} className="flex-shrink-0 flex flex-col items-center space-y-1 cursor-pointer group">
              <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-md group-hover:scale-105 transition-transform ${idx === 0 ? 'animate-pulse-glow' : ''}`}>
                <div className="w-full h-full rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center text-[11px] font-semibold text-center px-1 leading-tight">
                  {item.name}
                </div>
              </div>
              <span className="text-[10px] text-slate-300 font-medium truncate w-16 text-center">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Search & Filter */}
      <section className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vakansiya, şəhər, vəzifə və ya şirkət axtar..."
            className="w-full bg-slate-900/85 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-300 backdrop-blur-md focus:outline-none focus:border-cyan-400/80 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-md text-cyan-200 hover:bg-cyan-500/30 active:scale-95 transition-all shadow-lg shadow-cyan-500/15"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </section>

      {/* Feed */}
      <section className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-3xl bg-slate-900/85 border border-white/10 backdrop-blur-md p-5 space-y-3 animate-pulse">
                <div className="h-6 w-32 bg-white/10 rounded-lg" />
                <div className="h-4 w-48 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-10 w-full bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Nəticə tapılmadı</p>
            <p className="text-xs text-slate-400">Axtarışınızı dəyişdirin və ya filtrləri sıfırlayın</p>
          </div>
        ) : (
          feedItems.map((item, idx) => (
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
      </section>
    </>
  );
}

/* ============ FEED CARD ============ */

export function FeedCard({
  item, index, isFavorite, onToggleFavorite, role, actions,
}: {
  item: FeedItem;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  role: 'jobseeker' | 'employer';
  actions: CardActions;
}) {
  const companyName = item.company?.name || '';
  const applied = actions.appliedIds.includes(item.id);
  const viewed = actions.viewedIds.includes(item.id);
  const [expanded, setExpanded] = useState(false);
  const handleView = () => {
    setExpanded((v) => !v);
    actions.onView(item);
  };
  return (
    <div
      className="relative rounded-3xl bg-slate-900/85 border border-white/10 backdrop-blur-md p-5 space-y-4 shadow-xl shadow-black/10 hover:border-cyan-400/30 hover:bg-white/[0.12] transition-all group animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {item.is_vip && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-extrabold tracking-wider shadow-lg flex items-center space-x-0.5">
          <Star className="w-2.5 h-2.5 fill-black" />
          <span>VIP</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-wider text-cyan-300 uppercase px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 backdrop-blur-md">
          {companyName ? `ŞİRKƏT: ${companyName}` : 'BVM'}
        </span>
        {item.type === 'vacancy' && (
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 backdrop-blur-md">
            {item.salary}
          </span>
        )}
        {item.type === 'article' && (
          <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-3 py-1 rounded-xl border border-blue-500/30 backdrop-blur-md">
            {item.category}
          </span>
        )}
      </div>

      <div className="space-y-1.5 pt-1">
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{item.title}</h3>
        <p className="text-xs text-slate-300 font-medium">{companyName}</p>
        {item.type === 'article' && (
          <p className={`text-xs text-slate-200 leading-relaxed pt-1 ${expanded ? '' : 'line-clamp-2'}`}>{item.content}</p>
        )}
      </div>

      {item.type === 'vacancy' && (
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-200 pt-1">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl font-medium">
            <Clock className="w-3 h-3" /> {item.duration}
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl font-medium">
            <MapPin className="w-3 h-3" /> {item.location}
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex space-x-2">
          {item.type === 'vacancy' && role === 'jobseeker' && (
            <button
              onClick={() => !applied && actions.onApply(item)}
              disabled={applied}
              className={`flex items-center space-x-2 text-xs px-4 py-2 rounded-xl font-extrabold active:scale-95 transition-all ${
                applied
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90 shadow-md shadow-cyan-500/20'
              }`}
            >
              {applied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{applied ? 'Müraciət edildi' : 'Müraciət Et'}</span>
            </button>
          )}
          {item.type === 'article' && (
            <button
              onClick={handleView}
              className="flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{expanded ? 'Bağla' : 'Davamını Oxu'}</span>
            </button>
          )}
          {item.type === 'vacancy' && (
            <button
              onClick={handleView}
              aria-label="Vakansiyaya bax"
              className={`p-2.5 rounded-xl border backdrop-blur-xl transition-all ${
                viewed ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {role === 'employer' && (
            <button
              onClick={actions.onNewVacancy}
              className="flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yeni Vakansiya</span>
            </button>
          )}
          <button aria-label="Zəng et" className="p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl hover:bg-white/20 text-slate-200 transition-all">
            <Phone className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
        <button
          onClick={onToggleFavorite}
          className={`p-2.5 rounded-xl border backdrop-blur-xl transition-all ${
            isFavorite
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-white/10 border-white/15 text-slate-200 hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}
