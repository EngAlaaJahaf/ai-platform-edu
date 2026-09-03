const API_BASE = '/api';

export function getAIProvider() {
  return localStorage.getItem('eduai_provider') || 'gemini';
}

export function setAIProvider(provider) {
  localStorage.setItem('eduai_provider', provider);
}

export function getApiKey() {
  return localStorage.getItem('eduai_gemini_api_key') || '';
}

export function setApiKey(key) {
  if (key) {
    localStorage.setItem('eduai_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('eduai_gemini_api_key');
  }
}

export function getBaseUrl() {
  return localStorage.getItem('eduai_base_url') || '';
}

export function setBaseUrl(url) {
  if (url) {
    localStorage.setItem('eduai_base_url', url.trim());
  } else {
    localStorage.removeItem('eduai_base_url');
  }
}

export function getSelectedModel() {
  const provider = getAIProvider();
  const saved = localStorage.getItem('eduai_gemini_model');
  if (saved) return saved;
  if (provider === 'ollama') return 'qwen2.5:latest';
  if (provider === 'deepseek') return 'deepseek-chat';
  if (provider === 'groq') return 'llama-3.3-70b-versatile';
  return 'gemini-1.5-flash';
}

export function setSelectedModel(model) {
  localStorage.setItem('eduai_gemini_model', model);
}

export function getGoogleClientId() {
  return localStorage.getItem('eduai_google_client_id') || '';
}

export function setGoogleClientId(clientId) {
  if (clientId) {
    localStorage.setItem('eduai_google_client_id', clientId.trim());
  } else {
    localStorage.removeItem('eduai_google_client_id');
  }
}

export function getUseBaseRules() {
  const val = localStorage.getItem('eduai_use_base_rules');
  return val === null ? true : val === 'true';
}

export function setUseBaseRules(boolVal) {
  localStorage.setItem('eduai_use_base_rules', boolVal ? 'true' : 'false');
}

export function getUserProfile() {
  const data = localStorage.getItem('eduai_user_profile');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

export function setUserProfile(profile) {
  if (profile) {
    localStorage.setItem('eduai_user_profile', JSON.stringify(profile));
  } else {
    localStorage.removeItem('eduai_user_profile');
  }
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/user/me`, { headers: getHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  return null;
}

function getHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-AI-Provider': getAIProvider(),
    'X-Gemini-Model': getSelectedModel(),
    'X-Use-Base-Rules': getUseBaseRules() ? 'true' : 'false',
    ...extraHeaders
  };
  const key = getApiKey();
  if (key) {
    headers['X-Gemini-API-Key'] = key;
  }
  const baseUrl = getBaseUrl();
  if (baseUrl) {
    headers['X-AI-Base-Url'] = baseUrl;
  }
  const user = getUserProfile();
  if (user && user.id) {
    headers['X-User-Id'] = user.id;
  }
  return headers;
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', provider: getAIProvider(), has_documents: false };
  }
}

export async function validateConnection(arg1 = {}, arg2, arg3, arg4) {
  let provider, apiKey, baseUrl, model;
  if (typeof arg1 === 'object' && arg1 !== null) {
    provider = arg1.provider;
    apiKey = arg1.apiKey;
    baseUrl = arg1.baseUrl;
    model = arg1.model;
  } else {
    provider = arg1;
    apiKey = arg2;
    baseUrl = arg3;
    model = arg4;
  }

  const res = await fetch(`${API_BASE}/validate-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: provider || getAIProvider(),
      api_key: apiKey !== undefined ? apiKey : getApiKey(),
      base_url: baseUrl !== undefined ? baseUrl : getBaseUrl(),
      model: model || getSelectedModel()
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل الاتصال بالمزود');
  }
  return await res.json();
}

export async function validateApiKey(apiKey, provider, baseUrl, model) {
  return await validateConnection({ provider, apiKey, baseUrl, model });
}

export async function fetchAvailableModels(provider, baseUrl, apiKey) {
  const res = await fetch(`${API_BASE}/fetch-models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: provider || getAIProvider(),
      base_url: baseUrl !== undefined ? baseUrl : getBaseUrl(),
      api_key: apiKey !== undefined ? apiKey : getApiKey()
    })
  });
  if (!res.ok) throw new Error('فشل جلب قائمة النماذج من الرابط');
  const data = await res.json();
  return data.models || [];
}

export async function verifyGoogleCredential(credential, clientId = null) {
  const res = await fetch(`${API_BASE}/auth/google/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, client_id: clientId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل التحقق من حساب Google');
  }

  const data = await res.json();
  if (data.success && data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  throw new Error('بيانات المستخدم غير مكتملة');
}

export async function adminLogin(adminKey) {
  const res = await fetch(`${API_BASE}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_key: adminKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'رمز التحقق أو كلمة مرور المدير غير صحيحة');
  }

  const data = await res.json();
  if (data.success && data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  throw new Error('فشل تسجيل دخول المشرف');
}

export async function loginWithPassword(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل تسجيل الدخول');
  }

  const data = await res.json();
  if (data.success && data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  throw new Error('فشل تسجيل الدخول');
}

export async function registerAccount(name, email, password, role = 'student') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل إنشاء الحساب');
  }

  const data = await res.json();
  if (data.success && data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  throw new Error('فشل إنشاء الحساب');
}

export async function studentLogin(email, name = '') {
  const res = await fetch(`${API_BASE}/auth/student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل تسجيل الدخول للطالب');
  }

  const data = await res.json();
  if (data.success && data.user) {
    setUserProfile(data.user);
    return data.user;
  }
  throw new Error('فشل تسجيل الدخول');
}

export async function uploadDocument(file, userId = null) {
  const formData = new FormData();
  formData.append('file', file);
  const user = getUserProfile();
  const effectiveUserId = userId || user?.id || '';
  if (effectiveUserId) {
    formData.append('user_id', effectiveUserId);
  }

  const headers = {};
  if (effectiveUserId) {
    headers['X-User-Id'] = effectiveUserId;
  }
  const token = localStorage.getItem('eduai_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'فشل رفع الملف' }));
    throw new Error(err.detail || 'فشل رفع الملف');
  }
  return await res.json();
}

export async function getLatestDocument() {
  try {
    const res = await fetch(`${API_BASE}/documents/latest`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.document || null;
  } catch (e) {
    return null;
  }
}

// Backward compatibility alias
export const uploadPdfFile = uploadDocument;

export async function uploadDocumentFile(file, userId = null) {
  return await uploadDocument(file, userId);
}

export async function sendChatMessage(query, docId = null, history = [], customSystemPrompt = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      query, 
      doc_id: docId, 
      history, 
      custom_system_prompt: customSystemPrompt 
    }),
  });

  if (!res.ok) throw new Error('Chat API error');
  return await res.json();
}

