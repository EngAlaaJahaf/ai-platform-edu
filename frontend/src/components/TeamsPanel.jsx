import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Trash2,
  Crown,
  Shield,
  PenLine,
  Eye,
  RefreshCw,
  ChevronDown,
  UserMinus,
  Link2Off
} from 'lucide-react';
import {
  fetchMyTeams,
  createTeam,
  joinTeam,
  fetchTeam,
  deleteTeamApi,
  fetchTeamShares,
  unshareFromTeam,
  setTeamMemberRole,
  removeTeamMember
} from '../services/api';

const ROLE_LABELS = {
  owner: 'مالك',
  admin: 'مشرف',
  editor: 'محرر',
  viewer: 'مشاهد'
};

const ROLE_STYLES = {
  owner: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  admin: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
  editor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  viewer: 'bg-slate-500/20 text-slate-500 dark:text-slate-400'
};

const ROLE_ICONS = { owner: Crown, admin: Shield, editor: PenLine, viewer: Eye };

function RoleBadge({ role }) {
  const Icon = ROLE_ICONS[role] || Eye;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${ROLE_STYLES[role] || ROLE_STYLES.viewer}`}>
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export default function TeamsPanel({ onChanged }) {
  const [mode, setMode] = useState('mine'); // 'mine' | 'join'
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setTeams(await fetchMyTeams());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => {
    setSuccess(msg);
    if (onChanged) onChanged();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const team = await createTeam(newName.trim());
      setNewName('');
      await load();
      notify(`تم إنشاء فريق "${team.name}" — كود الدعوة: ${team.invite_code}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError('');
    try {
      const team = await joinTeam(code.trim());
      setCode('');
      setMode('mine');
      await load();
      notify(`انضممت إلى فريق "${team.name}" بنجاح`);
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  const toggleExpand = async (teamId) => {
    if (expanded === teamId) {
      setExpanded(null);
      return;
    }
    setExpanded(teamId);
    try {
      const [team, shares] = await Promise.all([fetchTeam(teamId), fetchTeamShares(teamId)]);
      setDetails((d) => ({ ...d, [teamId]: { team, shares } }));
    } catch (e) {
      setError(e.message);
    }
  };

  const copyCode = async (inviteCode) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = inviteCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(inviteCode);
    setTimeout(() => setCopied(''), 2000);
  };

  const doAction = async (key, fn, okMsg) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      const openId = expanded;
      await load();
      if (openId) {
        try {
          const [team, shares] = await Promise.all([fetchTeam(openId), fetchTeamShares(openId)]);
          setDetails((d) => ({ ...d, [openId]: { team, shares } }));
        } catch { /* team may be deleted */ setExpanded(null); }
      }
      if (okMsg) notify(okMsg);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const canManage = (team) => ['owner', 'admin'].includes(team.my_role);
  const canShare = (team) => ['owner', 'admin', 'editor'].includes(team.my_role);

  return (
    <div className="glass-card rounded-3xl p-6 border shadow-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black theme-text-primary">مساحات الفرق</h2>
            <p className="text-xs theme-text-secondary mt-0.5">شارك مستنداتك مع زملائك بكود دعوة — المشاهد يرى فقط</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl theme-card-inner border">
          <button
            onClick={() => setMode('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'mine' ? 'bg-violet-600 text-white' : 'theme-text-muted'}`}
          >
            فرقي
          </button>
          <button
            onClick={() => setMode('join')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${mode === 'join' ? 'bg-violet-600 text-white' : 'theme-text-muted'}`}
          >
            <LogIn className="w-3.5 h-3.5" />
            انضم بكود
          </button>
          <button onClick={load} disabled={loading} className="p-1.5 rounded-lg theme-text-muted hover:text-violet-500 transition" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {success}
        </div>
      )}

      {mode === 'join' ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="أدخل كود الدعوة (مثال: KH3QV6)"
            className="flex-1 px-4 py-2.5 rounded-xl theme-card-inner border text-sm font-mono tracking-widest text-center theme-text-primary outline-none focus:border-violet-500"
            maxLength={12}
          />
          <button
            onClick={handleJoin}
            disabled={joining || !code.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {joining ? 'جاري الانضمام...' : 'انضم للفريق'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="اسم الفريق الجديد (مثال: فريق مشروع التخرج)"
              className="flex-1 px-4 py-2.5 rounded-xl theme-card-inner border text-xs theme-text-primary outline-none focus:border-violet-500 font-['Tajawal']"
              maxLength={80}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'جاري الإنشاء...' : 'إنشاء فريق'}
            </button>
          </div>

          {loading ? (
            <p className="text-xs theme-text-muted text-center py-6">جاري تحميل فرقك...</p>
          ) : teams.length === 0 ? (
            <p className="text-xs theme-text-muted text-center py-6">لا تنتمي لأي فريق بعد — أنشئ فريقاً أو انضم بكود دعوة.</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const det = details[team.id];
                const isOpen = expanded === team.id;
                const members = det?.team?.members || [];
                const shares = det?.shares || [];
                return (
                  <div key={team.id} className="rounded-2xl theme-card-inner border overflow-hidden">
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <b className="text-sm font-black theme-text-primary truncate">{team.name}</b>
                            <RoleBadge role={team.my_role} />
                          </div>
                          <p className="text-[11px] theme-text-muted mt-0.5">
                            {team.members_count} أعضاء • {team.shares_count} عناصر مشاركة
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copyCode(team.invite_code)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-violet-500/15 text-violet-600 dark:text-violet-300 hover:bg-violet-500/25 transition flex items-center gap-1"
                          title="نسخ كود الدعوة"
                        >
                          {copied === team.invite_code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {team.invite_code}
                        </button>
                        <button
                          onClick={() => toggleExpand(team.id)}
                          className="p-1.5 rounded-lg theme-header-btn border transition"
                          title="التفاصيل والأعضاء"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3">
                        <div>
                          <p className="text-[11px] font-black theme-text-secondary mb-2">الأعضاء ({members.length})</p>
                          <div className="space-y-1.5">
                            {members.map((m) => (
                              <div key={m.user_id} className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold theme-text-primary truncate">{m.name || m.email}</span>
                                  <RoleBadge role={m.role} />
                                </div>
                                {canManage(team) && m.role !== 'owner' && m.user_id !== undefined && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <select
                                      value={m.role}
                                      disabled={busy === `role-${m.user_id}`}
                                      onChange={(e) => doAction(`role-${m.user_id}`, () => setTeamMemberRole(team.id, m.user_id, e.target.value), 'تم تحديث الدور')}
                                      className="px-1.5 py-1 rounded-lg theme-card-inner border text-[11px] theme-text-primary outline-none"
                                    >
                                      <option value="admin">مشرف</option>
                                      <option value="editor">محرر</option>
                                      <option value="viewer">مشاهد</option>
                                    </select>
                                    <button
                                      onClick={() => { if (window.confirm(`إزالة ${m.name || m.email} من الفريق؟`)) doAction(`rm-${m.user_id}`, () => removeTeamMember(team.id, m.user_id), 'تمت إزالة العضو'); }}
                                      disabled={busy === `rm-${m.user_id}`}
                                      className="p-1.5 rounded-lg hover:text-rose-500 transition"
                                      title="إزالة العضو"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-black theme-text-secondary mb-2">العناصر المشاركة ({shares.length})</p>
                          {shares.length === 0 ? (
                            <p className="text-[11px] theme-text-muted">لا عناصر مشاركة بعد — شارك مستنداً من بطاقته في المكتبة.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {shares.map((s) => (
                                <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="theme-text-primary font-medium truncate">
                                    {s.entity_type === 'document' ? '📄' : '📊'} {s.entity_name || s.entity_id}
                                  </span>
                                  {canShare(team) && (
                                    <button
                                      onClick={() => doAction(`un-${s.id}`, () => unshareFromTeam(team.id, s.entity_type, s.entity_id), 'تم إلغاء المشاركة')}
                                      disabled={busy === `un-${s.id}`}
                                      className="p-1.5 rounded-lg hover:text-rose-500 transition shrink-0"
                                      title="إلغاء المشاركة"
                                    >
                                      <Link2Off className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {team.my_role === 'owner' && (
                          <button
                            onClick={() => { if (window.confirm(`حذف فريق "${team.name}" نهائياً؟`)) doAction('del-team', () => deleteTeamApi(team.id), 'تم حذف الفريق'); }}
                            disabled={busy === 'del-team'}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف الفريق نهائياً
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
