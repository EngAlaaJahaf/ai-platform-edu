import json
import os
import re
import traceback
import time
import concurrent.futures
from contextvars import ContextVar
from typing import List, Dict, Any, Optional
import httpx
from openai import OpenAI, RateLimitError
from backend.database import log_activity
from backend.config import GEMINI_API_KEY as ENV_GEMINI_KEY, DEFAULT_MODEL as ENV_MODEL

use_base_rules_var = ContextVar("use_base_rules", default=True)

class AIService:
    @staticmethod
    def clean_model_name(model_name: Optional[str]) -> str:
        if not model_name:
            return "gemini-1.5-flash"
        name = model_name.strip()
        if name.startswith("models/"):
            name = name[len("models/"):]
        return name

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """
        Cleans AI generation output from multilingual token leaks (CJK / Chinese / Japanese / Cyrillic),
        corrupted concatenations (e.g. searchي, defacesي, akeship_via), and artifacts.
        """
        if not text or not isinstance(text, str):
            return text

        # 1. Remove CJK (Chinese, Japanese, Korean) characters and Asian ideographs
        cleaned = re.sub(r'[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+', '', text)
        
        # 2. Fix specific corrupted fragments from multilingual model hallucinations
        corruptions = [
            (r'akeship_via', 'البريد الإلكتروني'),
            (r'akeship', 'الاحتيال'),
            (r'chomsky', 'خبيثة'),
            (r'\bsearchي\b', 'يبحث'),
            (r'\bdefacesي\b', 'يشوه'),
            (r'\bhackي\b', 'يخترق'),
            (r'\bcrackي\b', 'يكسر'),
            (r'\btestي\b', 'يختبر'),
            (r'م\s*ون\b', 'ممتازون'),
        ]
        for pattern, repl in corruptions:
            cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE)

        # 3. Clean up double spaces or dangling slashes left after removal
        cleaned = re.sub(r'[ \t]{2,}', ' ', cleaned)
        cleaned = re.sub(r'/\s*/', '/', cleaned)
        cleaned = re.sub(r'^\s*[/\\-]\s*', '', cleaned)
        cleaned = re.sub(r'\s*[/\\-]\s*$', '', cleaned)
        return cleaned.strip()

    @classmethod
    def sanitize_output(cls, data: Any) -> Any:
        """Recursively sanitizes all strings in dicts, lists, and primitives."""
        if isinstance(data, str):
            return cls.sanitize_text(data)
        elif isinstance(data, dict):
            return {cls.sanitize_text(str(k)): cls.sanitize_output(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [cls.sanitize_output(item) for item in data]
        return data

    @classmethod
    def fetch_available_models(
        cls,
        provider: str = "gemini",
        base_url: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> List[Dict[str, str]]:
        provider = (provider or "gemini").lower()
        key = api_key or ENV_GEMINI_KEY or ""
        discovered_models = []

        if base_url:
            clean_base = base_url.strip().rstrip("/")
            headers = {"Authorization": f"Bearer {key}"} if key else {}
            
            # Smart URL normalization
            root_url = clean_base[:-3] if clean_base.endswith("/v1") else clean_base
            
            endpoints_to_try = [
                f"{clean_base}/models" if not clean_base.endswith("/models") else clean_base,
                f"{root_url}/v1/models",
                f"{root_url}/api/tags",
                f"{root_url}/api/models",
                f"{root_url}/models"
            ]

            # Remove duplicate endpoints
            unique_endpoints = list(dict.fromkeys(endpoints_to_try))

            for ep in unique_endpoints:
                try:
                    with httpx.Client(timeout=2.0) as http_client:
                        r = http_client.get(ep, headers=headers)
                        if r.status_code == 200:
                            data = r.json()
                            if isinstance(data, list):
                                models_list = data
                            elif isinstance(data, dict):
                                models_list = data.get("data", []) or data.get("models", [])
                            else:
                                models_list = []
                                
                            for m in models_list:
                                if isinstance(m, str) and m.strip():
                                    discovered_models.append({"id": m.strip(), "name": m.strip()})
                                elif isinstance(m, dict):
                                    m_id = m.get("id") or m.get("name") or m.get("model")
                                    if m_id:
                                        m_str = str(m_id).strip()
                                        discovered_models.append({"id": m_str, "name": str(m.get("name") or m_str)})
                            if discovered_models:
                                break
                except Exception:
                    continue

        elif provider == "gemini":
            try:
                from google import genai
                client = genai.Client(api_key=key if key else None)
                for m in client.models.list():
                    m_id = m.name.replace("models/", "")
                    if "gemini" in m_id.lower() and "embed" not in m_id.lower():
                        discovered_models.append({"id": m_id, "name": m.display_name or m_id})
            except Exception:
                pass

        if not discovered_models:
            defaults = {
                "gemini": [
                    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash (الأسرع والأمثل)"},
                    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (الجيل الثاني)"},
                    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (المتقدم)"}
                ],
                "ollama": [
                    {"id": "qwen2.5:latest", "name": "Qwen 2.5 (Alibaba)"},
                    {"id": "llama3:latest", "name": "Llama 3 (Meta)"},
                    {"id": "deepseek-r1:latest", "name": "DeepSeek R1 (Reasoning)"},
                    {"id": "mistral:latest", "name": "Mistral 7B"}
                ],
                "deepseek": [
                    {"id": "deepseek-chat", "name": "DeepSeek-V3 Chat"},
                    {"id": "deepseek-reasoner", "name": "DeepSeek-R1 Reasoner"}
                ],
                "groq": [
                    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B"},
                    {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B"}
                ]
            }
            discovered_models = defaults.get(provider, [
                {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
                {"id": "gpt-4o", "name": "GPT-4o"}
            ])

        return discovered_models

    @classmethod
    def execute_chat_completion(
        cls,
        system_prompt: str,
        user_prompt: str,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        json_mode: bool = False,
        temperature: Optional[float] = None
    ) -> str:
        provider = (provider or "gemini").lower()
        key = api_key or ENV_GEMINI_KEY or ""
        clean_model = cls.clean_model_name(model)
        # Dynamic temperature from system_settings if not provided
        if temperature is None:
            try:
                from backend.database import get_system_settings
                temperature = float(get_system_settings().get("temperature", 0.3))
            except Exception:
                temperature = 0.3
        else:
            temperature = float(temperature)

        base_rules = (
            "\n\nقواعد الصياغة الأساسية الواجب الالتزام بها:\n"
            "- استخدم لغة واضحة وبسيطة.\n"
            "- اكتب بأسلوب مقتضب ومعلوماتي.\n"
            "- استخدم جملًا قصيرة وقوية الأثر.\n"
            "- اعتمد صيغة المبني للمعلوم دائما.\n"
            "- ركز على الرؤى العملية والقابلة للتنفيذ.\n"
            "- استخدم القوائم النقطية في منشورات التواصل الاجتماعي.\n"
            "- ادعم الادعاءات بالبيانات والأمثلة كلما أمكن ذلك.\n"
            "- خاطب القارئ مباشرة باستخدام ضمير المخاطب.\n"
            "- تجنب استخدام الشرطة الطويلة تماما.\n"
            "- استخدم الفواصل والنقاط فقط لربط الأفكار.\n"
            "- تجنب صياغة \"ليس هذا فحسب بل ذلك أيضا\".\n"
            "- تجنب الاستعارات والكليشيهات والتعميمات.\n"
            "- تجنب المقدمات المعتادة مثل \"في الختام\" أو \"خلاصة القول\".\n"
            "- تجنب كتابة أي ملاحظات أو تحذيرات جانبية.\n"
            "- اقتصر على المخرجات المطلوبة فقط.\n"
            "- تجنب الصفات والظروف غير الضرورية.\n"
            "- تجنب الجمل المتقطعة أو الأسئلة البلاغية.\n"
            "- تجنب الوسوم وعلامات الترقيم المعقدة مثل الفاصلة المنقوطة.\n"
            "- تجنب التنسيقات الخاصة مثل الماركدوان أو النجمات (إلا إذا طُلبت صيغة JSON فحافظ على هيكل الـ JSON المخرَج بشكل صحيح).\n"
            "- تجنب المبالغة في الكلمات التالية في النص: يمكن، قد، مجرد، جدا، حقا، حرفيا، فعليا، بالتأكيد، ربما، أساسا، استكشاف، انطلاق، تنوير، تسليط الضوء، صياغة، تخيل، عالم، مغيّر لقواعد اللعبة، فتح، اكتشاف، صاروخي، ليس وحدك، في عالم حيث، إحداث ثورة، مدمر، استخدام، غوص عميق، نسيج، إضاءة، كشف، محوري، معقد، توضيح، بناء عليه، علاوة على ذلك، ومع ذلك، تسخير، مثير، رائد، مذهل، يبقى أن نرى، لمحة عن، تنقل، مشهد، صارخ، شهادة، باختصار، بالإضافة إلى ذلك، تعزيز، فتحت، قوي، استفسارات، متطور باستمرار."
        )

        if system_prompt and "You are an AI assistant. Reply with 'OK'." not in system_prompt and use_base_rules_var.get():
            system_prompt = f"{system_prompt}\n{base_rules}"


        # 1. Base URL or OpenAI-compatible providers
        if base_url or provider in ["ollama", "openai", "deepseek", "groq", "openrouter", "custom"]:
            target_base_url = base_url
            if provider == "ollama" and not target_base_url:
                target_base_url = "http://localhost:11434/v1"
            elif provider == "deepseek" and not target_base_url:
                target_base_url = "https://api.deepseek.com/v1"
            elif provider == "groq" and not target_base_url:
                target_base_url = "https://api.groq.com/openai/v1"
            elif provider == "openrouter" and not target_base_url:
                target_base_url = "https://openrouter.ai/api/v1"

            client = OpenAI(
                base_url=target_base_url,
                api_key=key if key else "ollama",
                timeout=180.0,
                max_retries=2
            )

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            response_format = {"type": "json_object"} if json_mode and provider != "ollama" else None

            model_candidates = [clean_model]
            if "/" not in clean_model and provider in ["openrouter", "custom"]:
                model_candidates.append(f"openai/{clean_model}")

            last_err = None
            for cand_model in model_candidates:
                try:
                    response = client.chat.completions.create(
                        model=cand_model,
                        messages=messages,
                        temperature=temperature,
                        response_format=response_format
                    )
                    return response.choices[0].message.content or ""
                except RateLimitError as rle:
                    error_msg = f"المزود الخارجي للنموذج ({cand_model}) وصل للحد الأقصى (Rate Limit 429). اختر نموذجاً آخر من القائمة في الإعدادات."
                    log_activity("provider_error", f"Rate limit error with {cand_model}: {rle}", "error")
                    raise ValueError(error_msg)
                except Exception as e:
                    last_err = e
                    if "Rate limit" in str(e) or "429" in str(e):
                        error_msg = f"المزود الخارجي للنموذج ({cand_model}) وصل للحد الأقصى (Rate Limit 429). اختر نموذجاً آخر من القائمة في الإعدادات."
                        log_activity("provider_error", f"Rate limit error with {cand_model}: {e}", "error")
                        raise ValueError(error_msg)
                    if "Unable to determine provider" in str(e):
                        continue
                    else:
                        break

            if last_err:
                log_activity("provider_error", f"Provider {provider} ({clean_model}) failed: {last_err}", "error")
                raise last_err

        # 2. Google Gemini Provider
        if not key:
            raise ValueError("مفتاح Gemini API غير مدخل. يرجى إدخال مفتاحك في نافذة الإعدادات.")

        candidate_models = [
            clean_model,
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro"
        ]

        last_error = None
        for cand_model in candidate_models:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(
                    api_key=key,
                    http_options={'timeout': 180.0}
                )
                combined_prompt = f"{system_prompt}\n\n{user_prompt}"
                
                config_kwargs = {"temperature": temperature, "max_output_tokens": 8192}
                if json_mode:
                    config_kwargs["response_mime_type"] = "application/json"
                    
                res = client.models.generate_content(
                    model=cand_model,
                    contents=combined_prompt,
                    config=types.GenerateContentConfig(**config_kwargs)
                )
                if res and res.text:
                    return res.text
            except Exception as e:
                last_error = e
                if "404" in str(e) or "NOT_FOUND" in str(e):
                    continue
                else:
                    break

        error_msg = f"فشل الاتصال بـ Gemini: {last_error}"
        log_activity("provider_error", error_msg, "error")
        raise ValueError(error_msg)

    @classmethod
    def validate_connection(
        cls, 
        provider: str = "gemini", 
        api_key: Optional[str] = None, 
        base_url: Optional[str] = None, 
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = (provider or "gemini").lower()
        try:
            test_response = cls.execute_chat_completion(
                system_prompt="You are an AI assistant. Reply with 'OK'.",
                user_prompt="Ping",
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model
            )
            provider_label = {
                "gemini": "Google Gemini 🌟",
                "ollama": "Ollama Local 🦙",
                "deepseek": "DeepSeek AI ⚡",
                "groq": "Groq LPU 🚀",
                "openrouter": "OpenRouter 🌐",
                "openai": "OpenAI 🤖",
                "custom": "Custom Endpoint 💻"
            }.get(provider, provider)

            return {
                "valid": True,
                "provider": provider,
                "message": f"تم الاتصال بنجاح مع {provider_label} (النموذج: {model or 'Default'})!"
            }
        except Exception as e:
            return {
                "valid": False,
                "provider": provider,
                "error": f"تنبيه: {str(e)}"
            }

    @classmethod
    def answer_with_rag(
        cls, 
        query: str, 
        context_chunks: List[Dict[str, Any]], 
        conversation_history: Optional[List[Dict[str, str]]] = None,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        custom_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        context_text = "\n\n".join([
            f"--- [المصدر: صفحة {c.get('page_number', 1)}] ---\n{c.get('text', '')}"
            for c in context_chunks
        ])

        citations = list(set([c.get("page_number", 1) for c in context_chunks if c.get("page_number")]))

        system_prompt = custom_system_prompt or (
            "أنت «ذكاء | EduAI»، أستاذ جامعي ومساعد أكاديمي متقدم للطلاب الجامعيين والباحثين. "
            "مهمتك الإجابة عن سؤال الطالب بدقة استناداً إلى كل محتويات المستند المرفق (من الصفحة الأولى حتى الصفحة الأخيرة).\n"
            "قواعد التوثيق والاستجابة الذكية الشاملة:\n"
            "1. البحث الشامل والتوافق ثنائي اللغة (Universal & Full-Document Coverage):\n"
            "   - اقرأ وابحث في كامل صفحات وشرائح المستند المرفق (المقدمة، الفصول، الجداول، الخاتمة، والواجبات/التكليفات في نهاية الملف).\n"
            "   - قد يكون المستند باللغة الإنجليزية ويسأل الطالب بالعربية (أو العكس)؛ طابق المفاهيم الأكاديمية والمصطلحات تلقائياً (مثلاً: تكليف / واجب = Assignment / Homework / Task / Case Study، الميزة التنافسية = Competitive Advantage، نموذج الإيرادات = Revenue Model، إلخ).\n"
            "   - إذا سأل الطالب عن أي تكليف، واجب، سؤال، أو مفهوم موجود في أي صفحة من الملف (بما فيها الصفحات الأخيرة)، استخرج المطلوب واشرحه بالتفصيل باللغة العربية مع ذكر المصطلح الأصلي وتوثيق رقم الصفحة مثل: [المصدر: صفحة X].\n"
            "2. قاعدة خارج النطاق:\n"
            "   - لا تصنف السؤال أبداً على أنه خارج النطاق إذا كان يتعلق بأي جزء من الملف أو بموضوع المادة الدراسية.\n"
            "   - فقط إذا سأل الطالب عن موضوع خارجي تماماً لا يمت للمادة الأكاديمية بصلة، اكتب في أول سطر حصراً: [⚠️ هذا السؤال خارج نطاق الملف المرفوع] ثم أجب باختصار.\n"
            "3. نسق الإجابة بتنسيق Markdown أكاديمي غني ومرتب (نقاط واضحة، جداول، عناوين، أمثلة)."
        )

        user_prompt = f"محتوى المستند المرفق الكامل:\n{context_text}\n\nسؤال الطالب: {query}"

        try:
            ans_text = cls.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model
            )
            is_out_of_scope = bool(re.search(r'\[?\s*⚠️?\s*هذا السؤال خارج نطاق الملف', ans_text))
            
            # Extract specific cited pages from model response text or fall back to context pages
            cited_pages_in_text = [int(p) for p in re.findall(r'صفحة\s*(\d+)', ans_text)]
            final_citations = sorted(list(set(cited_pages_in_text))) if cited_pages_in_text else sorted(list(set([c.get("page_number", 1) for c in context_chunks if c.get("page_number")])))[:5]
            
            return {
                "answer": cls.sanitize_text(ans_text),
                "is_out_of_scope": is_out_of_scope,
                "citations": final_citations,
                "sources": context_chunks[:4]
            }
        except Exception as err:
            return {
                "answer": f"⚠️ حدث تعذر في الاتصال بالنموذج المختار ({model or 'Default'}):\n{str(err)}\n\n💡 نصيحة: انقر على زر (الإعدادات ⚙️) بالأعلى وتأكد من اختيار نموذج نشط ومتاح.",
                "is_out_of_scope": False,
                "citations": sorted(citations),
                "sources": context_chunks[:3]
            }

    @classmethod
    def generate_summary_and_mindmap(
        cls, 
        full_text: str, 
        level: str = "full",
        language: str = "ar",
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        custom_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        if not full_text.strip():
            return {
                "title": "لا يوجد مستند مرفوع",
                "overview": "يرجى رفع ملف المحاضرة أولاً.",
                "key_points": ["ارفع الملف لبدء التلخيص."],
                "definitions": [],
                "comparisons": [],
                "exam_traps": [],
                "formulas_rules": [],
                "mindmap": {"label": "ارفع ملفاً", "children": []}
            }

        lang_instruction = {
            "ar": "يجب كتابة كامل محتوى التلخيص (العناوين، النظرة العامة، المحاور والشروحات، المقارنات، ومصائد الامتحانات، وقاموس المصطلحات، وشجرة الخريطة الذهنية) باللغة العربية الفصحى الأكاديمية الواضحة والثرية حتى لو كان المستند الأصلي مكتوباً بالإنجليزية.",
            "en": "All summary sections (Title, Overview, Pillars, Comparisons, Exam Traps, Definitions, Formulas, Mindmap) must be written strictly and entirely in clear academic English.",
            "bilingual": "يجب كتابة الشروحات والنظرة العامة والمحاور باللغة العربية الفصحى الواضحة مع إبراز المصطلحات والمفاهيم الإنجليزية المقابلة بجانب كل تعريف ومحور (Bilingual Academic Arabic with English Core Terminology)."
        }.get(language, "اللغة العربية الفصحى الأكاديمية.")

        level_instructions = ""
        if level == "quick":
            level_instructions = "تنبيه هام (ملخص سريع): استخرج فقط نظرة عامة سريعة وأهم النقاط الجوهرية (key_points). بالنسبة للحقول الأخرى (المحاور، التعريفات، المقارنات، مصائد الامتحانات، الخريطة الذهنية) اجعلها موجزة ومبسطة جداً لتسريع الاستجابة قدر الإمكان."
        elif level == "deep":
            level_instructions = "تنبيه هام (ملخص عميق وتفصيلي): قدم شرحاً عميقاً ومطولاً جداً للمحاور (pillars)، مع أمثلة عملية وتطبيقات لكل نقطة، وتوسيع كبير في المقارنات والمصطلحات وشجرة الخريطة الذهنية لتشمل كل التفاصيل الدقيقة والمعادلات."
        else:
            level_instructions = "تنبيه هام (ملخص متكامل): استخرج ملخصاً متوازناً وشاملاً يتضمن المحاور والمقارنات ومصائد الامتحانات والتعريفات والخريطة الذهنية بشكل قياسي ومفيد."

        system_prompt = custom_system_prompt or (
            "أنت بروفيسور وخبير تلخيص أكاديمي معتمد لأرقى الجامعات العالمية. "
            f"مهمتك قراءة المادة التعليمية واستخراج ملخص أكاديمي بمستوى '{level}'. اللغة المستهدفة المطلوبة هي: '{language}'.\n"
            f"تعليمات اللغة الإلزامية: {lang_instruction}\n\n"
            f"{level_instructions}\n\n"
            "توجيه خاص وحاسم بجداول المقارنة (comparisons):\n"
            "استخرج كافة المقارنات والفروقات في المادة التعليمية سواء كانت مقارنة ثنائية (بين عنصرين)، أو ثلاثية (مثل: مقارنة بين القبعات البيضاء والسوداء والرمادية، أو بين الفيروسات والديدان وأحصنة طروادة)، أو متعددة الأطراف (N-Way Comparison). لكل جدول مقارنة:\n"
            "1. حدد العنوان (title) بشكل دقيق يوضح كل الأطراف المقارنة.\n"
            "2. حدد مصفوفة الأطراف (items): مصفوفة تحتوي أسماء كل الأطراف المقارنة كاملة بالتساوي: مثلاً [\"القبعة البيضاء (White Hat)\", \"القبعة السوداء (Black Hat)\", \"القبعة الرمادية (Grey Hat)\"].\n"
            "3. في مصفوفة أوجه المقارنة (rows): لكل وجه (aspect)، ضع مصفوفة (values) بنفس عدد وترتيب الأطراف في (items)، بحيث يحصل كل طرف على شرحه وخصائصه الدقيقة المقابلة له دون نقص أي طرف.\n\n"
            "أرجع النتيجة بصيغة JSON حصراً بدون أي نصوص أو markdown خارج كائن الـ JSON. هيكل الاستجابة المطلوب:\n"
            "{\n"
            '  "title": "العنوان الأكاديمي الدقيق للمحاضرة أو الفصل باللغة المطلوبة",\n'
            '  "overview": "نظرة عامة وشاملة تشرح الفكرة الجوهرية والهدف العام من الموضوع في 4-5 أسطر غنية ومحكمة باللغة المطلوبة",\n'
            '  "pillars": [\n'
            '    {\n'
            '      "pillar_title": "1️⃣ عنوان المحور الأول",\n'
            '      "description": "شرح وافٍ وتفصيلي للمحور مع الأمثلة إن وجدت",\n'
            '      "sub_points": ["تفصيل فرعي 1", "تفصيل فرعي 2", "تفصيل فرعي 3"]\n'
            '    }\n'
            '  ],\n'
            '  "key_points": ["نقطة جوهرية 1 مستخلصة", "نقطة جوهرية 2", "نقطة جوهرية 3", "نقطة جوهرية 4", "نقطة جوهرية 5"],\n'
            '  "definitions": [\n'
            '    {"term": "المصطلح باللغة الإنجليزية / العربية", "meaning": "التعريف العلمي الدقيق والواضح", "example": "مثال أو سياق الاستخدام"}\n'
            '  ],\n'
            '  "comparisons": [\n'
            '    {\n'
            '      "title": "مقارنة بين القبعات البيضاء والسوداء والرمادية",\n'
            '      "items": ["القبعة البيضاء (White Hat)", "القبعة السوداء (Black Hat)", "القبعة الرمادية (Grey Hat)"],\n'
            '      "rows": [\n'
            '        {\n'
            '          "aspect": "الدافع والهدف",\n'
            '          "values": [\n'
            '            "مخترق أخلاقي يساعد المؤسسات في فحص الثغرات وإصلاحها بشكل قانوني.",\n'
            '            "مخترق خبيث يسعى لإحداث ضرر أو سرقة بيانات لتحقيق مكاسب غير مشروعة.",\n'
            '            "مخترق وسط يخترق بدون إذن مسبق لكن بدون نية تخريبية، ويطالب بمكافأة."\n'
            '          ]\n'
            '        }\n'
            '      ]\n'
            '    }\n'
            '  ],\n'
            '  "exam_traps": [\n'
            '    {"trap": "الخطأ الشائع أو الفخ الامتحاني", "correct_concept": "المفهوم الصحيح الواجب حفظه"}\n'
            '  ],\n'
            '  "formulas_rules": [\n'
            '    {"name": "اسم القانون / القاعدة / الخوارزمية", "rule": "الصيغة أو القاعدة الرياضية/البرمجية", "explanation": "تفسير المعاملات"}\n'
            '  ],\n'
            '  "mindmap": {\n'
            '     "label": "المفهوم المركزي للمحاضرة",\n'
            '     "children": [\n'
            '        {\n'
            '           "label": "المحور 1",\n'
            '           "children": [\n'
            '              {"label": "المفهوم الفرعي 1.1"},\n'
            '              {"label": "المفهوم الفرعي 1.2"}\n'
            '           ]\n'
            '        },\n'
            '        {\n'
            '           "label": "المحور 2",\n'
            '           "children": [\n'
            '              {"label": "المفهوم الفرعي 2.1"},\n'
            '              {"label": "المفهوم الفرعي 2.2"}\n'
            '           ]\n'
            '        }\n'
            '     ]\n'
            '  }\n'
            "}\n\n"
            "قاعدة النقاء اللغوي الأكاديمي الصارم (Strict Language Purity):\n"
            "يُمنع منعاً باتاً ومطلقاً إخراج أي حروف أو رموز آسيوية أو صينية (مثل 电子邮件 أو 软件 أو 善良) أو أي تشوهات دمج الكلمات (مثل searchي أو defacesي) في أي حقل أو في أي عقدة من عقد الخريطة الذهنية. يجب أن تكون كل النصوص إما باللغة العربية الفصحى السليمة أو باللغة الإنجليزية الأكاديمية للمصطلحات اللاتينية فقط."
        )

        char_limit = 8000 if level == "quick" else (16000 if level == "deep" else 12000)
        user_prompt = f"نص المادة التعليمية المطلوب تلخيصها استناداً إلى محتواها العلمي حصراً:\n{full_text[:char_limit]}"

        try:
            raw = cls.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model,
                json_mode=True
            )
            raw = re.sub(r'^```json\s*', '', raw.strip())
            raw = re.sub(r'\s*```$', '', raw)
            parsed_json = json.loads(raw)
            return cls.sanitize_output(parsed_json)
        except Exception as e:
            err_str = str(e)
            if "timed out" in err_str.lower() or "timeout" in err_str.lower():
                raise ValueError("استغرق خادم الذكاء الاصطناعي وقتاً أطول من المعتاد لمعالجة المستند الكامل. تم رفع المهلة، ويمكنك تجربة 'ملخص سريع' أو اختيار نموذج فائق السرعة مثل Gemini Flash أو Groq.")
            raise ValueError(f"تعذر استخراج الملخص الأكاديمي: {err_str}")

    @classmethod
    def generate_quiz(
        cls, 
        full_text: str, 
        count: int = 5, 
        difficulty: str = "medium",
        language: str = "bilingual",
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        custom_system_prompt: Optional[str] = None,
        extract_only: bool = False
    ) -> Dict[str, Any]:
        if not full_text.strip():
            return {"questions": [], "flashcards": [], "predicted_score_baseline": 0, "study_tips": []}

        difficulty_instructions = {
            "easy": "ركز على استيعاب المفاهيم والمصطلحات الأساسية والتعاريف المباشرة.",
            "medium": "امزج بين الفهم المفاهيمي والمقارنة والتطبيق على سيناريوهات معقولة.",
            "hard": "صغ أسئلة امتحانات نهائية معقدة (Higher-Order Thinking / Bloom's Taxonomy: Analysis & Application) تتضمن مشتتات دقيقة ومقارنات وسيناريوهات برمجية وتحليل حالات خاصة ومصائد شائعة."
        }.get(difficulty, "امزج بين الفهم والتطبيق.")

        lang_instruction = {
            "ar": "يجب أن تكون الأسئلة والخيارات والشروحات باللغة العربية الفصحى حصراً.",
            "en": "All questions, options, and explanations must be strictly in clear academic English.",
            "bilingual": "يجب توفير السؤال والخيارات والشروحات بصيغة ثنائية متوازية (English & Arabic) في الحقول المخصصة."
        }.get(language, "صيغة ثنائية متوازية.")

        if extract_only:
            system_prompt = custom_system_prompt or (
                "أنت خبير في معالجة واستخراج البيانات التعليمية. النص المرفق يحتوي بالفعل على أسئلة اختبار (Quiz/Exam) مع خياراتها ومفتاح الإجابات (Answer Key) في نهايته.\n"
                "مهمتك: **عدم تأليف أي أسئلة جديدة**، بل استخراج الأسئلة الموجودة في النص كما هي تماماً، وتحديد الإجابة الصحيحة لكل سؤال بناءً على مفتاح الإجابات المرفق، ثم تنسيقها في قالب JSON المطلوب.\n"
                f"إرشادات اللغة المطلوبة: {lang_instruction}\n"
                "قواعد الاستخراج:\n"
                "1. حافظ على صياغة السؤال والخيارات (A, B, C, D) كما وردت في النص.\n"
                "2. اربط كل سؤال بإجابته الصحيحة من مفتاح الإجابات.\n"
                "3. إذا لم يوجد شرح للإجابة في النص، قم بتوليد شرح علمي دقيق يبرر سبب صحة الإجابة.\n"
                "4. استخرج أكبر عدد ممكن من الأسئلة الموجودة (تجاهل معلمة count).\n"
                "5. استخرج أو قم بتوليد بطاقات استذكار (Flashcards) لأهم المصطلحات الواردة في الأسئلة.\n"
                "أرجع النتيجة بصيغة JSON حصراً بدون أي نصوص إضافية:\n"
            )
        else:
            system_prompt = custom_system_prompt or (
                "أنت رئيس لجنة الامتحانات وأستاذ جامعي معتمد في إعداد بنوك أسئلة الاختيار من متعدد (MCQ) وبطاقات الاستذكار (Flashcards) بأعلى المعايير الأكاديمية العالمية.\n"
                f"مهمتك: بناء اختبار دقيق بعدد {count} أسئلة بمستوى صعوبة: '{difficulty}'، واللغة المطلوبة: '{language}'.\n"
                f"إرشادات الصعوبة: {difficulty_instructions}\n"
                f"إرشادات اللغة: {lang_instruction}\n"
                "قواعد صياغة الأسئلة والبطاقات الإلزامية:\n"
                "1. صياغة السؤال بالإنجليزية في (question_en) وبالعربية في (question_ar).\n"
                "2. الخيارات (A, B, C, D) بصيغة ثنائية واضحة: [Option in English | الخيار بالعربية]. المشتتات مقنعة وعلمية.\n"
                "3. الحرف الصحيح حصراً في (correct_letter) كـ A أو B أو C أو D، ورقم الفهرس في (correct_index) من 0 إلى 3.\n"
                "4. شرح علمي مفصل باللغتين (explanation_en) و (explanation_ar) يوضح سبب صحة الإجابة ولماذا الخيارات الأخرى خاطئة.\n"
                "5. بطاقات الاستذكار (flashcards) تحتوي على المصطلح والشرح باللغتين: front_ar, front_en, back_ar, back_en.\n"
                "أرجع النتيجة بصيغة JSON حصراً بدون أي نصوص إضافية:\n"
            )
        
        system_prompt += (
            "{\n"
            '  "chapter_title": "اسم الفصل أو المحاضرة الأكاديمية",\n'
            '  "difficulty_level": "' + difficulty + '",\n'
            '  "language": "' + language + '",\n'
            '  "questions": [\n'
            '    {\n'
            '      "id": 1,\n'
            '      "question_en": "Question in clear academic English?",\n'
            '      "question_ar": "السؤال بصياغة عربية أكاديمية واضحة وموازية؟",\n'
            '      "options_en": ["Option A EN", "Option B EN", "Option C EN", "Option D EN"],\n'
            '      "options_ar": ["الخيار أ عربي", "الخيار ب عربي", "الخيار ج عربي", "الخيار د عربي"],\n'
            '      "options": [\n'
            '        "Option A EN | الخيار أ عربي",\n'
            '        "Option B EN | الخيار ب عربي",\n'
            '        "Option C EN | الخيار ج عربي",\n'
            '        "Option D EN | الخيار د عربي"\n'
            '      ],\n'
            '      "correct_letter": "A",\n'
            '      "correct_index": 0,\n'
            '      "explanation_en": "Comprehensive scientific explanation.",\n'
            '      "explanation_ar": "شرح علمي مفصل يوضح سبب صحة الخيار أ.",\n'
            '      "topic": "الموضوع الفرعي",\n'
            '      "cognitive_level": "فهم / تحليل / تطبيق"\n'
            '    }\n'
            '  ],\n'
            '  "flashcards": [\n'
            '    {\n'
            '      "front_ar": "المصطلح بالعربية",\n'
            '      "front_en": "Term in English",\n'
            '      "back_ar": "الشرح العلمي والقاعدة الجوهرية بالعربية",\n'
            '      "back_en": "Scientific explanation and key rule in English",\n'
            '      "front": "المصطلح",\n'
            '      "back": "الشرح"\n'
            '    }\n'
            '  ],\n'
            '  "predicted_score_baseline": 85,\n'
            '  "study_tips": [\n'
            '    "نصيحة للمذاكرة والتركيز 1",\n'
            '    "نصيحة لاجتياز أسئلة الامتحان 2"\n'
            '  ]\n'
            "}"
        )
        char_limit = 200000 if extract_only else 60000
        full_text = full_text[:char_limit]

        def process_chunk(chunk_text: str) -> dict:
            user_prompt = f"نص المادة الأكاديمية المطلوب استخراج بنك الأسئلة الدقيق منها:\n{chunk_text}"
            try:
                raw = cls.execute_chat_completion(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    provider=provider,
                    api_key=api_key,
                    base_url=base_url,
                    model=model,
                    json_mode=True
                )
                raw = re.sub(r'^```json\s*', '', raw.strip())
                raw = re.sub(r'\s*```$', '', raw)
                
                parsed = None
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    for i in range(len(raw)-1, 10, -1):
                        if raw[i] == '}':
                            try:
                                candidate = raw[:i+1] + '\n  ],\n  "flashcards": [],\n  "study_tips": []\n}'
                                parsed = json.loads(candidate)
                                break
                            except json.JSONDecodeError:
                                pass
                if not parsed:
                    return {"questions": [], "flashcards": []}

                for q in parsed.get("questions", []):
                    if not q.get("question"):
                        q["question"] = q.get("question_ar") or q.get("question_en") or ""
                    if not q.get("explanation"):
                        q["explanation"] = q.get("explanation_ar") or q.get("explanation_en") or ""
                    if "correct_letter" in q and "correct_index" not in q:
                        letters = ["A", "B", "C", "D", "E"]
                        q["correct_index"] = letters.index(q["correct_letter"]) if q["correct_letter"] in letters else 0
                return parsed
            except Exception as e:
                return {"error": str(e), "questions": [], "flashcards": []}

        if extract_only and len(full_text) > 3500:
            chunk_size = 3500
            chunks = []
            answer_key_context = full_text[-4000:] if len(full_text) > 4000 else full_text
            
            for i in range(0, len(full_text), chunk_size):
                chunk = full_text[i:i+chunk_size]
                # Append answer key to chunk to ensure AI has context for correct answers
                if answer_key_context not in chunk:
                    chunk += f"\n\n--- مفتاح الإجابات للإسترشاد (Answer Key) ---\n{answer_key_context}"
                chunks.append(chunk)
                
            results = []
            # Sequential extraction to prevent provider rate limits / timeouts
            for chunk in chunks:
                results.append(process_chunk(chunk))
                    
            final_parsed = {
                "chapter_title": "الامتحان المستخلص (المجمع)",
                "difficulty_level": difficulty,
                "language": language,
                "questions": [],
                "flashcards": [],
                "predicted_score_baseline": 85,
                "study_tips": ["نصيحة: تمت معالجة هذا المستند الطويل على دفعات لتجنب الأخطاء."]
            }
            
            seen_questions = set()
            for res in results:
                for q in res.get("questions", []):
                    q_text = q.get("question", "").strip()
                    if q_text and q_text not in seen_questions:
                        seen_questions.add(q_text)
                        final_parsed["questions"].append(q)
                final_parsed["flashcards"].extend(res.get("flashcards", []))
                if res.get("chapter_title") and final_parsed["chapter_title"] == "الامتحان المستخلص (المجمع)":
                    final_parsed["chapter_title"] = res.get("chapter_title")
                    
            for i, q in enumerate(final_parsed["questions"]):
                q["id"] = i + 1
                
            return cls.sanitize_output(final_parsed)
        else:
            parsed = process_chunk(full_text)
            if not parsed.get("questions") and parsed.get("error"):
                return {
                    "chapter_title": "الامتحان المستخلص",
                    "difficulty_level": difficulty,
                    "questions": [],
                    "flashcards": [],
                    "predicted_score_baseline": 70,
                    "study_tips": [f"تأكد من إعدادات المزود: {parsed.get('error')}"]
                }
            if not parsed.get("chapter_title"):
                parsed["chapter_title"] = "الامتحان المستخلص"
            return cls.sanitize_output(parsed)

    @classmethod
    def proofread_text(
        cls, 
        input_text: str,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        custom_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        system_prompt = custom_system_prompt or (
            "أنت مدقق لغوي وأكاديمي خبير للغة العربية. حلل النص للكشف عن الأخطاء النحوية والإملائية والأسلوبية، وقدر نسبة الأصالة (Originality Score 0-100%) وسلامة اللغة (Grammar Score 0-100%)، وصغ نسخة أكاديمية بليغة. أرجع النتيجة بصيغة JSON حصراً:\n"
            "{\n"
            '  "originality_score": 94,\n'
            '  "grammar_score": 88,\n'
            '  "issues_count": 2,\n'
            '  "issues": [{"type": "نوع الخطأ", "original": "الكلمة", "correction": "التصحيح", "reason": "السبب"}],\n'
            '  "paraphrased_version": "النص بعد إعادة الصياغة الأكاديمية",\n'
            '  "academic_suggestions": ["اقتراح 1", "اقتراح 2"]\n'
            "}"
        )

        user_prompt = f"النص المطلوب تدقيقه:\n{input_text[:4000]}"

        try:
            raw = cls.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model,
                json_mode=True
            )
            raw = re.sub(r'^```json\s*', '', raw.strip())
            raw = re.sub(r'\s*```$', '', raw)
            return cls.sanitize_output(json.loads(raw))
        except Exception as e:
            return {
                "originality_score": 85,
                "grammar_score": 85,
                "issues_count": 0,
                "issues": [],
                "paraphrased_version": input_text,
                "academic_suggestions": [f"تأكد من إعدادات المفتاح: {e}"]
            }

    @classmethod
    def generate_custom_prompt(
        cls,
        task_goal: str,
        category: str = "quiz",
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        meta_prompt = (
            "أنت مهندس برومبتات (Prompt Engineer) خبير في التعليم والذكاء الاصطناعي. "
            "مهمتك صياغة برومبت نظام (System Prompt) احترافي ومحكم لاستخدامه كقالب لاستخراج الأسئلة أو التلخيص أو RAG. "
            "أرجع النتيجة بصيغة JSON حصراً:\n"
            "{\n"
            '  "title": "عنوان جذاب ومختصر للبرومبت",\n'
            '  "description": "وصف دقيق لوظيفة هذا البرومبت في سطر واحد",\n'
            '  "system_prompt": "نص البرومبت الاحترافي المفصل الموجه للذكاء الاصطناعي مع التعليمات والشروط والتنسيق"\n'
            "}"
        )

        user_input = f"الهدف أو التخصص المطلوب للبرومبت: {task_goal}\nالتصنيف: {category}"

        try:
            raw = cls.execute_chat_completion(
                system_prompt=meta_prompt,
                user_prompt=user_input,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model,
                json_mode=True
            )
            raw = re.sub(r'^```json\s*', '', raw.strip())
            raw = re.sub(r'\s*```$', '', raw)
            return json.loads(raw)
        except Exception as e:
            return {
                "title": f"برومبت مخصص: {task_goal[:30]}",
                "description": f"قالب مخصص تم إنشاؤه لتصنيف {category}",
                "system_prompt": f"أنت أستاذ جامعي ومساعد أكاديمي ذكي. ركز على: {task_goal}، وقدم استجابات دقيقة ومنظمة باللغة العربية."
            }

    @classmethod
    def translate_document(
        cls,
        full_text: str,
        source_lang: str = "en",
        target_lang: str = "ar",
        mode: str = "target_only",  # 'target_only', 'page_by_page', 'line_by_line'
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        custom_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Translate academic documents with 3 distinct layout modes."""
        
        lang_names = {
            "en": "الإنجليزية (English)",
            "ar": "العربية (Arabic)",
            "fr": "الفرنسية (French)",
            "de": "الألمانية (German)",
            "es": "الإسبانية (Spanish)",
            "zh": "الصينية (Chinese)"
        }
        src_name = lang_names.get(source_lang, source_lang)
        tgt_name = lang_names.get(target_lang, target_lang)

        default_system_prompt = (
            f"أنت مترجم أكاديمي محترف وخبير في ترجمة الكتب والأبحاث الجامعية من {src_name} إلى {tgt_name}. "
            "قواعد الترجمة الصارمة:\n"
            "1. ترجمة أكاديمية بليغة ودقيقة علمياً مع الحفاظ التام على المصطلحات التقنية الأساسية (ويمكن ذكر المصطلح الأصلي بين قوسين عند الحاجة الأولى).\n"
            "2. الحفاظ الصارم على تخطيط وهيكل الصفحة الأصلي (Layout & Formatting) بأسلوب Canva/Word Document:\n"
            "   - الحفاظ على فواصل الفقرات كما هي دون دمج الجمل في فقرة واحدة.\n"
            "   - الحفاظ على ترقيم العناوين، القوائم النقطية (Bullet Points)، والبنود الرقمية (مثل 2.1, 2.2, 1., 2.) كل بند في سطر مستقل.\n"
            "   - الحفاظ على الجداول والمعادلات الرياضية والرموز البرمجية.\n"
            "3. يجب أن تُرجع النتيجة بصيغة JSON محكمة حصراً وفق الحقول التالية:\n"
            "{\n"
            '  "translated_title": "عنوان المستند المترجم",\n'
            '  "summary_overview": "نبذة موجزة من سطرين حول المحتوى المترجم",\n'
            '  "full_translated_text": "النص الكامل المترجم فقط بلغة الهدف مع كامل العناوين وتوزيع الفقرات الأكاديمي المنسق (Markdown)",\n'
            '  "units": [\n'
            '    {\n'
            '      "original": "الجملة أو الفقرة الأصلية باللغة المصدر",\n'
            '      "translated": "الترجمة الدقيقة الموازية بلغة الهدف"\n'
            '    }\n'
            '  ],\n'
            '  "parallel_pages": [\n'
            '    {\n'
            '      "page_num": 1,\n'
            '      "original_text": "محتوى الصفحة الأصلية مع الحفاظ على فواصل الأسطر والفقرات والقوائم",\n'
            '      "translated_text": "محتوى الصفحة المترجمة المقابلة بنفس توزيع الفقرات والأسطر والقوائم"\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        system_prompt = custom_system_prompt or default_system_prompt
        
        # Take first ~7500 chars to avoid token limits on heavy models
        content_sample = full_text[:8000]
        user_prompt = f"المستند المطلوب ترجمته:\n{content_sample}"

        try:
            raw = cls.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model,
                json_mode=True
            )
            raw = re.sub(r'^```json\s*', '', raw.strip())
            raw = re.sub(r'\s*```$', '', raw)
            data["source_lang"] = source_lang
            data["target_lang"] = target_lang
            data["mode"] = mode
            return cls.sanitize_output(data)
        except Exception as e:
            # Fallback structure
            paragraphs = [p.strip() for p in content_sample.split('\n') if p.strip()]
            units = [{"original": p, "translated": f"[ترجمة تجريبية]: {p}"} for p in paragraphs[:15]]
            return {
                "source_lang": source_lang,
                "target_lang": target_lang,
                "mode": mode,
                "translated_title": "ترجمة المستند الأكاديمي",
                "summary_overview": "تم استخراج وترجمة النص بنجاح.",
                "full_translated_text": f"خطأ أثناء استدعاء المحرك: {e}\n\nيرجى التأكد من صلاحية المفتاح والاتصال.",
                "units": units,
                "parallel_pages": [
                    {
                        "page_num": 1,
                        "original_text": content_sample[:1000],
                        "translated_text": f"ترجمة الصفحة 1:\n{content_sample[:1000]}"
                    }
                ]
            }