export async function sendChatMessageStream(query, docId = null, history = [], customSystemPrompt = null, onChunk) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, doc_id: docId, history, custom_system_prompt: customSystemPrompt }),
  });
  if (!res.ok) throw new Error('Chat stream error');
  if (!res.body) {
    let data;
    try { data = await res.json(); } catch { const txt = await res.text(); data = { answer: txt }; }
    if (onChunk) onChunk(data.answer || '');
    return data;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    if (onChunk) onChunk(chunk);
  }
  return { answer: full };
}

export async function fetchSummary(docId = null, level = 'full', language = 'ar', customSystemPrompt = null) {
  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      doc_id: docId, 
      level, 
      language,
      custom_system_prompt: customSystemPrompt 
    }),
  });

  if (!res.ok) throw new Error('Summarize API error');
  return await res.json();
}
export async function fetchQuiz(docId = null, count = 5, difficulty = 'medium', language = 'bilingual', customSystemPrompt = null, extractOnly = false) {
  const res = await fetch(`${API_BASE}/generate-quiz`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      doc_id: docId, 
      count, 
      difficulty, 
      language,
      custom_system_prompt: customSystemPrompt,
      extract_only: extractOnly
    }),
  });
  if (!res.ok) throw new Error('فشل توليد الاختبار');
  return await res.json();
}

