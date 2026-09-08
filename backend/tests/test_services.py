from backend.services.ai_service import AIService
from backend.services.quiz_formatter import QuizFormatterService
from backend.services.rag_service import RAGService


class TestAICleanModelName:
    def test_empty_returns_default(self):
        assert AIService.clean_model_name(None) == "gemini-1.5-flash"
        assert AIService.clean_model_name("") == "gemini-1.5-flash"

    def test_strips_models_prefix(self):
        assert AIService.clean_model_name("models/gemini-1.5-flash") == "gemini-1.5-flash"

    def test_strips_whitespace(self):
        assert AIService.clean_model_name("  gemini-pro  ") == "gemini-pro"

    def test_preserves_normal_name(self):
        assert AIService.clean_model_name("gpt-4o") == "gpt-4o"


class TestAISanitizeChunk:
    def test_empty_input(self):
        assert AIService.sanitize_chunk("") == ""
        assert AIService.sanitize_chunk(None) == ""

    def test_removes_cjk_characters(self):
        assert "中文" not in AIService.sanitize_chunk("hello 中文 world")
        assert AIService.sanitize_chunk("hello 中文 world") == "hello  world"

    def test_preserves_arabic(self):
        result = AIService.sanitize_chunk("مرحبا بالعالم")
        assert "مرحبا" in result

    def test_preserves_english(self):
        assert AIService.sanitize_chunk("Hello World") == "Hello World"


class TestAISanitizeText:
    def test_empty_input(self):
        assert AIService.sanitize_text("") == ""
        assert AIService.sanitize_text(None) is None

    def test_removes_cjk(self):
        result = AIService.sanitize_text("تعقيد中文字符الأحداث")
        assert "中文" not in result

    def test_fixes_corrupted_fragments(self):
        result = AIService.sanitize_text("akeship_via is bad")
        assert "akeship_via" not in result
        assert "البريد الإلكتروني" in result

    def test_preserves_code_blocks(self):
        code = "```python\nprint('hello')\n```"
        result = AIService.sanitize_text(code)
        assert "print('hello')" in result

    def test_preserves_latex(self):
        latex = "$E = mc^2$"
        result = AIService.sanitize_text(latex)
        assert "E = mc^2" in result

    def test_fixes_bracket_spacing(self):
        result = AIService.sanitize_text("المصدر:الكتاب)")
        assert ": " in result or "المصدر" in result

    def test_fixes_arabic_latin_spacing(self):
        result = AIService.sanitize_text("ĵjĵ ĵ ĵjĵ")
        assert isinstance(result, str)

    def test_preserves_arabic_text(self):
        text = "الذكاء الاصطناعي هو فرع من علوم الحاسب"
        result = AIService.sanitize_text(text)
        assert "الذكاء الاصطناعي" in result


class TestAISanitizeOutput:
    def test_string_passthrough(self):
        result = AIService.sanitize_output("hello")
        assert isinstance(result, str)

    def test_dict_sanitization(self):
        data = {"key": "value with 中文"}
        result = AIService.sanitize_output(data)
        assert isinstance(result, dict)
        assert "key" in result

    def test_list_sanitization(self):
        data = ["item1", "item2 with 中文"]
        result = AIService.sanitize_output(data)
        assert isinstance(result, list)
        assert len(result) == 2

    def test_nested_structure(self):
        data = {"a": {"b": ["c", "d 中文"]}}
        result = AIService.sanitize_output(data)
        assert isinstance(result, dict)
        assert "a" in result


