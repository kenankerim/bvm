import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Heart, MessageSquare, User, Bell, BellOff } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase, type Company, type Vacancy, type Article, type FeedItem } from './lib/supabase';
import { firebaseAuth, type FirebaseUser } from './lib/firebase';
import { useCollection } from './hooks/useCollection';
import { COMPANY_VACANCIES, effectiveStatus, toFeedItem, useNow, type CompanyVacancy } from './lib/vacancies';
import type { Row } from './lib/db';
import { AuthModal } from './components/AuthModal';
import { HomeTab, type CardActions } from './components/HomeTab';
import { FavoritesTab } from './components/FavoritesTab';
import { MessagesTab } from './components/MessagesTab';
import { FilterModal, type SortBy } from './components/FilterModal';
import { ProfileTab } from './components/profile/ProfileTab';
import type { Application } from './components/profile/CompanyBlocks';

type Role = 'jobseeker' | 'employer';
type View = Row & { viewer_uid: string; item_id: string };

const conversations = [
  { id: 1, name: 'Pasha Bank HR', lastMsg: 'Sizin CV-nizə baxdıq...', time: '10:24', unread: 2 },
  { id: 2, name: 'Kapital Bank', lastMsg: 'Müsahibə vaxtını təsdiqləyin', time: 'Dünən', unread: 0 },
  { id: 3, name: 'Azercell İşə Qəbul', lastMsg: 'Təşəkkür edirik!', time: '2 gün', unread: 0 },
];