export async function fetchQuizProgress(docId) {
  if (!docId) return null;
  const res = await fetch(`${API_BASE}/documents/${docId}/progress`, {
    headers: getHeaders()
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.progress_json ? JSON.parse(data.progress_json) : null;
}

export async function saveQuizProgress(docId, progressData) {
  if (!docId) return;
  await fetch(`${API_BASE}/documents/${docId}/progress`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ progress_json: JSON.stringify(progressData) })
  }).catch(() => {}); // silently fail
}

export async function proofreadText(text, customSystemPrompt = null) {
  const res = await fetch(`${API_BASE}/proofread`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      text, 
      custom_system_prompt: customSystemPrompt 
    }),
  });

  if (!res.ok) throw new Error('Proofread API error');
  return await res.json();
}

export async function translateDocument({ docId = null, text = null, sourceLang = 'en', targetLang = 'ar', mode = 'line_by_line', customSystemPrompt = null }) {
  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      doc_id: docId,
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
      mode,
      custom_system_prompt: customSystemPrompt
    }),
  });

  if (!res.ok) throw new Error('فشل استدعاء محرك الترجمة الأكاديمية');
  return await res.json();
}

export async function exportToDocx({ title, subtitle = '', docName = '', content = null, units = null, sections = null, filename = 'document.docx' }) {
  const res = await fetch(`${API_BASE}/export/docx`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      title,
      subtitle,
      doc_name: docName,
      content,
      units,
      sections
    })
  });
  if (!res.ok) throw new Error('فشل تصدير مستند Word (.docx)');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Quiz Export & Import API ---
export async function exportQuizData(quizData, format = 'custom_text', chapterTitle = 'Chapter Exam') {
  if (format === 'xlsx') {
    const res = await fetch(`${API_BASE}/quiz/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_data: quizData, format: 'xlsx', chapter_title: chapterTitle })
    });
    if (!res.ok) throw new Error('فشل تصدير ملف Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quiz_${chapterTitle}.xlsx`;
    link.click();
    return { success: true };
  }

  const res = await fetch(`${API_BASE}/quiz/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_data: quizData, format, chapter_title: chapterTitle })
  });

  if (!res.ok) throw new Error('فشل تصدير الأسئلة');
  const data = await res.json();

  let fileBlob;
  let filename = data.filename;

  if (format === 'json') {
    fileBlob = new Blob([JSON.stringify(data.content, null, 2)], { type: 'application/json;charset=utf-8' });
  } else if (format === 'csv') {
    fileBlob = new Blob(['\uFEFF' + data.content], { type: 'text/csv;charset=utf-8' });
  } else {
    fileBlob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
  }

  const url = URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  return { success: true };
}

export async function importQuizFromText(rawText) {
  const res = await fetch(`${API_BASE}/quiz/import-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل استيراد الأسئلة من النص');
  }
  return await res.json();
}

// --- Prompts API ---
export async function fetchPrompts(category = null) {
  const url = category ? `${API_BASE}/prompts?category=${category}` : `${API_BASE}/prompts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل جلب قائمة البرومبتات');
  const data = await res.json();
  return data.prompts || [];
}

export async function saveCustomPrompt(categoryOrObj, title, description, systemPrompt) {
  let payload;
  if (typeof categoryOrObj === 'object') {
    payload = categoryOrObj;
  } else {
    payload = {
      category: categoryOrObj,
      title,
      description,
      system_prompt: systemPrompt
    };
  }

  const res = await fetch(`${API_BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('فشل حفظ البرومبت');
  return await res.json();
}

export const createPrompt = saveCustomPrompt;

export async function deleteCustomPrompt(promptId) {
  const res = await fetch(`${API_BASE}/prompts/${promptId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('فشل حذف البرومبت');
  return await res.json();
}

export const deletePrompt = deleteCustomPrompt;

export async function generatePromptWithAI(taskGoal, category = 'quiz') {
  const res = await fetch(`${API_BASE}/generate-prompt`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      task_goal: taskGoal,
      category
    })
  });
  if (!res.ok) throw new Error('فشل توليد البرومبت بالذكاء الاصطناعي');
  return await res.json();
}

export const generateCustomPrompt = generatePromptWithAI;

// -------------------------------------------------------------
// Document Management API (مكتبة وإدارة المستندات)
// -------------------------------------------------------------

export async function fetchDocuments({ limit = 20, offset = 0, search = '' } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) params.set('search', search);
  const res = await fetch(`${API_BASE}/documents?${params.toString()}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('فشل جلب قائمة المستندات');
  const data = await res.json();
  return data.documents || [];
}

export async function fetchDocumentDetails(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('فشل جلب تفاصيل المستند');
  const data = await res.json();
  return data.document;
}

export async function updateDocumentTitle(docId, title) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('فشل تعديل اسم المستند');
  return await res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('فشل حذف المستند');
  return await res.json();
}

// -------------------------------------------------------------
// Admin Control Panel API (لوحة الإدارة والتحكم الشاملة)
// -------------------------------------------------------------

export async function fetchPublicSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`);
    if (!res.ok) throw new Error('فشل جلب إعدادات الهوية العامة');
    return await res.json();
  } catch (e) {
    return {
      platform_name: "ذكاء EduAI",
      platform_subtitle: "المنصة الأكاديمية الذكية المتكاملة",
      university_name: "الجامعة",
      faculty_name: "كلية الحاسبات وتكنولوجيا المعلومات",
      support_email: "admin@eduai.edu",
      footer_text: "المنصة الأكاديمية الذكية المتقدمة"
    };
  }
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error('فشل جلب إحصائيات الإدارة');
  return await res.json();
}

export async function fetchAdminSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`, { headers: getHeaders() });
  if (!res.ok) throw new Error('فشل جلب إعدادات المنصة');
  const data = await res.json();
  return data.settings;
}

