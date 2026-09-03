import React, { useState } from 'react';
import { Users, Shield, Edit3, Trash2, Key, Search, UserPlus, CheckCircle2, X } from 'lucide-react';

export default function UserSettings({ 
  usersList, 
  handleCreateUser, 
  handleUpdateUser, 
  handleDeleteUser, 
  handleResetPassword,
  newUserData,
  setNewUserData,
  editingUser,
  setEditingUser,
  resetPassUser,
  setResetPassUser,
  newPasswordValue,
  setNewPasswordValue,
  isAddUserOpen,
  setIsAddUserOpen
}) {
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchUserQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const PERMISSION_OPTIONS = [
    { key: 'can_chat', label: 'الدردشة التفاعلية' },
    { key: 'can_upload', label: 'رفع المستندات' },
    { key: 'can_quiz', label: 'توليد الاختبارات' },
    { key: 'can_summarize', label: 'التلخيص' },
    { key: 'can_translate', label: 'الترجمة الأكاديمية' },
    { key: 'can_proofread', label: 'التدقيق اللغوي' },
  ];

  const handlePermissionToggle = (e, permissionKey) => {
    const isChecked = e.target.checked;
    setEditingUser(prev => {
      let currentPerms = {};
      try {
        currentPerms = typeof prev.permissions_json === 'string' ? JSON.parse(prev.permissions_json || '{}') : (prev.permissions_json || {});
      } catch (err) {}
      
      return {
        ...prev,
        permissions: {
          ...currentPerms,
          [permissionKey]: isChecked
        }
      };
    });
  };

  const hasPermission = (user, key) => {
    try {
      const perms = typeof user.permissions_json === 'string' ? JSON.parse(user.permissions_json || '{}') : (user.permissions_json || user.permissions || {});
      if (perms.hasOwnProperty(key)) return perms[key];
      return true; // default to true if not set
    } catch(e) {
      return true;
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12 font-['Tajawal']">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black theme-text-primary mb-1">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-xs theme-text-muted font-bold">تحكم كامل بحسابات المنصة، الحصص (Quotas) والصلاحيات الدقيقة</p>
        </div>
        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          مستخدم جديد +
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            value={searchUserQuery}
            onChange={(e) => setSearchUserQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl theme-card-inner border text-xs font-bold theme-text-primary focus:border-indigo-500 transition shadow-inner"
          />
        </div>
        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 rounded-2xl theme-card-inner border text-xs font-bold theme-text-primary focus:border-indigo-500 transition"
        >
          <option value="all">كل الرتب</option>
          <option value="admin">مدير (Admin)</option>
          <option value="student">طالب/باحث (Student)</option>
        </select>
      </div>

      <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 theme-text-primary font-black">
                <th className="px-5 py-4 text-right">المستخدم</th>
                <th className="px-4 py-4 text-right">الرتبة</th>
                <th className="px-4 py-4 text-right">الباقة (Tier)</th>
                <th className="px-4 py-4 text-center">الاستهلاك</th>
                <th className="px-4 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="" className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900" />
                      <div>
                        <div className="font-black text-xs theme-text-primary">{user.name}</div>
                        <div className="text-[11px] theme-text-muted font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                      user.role === 'admin' 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {user.role === 'admin' ? 'مدير' : 'طالب'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-amber-500 font-black text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {user.subscription_tier || 'Pro Academic'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-mono text-[11px] font-bold">
                      <span className={user.tokens_used > (user.tokens_limit * 0.9) ? 'text-rose-500 font-black' : 'theme-text-primary'}>
                        {(user.tokens_used || 0).toLocaleString()}
                      </span>
                      <span className="theme-text-muted mx-1">/</span>
                      <span className="theme-text-muted">{(user.tokens_limit || 500000).toLocaleString()}</span>
                    </div>
                    <div className="w-28 mx-auto bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${user.tokens_used > (user.tokens_limit * 0.9) ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${Math.min(100, ((user.tokens_used || 0) / (user.tokens_limit || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          let parsedPerms = {};
                          try {
                             parsedPerms = typeof user.permissions_json === 'string' ? JSON.parse(user.permissions_json || '{}') : (user.permissions_json || {});
                          } catch(e) {}
                          setEditingUser({ ...user, permissions: parsedPerms });
                        }}
                        className="p-1.5 rounded-xl theme-header-btn border hover:text-indigo-500 transition cursor-pointer"
                        title="تعديل المستخدم والصلاحيات"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setResetPassUser(user)}
                        className="p-1.5 rounded-xl theme-header-btn border hover:text-amber-500 transition cursor-pointer"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-xl theme-header-btn border hover:text-rose-500 transition cursor-pointer"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center theme-text-muted text-xs font-bold">
                    لا يوجد مستخدمين لعرضهم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal with Permissions */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                تعديل الصلاحيات المتقدمة ({editingUser.name})
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">الرتبة (Role)</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                    >
                      <option value="student">طالب/باحث</option>
                      <option value="admin">مدير نظام</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">حد التوكنز (Quota)</label>
                    <input
                      type="number"
                      required
                      value={editingUser.tokens_limit}
                      onChange={(e) => setEditingUser({ ...editingUser, tokens_limit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-bold text-white mb-4">صلاحيات الوحدات (Atom Level Control)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {PERMISSION_OPTIONS.map(opt => (
                      <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-white/5 transition">
                        <input 
                          type="checkbox" 
                          checked={hasPermission(editingUser, opt.key)}
                          onChange={(e) => handlePermissionToggle(e, opt.key)}
                          className="w-4 h-4 rounded bg-slate-800 border-white/20 text-indigo-500 focus:ring-indigo-500/50"
                        />
                        <span className="text-sm text-slate-300 font-bold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} type="button" className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-bold transition">
                إلغاء
              </button>
              <button type="submit" form="edit-user-form" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                مستخدم جديد
              </h3>
              <button onClick={() => setIsAddUserOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="add-user-form" onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">كلمة المرور المؤقتة</label>
                  <input
                    type="text"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الرتبة (Role)</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                  >
                    <option value="student">طالب/باحث</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-2">
              <button onClick={() => setIsAddUserOpen(false)} type="button" className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-bold transition">
                إلغاء
              </button>
              <button type="submit" form="add-user-form" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                إعادة تعيين المرور
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-300 mb-4">كلمة المرور الجديدة لـ: <span className="font-bold text-white">{resetPassUser.name}</span></p>
              <form id="reset-pass-form" onSubmit={handleResetPassword}>
                <input
                  type="text"
                  required
                  placeholder="أدخل كلمة مرور قوية..."
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 transition font-mono"
                />
              </form>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-2">
              <button onClick={() => setResetPassUser(null)} type="button" className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-bold transition">
                إلغاء
              </button>
              <button type="submit" form="reset-pass-form" className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 transition">
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
