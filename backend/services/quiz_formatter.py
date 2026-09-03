import io
import csv
import json
import re
import pandas as pd
from typing import List, Dict, Any

class QuizFormatterService:
    @staticmethod
    def to_bilingual_custom_text(quiz_data: Any, chapter_title: str = "Chapter Exam") -> str:
        if isinstance(quiz_data, list):
            quiz_data = {"questions": quiz_data}
        lines = [f"##Chapter {chapter_title}: {chapter_title}", ""]
        questions = quiz_data.get("questions", []) if isinstance(quiz_data, dict) else []

        for q in questions:
            q_en = q.get("question_en") or q.get("question") or ""
            q_ar = q.get("question_ar") or q.get("question") or ""
            
            lines.append(f"Q_EN: {q_en}")
            lines.append(f"Q_AR: {q_ar}")

            options = q.get("options", [])
            options_en = q.get("options_en", [])
            options_ar = q.get("options_ar", [])
            
            letters = ["A", "B", "C", "D", "E"]
            for idx in range(max(len(options), len(options_en), 4)):
                letter = letters[idx] if idx < len(letters) else f"Opt{idx+1}"
                opt_en = options_en[idx] if idx < len(options_en) else (options[idx] if idx < len(options) else "")
                opt_ar = options_ar[idx] if idx < len(options_ar) else (options[idx] if idx < len(options) else "")
                
                # Check if option already contains English | Arabic
                if " | " in opt_en and not opt_ar:
                    parts = opt_en.split(" | ", 1)
                    opt_en, opt_ar = parts[0].strip(), parts[1].strip()
                
                if opt_ar and opt_en != opt_ar:
                    lines.append(f"{letter}: {opt_en} | {opt_ar}")
                else:
                    lines.append(f"{letter}: {opt_en}")

            correct_letter = q.get("correct_letter")
            if not correct_letter and "correct_index" in q:
                idx = q["correct_index"]
                correct_letter = letters[idx] if idx < len(letters) else "A"
            lines.append(f"ANSWER: {correct_letter or 'A'}")

            exp_en = q.get("explanation_en") or q.get("explanation") or ""
            exp_ar = q.get("explanation_ar") or q.get("explanation") or ""
            lines.append(f"EXPLANATION_EN: {exp_en}")
            lines.append(f"EXPLANATION_AR: {exp_ar}")
            lines.append("")

        return "\n".join(lines).strip()

    @staticmethod
    def parse_custom_text(text: str) -> Dict[str, Any]:
        """
        Parse custom text format into structured quiz data with multiple chapters.
        """
        clean_text = text.strip()
        
        # Split text into blocks by ##Chapter occurrences
        # Using positive lookahead to keep the separator in the split blocks
        blocks = re.split(r"\n\s*(?=##Chapter)", clean_text)
        if not blocks or (len(blocks) == 1 and not blocks[0].startswith("##Chapter")):
            # Fallback if no ##Chapter at the very beginning of the string
            if not clean_text.startswith("##Chapter"):
                blocks = [clean_text]

        chapters = []
        all_questions = []
        global_q_id = 1
        letters = ["A", "B", "C", "D"]

        for b in blocks:
            b = b.strip()
            if not b:
                continue

            # Extract chapter titles
            lines = b.splitlines()
            chapter_title_lines = []
            question_lines = []
            
            for line in lines:
                if line.strip().startswith("##Chapter"):
                    # Extract the title part after ##Chapter
                    title = re.sub(r"^##Chapter\s*", "", line.strip()).strip()
                    if title:
                        chapter_title_lines.append(title)
                else:
                    question_lines.append(line)

            # Combine chapter titles if multiple (e.g. English and Arabic lines)
            if chapter_title_lines:
                chapter_title = " | ".join(chapter_title_lines)
            else:
                chapter_title = "Imported Quiz"

            # Parse questions text inside this block
            questions_text = "\n".join(question_lines).strip()
            if "Q_EN:" in questions_text:
                q_blocks = re.split(r"\n\s*(?=Q_EN:)", questions_text)
            else:
                q_blocks = re.split(r"\n\s*\n+", questions_text)

            current_chapter_questions = []
            for qb in q_blocks:
                qb = qb.strip()
                if not qb:
                    continue

                q_en_m = re.search(r"Q_EN:\s*(.+)", qb)
                q_ar_m = re.search(r"Q_AR:\s*(.+)", qb)
                ans_m = re.search(r"ANSWER:\s*([A-E])", qb, re.IGNORECASE)
                exp_en_m = re.search(r"EXPLANATION_EN:\s*(.+)", qb)
                exp_ar_m = re.search(r"EXPLANATION_AR:\s*(.+)", qb)

                options = []
                options_en = []
                options_ar = []

                for letter in letters:
                    opt_m = re.search(rf"^{letter}:\s*(.+)$", qb, re.MULTILINE)
                    if opt_m:
                        val = opt_m.group(1).strip()
                        if " | " in val:
                            parts = val.split(" | ", 1)
                            options_en.append(parts[0].strip())
                            options_ar.append(parts[1].strip())
                            options.append(val)
                        else:
                            options_en.append(val)
                            options_ar.append(val)
                            options.append(val)

                correct_letter = ans_m.group(1).upper() if ans_m else "A"
                correct_index = letters.index(correct_letter) if correct_letter in letters else 0

                if q_en_m or q_ar_m:
                    q_en = q_en_m.group(1).strip() if q_en_m else ""
                    q_ar = q_ar_m.group(1).strip() if q_ar_m else q_en

                    q_obj = {
                        "id": f"q_{global_q_id}",
                        "question": q_ar or q_en,
                        "question_en": q_en,
                        "question_ar": q_ar,
                        "options": options,
                        "options_en": options_en,
                        "options_ar": options_ar,
                        "correct_letter": correct_letter,
                        "correct_index": correct_index,
                        "explanation": (exp_ar_m.group(1).strip() if exp_ar_m else (exp_en_m.group(1).strip() if exp_en_m else "")),
                        "explanation_en": exp_en_m.group(1).strip() if exp_en_m else "",
                        "explanation_ar": exp_ar_m.group(1).strip() if exp_ar_m else "",
                        "topic": chapter_title
                    }
                    current_chapter_questions.append(q_obj)
                    all_questions.append(q_obj)
                    global_q_id += 1

            if current_chapter_questions:
                chapters.append({
                    "id": f"ch_{len(chapters) + 1}",
                    "title": chapter_title,
                    "questions": current_chapter_questions
                })

        first_chapter_title = chapters[0]["title"] if chapters else "Imported Quiz"
        return {
            "title": first_chapter_title,
            "chapter_title": first_chapter_title,
            "chapters": chapters,
            "questions": all_questions,
            "predicted_score_baseline": 85,
            "study_tips": ["تم استيراد الأسئلة وتوزيعها على الشباتر بنجاح."]
        }

    @staticmethod
    def to_csv(quiz_data: Any) -> str:
        if isinstance(quiz_data, list):
            quiz_data = {"questions": quiz_data}
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([
            "ID", "Question (Arabic)", "Question (English)", 
            "Option A", "Option B", "Option C", "Option D", 
            "Correct Answer", "Explanation (Arabic)", "Explanation (English)", "Topic"
        ])

        letters = ["A", "B", "C", "D"]
        for q in quiz_data.get("questions", []) if isinstance(quiz_data, dict) else []:
            opts = q.get("options", [])
            opts_en = q.get("options_en", [])
            opts_ar = q.get("options_ar", [])

            opt_a = opts_ar[0] if len(opts_ar) > 0 else (opts[0] if len(opts) > 0 else "")
            opt_b = opts_ar[1] if len(opts_ar) > 1 else (opts[1] if len(opts) > 1 else "")
            opt_c = opts_ar[2] if len(opts_ar) > 2 else (opts[2] if len(opts) > 2 else "")
            opt_d = opts_ar[3] if len(opts_ar) > 3 else (opts[3] if len(opts) > 3 else "")

            correct_letter = q.get("correct_letter")
            if not correct_letter and "correct_index" in q:
                idx = q["correct_index"]
                correct_letter = letters[idx] if idx < len(letters) else "A"

            writer.writerow([
                q.get("id", 1),
                q.get("question_ar") or q.get("question", ""),
                q.get("question_en", ""),
                opt_a,
                opt_b,
                opt_c,
                opt_d,
                correct_letter,
                q.get("explanation_ar") or q.get("explanation", ""),
                q.get("explanation_en", ""),
                q.get("topic", "")
            ])

        return output.getvalue()

    @staticmethod
    def to_excel_bytes(quiz_data: Any) -> bytes:
        """Generate formatted Excel .xlsx workbook."""
        if isinstance(quiz_data, list):
            quiz_data = {"questions": quiz_data}
        rows = []
        letters = ["A", "B", "C", "D"]

        for q in quiz_data.get("questions", []) if isinstance(quiz_data, dict) else []:
            opts = q.get("options", [])
            opts_en = q.get("options_en", [])
            opts_ar = q.get("options_ar", [])

            correct_letter = q.get("correct_letter")
            if not correct_letter and "correct_index" in q:
                idx = q["correct_index"]
                correct_letter = letters[idx] if idx < len(letters) else "A"

            rows.append({
                "رقم السؤال": q.get("id", 1),
                "السؤال (عربي)": q.get("question_ar") or q.get("question", ""),
                "Question (English)": q.get("question_en", ""),
                "الخيار A": opts_ar[0] if len(opts_ar) > 0 else (opts[0] if len(opts) > 0 else ""),
                "الخيار B": opts_ar[1] if len(opts_ar) > 1 else (opts[1] if len(opts) > 1 else ""),
                "الخيار C": opts_ar[2] if len(opts_ar) > 2 else (opts[2] if len(opts) > 2 else ""),
                "الخيار D": opts_ar[3] if len(opts_ar) > 3 else (opts[3] if len(opts) > 3 else ""),
                "الإجابة الصحيحة": correct_letter,
                "الشرح والتعليل (عربي)": q.get("explanation_ar") or q.get("explanation", ""),
                "Explanation (English)": q.get("explanation_en", ""),
                "الموضوع / الفصل": q.get("topic", "")
            })

        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Exam Questions")
        
        return output.getvalue()
