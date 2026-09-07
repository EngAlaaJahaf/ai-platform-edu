import React, { useState, useEffect } from 'react';
import { X, Users, Share2, Check } from 'lucide-react';
import { fetchMyTeams, shareWithTeamApi } from '../services/api';

export default function ShareDocModal({ doc, onClose, onShared }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharingId, setSharingId] = useState('');
  const [doneId, setDoneId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchMyTeams();
        setTeams(all.filter((t) => ['owner', 'admin', 'editor'].includes(t.my_role)));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShare = async (teamId) => {
    setSharingId(teamId);
    setError('');
    try {
      await shareWithTeamApi(teamId, 'document', doc.id);
      setDoneId(teamId);
      if (onShared) onShared();
      setTimeout(() => setDoneId(''), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSharingId('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-500 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black theme-text-primary">مشاركة مع فريق</h4>
              <p className="text-xs theme-text-muted truncate max-w-[220px]">{doc?.filename}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl theme-header-btn border">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-xs theme-text-muted text-center py-6">جاري تحميل فرقك...</p>
        ) : teams.length === 0 ? (
          <p className="text-xs theme-text-muted text-center py-6">
            لا تنتمي لأي فريق بدور محرر أو أعلى — أنشئ فريقاً من لوحة الفرق أولاً.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl theme-card-inner border">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-xs font-bold theme-text-primary truncate">{t.name}</span>
                </div>
                <button
                  onClick={() => handleShare(t.id)}
                  disabled={sharingId === t.id}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition shrink-0 flex items-center gap-1 ${
                    doneId === t.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50'
                  }`}
                >
                  {doneId === t.id ? (<><Check className="w-3.5 h-3.5" /> تمت المشاركة</>) : sharingId === t.id ? 'جاري...' : 'مشاركة'}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl theme-header-btn border text-xs font-bold"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
