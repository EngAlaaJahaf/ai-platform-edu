import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check, RefreshCw, Share2, ArrowLeft } from 'lucide-react';
import { fetchTeams, fetchTeamDetails, shareEntityWithTeam, unshareEntityFromTeam } from '../services/api';

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export default function ShareEntityModal({ isOpen, onClose, entityType, entityId, entityTitle }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyTeam, setBusyTeam] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [state, setState] = useState({});

  const loadTeams = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeams();
      const teamList = data.teams || [];
      const init = {};
      const details = await Promise.all(
        teamList.map((t) => fetchTeamDetails(t.id).catch(() => null))
      );
      teamList.forEach((t, i) => {
        const detail = details[i];
        const shared = !!(detail && detail.shares && detail.shares.some(
          (s) => s.entity_type === entityType && s.entity_id === entityId
        ));
        init[t.id] = shared;
      });
      setTeams(teamList);
      setState(init);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setState({});
      loadTeams();
    }
  }, [isOpen, entityId, entityType]);

  const toggleShare = async (teamId) => {
    const currentlyShared = !!state[teamId];
    setBusyTeam(teamId);
    setError('');
    try {
      if (currentlyShared) {
        await unshareEntityFromTeam(teamId, entityType, entityId);
      } else {
        await shareEntityWithTeam(teamId, entityType, entityId);
      }
      setState((s) => ({ ...s, [teamId]: !currentlyShared }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyTeam(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-500 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-black theme-text-primary flex items-center gap-1.5">
                مشاركة {entityType === 'document' ? 'المستند' : 'العرض'}
              </h4>
              <p className="text-xs theme-text-muted truncate max-w-[300px]">{entityTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl theme-header-btn border">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl p-3 border border-rose-500/30 text-rose-500 text-xs font-bold">
            {error}
          </div>
        )}

        <p className="text-xs theme-text-secondary leading-relaxed">
          اختر فريقاً لمشاركة هذا العنصر معه. يمكن لكل أعضاء الفريق مشاهدته، ويمكن للمحرّرين تعديله، ولا يزال المالك محتفظاً بحقوقه الكاملة.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-10 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl theme-card-inner border border-dashed p-6 text-center space-y-2">
              <Users className="w-6 h-6 text-violet-500/40 mx-auto" />
              <p className="text-xs theme-text-muted font-bold">لا توجد فرق بعد</p>
              <p className="text-[11px] theme-text-muted">أنشئ فريقاً أو انضم بكود دعوة من صفحة «مساحة العمل الجماعية».</p>
            </div>
          ) : (
            teams.map((t) => {
              const shared = !!state[t.id];
              return (
                <div key={t.id} className="rounded-2xl p-3 theme-card-inner border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-xl bg-violet-500/15 text-violet-500 shrink-0">
                      <Users className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold theme-text-primary truncate">{t.name}</span>
                      <span className="block text-[10px] theme-text-muted" dir="ltr">{t.invite_code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyText(t.invite_code)}
                      className="p-1.5 rounded-lg theme-header-btn border hover:text-violet-500 transition"
                      title="نسخ كود الدعوة"
                    >
                      {copied === t.invite_code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleShare(t.id)}
                      disabled={busyTeam === t.id}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 disabled:opacity-50 ${
                        shared
                          ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                      }`}
                    >
                      {busyTeam === t.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : shared ? (
                        'إلغاء المشاركة'
                      ) : (
                        <>مشاركة <ArrowLeft className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}