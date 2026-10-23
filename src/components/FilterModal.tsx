import { ArrowUpDown, Building2, Check, X } from 'lucide-react';

export type SortBy = 'newest' | 'salary' | 'alphabetical';

/* ============ FILTER MODAL ============ */

export function FilterModal({
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900/85 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/30 backdrop-blur-xl animate-slide-up">
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
            className="w-full bg-slate-900/85 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400/80 transition-all"
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