export async function saveAdminSettings(settings) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ settings })
  });
  if (!res.ok) throw new Error('فشل حفظ إعدادات المنصة');
  return await res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error('فشل جلب قائمة المستخدمين');
  const data = await res.json();
  return data.users || [];
}

export async function createAdminUser(userData) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل إنشاء المستخدم');
  }
  return await res.json();
}

export async function updateAdminUser(userId, userData) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل تحديث بيانات المستخدم');
  }
  return await res.json();
}

export async function resetAdminUserPassword(userId, newPassword) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ new_password: newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل إعادة تعيين كلمة المرور');
  }
  return await res.json();
}

export async function resetAdminUserTokens(userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-tokens`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل تصفير التوكنز');
  }
  return await res.json();
}

export async function setAdminUserTokens(userId, { tokens_used, tokens_limit }) {
  const body = {};
  if (tokens_used !== undefined && tokens_used !== null) body.tokens_used = Number(tokens_used);
  if (tokens_limit !== undefined && tokens_limit !== null) body.tokens_limit = Number(tokens_limit);
  const res = await fetch(`${API_BASE}/admin/users/${userId}/tokens`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل تحديث التوكنز');
  }
  return await res.json();
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'فشل حذف المستخدم');
  }
  return await res.json();
}

export async function fetchAdminLogs(limit = 50) {
  const res = await fetch(`${API_BASE}/admin/logs?limit=${limit}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('فشل جلب سجل النشاطات');
  const data = await res.json();
  return data.logs || [];
}

export async function clearAdminLogs() {
  const res = await fetch(`${API_BASE}/admin/logs`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('فشل مسح السجلات');
  return await res.json();
}

export async function clearAdminCache() {
  const res = await fetch(`${API_BASE}/admin/clear-cache`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('فشل تنظيف الذاكرة المؤقتة');
  return await res.json();
}