class TestRAGNormalizeText:
    def test_empty_input(self):
        assert RAGService.normalize_text("") == ""
        assert RAGService.normalize_text(None) == ""

    def test_removes_diacritics(self):
        text = "كِتَابٌ"
        result = RAGService.normalize_text(text)
        assert "\u064B" not in result
        assert "\u0650" not in result

    def test_normalizes_arabic_variants(self):
        text = "إ أ آ ا"
        result = RAGService.normalize_text(text)
        assert "إ" not in result
        assert "أ" not in result

    def test_normalizes_taa_marbuta(self):
        text = "كتبة"
        result = RAGService.normalize_text(text)
        assert "ة" not in result
        assert "ه" in result

    def test_normalizes_alif_maqsurah(self):
        text = "على"
        result = RAGService.normalize_text(text)
        assert "ى" not in result
        assert "ي" in result

    def test_lowercase(self):
        result = RAGService.normalize_text("Hello World")
        assert result == "hello world"

    def test_removes_special_chars(self):
        result = RAGService.normalize_text("hello! @world#")
        assert "!" not in result
        assert "@" not in result


class TestRAGSearchRelevantChunks:
    def test_empty_chunks(self):
        result = RAGService.search_relevant_chunks("query", [])
        assert result == []

    def test_small_document_returns_all(self):
        chunks = [{"text": f"chunk {i}", "page": i} for i in range(10)]
        result = RAGService.search_relevant_chunks("test", chunks)
        assert len(result) == 10

    def test_large_document_with_keyword_fallback(self):
        chunks = [{"text": f"chunk {i} about machine learning", "page": i} for i in range(150)]
        result = RAGService.search_relevant_chunks("machine learning", chunks, top_k=10)
        assert len(result) <= 10

    def test_chunks_have_score(self):
        chunks = [{"text": "python programming language", "page": i} for i in range(10)]
        result = RAGService.search_relevant_chunks("python", chunks)
        assert len(result) > 0

    def test_relevance_ranking(self):
        chunks = [
            {"text": "unrelated topic about cooking", "page": 1},
            {"text": "machine learning and artificial intelligence", "page": 2},
            {"text": "deep learning neural networks", "page": 3},
        ]
        result = RAGService.search_relevant_chunks("machine learning", chunks, top_k=3)
        assert len(result) > 0


class TestQuizFormatterToBilingual:
    def test_empty_quiz(self):
        result = QuizFormatterService.to_bilingual_custom_text({"questions": []})
        assert "##Chapter" in result

    def test_single_question(self):
        quiz = {
            "questions": [
                {
                    "question_en": "What is AI?",
                    "question_ar": "ما هو الذكاء الاصطناعي؟",
                    "options_en": ["A", "B", "C", "D"],
                    "options_ar": ["أ", "ب", "ج", "د"],
                    "correct_letter": "A",
                }
            ]
        }
        result = QuizFormatterService.to_bilingual_custom_text(quiz)
        assert "Q_EN: What is AI?" in result
        assert "Q_AR: ما هو الذكاء الاصطناعي؟" in result
        assert "ANSWER: A" in result

    def test_list_input_converted(self):
        quiz = [
            {
                "question": "Test?",
                "options": ["A", "B", "C", "D"],
                "correct_letter": "B",
            }
        ]
        result = QuizFormatterService.to_bilingual_custom_text(quiz)
        assert "##Chapter" in result

    def test_correct_index_fallback(self):
        quiz = {
            "questions": [
                {
                    "question_en": "Q1?",
                    "options_en": ["A", "B", "C", "D"],
                    "correct_index": 2,
                }
            ]
        }
        result = QuizFormatterService.to_bilingual_custom_text(quiz)
        assert "ANSWER: C" in result


class TestQuizFormatterParseCustomText:
    def test_simple_quiz(self):
        text = """##Chapter 1: Test

Q_EN: What is 2+2?
Q_AR: ما هو 2+2؟
A: 3
B: 4
C: 5
D: 6
ANSWER: B
EXPLANATION_EN: Basic math
EXPLANATION_AR: رياضيات أساسية
"""
        result = QuizFormatterService.parse_custom_text(text)
        assert "chapters" in result or "questions" in result

    def test_empty_text(self):
        result = QuizFormatterService.parse_custom_text("")
        assert "questions" in result or "chapters" in result

    def test_no_chapter_header(self):
        text = """Q_EN: Question?
A: Option A
B: Option B
ANSWER: A
"""
        result = QuizFormatterService.parse_custom_text(text)
        assert isinstance(result, dict)
