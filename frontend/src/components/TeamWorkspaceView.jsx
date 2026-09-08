import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Crown,
  FileText,
  Presentation,
  Share2,
  ArrowRight,
  X,
  KeyRound,
  FolderOpen
} from 'lucide-react';
import {
  fetchTeams,
  createTeam,
  joinTeamByCode,
  fetchTeamDetails,
  addTeamMember,
  changeTeamMemberRole,
  removeTeamMember,
  shareEntityWithTeam,
  unshareEntityFromTeam,
  deleteTeam,
  fetchDocuments,
  fetchPresentations,
  getUserProfile
} from '../services/api';

const ROLE_LABELS = {
  owner: 'ظ…ط§ظ„ظƒ',
  admin: 'ظ…ط´ط±ظپ',
  editor: 'ظ…ط­ط±ظ‘ط±',
  viewer: 'ظ…ط´ط§ظ‡ط¯'
};

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export default function TeamWorkspaceView() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [addUserId, setAddUserId] = useState('');
  const [addUserRole, setAddUserRole] = useState('viewer');
  const [addingMember, setAddingMember] = useState(false);

  const [shareType, setShareType] = useState('document');
  const [shareEntityId, setShareEntityId] = useState('');
  const [shareSource, setShareSource] = useState([]);
  const [loadShareSource, setLoadShareSource] = useState(false);
  const [sharing, setSharing] = useState(false);

  const user = getUserProfile();

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTeams();
      setTeams(data.teams || []);
      if (data.teams && data.teams.length > 0) {
        const first = data.teams.find(t => t.id === selectedTeamId) ? selectedTeamId : data.teams[0].id;
        setSelectedTeamId(first);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => { loadTeams(); }, []);

  const loadDetail = useCallback(async () => {
    if (!selectedTeamId) { setDetail(null); return; }
    setLoadingDetail(true);
    try {
      const d = await fetchTeamDetails(selectedTeamId);
      setDetail(d);
    } catch (e) {
      setError(e.message);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedTeamId]);

  useEffect(() => { loadDetail(); }, [selectedTeamId, loadDetail]);

  const myRole = detail?.members?.find(m => m.user_id === user?.id)?.role || null;
  const canManage = myRole === 'owner' || myRole === 'admin';
  const canShare = canManage;

  const handleCreate = async () => {
    if (!newTeamName.trim()) { setError('ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظپط±ظٹظ‚'); return; }
    setCreating(true); setError(''); setNotice('');
    try {
      await createTeam(newTeamName.trim());
      setNewTeamName('');
      setNotice('طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظپط±ظٹظ‚ ط¨ظ†ط¬ط§ط­');
      await loadTeams();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError('ط£ط¯ط®ظ„ ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط©'); return; }
    setJoining(true); setError(''); setNotice('');
    try {
      await joinTeamByCode(joinCode.trim());
      setJoinCode('');
      setNotice('ط§ظ†ط¶ظ…ظ…طھ ط¥ظ„ظ‰ ط§ظ„ظپط±ظٹظ‚ ط¨ظ†ط¬ط§ط­');
      await loadTeams();
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInvite = (code) => {
    copyText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const refreshShareSource = async (type) => {
    setLoadShareSource(true);
    setShareSource([]);
    setShareEntityId('');
    try {
      if (type === 'document') {
        const docs = await fetchDocuments({ limit: 100 });
        setShareSource(Array.isArray(docs) ? docs.filter(d => d.id) : []);
      } else {
        const data = await fetchPresentations();
        const pres = (data && data.presentations) || [];
        setShareSource(pres.filter(p => p.id || p.presentation_id));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadShareSource(false);
    }
  };

  const handleAddMember = async () => {
    if (!addUserId.trim()) { setError('ط£ط¯ط®ظ„ ظ…ط¹ط±ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…'); return; }
    setAddingMember(true); setError('');
    try {
      await addTeamMember(selectedTeamId, addUserId.trim(), addUserRole);
      setAddUserId('');
      setNotice('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ط¹ط¶ظˆ');
      await loadDetail();
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setError(''); setNotice('');
    try {
      await changeTeamMemberRole(selectedTeamId, userId, role);
      await loadDetail();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('ط¥ط²ط§ظ„ط© ظ‡ط°ط§ ط§ظ„ط¹ط¶ظˆ ظ…ظ† ط§ظ„ظپط±ظٹظ‚طں')) return;
    setError(''); setNotice('');
    try {
      await removeTeamMember(selectedTeamId, userId);
      await loadDetail();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleShare = async () => {
    if (!shareEntityId) { setError('ط§ط®طھط± ط¹ظ†طµط±ط§ظ‹ ظ„ظ„ظ…ط´ط§ط±ظƒط©'); return; }
    setSharing(true); setError(''); setNotice('');
    try {
      await shareEntityWithTeam(selectedTeamId, shareType, shareEntityId);
      setNotice('طھظ…طھ ظ…ط´ط§ط±ظƒط© ط§ظ„ط¹ظ†طµط± ظ…ط¹ ط§ظ„ظپط±ظٹظ‚');
      setShareEntityId('');
      await loadDetail();
    } catch (e) {
      setError(e.message);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (type, entityId) => {
    setError(''); setNotice('');
    try {
      await unshareEntityFromTeam(selectedTeamId, type, entityId);
      setNotice('طھظ… ط¥ظ„ط؛ط§ط، ظ…ط´ط§ط±ظƒط© ط§ظ„ط¹ظ†طµط±');
      await loadDetail();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('ط­ط°ظپ ط§ظ„ظپط±ظٹظ‚ ظ†ظ‡ط§ط¦ظٹط§ظ‹طں ط³ظٹظڈظپظ‚ط¯ ط§ظ„ظˆطµظˆظ„ ظ„ط¬ظ…ظٹط¹ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ظ…ط´طھط±ظƒط©.')) return;
    setError(''); setNotice('');
    try {
      await deleteTeam(selectedTeamId);
      setSelectedTeamId(null);
      setDetail(null);
      setNotice('طھظ… ط­ط°ظپ ط§ظ„ظپط±ظٹظ‚');
      await loadTeams();
    } catch (e) {
      setError(e.message);
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black theme-text-primary">ظ…ط³ط§ط­ط© ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¬ظ…ط§ط¹ظٹط©</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 font-black text-xs">
                {teams.length} ظپط±ظ‚
              </span>
            </div>
            <p className="text-xs theme-text-secondary mt-1">
              ط£ظ†ط´ط¦ ظپط±ظٹظ‚ط§ظ‹طŒ ط´ط§ط±ظƒ ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط©طŒ ظˆطھط¹ط§ظˆظ† ط¹ظ„ظ‰ ط§ظ„ظ…ظ‚ط±ط±ط§طھ ظˆط§ظ„ط¹ط±ظˆط¶ ط§ظ„طھظ‚ط¯ظٹظ…ظٹط© ط¨ط£ط¯ظˆط§ط± ظ…ط±ط§ظ‚ط¨ط© (ظ…ط§ظ„ظƒ / ظ…ط´ط±ظپ / ظ…ط­ط±ظ‘ط± / ظ…ط´ط§ظ‡ط¯)
            </p>
          </div>
        </div>
        <button
          onClick={loadTeams}
          disabled={loading}
          className="p-2.5 rounded-xl theme-header-btn border hover:text-violet-500 transition"
          title="طھط­ط¯ظٹط« ط§ظ„ظپط±ظ‚"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="card p-4 border-rose-500/30 text-rose-500 text-xs font-bold">
          {error}
        </div>
      )}
      {notice && (
        <div className="card p-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {notice}
        </div>
      )}

      {/* Create & Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-black theme-text-primary flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-500" /> ط¥ظ†ط´ط§ط، ظپط±ظٹظ‚ ط¬ط¯ظٹط¯
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="ط§ط³ظ… ط§ظ„ظپط±ظٹظ‚ (ظ…ط«ط§ظ„: ظپط±ظٹظ‚ ظ…ط´ط±ظˆط¹ ط§ظ„طھط®ط±ط¬)"
              className="flex-1 px-3 py-2.5 rounded-xl theme-card-inner border text-xs theme-text-primary outline-none focus:border-violet-500 font-['Tajawal']"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> ط¥ظ†ط´ط§ط،
            </button>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-black theme-text-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-500" /> ط§ظ„ط§ظ†ط¶ظ…ط§ظ… ط¨ظƒظˆط¯ ط¯ط¹ظˆط©
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              placeholder="ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط© ظ…ظ† ظ…ط§ظ„ظƒ ط§ظ„ظپط±ظٹظ‚"
              maxLength={8}
              dir="ltr"
              className="flex-1 px-3 py-2.5 rounded-xl theme-card-inner border text-xs font-mono text-center tracking-widest theme-text-primary outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> ط§ظ†ط¶ظ…ط§ظ…
            </button>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3 card p-8 animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
          <p className="text-xs theme-text-muted">ط¬ط§ط±ظٹ ط¬ظ„ط¨ ظپط±ظ‚ظƒ...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center space-y-4 card p-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 mx-auto flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold theme-text-primary">ظ„ط§ طھظˆط¬ط¯ ظپط±ظ‚ ط¨ط¹ط¯</h3>
          <p className="text-xs theme-text-secondary max-w-md mx-auto">
            ط£ظ†ط´ط¦ ظپط±ظٹظ‚ط§ظ‹ ط§ظ„ط¢ظ† ظˆط´ط§ط±ظƒ ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط©طŒ ط£ظˆ ط§ظ†ط¶ظ… ظ„ظپط±ظٹظ‚ ط²ظ…ظٹظ„ظƒ ط¹ط¨ط± ط§ظ„ظƒظˆط¯.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => {
            const active = t.id === selectedTeamId;
            const isOwner = t.owner_id === user?.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`card p-5 transition-all duration-200 cursor-pointer hover:shadow-xl ${
                  active ? 'ring-2 ring-violet-500/40 border-violet-500 shadow-violet-500/10' : 'hover:border-violet-400/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                      <Users className="w-5 h-5" />
                    </span>
                    <div className="overflow-hidden">
                      <b className="text-sm font-black theme-text-primary truncate block">{t.name}</b>
                      <span className="text-[11px] theme-text-muted block mt-0.5">
                        {t.member_count} ط£ط¹ط¶ط§ط، â€¢ ط¨ظˆط§ط³ط·ط© {t.owner_name || 'ط§ظ„ظ…ط§ظ„ظƒ'}
                      </span>
                    </div>
                  </div>
                  {isOwner && <Crown className="w-4 h-4 text-amber-400 shrink-0" title="ط£ظ†طھ ط§ظ„ظ…ط§ظ„ظƒ" />}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 gap-2">
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold" dir="ltr">
                    {t.invite_code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] theme-text-muted">{ROLE_LABELS[t.role] || t.role}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopyInvite(t.invite_code); }}
                      className="p-1.5 rounded-lg theme-header-btn border hover:text-violet-500 transition"
                      title="ظ†ط³ط® ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط©"
                    >
                      {copied === t.invite_code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Detail Panel */}
      {selectedTeam && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black theme-text-primary">{selectedTeam.name}</h3>
                <p className="text-xs theme-text-muted mt-0.5">ط¯ظˆط±ظٹ: {ROLE_LABELS[myRole] || '-'} {canManage && 'â€¢ ظٹظ…ظƒظ†ظƒ ط§ظ„ط¥ط¯ط§ط±ط© ظˆط§ظ„ظ…ط´ط§ط±ظƒط©'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl theme-card-inner border">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span className="font-mono text-sm font-black tracking-widest theme-text-primary" dir="ltr">{selectedTeam.invite_code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyInvite(selectedTeam.invite_code)}
                  className="p-1.5 rounded-lg theme-header-btn border hover:text-emerald-500 transition"
                  title="ظ†ط³ط® ظƒظˆط¯ ط§ظ„ط¯ط¹ظˆط©"
                >
                  {copied === selectedTeam.invite_code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              {myRole === 'owner' && (
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  className="p-2.5 rounded-xl theme-card-inner border text-rose-500 hover:bg-rose-500/10 transition"
                  title="ط­ط°ظپ ط§ظ„ظپط±ظٹظ‚"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {loadingDetail ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
            </div>
          ) : detail ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Members */}
              <div className="space-y-4">
                <h4 className="text-sm font-black theme-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ط§ظ„ط£ط¹ط¶ط§ط، ({detail.members.length})
                </h4>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {detail.members.map((m) => (
                    <div key={m.user_id} className="rounded-2xl p-3 theme-card-inner border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.picture ? (
                          <img src={m.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center font-black text-xs shrink-0">
                            {(m.name || 'طں').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block text-xs font-bold theme-text-primary truncate">{m.name || m.user_id}</span>
                          <span className="block text-[10px] theme-text-muted truncate" dir="ltr">{m.email || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.role === 'owner' ? (
                          <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center gap-1">
                            <Crown className="w-3 h-3" /> ظ…ط§ظ„ظƒ
                          </span>
                        ) : canManage && m.user_id !== user?.id ? (
                          <>
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                              className="px-2 py-1 rounded-lg theme-card-inner border text-[10px] font-bold theme-text-primary outline-none"
                            >
                              {Object.keys(ROLE_LABELS).filter(r => r !== 'owner').map(r => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="p-1.5 rounded-lg theme-header-btn border text-rose-500 hover:bg-rose-500/10 transition"
                              title="ط¥ط²ط§ظ„ط© ط§ظ„ط¹ط¶ظˆ"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-1 rounded-lg theme-card-inner border text-[10px] font-bold theme-text-secondary">
                            {ROLE_LABELS[m.role]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {canManage && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-black theme-text-secondary">ط¥ط¶ط§ظپط© ط¹ط¶ظˆ (ط¨ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…)</h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addUserId}
                        onChange={(e) => setAddUserId(e.target.value)}
                        placeholder="usr_xxxxxxxx... (ظ…ط¹ط±ظ‘ظپ ط­ط³ط§ط¨ ط§ظ„ط¹ط¶ظˆ)"
                        dir="ltr"
                        className="flex-1 px-3 py-2 rounded-xl theme-card-inner border text-xs theme-text-primary outline-none focus:border-violet-500"
                      />
                      <select
                        value={addUserRole}
                        onChange={(e) => setAddUserRole(e.target.value)}
                        className="px-2 py-2 rounded-xl theme-card-inner border text-[11px] font-bold theme-text-primary outline-none"
                      >
                        <option value="viewer">ظ…ط´ط§ظ‡ط¯</option>
                        <option value="editor">ظ…ط­ط±ظ‘ط±</option>
                        <option value="admin">ظ…ط´ط±ظپ</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={addingMember}
                        className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs transition disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Shared entities */}
              <div className="space-y-4">
                <h4 className="text-sm font-black theme-text-primary flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-teal-500" />
                  ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ظ…ط´طھط±ظƒط© ({detail.shares.length})
                </h4>

                {detail.shares.length === 0 ? (
                  <div className="rounded-2xl theme-card-inner border border-dashed p-6 text-center space-y-1.5">
                    <Share2 className="w-6 h-6 text-teal-500/40 mx-auto" />
                    <p className="text-xs theme-text-muted font-bold">ظ„ظ… طھطھظ… ظ…ط´ط§ط±ظƒط© ط£ظٹ ط¹ظ†طµط± ط¨ط¹ط¯</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {detail.shares.map((s) => (
                      <div key={`${s.entity_type}-${s.entity_id}`} className="rounded-2xl p-3 theme-card-inner border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`p-2 rounded-xl text-white shrink-0 ${s.entity_type === 'document' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                            {s.entity_type === 'document' ? <FileText className="w-3.5 h-3.5" /> : <Presentation className="w-3.5 h-3.5" />}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold theme-text-primary truncate">{s.entity_title || s.entity_id}</span>
                            <span className="block text-[10px] theme-text-muted">
                              {s.entity_type === 'document' ? 'ظ…ط³طھظ†ط¯' : 'ط¹ط±ط¶ طھظ‚ط¯ظٹظ…ظٹ'} â€¢ {new Date(s.created_at || Date.now()).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                        {canShare && (
                          <button
                            type="button"
                            onClick={() => handleUnshare(s.entity_type, s.entity_id)}
                            className="p-1.5 rounded-lg theme-header-btn border text-rose-500 hover:bg-rose-500/10 transition shrink-0"
                            title="ط¥ظ„ط؛ط§ط، ط§ظ„ظ…ط´ط§ط±ظƒط©"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canShare && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-black theme-text-secondary">ظ…ط´ط§ط±ظƒط© ط¹ظ†طµط± ط¬ط¯ظٹط¯ ظ…ط¹ ط§ظ„ظپط±ظٹظ‚</h5>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex rounded-xl theme-card-inner border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => { setShareType('document'); refreshShareSource('document'); }}
                          className={`px-3 py-2 text-[11px] font-black transition ${shareType === 'document' ? 'bg-emerald-600 text-white' : 'theme-text-secondary'}`}
                        >
                          ظ…ط³طھظ†ط¯
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShareType('presentation'); refreshShareSource('presentation'); }}
                          className={`px-3 py-2 text-[11px] font-black transition ${shareType === 'presentation' ? 'bg-blue-600 text-white' : 'theme-text-secondary'}`}
                        >
                          ط¹ط±ط¶
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => refreshShareSource(shareType)}
                        className="p-2 rounded-xl theme-header-btn border hover:text-teal-500 transition"
                        title="طھط­ظ…ظٹظ„ ظ‚ط§ط¦ظ…ط© ط¹ظ†ط§طµط±ظƒ"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadShareSource ? 'animate-spin' : ''}`} />
                      </button>
                      <select
                        value={shareEntityId}
                        onChange={(e) => setShareEntityId(e.target.value)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-xl theme-card-inner border text-xs theme-text-primary outline-none"
                      >
                        <option value="">{loadShareSource ? 'ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...' : 'ط§ط®طھط± ط¹ظ†طµط±ط§ظ‹ ظ„ظ…ط´ط§ط±ظƒطھظ‡'}</option>
                        {shareSource.map((item) => {
                          const val = item.id || item.presentation_id;
                          const label = item.filename || item.title || val;
                          return <option key={val} value={val}>{label}</option>;
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={sharing || loadShareSource}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" /> ظ…ط´ط§ط±ظƒط©
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs theme-text-muted">طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ظپط±ظٹظ‚</div>
          )}
        </div>
      )}
    </div>
  );
}