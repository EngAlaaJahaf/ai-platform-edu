import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check, Save, ArrowRight } from 'lucide-react';

import AdminSidebar from './admin/AdminSidebar';
import BrandingSettings from './admin/settings/BrandingSettings';
import UserSettings from './admin/settings/UserSettings';
import AISettings from './admin/settings/AISettings';
import SystemPolicies from './admin/settings/SystemPolicies';
import PromptsSettings from './admin/settings/PromptsSettings';
import ActivityLogs from './admin/settings/ActivityLogs';
import AdvancedSettings from './admin/settings/AdvancedSettings';

import { 
  fetchAdminStats, 
  fetchAdminSettings, 
  saveAdminSettings, 
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
  fetchAdminLogs, 
  clearAdminLogs,
  validateApiKey,
  fetchAvailableModels,
  fetchPrompts,
  saveCustomPrompt,
  deleteCustomPrompt,
  generatePromptWithAI,
  getAIProvider,
  getApiKey,
  getBaseUrl,
  getSelectedModel,
  getGoogleClientId,
  setAIProvider,
  setApiKey,
  setBaseUrl,
  setSelectedModel,
  setGoogleClientId
} from '../services/api';

export default function AdminDashboardView({ 
  onBackToApp
}) {
  const [activeSection, setActiveSection] = useState('branding');
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // User Management State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '', email: '', password: '', role: 'student', tier: 'Pro Academic 🌟', token_limit: 500000
  });
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // AI Engine State
  const [provider, setProvider] = useState(getAIProvider());
  const [apiKey, setApiKey] = useState(getApiKey());
  const [baseUrl, setBaseUrl] = useState(getBaseUrl());
  const [selectedModel, setSelectedModel] = useState(getSelectedModel());
  const [googleClientId, setGoogleClientIdState] = useState(getGoogleClientId());
  const [dynamicModels, setDynamicModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [searchModelQuery, setSearchModelQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, settingsData, usersData, logsData, promptsData] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminSettings().catch(() => ({})),
        fetchAdminUsers().catch(() => []),
        fetchAdminLogs(50).catch(() => []),
        fetchPrompts().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.default_provider) setProvider(settingsData.default_provider);
        if (settingsData.default_model) setSelectedModel(settingsData.default_model);
        if (settingsData.default_base_url) setBaseUrl(settingsData.default_base_url);
        if (settingsData.default_api_key) setApiKey(settingsData.default_api_key);
        if (settingsData.google_client_id !== undefined) {
          setGoogleClientIdState(settingsData.google_client_id || '');
          setGoogleClientId(settingsData.google_client_id || '');
        } else if (settingsData.google_client_id === '') {
          setGoogleClientIdState('');
        }
      }
      if (usersData) setUsersList(usersData);
      if (logsData) setLogs(logsData);
      if (promptsData) setPrompts(promptsData);
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updated = {
        ...settings,
        default_provider: provider,
        default_model: selectedModel,
        default_base_url: baseUrl,
        default_api_key: apiKey,
        google_client_id: googleClientId
      };
      
      setApiKey(apiKey);
      setBaseUrl(baseUrl);
      setAIProvider(provider);
      setSelectedModel(selectedModel);
      setGoogleClientId(googleClientId);

      await saveAdminSettings(updated);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    try {
      await createAdminUser(newUserData);
      setIsAddUserOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'student', tier: 'Pro Academic 🌟', token_limit: 500000 });
      loadAdminData();
    } catch (err) {
      alert(err.message || 'فشل إنشاء المستخدم');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.id, editingUser);
      setEditingUser(null);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'فشل تعديل المستخدم');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassUser || !newPasswordValue.trim()) return;
    try {
      await resetAdminUserPassword(resetPassUser.id, newPasswordValue.trim());
      setResetPassUser(null);
      setNewPasswordValue('');
      alert('تمت إعادة تعيين كلمة المرور بنجاح');
    } catch (err) {
      alert(err.message || 'فشل إعادة تعيين كلمة المرور');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المستخدم (${userEmail}) وكافة بياناته ومستنداته نهائياً؟`)) return;
    try {
      await deleteAdminUser(userId);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'فشل حذف المستخدم');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('هل تريد مسح وتفريغ سجلات النشاط بالكامل؟')) return;
    try {
      await clearAdminLogs();
      setLogs([]);
    } catch (err) {
      alert(err.message || 'فشل مسح السجلات');
    }
  };

  const handleValidateConnection = async () => {
    setValidating(true);
    try {
      const res = await validateApiKey(apiKey, provider, baseUrl, selectedModel);
      setValidationResult({ success: res.valid, message: res.message });
    } catch (err) {
      setValidationResult({ success: false, error: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleFetchModels = async () => {
    setFetchingModels(true);
    try {
      const data = await fetchAvailableModels(provider, baseUrl, apiKey);
      if (data && data.models) {
        const modelIds = data.models.map(m => typeof m === 'object' ? m.id : m);
        setDynamicModels(modelIds);
        if (modelIds.length > 0 && !selectedModel) {
          setSelectedModel(modelIds[0]);
        }
      }
    } catch (err) {
      alert("فشل جلب النماذج: " + err.message);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSaveCustomPrompt = async (p) => {
    await saveCustomPrompt(p);
    loadAdminData();
  };

  const handleDeletePrompt = async (id) => {
    if (!window.confirm('حذف هذا القالب؟')) return;
    await deleteCustomPrompt(id);
    loadAdminData();
  };

  return (
    <div className="flex h-screen theme-nav font-['Tajawal'] overflow-hidden theme-text-primary" dir="rtl">
      
      {/* Sidebar Navigation */}
      <AdminSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        stats={stats}
        onSave={handleSaveSettings}
        saving={saving}
        saveSuccess={saveSuccess}
        loading={loading}
        onRefresh={loadAdminData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 z-50">
           <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded-xl theme-header-btn border text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            العودة للمنصة <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          
          {/* Render Active Section */}
          <div className="mx-auto mt-2">
            {activeSection === 'branding' && <BrandingSettings settings={settings} setSettings={setSettings} />}
            {activeSection === 'users' && (
              <UserSettings 
                usersList={usersList} 
                handleCreateUser={handleCreateUser}
                handleUpdateUser={handleUpdateUser}
                handleDeleteUser={handleDeleteUser}
                handleResetPassword={handleResetPassword}
                newUserData={newUserData}
                setNewUserData={setNewUserData}
                editingUser={editingUser}
                setEditingUser={setEditingUser}
                resetPassUser={resetPassUser}
                setResetPassUser={setResetPassUser}
                newPasswordValue={newPasswordValue}
                setNewPasswordValue={setNewPasswordValue}
                isAddUserOpen={isAddUserOpen}
                setIsAddUserOpen={setIsAddUserOpen}
              />
            )}
            {activeSection === 'ai' && (
              <AISettings 
                provider={provider} setProvider={setProvider}
                apiKey={apiKey} setApiKey={setApiKey}
                baseUrl={baseUrl} setBaseUrl={setBaseUrl}
                selectedModel={selectedModel} setSelectedModel={setSelectedModel}
                googleClientId={googleClientId} setGoogleClientId={setGoogleClientIdState}
                validating={validating} validationResult={validationResult}
                handleValidateConnection={handleValidateConnection}
                dynamicModels={dynamicModels} fetchingModels={fetchingModels}
                handleFetchModels={handleFetchModels}
                searchModelQuery={searchModelQuery} setSearchModelQuery={setSearchModelQuery}
                isModelDropdownOpen={isModelDropdownOpen} setIsModelDropdownOpen={setIsModelDropdownOpen}
                modelDropdownRef={modelDropdownRef}
              />
            )}
            {activeSection === 'policies' && <SystemPolicies settings={settings} setSettings={setSettings} />}
            {activeSection === 'advanced' && <AdvancedSettings settings={settings} setSettings={setSettings} />}
            {activeSection === 'prompts' && (
              <PromptsSettings 
                prompts={prompts} 
                setPrompts={setPrompts} 
                handleSaveCustomPrompt={handleSaveCustomPrompt}
                handleDeletePrompt={handleDeletePrompt}
                handleGeneratePromptWithAI={generatePromptWithAI}
              />
            )}
            {activeSection === 'logs' && <ActivityLogs logs={logs} handleClearLogs={handleClearLogs} />}
          </div>

        </div>
      </div>
    </div>
  );
}