const workTypeOptions = ['Tam ştat', 'Uzaqdan', 'Yarım ştat', 'Mövsümi', 'Növbəli', 'Freelance'];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [role, setRole] = useState<Role>('jobseeker');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [baseFeed, setBaseFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newVacancySignal, setNewVacancySignal] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bvm_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [experienceUnit, setExperienceUnit] = useState('ay');
  const [experienceVal, setExperienceVal] = useState(6);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(['Tam ştat', 'Uzaqdan']);
  const [customWorkType, setCustomWorkType] = useState('');
  const [cvLanguage, setCvLanguage] = useState('AZ');
  const [salaryRange, setSalaryRange] = useState(300);
  const [companySearch, setCompanySearch] = useState('');

  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; from: string; text: string; time: string }[]>([]);

  const [notificationsOn, setNotificationsOn] = useState(() => {
    try { return localStorage.getItem('bvm_notifications') !== 'off'; } catch { return true; }
  });
  useEffect(() => {
    localStorage.setItem('bvm_notifications', notificationsOn ? 'on' : 'off');
  }, [notificationsOn]);

  useEffect(() => {
    localStorage.setItem('bvm_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      setUser(fbUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vacRes, artRes, compRes] = await Promise.all([
        supabase.from('vacancies').select('*, company:companies(*)').order('created_at', { ascending: false }),
        supabase.from('articles').select('*, company:companies(*)').order('created_at', { ascending: false }),
        supabase.from('companies').select('*').order('name'),
      ]);
      if (vacRes.error || artRes.error || compRes.error) return;
      setCompanies(compRes.data || []);
      setBaseFeed([
        ...(vacRes.data as Vacancy[]).map((v) => ({ ...v, type: 'vacancy' as const })),
        ...(artRes.data as Article[]).map((a) => ({ ...a, type: 'article' as const })),
      ]);
    } catch {
      // keep empty feed on network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Company-created vacancies: only effectively-active ones appear in the public feed.
  const now = useNow();
  const { items: companyVacancies } = useCollection<CompanyVacancy>(COMPANY_VACANCIES, {});
  const { items: myApplications, add: addApplication } = useCollection<Application>(
    'applications',
    user ? { applicant_uid: user.uid } : null
  );
  const { items: myViews, add: addView } = useCollection<View>('views', user ? { viewer_uid: user.uid } : null);

  const feedItems = useMemo(() => {
    const live = companyVacancies.filter((v) => effectiveStatus(v, now) === 'active').map(toFeedItem);
    return [...live, ...baseFeed];
  }, [companyVacancies, baseFeed, now]);

  const sortItems = useCallback((items: FeedItem[]): FeedItem[] => {
    const vipFirst = (a: FeedItem, b: FeedItem) => (a.is_vip !== b.is_vip ? (a.is_vip ? -1 : 1) : 0);
    return [...items].sort((a, b) => {
      const vip = vipFirst(a, b);
      if (vip) return vip;
      if (sortBy === 'salary') {
        return (b.type === 'vacancy' ? b.salary_min : 0) - (a.type === 'vacancy' ? a.salary_min : 0);
      }
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sortBy]);

  const filteredFeed = sortItems(
    feedItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const cq = companySearch.toLowerCase();
      const companyName = (item.company?.name || '').toLowerCase();
      const matchesSearch = !q || (
        item.title.toLowerCase().includes(q) ||
        (item.type === 'vacancy' && item.location.toLowerCase().includes(q)) ||
        (item.type === 'vacancy' && item.salary.toLowerCase().includes(q)) ||
        companyName.includes(q)
      );
      return matchesSearch && (!cq || companyName.includes(cq));
    })
  );
  const favoriteItems = sortItems(feedItems.filter((item) => favorites.includes(item.id)));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };
  const toggleWorkType = (type: string) => {
    setSelectedWorkTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const actions: CardActions = {
    appliedIds: myApplications.map((a) => a.vacancy_id),
    viewedIds: myViews.map((v) => v.item_id),
    onApply: (item) => {
      if (!user) return setShowAuthModal(true);
      if (myApplications.some((a) => a.vacancy_id === item.id)) return;
      void addApplication({
        applicant_name: user.displayName || 'Namizəd',
        company_uid: item.type === 'vacancy' ? item.owner_uid ?? item.company_id : item.company_id,
        vacancy_id: item.id,
        vacancy_title: item.title,
      });
    },
    onView: (item) => {
      if (!user || myViews.some((v) => v.item_id === item.id)) return;
      void addView({ item_id: item.id });
    },
    onNewVacancy: () => {
      if (!user) return setShowAuthModal(true);
      setActiveTab('profile');
      setNewVacancySignal((n) => n + 1);
    },
  };

  const loadChatMessages = useCallback(async (convId: number, uid: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, sender, text, created_at')
        .eq('conversation_id', convId)
        .eq('firebase_uid', uid)
        .order('created_at', { ascending: true });
      if (error) return;
      setChatMessages((data || []).map((m) => ({
        id: m.id,
        from: m.sender,
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
      })));
    } catch {
      // keep empty
    }
  }, []);

  useEffect(() => {
    if (selectedChat !== null && user) loadChatMessages(selectedChat, user.uid);
    else setChatMessages([]);
  }, [selectedChat, user, loadChatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || selectedChat === null) return;
    if (!user) return setShowAuthModal(true);
    const text = chatInput.trim();
    setChatInput('');
    const tempId = `temp_${Date.now()}`;
    const time = new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { id: tempId, from: 'me', text, time }]);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ firebase_uid: user.uid, conversation_id: selectedChat, sender: 'me', text })
        .select('id')
        .single();
      if (error) throw error;
      setChatMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m)));
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatInput(text);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] text-white font-sans antialiased pb-28 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <div className="fixed top-[-10%] left-[-15%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 px-4 py-3 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-lg shadow-cyan-500/30 border border-white/20">
              B
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white">BVM</span>
              <span className="text-[9px] text-cyan-300 font-medium tracking-widest -mt-0.5 uppercase">Karyera & İş</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotificationsOn((v) => !v)}
              aria-pressed={notificationsOn}
              aria-label={notificationsOn ? 'Bildirişləri söndür' : 'Bildirişləri aktiv et'}
              title={notificationsOn ? 'Bildirişlər aktivdir' : 'Bildirişlər deaktivdir'}
              className={`relative p-2 rounded-full border transition-all active:scale-95 ${
                notificationsOn
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                  : 'bg-slate-800 border-white/15 text-slate-400'
              }`}
            >
              {notificationsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {notificationsOn && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />}
            </button>
            <div role="radiogroup" aria-label="Rejim" className="grid grid-cols-2 p-0.5 rounded-full bg-slate-800 border border-white/15">
              {([['jobseeker', 'İş Axtaran'], ['employer', 'Şirkət']] as const).map(([id, label]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={role === id}
                  onClick={() => setRole(id)}
                  className={`w-[76px] py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    role === id ? 'bg-cyan-400 text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 pt-3 space-y-4">
        {activeTab === 'home' && (
          <HomeTab
            companies={companies}
            feedItems={filteredFeed}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowFilterModal={setShowFilterModal}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            role={role}
            actions={actions}
          />
        )}
        {activeTab === 'favorites' && (
          <FavoritesTab items={favoriteItems} favorites={favorites} toggleFavorite={toggleFavorite} role={role} actions={actions} />
        )}
        {activeTab === 'messages' && (
          <MessagesTab
            conversations={conversations}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            chatMessages={chatMessages}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            role={role}
            setRole={setRole}
            user={user}
            authLoading={authLoading}
            onShowAuth={() => setShowAuthModal(true)}
            onSignOut={() => void signOut(firebaseAuth)}
            newVacancySignal={newVacancySignal}
          />
        )}
      </main>

      {showFilterModal && (
        <FilterModal
          onClose={() => setShowFilterModal(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          experienceUnit={experienceUnit}
          setExperienceUnit={setExperienceUnit}
          experienceVal={experienceVal}
          setExperienceVal={setExperienceVal}
          workTypeOptions={workTypeOptions}
          selectedWorkTypes={selectedWorkTypes}
          toggleWorkType={toggleWorkType}
          customWorkType={customWorkType}
          setCustomWorkType={setCustomWorkType}
          cvLanguage={cvLanguage}
          setCvLanguage={setCvLanguage}
          salaryRange={salaryRange}
          setSalaryRange={setSalaryRange}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
        />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-slate-950/85 border-t border-white/10 py-2.5 shadow-lg shadow-black/30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {[
            { id: 'home', label: 'Ana Ekran', icon: Home },
            { id: 'favorites', label: 'Seçilmişlər', icon: Heart },
            { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
            { id: 'profile', label: 'Profil', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
