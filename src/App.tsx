import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, Heart, MessageSquare, User, Search, SlidersHorizontal,
  Send, Phone, FileText, CheckCircle2, Building2,
  Briefcase, PlusCircle, X, Globe, Eye, MapPin, Clock, Bookmark,
  Bell, BellOff, Settings, LogOut, Star, TrendingUp, Award, Mail,
  ArrowUpDown, Image as ImageIcon, Paperclip, Check, Loader2, Lock,
  Plus, Trash2, Calendar, Users,
} from 'lucide-react';
import { supabase, type Company, type Vacancy, type Article, type FeedItem } from './lib/supabase';
import { firebaseAuth, type FirebaseUser } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { AIAssistant } from './components/AIAssistant';
import { uploadToCloudinary } from './lib/cloudinary';

type SortBy = 'newest' | 'salary' | 'alphabetical';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [role, setRole] = useState<'jobseeker' | 'employer'>('jobseeker');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bvm_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sorting
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Filter states
  const [experienceUnit, setExperienceUnit] = useState('ay');
  const [experienceVal, setExperienceVal] = useState(6);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(['Tam ştat', 'Uzaqdan']);
  const [customWorkType, setCustomWorkType] = useState('');
  const [cvLanguage, setCvLanguage] = useState('AZ');
  const [salaryRange, setSalaryRange] = useState(300);

  // Post creator state
  const [postText, setPostText] = useState('');

  // CV upload state — dynamically loaded per Firebase user
  const [cvFiles, setCvFiles] = useState<{ id: string; name: string; lang: string }[]>([]);
  const [cvLoading, setCvLoading] = useState(false);

  // Messages state
  const [conversations] = useState([
    { id: 1, name: 'Pasha Bank HR', lastMsg: 'Sizin CV-nizə baxdıq...', time: '10:24', unread: 2 },
    { id: 2, name: 'Kapital Bank', lastMsg: 'Müsahibə vaxtını təsdiqləyin', time: 'Dünən', unread: 0 },
    { id: 3, name: 'Azercell İşə Qəbul', lastMsg: 'Təşəkkür edirik!', time: '2 gün', unread: 0 },
  ]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; from: string; text: string; time: string }[]>([]);

  // Company search filter
  const [companySearch, setCompanySearch] = useState('');

  // File input ref for CV upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  // File input refs for post upload
  const postImageRef = useRef<HTMLInputElement>(null);
  const postDocRef = useRef<HTMLInputElement>(null);
  // File input refs for profile photos
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Notification bell toggle
  const [notificationsOn, setNotificationsOn] = useState(() => {
    try { return localStorage.getItem('bvm_notifications') !== 'off'; } catch { return true; }
  });
  useEffect(() => {
    localStorage.setItem('bvm_notifications', notificationsOn ? 'on' : 'off');
  }, [notificationsOn]);

  // Post attachment state
  const [postFileName, setPostFileName] = useState('');
  const [postFileType, setPostFileType] = useState('');

  // Profile photo state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

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
        supabase.from('vacancies').select('*, company:companies(*)').order('is_vip', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('articles').select('*, company:companies(*)').order('is_vip', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('companies').select('*').order('name'),
      ]);

      if (vacRes.error || artRes.error || compRes.error) {
        setLoading(false);
        return;
      }

      setCompanies(compRes.data || []);
      const vacancies: FeedItem[] = (vacRes.data as Vacancy[]).map((v) => ({ ...v, type: 'vacancy' as const }));
      const articles: FeedItem[] = (artRes.data as Article[]).map((a) => ({ ...a, type: 'article' as const }));
      const merged = [...vacancies, ...articles].sort((a, b) => {
        if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setFeedItems(merged);
    } catch {
      // Network or other error — keep empty feed, don't crash the app
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const sortedFeed = useCallback((items: FeedItem[]): FeedItem[] => {
    const sorted = [...items];
    if (sortBy === 'salary') {
      sorted.sort((a, b) => {
        if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
        const aSal = a.type === 'vacancy' ? a.salary_min : 0;
        const bSal = b.type === 'vacancy' ? b.salary_min : 0;
        return bSal - aSal;
      });
    } else if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => {
        if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
    } else {
      sorted.sort((a, b) => {
        if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return sorted;
  }, [sortBy]);

  const filteredFeed = sortedFeed(
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
      const matchesCompany = !cq || companyName.includes(cq);
      return matchesSearch && matchesCompany;
    })
  );

  const favoriteItems = sortedFeed(feedItems.filter((item) => favorites.includes(item.id)));
  const workTypeOptions = ['Tam ştat', 'Uzaqdan', 'Yarım ştat', 'Mövsümi', 'Növbəli', 'Freelance'];

  const toggleWorkType = (type: string) => {
    setSelectedWorkTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
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
    if (selectedChat !== null && user) {
      loadChatMessages(selectedChat, user.uid);
    } else {
      setChatMessages([]);
    }
  }, [selectedChat, user, loadChatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || selectedChat === null || !user) return;
    const text = chatInput.trim();
    setChatInput('');
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { id: tempId, from: 'me', text, time: now }]);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ firebase_uid: user.uid, conversation_id: selectedChat, sender: 'me', text })
        .select('id')
        .single();
      if (error) {
        setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
        setChatInput(text);
        return;
      }
      setChatMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: data.id } : m));
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatInput(text);
    }
  };

  const loadCvs = useCallback(async (uid: string) => {
    setCvLoading(true);
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('id, file_name, lang')
        .eq('firebase_uid', uid)
        .order('created_at', { ascending: false });
      if (error) return;
      setCvFiles((data || []).map((r) => ({ id: r.id, name: r.file_name, lang: r.lang })));
    } catch {
      // keep empty — don't crash
    } finally {
      setCvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadCvs(user.uid);
    else setCvFiles([]);
  }, [user, loadCvs]);

  const handleAddCv = () => {
    if (!user || cvFiles.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    if (file.type.startsWith('video/')) return;
    const lang = cvLanguage;
    try {
      const cloudUrl = await uploadToCloudinary(file);
      const fileName = cloudUrl || file.name;
      const { data, error } = await supabase
        .from('cvs')
        .insert({ firebase_uid: user.uid, file_name: fileName, lang })
        .select('id, file_name, lang')
        .single();
      if (error) return;
      setCvFiles((prev) => [...prev, { id: data.id, name: data.file_name, lang: data.lang }]);
    } catch {
      // ignore
    }
  };

  const handlePostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.type.startsWith('video/')) return;
    setPostFileName(file.name);
    setPostFileType('image');
  };

  const handlePostDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.type.startsWith('video/')) return;
    setPostFileName(file.name);
    setPostFileType('document');
  };

  const handlePublishPost = async () => {
    if (!postText.trim() && !postFileName) return;
    if (!user) return;
    try {
      await supabase.from('posts').insert({
        firebase_uid: user.uid,
        content: postText.trim(),
        file_name: postFileName || null,
        file_type: postFileType || null,
      });
      setPostText('');
      setPostFileName('');
      setPostFileType('');
    } catch {
      // ignore
    }
  };

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    if (file.type.startsWith('video/')) return;
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    try {
      const cloudUrl = await uploadToCloudinary(file);
      const finalUrl = cloudUrl || localUrl;
      if (cloudUrl) setAvatarUrl(cloudUrl);
      await supabase.from('profile_photos').upsert({ firebase_uid: user.uid, avatar_url: finalUrl }, { onConflict: 'firebase_uid' });
    } catch {
      // ignore
    }
  };

  const handleCoverSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    if (file.type.startsWith('video/')) return;
    const localUrl = URL.createObjectURL(file);
    setCoverUrl(localUrl);
    try {
      const cloudUrl = await uploadToCloudinary(file);
      const finalUrl = cloudUrl || localUrl;
      if (cloudUrl) setCoverUrl(cloudUrl);
      await supabase.from('profile_photos').upsert({ firebase_uid: user.uid, cover_url: finalUrl }, { onConflict: 'firebase_uid' });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] text-white font-sans antialiased pb-28 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* DECORATIVE GLOW ORBS */}
      <div className="fixed top-[-10%] left-[-15%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/8 blur-[110px] pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/60 border-b border-white/10 px-4 py-3 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-lg shadow-cyan-500/30 border border-white/20">
              B
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
                BVM
              </span>
              <span className="text-[9px] text-cyan-300/80 font-medium tracking-widest -mt-0.5 uppercase">
                Karyera & İş
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotificationsOn((v) => !v)}
              className={`p-2 rounded-full border transition-all active:scale-95 backdrop-blur-xl ${
                notificationsOn
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                  : 'bg-white/10 border-white/15 text-slate-400'
              }`}
            >
              {notificationsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-full bg-white/10 border border-white/15 text-slate-200 hover:text-cyan-400 hover:bg-cyan-500/15 transition-all active:scale-95 backdrop-blur-xl"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRole(role === 'jobseeker' ? 'employer' : 'jobseeker')}
              className="text-[11px] px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 font-bold backdrop-blur-md hover:bg-cyan-500/20 transition-all shadow-sm active:scale-95"
            >
              {role === 'jobseeker' ? 'İŞ AXTARAN' : 'ŞİRKƏT REJİMİ'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
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
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesTab items={favoriteItems} favorites={favorites} toggleFavorite={toggleFavorite} role={role} />
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
            postText={postText}
            setPostText={setPostText}
            cvFiles={cvFiles}
            setCvFiles={setCvFiles}
            handleAddCv={handleAddCv}
            cvLoading={cvLoading}
            user={user}
            authLoading={authLoading}
            onShowAuth={() => setShowAuthModal(true)}
            fileInputRef={fileInputRef}
            onFileSelected={handleFileSelected}
            cvLanguage={cvLanguage}
            postImageRef={postImageRef}
            postDocRef={postDocRef}
            onPostImage={handlePostImage}
            onPostDoc={handlePostDoc}
            postFileName={postFileName}
            setPostFileName={setPostFileName}
            setPostFileType={setPostFileType}
            onPublishPost={handlePublishPost}
            avatarInputRef={avatarInputRef}
            coverInputRef={coverInputRef}
            onAvatarSelected={handleAvatarSelected}
            onCoverSelected={handleCoverSelected}
            avatarUrl={avatarUrl}
            coverUrl={coverUrl}
          />
        )}
      </main>

      {/* FILTER MODAL */}
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

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} />
      )}

      {/* AI ASSISTANT WIDGET */}
      <AIAssistant />

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-slate-900/60 border-t border-white/10 py-2.5 shadow-lg shadow-black/20">
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
                className={`flex flex-col items-center space-y-1 transition-all ${
                  isActive ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
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

/* ============ HOME TAB ============ */

function HomeTab({
  companies, feedItems, loading, searchQuery, setSearchQuery,
  setShowFilterModal, favorites, toggleFavorite, role,
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
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-300 backdrop-blur-md focus:outline-none focus:border-cyan-400/80 transition-all"
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
              <div key={i} className="rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-5 space-y-3 animate-pulse">
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
            <p className="text-xs text-slate-500">Axtarışınızı dəyişdirin və ya filtrləri sıfırlayın</p>
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
            />
          ))
        )}
      </section>
    </>
  );
}

/* ============ FEED CARD ============ */

function FeedCard({
  item, index, isFavorite, onToggleFavorite, role,
}: {
  item: FeedItem;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  role: 'jobseeker' | 'employer';
}) {
  const companyName = item.company?.name || '';
  return (
    <div
      className="relative rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-5 space-y-4 shadow-xl shadow-black/10 hover:border-cyan-400/30 hover:bg-white/[0.12] transition-all group animate-fade-in-up"
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
          <p className="text-xs text-slate-300 leading-relaxed pt-1">{item.content}</p>
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
            <button className="flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20">
              <Send className="w-3.5 h-3.5" />
              <span>Müraciət Et</span>
            </button>
          )}
          {item.type === 'article' && (
            <button className="flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20">
              <Eye className="w-3.5 h-3.5" />
              <span>Davamını Oxu</span>
            </button>
          )}
          {role === 'employer' && (
            <button className="flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yeni Vakansiya</span>
            </button>
          )}
          <button className="p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl hover:bg-white/20 text-slate-200 transition-all">
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

/* ============ FAVORITES TAB ============ */

function FavoritesTab({
  items, favorites, toggleFavorite, role,
}: {
  items: FeedItem[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  role: 'jobseeker' | 'employer';
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
          <p className="text-xs text-slate-500">Vakansiyalardakı ürək ikonu ilə bura əlavə edin</p>
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
          />
        ))
      )}
    </div>
  );
}

/* ============ MESSAGES TAB ============ */

function MessagesTab({
  conversations, selectedChat, setSelectedChat, chatInput, setChatInput, handleSendMessage,
  chatMessages,
}: {
  conversations: { id: number; name: string; lastMsg: string; time: string; unread: number }[];
  selectedChat: number | null;
  setSelectedChat: (id: number | null) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendMessage: () => void;
  chatMessages: { id: string; from: string; text: string; time: string }[];
}) {
  const activeConv = conversations.find((c) => c.id === selectedChat);

  if (selectedChat !== null && activeConv) {
    return (
      <div className="flex flex-col pt-2 animate-fade-in-up" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
          <button onClick={() => setSelectedChat(null)} className="p-1.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-xl text-slate-200 hover:text-white hover:bg-white/20 transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300">
            {activeConv.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{activeConv.name}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktiv
            </p>
          </div>
          <button className="p-2 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-xl text-cyan-400 hover:bg-cyan-500/15 transition-all">
            <Phone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-20 pt-3">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs text-slate-500">Hələ mesaj yoxdur. İlk mesajı göndərin!</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.from === 'me'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-slate-900/60 border border-white/10 backdrop-blur-xl text-slate-200 rounded-bl-md'
                }`}>
                  {msg.text}
                  <span className="block text-[9px] text-slate-400 mt-1 text-right">{msg.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-16 left-0 right-0 px-3 z-30">
          <div className="max-w-md mx-auto flex items-center space-x-2 bg-slate-900/60 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-lg shadow-black/10">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Mesaj yazın..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center space-x-2 pb-2">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold tracking-tight">Mesajlar</h2>
      </div>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => setSelectedChat(conv.id)}
          className="w-full flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:bg-white/[0.15] hover:border-cyan-400/25 transition-all text-left active:scale-[0.98] shadow-lg shadow-black/5"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold border border-white/20">
              {conv.name.slice(0, 2).toUpperCase()}
            </div>
            {conv.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#1C2541]">
                {conv.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white truncate">{conv.name}</p>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{conv.time}</span>
            </div>
            <p className={`text-xs truncate ${conv.unread > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
              {conv.lastMsg}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ============ PROFILE TAB ============ */

function ProfileTab({
  role, setRole, postText, setPostText, cvFiles, setCvFiles, handleAddCv,
  cvLoading, user, authLoading, onShowAuth, fileInputRef, onFileSelected, cvLanguage,
  postImageRef, postDocRef, onPostImage, onPostDoc, postFileName, setPostFileName,
  setPostFileType, onPublishPost, avatarInputRef, coverInputRef, onAvatarSelected,
  onCoverSelected, avatarUrl, coverUrl,
}: {
  role: 'jobseeker' | 'employer';
  setRole: (r: 'jobseeker' | 'employer') => void;
  postText: string;
  setPostText: (v: string) => void;
  cvFiles: { id: string; name: string; lang: string }[];
  setCvFiles: (v: { id: string; name: string; lang: string }[]) => void;
  handleAddCv: () => void;
  cvLoading: boolean;
  user: FirebaseUser | null;
  authLoading: boolean;
  onShowAuth: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cvLanguage: string;
  postImageRef: React.RefObject<HTMLInputElement>;
  postDocRef: React.RefObject<HTMLInputElement>;
  onPostImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPostDoc: (e: React.ChangeEvent<HTMLInputElement>) => void;
  postFileName: string;
  setPostFileName: (v: string) => void;
  setPostFileType: (v: string) => void;
  onPublishPost: () => void;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  coverInputRef: React.RefObject<HTMLInputElement>;
  onAvatarSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarUrl: string;
  coverUrl: string;
}) {
  const [stats, setStats] = useState({ applied: 0, saved: 0, viewed: 0 });
  const [vacancyTab, setVacancyTab] = useState<'active' | 'inactive'>('active');
  const [customSections, setCustomSections] = useState<{ id: string; title: string; visible: boolean }[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [collaborators, setCollaborators] = useState<{ id: string; name: string; role: string }[]>([]);
  const [newCollabName, setNewCollabName] = useState('');
  const [showAddCollab, setShowAddCollab] = useState(false);

  useEffect(() => {
    try {
      const favs = localStorage.getItem('bvm_favorites');
      setStats((s) => ({ ...s, saved: favs ? JSON.parse(favs).length : 0 }));
    } catch {
      setStats((s) => ({ ...s, saved: 0 }));
    }
  }, []);

  const removeCv = async (id: string) => {
    try {
      await supabase.from('cvs').delete().eq('id', id);
      setCvFiles(cvFiles.filter((f) => f.id !== id));
    } catch {
      // ignore
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'İA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user ? (user.displayName || 'İstifadəçi') : (role === 'jobseeker' ? 'İş Axtaran İstifadəçi' : 'Şirkət Profili');
  const initials = user?.displayName ? getInitials(user.displayName) : (role === 'jobseeker' ? 'İA' : 'ŞP');

  const addCustomSection = async () => {
    if (!newSectionTitle.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('employer_sections')
        .insert({ firebase_uid: user.uid, title: newSectionTitle.trim(), is_visible: true, sort_order: customSections.length })
        .select('id, title, is_visible')
        .single();
      if (error) return;
      setCustomSections((prev) => [...prev, { id: data.id, title: data.title, visible: data.is_visible }]);
      setNewSectionTitle('');
      setShowAddSection(false);
    } catch {
      // ignore
    }
  };

  const toggleSectionVisible = (id: string) => {
    setCustomSections((prev) => prev.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const deleteSection = async (id: string) => {
    try { await supabase.from('employer_sections').delete().eq('id', id); } catch {}
    setCustomSections((prev) => prev.filter((s) => s.id !== id));
  };

  const addCollaborator = async () => {
    if (!newCollabName.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('employer_collaborators')
        .insert({ firebase_uid: user.uid, name: newCollabName.trim() })
        .select('id, name, role')
        .single();
      if (error) return;
      setCollaborators((prev) => [...prev, { id: data.id, name: data.name, role: data.role }]);
      setNewCollabName('');
      setShowAddCollab(false);
    } catch {
      // ignore
    }
  };

  const removeCollaborator = async (id: string) => {
    try { await supabase.from('employer_collaborators').delete().eq('id', id); } catch {}
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  const employerMenuItems = [
    { icon: FileText, label: 'Ehtiyatda olan CV-lər', sub: 'Saxlanılmış CV-lər', locked: false },
    { icon: Briefcase, label: 'Statuslar', sub: 'Şirkət statusları', locked: false },
    { icon: Users, label: 'Əməkdaşlar', sub: `${collaborators.length} nəfər`, locked: false },
    { icon: Award, label: 'Premium Elanlar', sub: 'Premium elanlar', locked: true },
  ];

  const jobseekerMenuItems = [
    { icon: FileText, label: 'CV-lərim', sub: `${cvFiles.length} CV`, locked: false },
    { icon: Briefcase, label: 'Müraciətlərim', sub: `${stats.applied} aktiv`, locked: false },
    { icon: Bookmark, label: 'Seçilmişlər', sub: `${stats.saved} vakansiya`, locked: false },
    { icon: Eye, label: 'Baxış Tarixçəsi', sub: `${stats.viewed} vakansiya`, locked: false },
  ];

  const menuItems = role === 'jobseeker' ? jobseekerMenuItems : employerMenuItems;

  return (
    <div className="space-y-4 pt-2">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-4 backdrop-blur-xl shadow-xl shadow-black/10">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black border border-white/20 shadow-lg">
            {role === 'jobseeker' ? 'İA' : 'ŞP'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              {user ? (user.displayName || user.email || 'İstifadəçi') : (role === 'jobseeker' ? 'İş Axtaran İstifadəçi' : 'Şirkət Profili')}
            </h2>
            <p className="text-xs text-slate-400">
              {user ? user.email : (role === 'jobseeker' ? 'email@example.com' : 'sirket@example.com')}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {user ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">Təsdiqlənmiş Profil</span>
                </>
              ) : (
                <button onClick={onShowAuth} className="text-[10px] text-cyan-300 font-semibold hover:text-cyan-200 transition-all">
                  Daxil ol / Qeydiyyat →
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {role === 'jobseeker' ? (
            <>
              <StatBox icon={Send} value={stats.applied} label="Müraciət" />
              <StatBox icon={Heart} value={stats.saved} label="Seçilmiş" />
              <StatBox icon={Eye} value={stats.viewed} label="Baxış" />
            </>
          ) : (
            <>
              <StatBox icon={Briefcase} value={5} label="Vakansiya" />
              <StatBox icon={Mail} value={23} label="Müraciət" />
              <StatBox icon={TrendingUp} value={4.8} label="Reytinq" />
            </>
          )}
        </div>
      </div>

      {/* Post Creator */}
      <div className="rounded-3xl bg-slate-900/70 border border-white/15 backdrop-blur-xl p-4 space-y-3 shadow-xl shadow-black/10">
        <span className="text-xs font-bold text-cyan-200">Yeni Post / Məqalə Paylaş</span>
        <textarea
          rows={3}
          placeholder="Bu gün hansı uğurunuzu və ya sertifikatınızı paylaşmaq istəyirsiniz?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 transition-all resize-none backdrop-blur-xl"
        />
        {postFileName && (
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-400/20 rounded-xl px-3 py-2">
            <span className="text-xs text-cyan-300 truncate">📎 {postFileName}</span>
            <button
              onClick={() => { setPostFileName(''); setPostFileType(''); }}
              className="text-slate-400 hover:text-rose-400 transition-all flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <div className="flex space-x-2">
            <button onClick={() => postImageRef.current?.click()} className="p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl text-cyan-400 hover:bg-white/20 transition-all">
              <ImageIcon className="w-4 h-4" />
            </button>
            <button onClick={() => postDocRef.current?.click()} className="p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xl text-cyan-400 hover:bg-white/20 transition-all">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onPublishPost}
            disabled={!postText.trim() && !postFileName}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Paylaş
          </button>
        </div>
      </div>

      {/* Multi CV Uploader — jobseeker only */}
      {role === 'jobseeker' && (
      <div className="rounded-3xl bg-slate-900/70 border border-white/15 backdrop-blur-xl p-4 space-y-3 shadow-xl shadow-black/10">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white">Mənim CV-lərim (Maks 5 ədəd)</span>
          <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
            {cvFiles.length}/5 Yüklənib
          </span>
        </div>
        {cvLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
        ) : cvFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyan-400/60" />
            </div>
            <p className="text-xs text-slate-300 font-medium text-center">Hələ heç bir CV yükleməmisiniz</p>
            <button
              onClick={handleAddCv}
              disabled={!user}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Əlavə et
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {cvFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-white/10 border border-white/15 backdrop-blur-xl p-2.5 rounded-2xl text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">{file.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    file.lang === 'AZ' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    file.lang === 'EN' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                    file.lang === 'RU' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {file.lang}
                  </span>
                  <button onClick={() => removeCv(file.id)} className="text-slate-400 hover:text-rose-400 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {cvFiles.length > 0 && (
          <button
            onClick={handleAddCv}
            disabled={cvFiles.length >= 5 || !user}
            className="w-full py-2.5 rounded-2xl bg-white/10 border border-dashed border-white/25 backdrop-blur-xl text-xs font-semibold text-slate-100 hover:bg-white/15 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Yeni CV / Sertifikat Yüklə</span>
          </button>
        )}
      </div>
      )}

      {/* Employer: Vacancy Management Tabs */}
      {role === 'employer' && (
        <div className="rounded-3xl bg-slate-900/70 border border-white/15 backdrop-blur-xl p-4 space-y-3 shadow-xl shadow-black/10">
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
            <button
              onClick={() => setVacancyTab('active')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                vacancyTab === 'active'
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200'
                  : 'text-slate-400 border border-transparent hover:text-slate-200'
              }`}
            >
              Aktiv Vakansiyalarım
            </button>
            <button
              onClick={() => setVacancyTab('inactive')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                vacancyTab === 'inactive'
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200'
                  : 'text-slate-400 border border-transparent hover:text-slate-200'
              }`}
            >
              Deaktiv Vakansiyalarım
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex-1">
                <p className="text-xs text-slate-300">
                  {vacancyTab === 'active'
                    ? 'Aktiv vakansiyanı sonlandırın və ya avtomatik tarix seçin'
                    : 'Deaktiv vakansiyanı aktiv edin və ya gələcək tarif seçin'}
                </p>
              </div>
              {vacancyTab === 'active' ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-500/25 transition-all">
                    Sonlandır
                  </button>
                  <label className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold cursor-pointer hover:bg-cyan-500/25 transition-all flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <input type="datetime-local" className="hidden" />
                    Tarix
                  </label>
                </div>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25 transition-all">
                    Aktiv et
                  </button>
                  <label className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold cursor-pointer hover:bg-cyan-500/25 transition-all flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <input type="datetime-local" className="hidden" />
                    Tarix
                  </label>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center py-6">
              <p className="text-xs text-slate-400">{vacancyTab === 'active' ? 'Aktiv' : 'Deaktiv'} vakansiya yoxdur</p>
            </div>
          </div>
        </div>
      )}

      {/* Role Switch Card */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/15 p-4 space-y-2 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="flex items-center space-x-2 pb-1">
          <Globe className="w-4 h-4 text-cyan-400" />
          <p className="text-xs font-bold text-slate-100 tracking-wide">Rejim Dəyişdir</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRole('jobseeker')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center ${
              role === 'jobseeker' ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-400'
            }`}
          >
            İş Axtaran
          </button>
          <button
            onClick={() => setRole('employer')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center ${
              role === 'employer' ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-400'
            }`}
          >
            Şirkət Rejimi
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/15 overflow-hidden backdrop-blur-xl shadow-lg shadow-black/5">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              className={`w-full flex items-center space-x-3 p-4 hover:bg-white/[0.08] transition-all text-left ${
                i < menuItems.length - 1 ? 'border-b border-white/10' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                item.locked ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' : 'bg-cyan-500/15 border border-cyan-400/25 text-cyan-300'
              }`}>
                {item.locked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-[10px] text-slate-300">{item.sub}</p>
              </div>
              {item.locked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <ChevronRight />
            </button>
          );
        })}
      </div>

      {/* Employer: Custom sections with + button */}
      {role === 'employer' && (
        <div className="rounded-2xl bg-slate-900/70 border border-white/15 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden">
          {/* Collaborators management */}
          {showAddCollab ? (
            <div className="p-4 space-y-2 border-b border-white/10">
              <input
                type="text"
                value={newCollabName}
                onChange={(e) => setNewCollabName(e.target.value)}
                placeholder="Əməkdaşın adı..."
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <div className="flex gap-2">
                <button onClick={addCollaborator} className="flex-1 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs font-bold transition-all">Əlavə et</button>
                <button onClick={() => setShowAddCollab(false)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold transition-all">Ləğv et</button>
              </div>
            </div>
          ) : null}
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3.5 border-b border-white/10 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-300">{c.role}</p>
                </div>
              </div>
              <button onClick={() => removeCollaborator(c.id)} className="text-slate-400 hover:text-rose-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {/* Custom dynamic sections */}
          {customSections.map((section) => (
            <div key={section.id} className="flex items-center justify-between p-3.5 border-b border-white/10 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center space-x-2 flex-1">
                <button
                  onClick={() => toggleSectionVisible(section.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    section.visible ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/15 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </button>
                <p className={`text-sm font-semibold ${section.visible ? 'text-white' : 'text-slate-500'}`}>{section.title}</p>
              </div>
              <button onClick={() => deleteSection(section.id)} className="text-slate-400 hover:text-rose-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {/* Add section / collaborator */}
          {showAddSection ? (
            <div className="p-4 space-y-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Bölmə başlığı yazın..."
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <div className="flex gap-2">
                <button onClick={addCustomSection} className="flex-1 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs font-bold transition-all">Əlavə et</button>
                <button onClick={() => setShowAddSection(false)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold transition-all">Ləğv et</button>
              </div>
            </div>
          ) : (
            <div className="flex border-t border-white/10">
              <button
                onClick={() => { setShowAddSection(true); setShowAddCollab(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Yeni Bölmə
              </button>
              <div className="w-px bg-white/10" />
              <button
                onClick={() => { setShowAddCollab(true); setShowAddSection(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Əməkdaş
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settings & Logout */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/15 overflow-hidden backdrop-blur-xl shadow-lg shadow-black/5">
        <button className="w-full flex items-center space-x-3 p-4 hover:bg-white/[0.08] transition-all text-left border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-200">
            <Settings className="w-4 h-4" />
          </div>
          <p className="text-sm font-semibold text-white flex-1">Tənzimləmələr</p>
          <ChevronRight />
        </button>
        <button
          onClick={async () => {
            if (user) {
              await signOut(firebaseAuth);
            } else {
              onShowAuth();
            }
          }}
          className="w-full flex items-center space-x-3 p-4 hover:bg-rose-500/5 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          </div>
          <p className="text-sm font-semibold text-rose-400 flex-1">{user ? 'Çıxış' : 'Daxil Ol / Qeydiyyat'}</p>
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-500 pt-2">BVM v1.0 — Karyera & İş</p>
    </div>
  );
}

function StatBox({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-white/15 backdrop-blur-xl p-2.5 text-center space-y-1">
      <Icon className="w-4 h-4 text-cyan-400 mx-auto" />
      <p className="text-base font-extrabold text-white">{value}</p>
      <p className="text-[9px] text-slate-200 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ============ FILTER MODAL ============ */

function FilterModal({
  onClose, sortBy, setSortBy, experienceUnit, setExperienceUnit, experienceVal, setExperienceVal,
  workTypeOptions, selectedWorkTypes, toggleWorkType,
  customWorkType, setCustomWorkType, cvLanguage, setCvLanguage,
  salaryRange, setSalaryRange, companySearch, setCompanySearch,
}: {
  onClose: () => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  experienceUnit: string;
  setExperienceUnit: (v: string) => void;
  experienceVal: number;
  setExperienceVal: (v: number) => void;
  workTypeOptions: string[];
  selectedWorkTypes: string[];
  toggleWorkType: (t: string) => void;
  customWorkType: string;
  setCustomWorkType: (v: string) => void;
  cvLanguage: string;
  setCvLanguage: (v: string) => void;
  salaryRange: number;
  setSalaryRange: (v: number) => void;
  companySearch: string;
  setCompanySearch: (v: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/30 backdrop-blur-xl animate-slide-up">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white tracking-wide">BVM Filtrlər Və Sıralama</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 border border-white/15 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Name Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Şirkət Adı</span>
          </label>
          <input
            type="text"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Şirkət adı ilə axtarış..."
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400/80 transition-all"
          />
        </div>

        {/* Sorting Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sıralama Qaydası</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'newest' as SortBy, label: 'Ən yenilər' },
              { id: 'salary' as SortBy, label: 'Yüksək maaş' },
              { id: 'alphabetical' as SortBy, label: 'A-Z Əlifba' },
            ].map((sort) => (
              <button
                key={sort.id}
                onClick={() => setSortBy(sort.id)}
                className={`py-2 text-xs rounded-xl border backdrop-blur-xl font-semibold transition-all ${
                  sortBy === sort.id ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200' : 'bg-white/10 border-white/15 text-slate-300'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-select Work Types */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">İş Rejimi (Çoxlu Seçim)</label>
          <div className="flex flex-wrap gap-2">
            {workTypeOptions.map((type) => {
              const isSelected = selectedWorkTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleWorkType(type)}
                  className={`px-3 py-1.5 text-xs rounded-xl border backdrop-blur-xl transition-all flex items-center space-x-1 ${
                    isSelected ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold' : 'bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Salary Range Slider */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Minimum Maaş (AZN)</label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="300"
              max="5000"
              step="100"
              value={salaryRange}
              onChange={(e) => setSalaryRange(Number(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 py-1 px-2.5 rounded-lg border border-cyan-500/20">
              {salaryRange}+ AZN
            </span>
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">İş Stajı (Təcrübə)</label>
          <div className="flex space-x-2">
            {['gün', 'ay', 'il'].map((unit) => (
              <button
                key={unit}
                onClick={() => setExperienceUnit(unit)}
                className={`flex-1 py-1.5 text-xs rounded-xl border capitalize font-medium transition-all backdrop-blur-xl ${
                  experienceUnit === unit ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm' : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/15'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="range"
              min="1"
              max={experienceUnit === 'gün' ? 31 : experienceUnit === 'ay' ? 12 : 50}
              value={experienceVal}
              onChange={(e) => setExperienceVal(Number(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-bold text-cyan-400 w-16 text-right bg-cyan-500/10 py-1 px-2 rounded-lg border border-cyan-500/20">
              {experienceVal} {experienceUnit}
            </span>
          </div>
        </div>

        {/* Custom work type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Xüsusi İş Rejimi / Digər</label>
          <input
            type="text"
            placeholder="Məs: Həftəsonu, Layihə əsaslı..."
            value={customWorkType}
            onChange={(e) => setCustomWorkType(e.target.value)}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 backdrop-blur-xl focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* CV Language */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">CV Dili Seçimi</label>
          <div className="flex space-x-2">
            {['AZ', 'EN', 'RU', 'TR'].map((lang) => (
              <button
                key={lang}
                onClick={() => setCvLanguage(lang)}
                className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-all backdrop-blur-xl ${
                  cvLanguage === lang ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200' : 'bg-white/10 border-white/15 text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.98] transition-all"
        >
          Filtrləri Tətbiq Et
        </button>
      </div>
    </div>
  );
}
