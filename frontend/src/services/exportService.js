/**
 * Academic Export Service (PDF, HTML, Markdown, Plain Text)
 * Designed for clean, white-background academic output with clickable Table of Contents.
 */

import { marked } from 'marked';

// Configure marked renderer for clean GFM output
marked.setOptions({
  gfm: true,
  breaks: true
});

export function renderMarkdownToHtml(markdownText) {
  if (!markdownText) return '';
  try {
    return marked.parse(markdownText);
  } catch (e) {
    return markdownText.replace(/\n/g, '<br/>');
  }
}

// Helper to trigger instant client-side download
export function downloadBlob(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate Academic Standalone HTML Document
export function buildAcademicHtml({
  title,
  subtitle,
  docName,
  sections = [],
  includeToc = true
}) {
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tocHtml = includeToc && sections.length > 1
    ? `
    <nav class="toc-container">
      <div class="toc-title">📑 فهرس المحتويات</div>
      <ul class="toc-list">
        ${sections.map((sec, idx) => `
          <li><a href="#sec-${idx}"><span>${sec.title}</span><span class="toc-dots"></span><span class="toc-num">${idx + 1}</span></a></li>
        `).join('')}
      </ul>
    </nav>
    `
    : '';

  const sectionsHtml = sections.map((sec, idx) => `
    <section id="sec-${idx}" class="academic-section">
      <h2 class="section-title">
        <span class="section-badge">${idx + 1}</span>
        ${sec.title}
      </h2>
      <div class="section-content">
        ${sec.contentHtml}
      </div>
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${docName || 'المنصة التعليمية'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-light: #3b82f6;
      --accent: #0284c7;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #cbd5e1;
      --bg-card: #f8fafc;
      --bg-table-header: #1e3a8a;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: var(--text-main);
      line-height: 1.85;
      font-size: 15px;
      padding: 40px 20px;
    }
    
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
    }
    
    /* Academic Header */
    .academic-header {
      border-bottom: 2.5px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    
    .header-main h1 {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      font-size: 25px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 6px;
      line-height: 1.3;
    }
    
    .header-main p {
      font-size: 13.5px;
      color: var(--text-muted);
      font-weight: 600;
    }
    
    .header-meta {
      text-align: left;
      font-size: 11.5px;
      color: var(--text-muted);
      border-right: 3px solid var(--accent);
      padding-right: 12px;
      min-width: 180px;
      line-height: 1.6;
    }
    
    .header-meta b {
      color: var(--text-main);
    }
    
    /* Table of Contents */
    .toc-container {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 32px;
      page-break-after: avoid;
    }
    
    .toc-title {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px dashed var(--border-color);
    }
    
    .toc-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .toc-list li a {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--text-main);
      font-weight: 600;
      font-size: 13.5px;
    }
    
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #94a3b8;
      margin: 0 10px;
      height: 12px;
    }
    
    .toc-num {
      font-family: 'JetBrains Mono', monospace;
      color: var(--accent);
      font-weight: 700;
    }
    
    /* Section Styles */
    .academic-section {
      margin-bottom: 36px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-badge {
      background: var(--primary);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .section-content {
      color: var(--text-main);
      font-size: 14.5px;
      line-height: 1.9;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    /* Markdown Headings within Chat / Summary */
    h1, h2, h3, h4 {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      color: var(--primary);
      margin-top: 18px;
      margin-bottom: 8px;
      font-weight: 700;
    }

    h1 { font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h2 { font-size: 17px; color: var(--accent); }
    h3 { font-size: 15px; color: #1e293b; }
    h4 { font-size: 14px; color: #334155; }
    
    /* Modern Academic Tables (Full GFM Table Support) */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 18px 0;
      font-size: 13.5px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    
    th, td {
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      padding: 11px 14px;
      text-align: right;
      line-height: 1.6;
    }

    th:last-child, td:last-child {
      border-right: none;
    }

    tr:last-child td {
      border-bottom: none;
    }
    
    th {
      background: #1e3a8a !important;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 13.5px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }

    tr:hover {
      background: #f1f5f9;
    }

    /* Blockquotes & Callouts */
    blockquote {
      border-right: 4px solid var(--accent);
      background: #f0f9ff;
      padding: 12px 18px;
      margin: 14px 0;
      border-radius: 6px;
      color: #0f172a;
      font-size: 14px;
      font-weight: 500;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1.5px dashed #cbd5e1;
      margin: 20px 0;
    }

    /* Lists */
    ul, ol {
      padding-right: 24px;
      margin: 12px 0;
    }

    li {
      margin-bottom: 6px;
    }

    /* Inline Code & Code Blocks */
    code {
      font-family: 'JetBrains Mono', monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12.5px;
      border: 1px solid #e2e8f0;
    }
    
    /* Callout & Cards */
    .academic-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 4px solid var(--accent);
      border-radius: 8px;
      padding: 16px;
      margin: 14px 0;
    }
    
    .academic-card-title {
      font-weight: 700;
      font-size: 15px;
      color: var(--primary);
      margin-bottom: 6px;
    }
    
    .trap-box {
      border-right-color: #ef4444;
      background: #fef2f2;
    }
    
    .correct-box {
      border-right-color: #10b981;
      background: #f0fdf4;
    }
    
    .code-block, pre code {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 8px;
      font-size: 12.5px;
      overflow-x: auto;
      direction: ltr;
      text-align: left;
      margin: 12px 0;
      border: none;
    }
    
    /* Print optimizations for PDF Generation */
    @media print {
      body {
        padding: 0;
        font-size: 12pt;
      }
      .page-container {
        max-width: 100%;
      }
      .academic-section {
        page-break-inside: avoid;
      }
      .toc-container {
        page-break-after: always;
      }
      a {
        text-decoration: none;
        color: var(--text-main);
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <header class="academic-header">
      <div class="header-main">
        <h1>${title}</h1>
        <p>${subtitle || 'ملخص وتقرير أكاديمي شامل'}</p>
      </div>
      <div class="header-meta">
        <div>المستند: <b>${docName || 'مادة دراسية'}</b></div>
        <div>التاريخ: <b>${currentDate}</b></div>
        <div>المنصة: <b>المساعد الأكاديمي الذكي</b></div>
      </div>
    </header>

    ${tocHtml}

    <main>
      ${sectionsHtml}
    </main>

    <footer style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      تم استخراج هذا التقرير الأكاديمي عبر منصة المساعد الأكاديمي الذكي (AI Educational Platform) • جميع الحقوق محفوظة
    </footer>
  </div>
</body>
</html>`;
}

// Print to PDF trigger
export function printAcademicDocument(htmlContent, documentTitle = 'Academic_Document') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة ملف الـ PDF');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
}

// -------------------------------------------------------------
// Section Specific Formatters (Summary, Quiz, Proofread, Chat)
// -------------------------------------------------------------

export function exportSummaryDocument({ summaryData, docName, scope = 'all', format = 'pdf' }) {
  if (!summaryData) return;

  const title = summaryData.title || 'الملخص الأكاديمي الشامل';
  const subtitle = `ملخص المحاضرة والمفاهيم الجوهرية • ${docName || ''}`;

  const allSections = [];

  if (scope === 'all' || scope === 'overview') {
    allSections.push({
      title: '🎯 النظرة العامة الجوهرية',
      contentHtml: `<p style="font-size: 15px; font-weight: 500; line-height: 1.9;">${summaryData.overview || 'لا توجد نظرة عامة.'}</p>`
    });
  }

  if ((scope === 'all' || scope === 'pillars') && summaryData.pillars?.length > 0) {
    const pillarsHtml = summaryData.pillars.map((p, idx) => `
      <div class="academic-card">
        <div class="academic-card-title">${p.pillar_title || `المحور ${idx + 1}`}</div>
        <p>${p.description || ''}</p>
        ${p.sub_points?.length ? `
          <ul style="padding-right: 20px; margin-top: 8px;">
            ${p.sub_points.map(sp => `<li>${sp}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');

    allSections.push({
      title: '📚 المحاور والمفاهيم الأساسية',
      contentHtml: pillarsHtml
    });
  }

  if ((scope === 'all' || scope === 'comparisons') && summaryData.comparisons?.length > 0) {
    const rawComps = summaryData.comparisons;
    let compTables = [];
    const splitLegacyDiff = (diff) => {
      if (!diff || typeof diff !== 'string') return { a: diff || '—', b: diff || '—' };
      const text = diff.trim();
      if (text.includes(' | ')) {
        const parts = text.split(' | ');
        return { a: parts[0].trim(), b: parts.slice(1).join(' | ').trim() };
      }
      const whileMatch = text.match(/^(.+?)(?:،\s*|\s+)بينما\s+(.+)$/i) || 
                         text.match(/^(.+?)(?:،\s*|\s+)في حين\s+(?:أن\s+)?(.+)$/i) ||
                         text.match(/^(.+?)(?:،\s*|\s+)أما\s+(.+)$/i);
      if (whileMatch) return { a: whileMatch[1].trim(), b: whileMatch[2].trim() };
      const firstSecondMatch = text.match(/^(?:الأولى?|الطرف الأول)\s*[:\s](.+?)(?:،\s*|\s+)(?:الثانية?|الطرف الثاني)\s*[:\s](.+)$/i);
      if (firstSecondMatch) return { a: firstSecondMatch[1].trim(), b: firstSecondMatch[2].trim() };
      if (text.includes('،') || text.includes(';') || text.includes('؛')) {
        const delimiter = text.includes('،') ? '،' : (text.includes('؛') ? '؛' : ';');
        const parts = text.split(delimiter);
        if (parts.length === 2 && parts[0].trim().length > 3 && parts[1].trim().length > 3) {
          return { a: parts[0].trim(), b: parts[1].trim() };
        }
      }
      return { a: text, b: text };
    };

    compTables = rawComps.map((table, tIdx) => {
      if (Array.isArray(table.items) && table.items.length > 0) {
        const items = table.items;
        const rows = (table.rows || []).map(r => ({
          aspect: r.aspect || r.title || 'وجه المقارنة',
          values: Array.isArray(r.values) ? r.values : items.map((_, i) => r[`item_${String.fromCharCode(97 + i)}_val`] || r[`item_${String.fromCharCode(97 + i)}`] || '—')
        }));
        return { title: table.title || `مقارنة ${tIdx + 1}`, items, rows };
      }
      if (table.item_a || table.item_b || Array.isArray(table.rows)) {
        const items = [];
        if (table.item_a) items.push(table.item_a);
        if (table.item_b) items.push(table.item_b);
        if (table.item_c) items.push(table.item_c);
        if (table.item_d) items.push(table.item_d);
        if (items.length === 0) items.push('الطرف الأول', 'الطرف الثاني');
        const rows = (table.rows || []).map(r => {
          let values = [];
          if (Array.isArray(r.values)) {
            values = r.values;
          } else {
            values = [r.item_a_val || r.item_a || '—', r.item_b_val || r.item_b || '—'];
            if (table.item_c || r.item_c_val) values.push(r.item_c_val || r.item_c || '—');
            if (table.item_d || r.item_d_val) values.push(r.item_d_val || r.item_d || '—');
          }
          return { aspect: r.aspect || 'وجه المقارنة', values };
        });
        return { title: table.title || `مقارنة: ${items.join(' vs ')}`, items, rows };
      }
      return {
        title: table.title || `مقارنة ${tIdx + 1}`,
        items: [table.item_a || 'الطرف الأول', table.item_b || 'الطرف الثاني'],
        rows: [{ aspect: table.aspect || 'المقارنة', values: [table.item_a_val || '—', table.item_b_val || '—'] }]
      };
    });

    const comparisonsHtml = compTables.map(tbl => {
      const items = tbl.items || ['الطرف الأول', 'الطرف الثاني'];
      return `
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px;">${tbl.title || 'جدول مقارنة أكاديمي'}</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="background-color: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">وجه المقارنة</th>
              ${items.map(it => `<th style="background-color: #f8fafc; padding: 8px; border: 1px solid #cbd5e1; text-align: right;">${it}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${(tbl.rows || []).map(r => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">${r.aspect}</td>
                ${(r.values || []).map(val => `<td style="padding: 8px; border: 1px solid #cbd5e1;">${val || '—'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;}).join('');

    allSections.push({
      title: '⚖️ جداول المقارنة الأكاديمية',
      contentHtml: comparisonsHtml
    });
  }

  if ((scope === 'all' || scope === 'traps') && summaryData.exam_traps?.length > 0) {
    const trapsHtml = summaryData.exam_traps.map(t => `
      <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
        <div class="academic-card trap-box" style="flex: 1; min-width: 280px; margin: 0;">
          <b style="color: #dc2626; font-size: 13px;">❌ الفخ الامتحاني الشائع:</b>
          <p style="margin-top: 4px; font-weight: 600;">${t.trap}</p>
        </div>
        <div class="academic-card correct-box" style="flex: 1; min-width: 280px; margin: 0;">
          <b style="color: #16a34a; font-size: 13px;">✓ المفهوم العلمي الصحيح:</b>
          <p style="margin-top: 4px; font-weight: 600;">${t.correct_concept}</p>
        </div>
      </div>
    `).join('');

    allSections.push({
      title: '⚠️ مصائد الامتحانات والأخطاء الشائعة',
      contentHtml: trapsHtml
    });
  }

  if ((scope === 'all' || scope === 'rules') && summaryData.formulas_rules?.length > 0) {
    const rulesHtml = summaryData.formulas_rules.map(r => `
      <div class="academic-card">
        <div class="academic-card-title">${r.name}</div>
        <div class="code-block">${r.rule}</div>
        ${r.explanation ? `<p style="font-size: 13px; color: #475569;">${r.explanation}</p>` : ''}
      </div>
    `).join('');

    allSections.push({
      title: '🧮 القوانين والمعادلات والقواعد',
      contentHtml: rulesHtml
    });
  }

  if ((scope === 'all' || scope === 'definitions') && summaryData.definitions?.length > 0) {
    const defsHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">المصطلح (Term)</th>
            <th style="width: 70%;">التعريف الأكاديمي والسياق</th>
          </tr>
        </thead>
        <tbody>
          ${summaryData.definitions.map(d => `
            <tr>
              <td><b style="color: #1e3a8a;">${d.term}</b></td>
              <td>
                <div>${d.meaning}</div>
                ${d.example ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">💡 مثال: ${d.example}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    allSections.push({
      title: '📖 قاموس المصطلحات والمفاهيم',
      contentHtml: defsHtml
    });
  }

  if ((scope === 'all' || scope === 'mindmap') && summaryData.mindmap?.label) {
    const renderNode = (node, depth = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      
      if (depth === 0) {
        return `
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #DDD6FE; color: #2E1065; border: 2px solid #8B5CF6; padding: 12px 28px; border-radius: 12px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);">
              🌳 ${node.label}
            </div>
          </div>
          ${hasChildren ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
              ${node.children.map((child) => renderNode(child, 1)).join('')}
            </div>
          ` : ''}
        `;
      }

      if (depth === 1) {
        return `
          <div style="background: #ffffff; border: 1.5px solid #BAE6FD; border-top: 5px solid #0284C7; border-radius: 14px; padding: 16px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: #BAE6FD; color: #082F49; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 14px; margin-bottom: 12px;">
              <span>📌</span>
              <span>${node.label}</span>
            </div>
            ${hasChildren ? `
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                ${node.children.map(c => `
                  <div style="background: #E0E7FF; color: #1E1B4B; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 12.5px; border-right: 3px solid #6366F1;">
                    <span>• ${c.label}</span>
                    ${c.children?.length ? `
                      <div style="display: flex; flex-wrap: gap; gap: 4px; margin-top: 6px; padding-right: 12px;">
                        ${c.children.map(gc => `<span style="background: #FEF3C7; color: #78350F; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">${gc.label}</span>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }

      return `<li>${node.label}</li>`;
    };

    const mindmapHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 16px 0;">
        ${renderNode(summaryData.mindmap, 0)}
      </div>
    `;

    allSections.push({
      title: '🌳 الخريطة الذهنية والشجرية للمفاهيم (NotebookLM Tree)',
      contentHtml: mindmapHtml
    });
  }

  const htmlDoc = buildAcademicHtml({
    title,
    subtitle,
    docName,
    sections: allSections,
    includeToc: scope === 'all'
  });

  const filePrefix = `Summary_${docName ? docName.replace(/\.[^/.]+$/, '') : 'Lecture'}`;

  if (format === 'pdf') {
    printAcademicDocument(htmlDoc, `${filePrefix}_PDF`);
  } else if (format === 'html') {
    downloadBlob(htmlDoc, `${filePrefix}.html`, 'text/html;charset=utf-8');
  } else if (format === 'md') {
    let mdContent = `# ${title}\n\n**المستند:** ${docName || ''}\n**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}\n\n---\n\n`;
    allSections.forEach(s => {
      mdContent += `## ${s.title}\n\n`;
      // Plain conversion for markdown
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      mdContent += `${cleanText}\n\n`;
    });
    downloadBlob(mdContent, `${filePrefix}.md`, 'text/markdown;charset=utf-8');
  } else if (format === 'txt') {
    let txtContent = `${title}\n${'='.repeat(title.length)}\nالمستند: ${docName || ''}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\n\n`;
    allSections.forEach(s => {
      txtContent += `[ ${s.title} ]\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      txtContent += `${cleanText}\n\n${'-'.repeat(40)}\n\n`;
    });
    downloadBlob(txtContent, `${filePrefix}.txt`, 'text/plain;charset=utf-8');
  }
}

// -------------------------------------------------------------
// Quiz Export Formatter
// -------------------------------------------------------------
export function mapQuizDataToInteractiveJSON(quizData, docName) {
  const chapters = [];
  if (quizData.chapters && quizData.chapters.length > 0) {
    quizData.chapters.forEach((ch, chIdx) => {
      chapters.push({
        id: ch.id || `ch${chIdx + 1}`,
        title: ch.title || `Chapter ${chIdx + 1}`,
        questions: (ch.questions || []).map((q, qIdx) => mapQuestion(q, qIdx))
      });
    });
  } else {
    chapters.push({
      id: "ch1",
      title: quizData.chapter_title || docName || "General Chapter",
      questions: (quizData.questions || []).map((q, qIdx) => mapQuestion(q, qIdx))
    });
  }

  function mapQuestion(q, idx) {
    const letters = ['A', 'B', 'C', 'D'];
    const optionsObj = {};

    let qEn = q.question_en || (typeof q.question === 'object' ? q.question?.en : q.question) || '';
    let qAr = q.question_ar || (typeof q.question === 'object' ? q.question?.ar : q.question) || '';

    letters.forEach((l, lIdx) => {
      let enOpt = '';
      let arOpt = '';

      if (q.options && typeof q.options === 'object' && !Array.isArray(q.options) && q.options[l]) {
        if (typeof q.options[l] === 'object') {
          enOpt = q.options[l].en || '';
          arOpt = q.options[l].ar || '';
        } else {
          enOpt = String(q.options[l]);
          arOpt = String(q.options[l]);
        }
      } else if (Array.isArray(q.options)) {
        let rawOption = q.options[lIdx] || '';
        enOpt = q.options_en?.[lIdx] || '';
        arOpt = q.options_ar?.[lIdx] || '';
        if (!enOpt && !arOpt && typeof rawOption === 'string' && rawOption.includes(' | ')) {
          const parts = rawOption.split(' | ');
          enOpt = parts[0];
          arOpt = parts[1];
        } else if (!enOpt && !arOpt) {
          enOpt = typeof rawOption === 'object' ? (rawOption.en || rawOption.text || '') : String(rawOption);
          arOpt = typeof rawOption === 'object' ? (rawOption.ar || rawOption.text || '') : String(rawOption);
        }
      }

      optionsObj[l] = {
        en: enOpt,
        ar: arOpt
      };
    });

    let expEn = q.explanation_en || (typeof q.explanation === 'object' ? q.explanation?.en : q.explanation) || '';
    let expAr = q.explanation_ar || (typeof q.explanation === 'object' ? q.explanation?.ar : q.explanation) || '';

    return {
      id: q.id || `q${idx + 1}`,
      type: "mcq",
      question: {
        en: qEn,
        ar: qAr
      },
      options: optionsObj,
      correct: q.correct_letter || (q.correct_index !== undefined ? letters[q.correct_index] : q.correct) || 'A',
      explanation: {
        en: expEn,
        ar: expAr
      }
    };
  }

  return {
    university: "منصة المساعد الأكاديمي الذكي (EduAI)",
    course: docName || "المقرر الدراسي",
    mode: "practice",
    duration_min: 30,
    chapters: chapters,
    test_title: quizData.chapter_title || docName || "اختبار تفاعلي أكاديمي"
  };
}

export function buildInteractiveQuizHtml(quizData, docName, settings = null) {
  const mappedQuiz = mapQuizDataToInteractiveJSON(quizData, docName);

  if (settings) {
    mappedQuiz.mode = settings.mode === 'exam' ? 'exam' : 'practice';
    mappedQuiz.show_result = settings.showResult === 'instant' ? 'immediate' : 'end';
    mappedQuiz.shuffle_questions = !!settings.randomizeQuestions;
    mappedQuiz.shuffle_options = !!settings.randomizeOptions;
    mappedQuiz.duration_min = parseInt(settings.duration, 10) || 30;
    mappedQuiz.primaryColor = settings.primaryColor || '#2563EB';
    mappedQuiz.backgroundColor = settings.backgroundColor || '#FFFFFF';
  }

  const exportBg = mappedQuiz.backgroundColor || '#FFFFFF';
  const isLightBgExport = ['#ffffff', '#f8fafc', '#fff', '#f3f4f6', '#e5e7eb'].includes(exportBg.toLowerCase()) || 
                          (exportBg.startsWith('#') && parseInt(exportBg.slice(1), 16) > 0xcccccc);

  const quizJsonStr = JSON.stringify(mappedQuiz, null, 2);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>بنك أسئلة تفاعلي - ${mappedQuiz.test_title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
<style>
  :root {
    --primary: ${mappedQuiz.primaryColor || '#1e3a8a'};
    --bg: ${exportBg};
    --card: ${isLightBgExport ? '#ffffff' : '#0f172a'};
    --card-inner: ${isLightBgExport ? '#f8fafc' : '#1e293b'};
    --border: ${isLightBgExport ? '#e2e8f0' : '#334155'};
    --text: ${isLightBgExport ? '#0f172a' : '#f8fafc'};
    --text-muted: ${isLightBgExport ? '#64748b' : '#94a3b8'};
    --ok: #10b981;
    --bad: #ef4444;
    --current: ${mappedQuiz.primaryColor || '#3b82f6'};
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Tajawal', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    line-height: 1.5;
  }
  .topbar {
    background: var(--primary);
    color: #ffffff;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 40px; width: auto; display: none; }
  .brand .titles { display: flex; flex-direction: column; gap: 2px; }
  .brand h1 { margin: 0; font-size: 18px; font-weight: 900; }
  .brand .uni { font-size: 12px; opacity: 0.9; font-weight: 700; }
  .meta { font-size: 12px; opacity: 0.95; text-align: left; }
  .wrap { display: flex; min-height: calc(100vh - 68px); }
  .left {
    width: 320px;
    background: var(--card);
    border-left: 1px solid var(--border);
    padding: 16px;
    overflow-y: auto;
    color: var(--text);
  }
  .panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--card-inner);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-weight: 800;
    font-size: 13px;
    color: var(--text);
  }
  select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card-inner);
    color: var(--text);
    margin-top: 12px;
    font-weight: bold;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    cursor: pointer;
  }
  select option {
    background: var(--card);
    color: var(--text);
  }
  .grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .qbox {
    position: relative;
    height: 42px;
    border: 1px solid var(--border);
    background: var(--card-inner);
    color: var(--text);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    font-weight: 800;
    font-size: 13px;
    transition: all 0.2s ease;
  }
  .qbox:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
  }
  .qbox.current {
    border: 2px solid var(--primary);
    background: rgba(37, 99, 235, 0.15);
    color: ${isLightBgExport ? 'var(--primary)' : '#60a5fa'};
    font-weight: 900;
  }
  .qbox.answered {
    background: rgba(16, 185, 129, 0.15);
    border-color: var(--ok);
    color: ${isLightBgExport ? '#059669' : '#34d399'};
  }
  .qbox.answered.done {
    background: var(--ok);
    color: #ffffff !important;
    border-color: var(--ok);
  }
  .qbox.marked::after {
    content: "•";
    position: absolute;
    top: -4px;
    right: 4px;
    color: var(--bad);
    font-size: 24px;
    line-height: 1;
  }
  .legend {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
  }
  .legend div { margin-bottom: 6px; font-weight: 800; color: var(--text); }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 4px 10px 4px 0;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    border: 1px solid var(--border);
    background: var(--card-inner);
    display: inline-block;
  }
  .dot.ok { background: var(--ok); border-color: var(--ok); }
  .dot.cur { border-color: var(--primary); background: rgba(37, 99, 235, 0.2); }
  .dot.red { background: var(--bad); border-color: var(--bad); }

  .main {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }
  .crumb {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    max-width: 960px;
  }
  .toprow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .badge {
    background: var(--card-inner);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    color: var(--text);
    font-weight: 800;
  }
  .timer {
    font-weight: 900;
    color: var(--text);
  }
  .qhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .qnum {
    font-weight: 900;
    color: var(--text-muted);
    font-size: 14px;
  }
  .langbtn {
    border: 1px solid var(--border);
    background: var(--card-inner);
    color: var(--text);
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 800;
    font-size: 12px;
    transition: all 0.2s ease;
  }
  .langbtn:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
  .qtext {
    margin: 12px 0;
    font-size: 17px;
    font-weight: 800;
    line-height: 1.6;
    color: var(--text);
  }
  .qtext.en, #q_en {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: isolate;
  }
  .qtext.ar, #q_ar {
    display: none;
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate;
  }
  .desc {
    color: var(--text-muted);
    font-size: 12px;
    margin-top: -4px;
  }
  .opts {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .opt {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    background: var(--card-inner);
    color: var(--text);
    transition: all 0.2s ease;
  }
  .opt:hover {
    border-color: var(--primary);
    background: ${isLightBgExport ? '#f1f5f9' : 'rgba(255,255,255,0.04)'};
  }
  .opt input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
    cursor: pointer;
    flex-shrink: 0;
  }
  .opt .txt {
    line-height: 1.4;
    width: 100%;
    font-size: 14px;
    font-weight: 700;
  }
  .opt .txt .en {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: isolate;
  }
  .opt .txt .ar {
    display: none;
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate;
  }
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  button {
    border: 0;
    border-radius: 10px;
    padding: 10px 18px;
    cursor: pointer;
    font-weight: 800;
    font-size: 13px;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  button:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  .btn {
    background: var(--card-inner);
    border: 1px solid var(--border);
    color: var(--text);
  }
  .btnP {
    background: #10b981;
    color: #ffffff;
  }
  .btnW {
    background: var(--primary);
    color: #ffffff;
  }
  .btnR {
    background: #ef4444;
    color: #ffffff;
  }
  .feedback {
    margin-top: 16px;
    padding: 14px 18px;
    border-radius: 12px;
    display: none;
    font-weight: 700;
    font-size: 13px;
    line-height: 1.6;
  }
  .feedback.ok {
    display: block;
    background: ${isLightBgExport ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)'};
    border: 1px solid var(--ok);
    color: ${isLightBgExport ? '#065f46' : '#34d399'};
  }
  .feedback.bad {
    display: block;
    background: ${isLightBgExport ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'};
    border: 1px solid var(--bad);
    color: ${isLightBgExport ? '#7f1d1d' : '#f87171'};
  }
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 1000;
  }
  .modal .box {
    background: var(--card);
    color: var(--text);
    border-radius: 16px;
    width: min(600px, 95%);
    border: 1px solid var(--border);
    padding: 24px;
    box-shadow: 0 20px 30px rgba(0,0,0,0.3);
  }
  .modal h3 { margin: 0 0 14px; font-size: 18px; font-weight: 900; }
  .sum { color: var(--text); font-weight: 800; margin: 10px 0; font-size: 14px; }
  .sum small { color: var(--text-muted); font-weight: 700; }
  .MathJax { font-size: 1.1em !important; }
</style>
</head>
<body>
  <div class="topbar">
    <div class="brand">
      <img id="logoImg" alt="Logo"/>
      <div class="titles">
        <h1>نظام الاختبارات الإلكترونية</h1>
        <div class="uni" id="uniName"></div>
      </div>
    </div>
    <div class="meta">
      <div><b id="testTitleTop"></b></div>
      <div style="opacity:.9" id="courseTop"></div>
    </div>
  </div>

  <div class="wrap">
    <aside class="left">
      <div class="panel-title">
        <span>تنقل الاختبار</span>
        <span style="color:var(--text-muted);font-weight:900" id="modeBadge"></span>
      </div>

      <select id="chapterSelect"></select>
      <div id="grid" class="grid"></div>

      <div class="legend">
        <div><b>مفتاح الحالات</b></div>
        <span><i class="dot cur"></i> السؤال الحالي</span>
        <span><i class="dot"></i> غير مُجاب</span>
        <span><i class="dot ok"></i> مُجاب</span>
        <span><i class="dot red"></i> مُعلَّم</span>
      </div>
    </aside>

    <main class="main">
      <div class="crumb">الصفحة الرئيسية &gt; المقرر &gt; الاختبار</div>
      <div class="card">

        <div class="toprow">
          <div class="badge" id="progress">السؤال 0 من 0</div>
          <div class="badge timer">⏱️ الوقت المتبقي: <span id="time">--:--</span></div>
          <div class="badge" id="score">النتيجة: 0</div>
        </div>

        <div class="qhead">
          <div class="qnum" id="qnum">—</div>
          <button type="button" class="langbtn" id="toggleLang">عرض الترجمة العربية</button>
        </div>

        <div class="qtext en" id="q_en" dir="ltr">اختر فصلًا للبدء.</div>
        <div class="qtext ar" id="q_ar" dir="rtl"></div>
        <div class="desc" id="descText"></div>

        <div class="opts" id="opts"></div>

        <div class="feedback" id="fb"></div>

        <div class="actions">
          <button type="button" class="btn" id="prev">السابق</button>
          <button type="button" class="btnW" id="mark">تعليم السؤال 🔴</button>
          <button type="button" class="btnP" id="submit">تأكيد الإجابة</button>
          <button type="button" class="btn" id="next">التالي</button>
          <button type="button" class="btnR" id="finish">إنهاء المحاولة</button>
        </div>
      </div>
    </main>
  </div>

  <div class="modal" id="modal">
    <div class="box">
      <h3>ملخص قبل التسليم</h3>
      <div class="sum">✔ تم الإجابة: <span id="s_done"></span> <small>(answered)</small></div>
      <div class="sum">✖ غير مُجاب: <span id="s_undone"></span> <small>(unanswered)</small></div>
      <div class="sum">🔴 مُعلَّم للمراجعة: <span id="s_marked"></span> <small>(marked)</small></div>
      <div class="sum">⏱️ الوقت المتبقي: <span id="s_time"></span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button type="button" class="btnR" id="confirmSubmit">تأكيد التسليم</button>
        <button type="button" class="btn" id="back">العودة للأسئلة</button>
      </div>
      <div style="margin-top:12px;color:var(--text-muted);font-size:12px">
        بعد التسليم سيتم عرض النتيجة النهائية (حسب إعدادات التصدير).
      </div>
    </div>
  </div>

<script>
  const QUIZ = ${quizJsonStr};

  // Settings
  const MODE = (QUIZ.mode || "exam").toLowerCase(); // practice|exam
  const SHOW_RESULT = (QUIZ.show_result || "immediate").toLowerCase(); // immediate|end
  const SHUFFLE_Q = !!QUIZ.shuffle_questions;
  const SHUFFLE_O = !!QUIZ.shuffle_options;

  let showArabic = false;
  let currentChapterIndex = "all";
  let currentQuestionIndex = 0;

  let score = 0;
  let answeredCorrect = new Set();

  let timerSeconds = Math.max(1, (QUIZ.duration_min || 30) * 60);

  function fmtTime(sec){
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return \`\${m}:\${String(s).padStart(2,"0")}\`;
  }

  // DOM elements
  const chapterSelect = document.getElementById("chapterSelect");
  const grid = document.getElementById("grid");
  const qnum = document.getElementById("qnum");
  const q_en = document.getElementById("q_en");
  const q_ar = document.getElementById("q_ar");
  const opts = document.getElementById("opts");
  const fb = document.getElementById("fb");
  const progress = document.getElementById("progress");
  const timeEl = document.getElementById("time");
  const scoreEl = document.getElementById("score");
  const descText = document.getElementById("descText");

  const btnPrev = document.getElementById("prev");
  const btnNext = document.getElementById("next");
  const btnSubmit = document.getElementById("submit");
  const btnMark = document.getElementById("mark");
  const btnFinish = document.getElementById("finish");
  const toggleLang = document.getElementById("toggleLang");

  const modal = document.getElementById("modal");
  const s_done = document.getElementById("s_done");
  const s_undone = document.getElementById("s_undone");
  const s_marked = document.getElementById("s_marked");
  const s_time = document.getElementById("s_time");
  const confirmSubmit = document.getElementById("confirmSubmit");
  const back = document.getElementById("back");

  // Top labels
  document.getElementById("uniName").textContent = (QUIZ.university || "").trim();
  document.getElementById("testTitleTop").textContent = (QUIZ.test_title || "اختبار").trim();
  document.getElementById("courseTop").textContent = (QUIZ.course || "").trim();
  document.getElementById("modeBadge").textContent = (MODE === "practice") ? "وضع التدريب" : "وضع الاختبار";

  // Logo
  const logoImg = document.getElementById("logoImg");
  if (QUIZ.logo_data_uri){
    logoImg.src = QUIZ.logo_data_uri;
    logoImg.style.display = "block";
  }

  function shuffleArray(a){
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  // Initialize + shuffle
  function initQuiz(){
    QUIZ.chapters.forEach(ch=>{
      ch.questions.forEach(q=>{
        if (!q.status) q.status = "unanswered";
        if (q.selected === undefined) q.selected = null;
        if (q.isCorrect === undefined) q.isCorrect = false;

        const letters = ["A","B","C","D"];
        let list = letters.map(L => ({origKey:L, en:q.options[L].en, ar:q.options[L].ar}));
        if (SHUFFLE_O) shuffleArray(list);

        const newOpts = {};
        let newCorrect = "A";
        list.forEach((item, idx)=>{
          const disp = letters[idx];
          newOpts[disp] = {en:item.en, ar:item.ar};
          if (item.origKey === q.correct) newCorrect = disp;
        });
        q._options = newOpts;
        q._correct = newCorrect;
      });

      if (SHUFFLE_Q) shuffleArray(ch.questions);
    });
  }

  function getChapter(){ return currentChapterIndex === "all" ? null : QUIZ.chapters[currentChapterIndex]; }
  function getQuestions(){
    if (currentChapterIndex === "all") {
      return QUIZ.chapters.flatMap(ch => ch.questions || []);
    }
    const ch = getChapter();
    return ch ? (ch.questions || []) : [];
  }
  function getQuestion(){ return getQuestions()[currentQuestionIndex]; }

  function updateTimerUI(){ timeEl.textContent = fmtTime(timerSeconds); }

  function startTimer(){
    updateTimerUI();
    const iv = setInterval(()=>{
      timerSeconds--;
      if (timerSeconds < 0){
        clearInterval(iv);
        openSummary(true);
        return;
      }
      updateTimerUI();
    }, 1000);
  }

  function renderChapters(){
    chapterSelect.innerHTML = "";
    
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = "عرض الكل / All Chapters (" + QUIZ.chapters.flatMap(ch => ch.questions || []).length + " سؤال)";
    chapterSelect.appendChild(allOpt);

    QUIZ.chapters.forEach((ch,i)=>{
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = ch.title;
      chapterSelect.appendChild(opt);
    });
    chapterSelect.value = String(currentChapterIndex);
    chapterSelect.onchange = ()=>{
      const val = chapterSelect.value;
      if (val === "all") {
        currentChapterIndex = "all";
      } else {
        currentChapterIndex = parseInt(val, 10);
      }
      currentQuestionIndex = 0;
      renderGrid();
      renderQuestion();
    };
  }

  function renderGrid(){
    grid.innerHTML = "";
    const questions = getQuestions();
    questions.forEach((q,i)=>{
      const d = document.createElement("div");
      d.className = "qbox";
      if (i===currentQuestionIndex) d.classList.add("current");
      if (q.status==="answered") d.classList.add("answered");
      if (q.status==="answered" && q.selected) d.classList.add("done");
      if (q.status==="marked") d.classList.add("marked");
      d.textContent = String(i+1);
      d.onclick = ()=>{
        currentQuestionIndex = i;
        renderGrid();
        renderQuestion();
      };
      grid.appendChild(d);
    });
  }

  function applyLanguageVisibility(){
    q_en.style.display = showArabic ? "none" : "block";
    q_ar.style.display = showArabic ? "block" : "none";

    document.querySelectorAll(".opt .en").forEach(el=>el.style.display = showArabic ? "none" : "block");
    document.querySelectorAll(".opt .ar").forEach(el=>el.style.display = showArabic ? "block" : "none");

    toggleLang.textContent = showArabic ? "إخفاء الترجمة العربية" : "عرض الترجمة العربية";
  }

  function renderQuestion(){
    fb.style.display = "none";
    fb.className = "feedback";
    fb.textContent = "";

    const questions = getQuestions();
    const q = getQuestion();

    progress.textContent = \`السؤال \${currentQuestionIndex+1} من \${questions.length}\`;
    qnum.textContent = \`سؤال - \${currentQuestionIndex+1}\`;

    q_en.innerHTML = q.question.en;
    q_ar.innerHTML = q.question.ar;

    descText.textContent = (QUIZ.test_desc || "").trim();

    opts.innerHTML = "";
    const letters = ["A","B","C","D"];
    letters.forEach(L=>{
      const row = document.createElement("label");
      row.className = "opt";
      const checked = (q.selected===L) ? "checked" : "";
      row.innerHTML = \`
        <input type="radio" name="opt" value="\${L}" \${checked}/>
        <div class="txt">
          <div class="en" dir="ltr"><b>\${L}.</b> \${q._options[L].en}</div>
          <div class="ar" dir="rtl"><b>\${L}.</b> \${q._options[L].ar}</div>
        </div>
      \`;
      row.onclick = (e)=>{
        e.stopPropagation();
        const input = row.querySelector("input");
        input.checked = true;
        q.selected = L;

        if (q.status!=="marked") q.status = "answered";

        renderGrid();
      };
      opts.appendChild(row);
    });

    btnPrev.disabled = currentQuestionIndex===0;
    btnNext.disabled = currentQuestionIndex===questions.length-1;

    applyLanguageVisibility();
    updateScoreUI();

    if(window.MathJax) MathJax.typeset();
  }

  function updateScoreUI(){
    scoreEl.textContent = \`النتيجة: \${score}\`;
  }

  function showFeedback(ok,msgEn,msgAr){  
    fb.style.display = "block";
    fb.className = "feedback " + (ok ? "ok":"bad");
    fb.innerHTML = showArabic ? msgAr : msgEn;
  }

  toggleLang.addEventListener("click",()=>{ showArabic=!showArabic; applyLanguageVisibility(); });

  btnPrev.addEventListener("click",()=>{ currentQuestionIndex--; renderGrid(); renderQuestion(); });
  btnNext.addEventListener("click",()=>{ currentQuestionIndex++; renderGrid(); renderQuestion(); });

  btnMark.addEventListener("click",()=>{ 
    const q=getQuestion();
    if(q.status==="marked"){ q.status = q.selected ? "answered" : "unanswered"; }
    else{ q.status="marked"; }
    renderGrid(); renderQuestion(); 
  });

  btnSubmit.addEventListener("click",()=>{ 
    const q=getQuestion();
    if(!q.selected){
      showFeedback(false,
        "Please select an answer.",
        "الرجاء اختيار إجابة."
      );
      return;
    }

    const isExam = (MODE==="exam");
    const showNow = (!isExam) && (SHOW_RESULT==="immediate");

    const isCorrect = (q.selected===q._correct);
    q.isCorrect = isCorrect;

    if(isCorrect && !answeredCorrect.has(q.id)){
      answeredCorrect.add(q.id);
      score+=1;
      updateScoreUI();
    }

    if(isExam || SHOW_RESULT==="end"){
      fb.style.display="none";
      fb.className="feedback";
      fb.textContent="";
      return;
    }

    const expEn = (q.explanation && q.explanation.en) ? q.explanation.en : "";
    const expAr = (q.explanation && q.explanation.ar) ? q.explanation.ar : "";

    if(showNow){
      if(isCorrect){
        showFeedback(true,
          \`✔ Correct<br><b>Explanation:</b> \${expEn}\`,
          \`✔ صحيحة<br><b>التوضيح:</b> \${expAr}\`
        );
      } else {
        showFeedback(false,
          \`✖ Incorrect<br><b>Correct:</b> \${q._correct}<br><b>Explanation:</b> \${expEn}\`,
          \`✖ خطأ<br><b>الإجابة الصحيحة:</b> \${q._correct}<br><b>التوضيح:</b> \${expAr}\`
        );
      }
    }
  });

  function computeSummary(){
    const qs=getQuestions();
    let done=0, undone=0, marked=0;
    qs.forEach(q=>{ 
      if(q.status==="marked") marked++;
      if(q.selected) done++;
      if(!q.selected) undone++;
    });
    return {done,undone,marked};
  }

  function openSummary(auto=false){ 
    const s=computeSummary();
    s_done.textContent=String(s.done);
    s_undone.textContent=String(s.undone);
    s_marked.textContent=String(s.marked);
    s_time.textContent=fmtTime(Math.max(0,timerSeconds));
    modal.style.display="flex";
  }

  function closeSummary(){ modal.style.display="none"; }

  btnFinish.addEventListener("click",e=>{ e.preventDefault(); e.stopPropagation(); openSummary(false); });
  back.addEventListener("click",()=>{ closeSummary(); });
  confirmSubmit.addEventListener("click",()=>{ 
    const ch=getChapter();
    const qs=getQuestions();
    const total=qs.length;
    const correctCount=qs.filter(q=>q.selected && q.selected===q._correct).length;

    const showScore = (MODE==="practice") || (MODE==="exam");
    const showExplanations = (MODE==="practice") && (SHOW_RESULT==="end");

    let details="";
    if(showExplanations){ 
      details = \`<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
      <div style="font-weight:900;margin-bottom:6px">مراجعة الإجابات (مع الشرح):</div>
      \${qs.map((q,i)=>{ 
        const ok = (q.selected===q._correct);
        const exp = showArabic ? (q.explanation.ar||"") : (q.explanation.en||"");
        const qText = showArabic ? q.question.ar : q.question.en;
        return \`<div style="margin:10px 0;padding:10px;border:1px solid #e5e7eb;border-radius:10px">
          <div style="font-weight:900">\${i+1}) \${_escape_html(qText)}</div>
          <div style="margin-top:6px;color:\${ok?'#16a34a':'#ef4444'};font-weight:900">
            \${ok?'✔ صحيحة':'✖ خطأ'} — إجابتك: \${q.selected||'-'} — الصحيحة: \${q._correct}
          </div>
          <div style="margin-top:6px;color:#64748b;font-weight:800">\${_escape_html(exp)}</div>
        </div>\`;
      }).join("")}\`;
    }

    document.body.innerHTML = \`
      <div class="topbar">
        <div class="brand">
          \${QUIZ.logo_data_uri ? \`<img alt="Logo" src="\${QUIZ.logo_data_uri}"/>\` : \`\`}
          <div class="titles">
            <h1>نظام الاختبارات الإلكترونية</h1>
            <div class="uni">\${_escape_html(QUIZ.university||"")}</div>
          </div>
        </div>
        <div class="meta"><b>تم التسليم ✅</b></div>
      </div>
      <div style="padding:18px">
        <div class="card" style="max-width:920px;margin:auto">
          <h2 style="margin:0 0 6px">\${_escape_html(QUIZ.test_title||"اختبار")}</h2>
          <div style="color:#64748b;font-weight:900;margin-bottom:6px">\${_escape_html(QUIZ.course||"")}</div>
          <div style="color:#64748b;margin-bottom:12px">\${_escape_html(ch ? ch.title : "عرض الكل / All Chapters")}</div>

          <div class="sum">عدد الأسئلة الكلي: \${total}</div>
          <div class="sum">إجابات الطالب: \${qs.filter(q=>q.selected).length}</div>
          <div class="sum">🔴 أسئلة معلّطة: \${qs.filter(q=>q.status==="marked").length}</div>
          <div class="sum">⏱️ الوقت المتبقي: \${fmtTime(Math.max(0,timerSeconds))}</div>
          \${showScore ? \`<div class="sum">النتيجة: \${correctCount} / \${total}</div>\` : \`\`}

          <div style="margin-top:10px;color:#64748b;font-size:12px;font-weight:800">
            ملف اختبار تفاعلي يعمل بدون إنترنت — مُصدّر بأسلوب يحاكي أنظمة LMS الجامعية.
          </div>
          \${details}
        </div>
      </div>
    \`;
  });

  function _escape_html(s) {
    if (s===null || s===undefined) return "";
    return String(s)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  // init
  initQuiz();
  renderChapters();
  renderGrid();
  renderQuestion();
  startTimer();
</script>
</body>
</html>`;
}
export function exportQuizDocument({ quizData, docName, scope = 'all', format = 'pdf', settings = null }) {
  if (!quizData) return;

  const title = quizData.chapter_title || 'بنك الأسئلة والاختبارات الأكاديمية';
  const subtitle = `أسئلة تفاعلية وبطاقات استذكار • ${docName || ''}`;

  const questions = quizData.questions || [];
  const flashcards = quizData.flashcards || [];

  const allSections = [];

  if ((scope === 'all' || scope === 'mcq') && questions.length > 0) {
    const mcqHtml = questions.map((q, idx) => `
      <div class="academic-card" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <b style="color: #1e3a8a; font-size: 15px;">السؤال ${idx + 1}:</b>
          <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
            ${q.bloom_level || 'مفاهيمي'}
          </span>
        </div>
        
        <p style="font-weight: 700; font-size: 15px; margin-bottom: 10px;">${q.question_ar || q.question || ''}</p>
        ${q.question_en ? `<p style="font-size: 13px; color: #64748b; direction: ltr; text-align: left; margin-bottom: 12px;">${q.question_en}</p>` : ''}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          ${(q.options || []).map((opt, oIdx) => {
            const letter = ['A', 'B', 'C', 'D'][oIdx];
            const isCorrect = letter === q.correct_letter || oIdx === q.correct_index;
            return `
              <div style="padding: 8px 12px; border-radius: 6px; border: 1px solid ${isCorrect ? '#10b981' : '#e2e8f0'}; background: ${isCorrect ? '#ecfdf5' : '#ffffff'}; font-size: 13px;">
                <b>(${letter})</b> ${opt} ${isCorrect ? '<span style="color: #10b981; font-weight: 700;">✓ (الإجابة الصحيحة)</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        ${q.explanation_ar || q.explanation ? `
          <div style="background: #f1f5f9; padding: 10px 12px; border-radius: 6px; font-size: 12.5px; border-right: 3px solid #0284c7;">
            <b>الشرح العلمي:</b> ${q.explanation_ar || q.explanation}
          </div>
        ` : ''}
      </div>
    `).join('');

    allSections.push({
      title: `📝 أسئلة الاختيار من متعدد (${questions.length} سؤال)`,
      contentHtml: mcqHtml
    });
  }

  if ((scope === 'all' || scope === 'flashcards') && flashcards.length > 0) {
    const flashcardsHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">المفهوم / السؤال (Front)</th>
            <th style="width: 65%;">الجواب / الشرح المتقن (Back)</th>
          </tr>
        </thead>
        <tbody>
          ${flashcards.map((f, idx) => `
            <tr>
              <td>
                <b style="color: #1e3a8a;">${f.front_ar || f.front || `بطاقة ${idx + 1}`}</b>
                ${f.front_en ? `<div style="font-size: 11.5px; color: #64748b; direction: ltr; text-align: left;">${f.front_en}</div>` : ''}
              </td>
              <td>
                <div>${f.back_ar || f.back || ''}</div>
                ${f.back_en ? `<div style="font-size: 11.5px; color: #64748b; direction: ltr; text-align: left; margin-top: 4px;">${f.back_en}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    allSections.push({
      title: `💡 بطاقات المذاكرة السريعة Flashcards (${flashcards.length} بطاقة)`,
      contentHtml: flashcardsHtml
    });
  }

  if ((scope === 'all' || scope === 'tips') && quizData.study_tips?.length > 0) {
    const tipsHtml = `
      <ul style="padding-right: 20px; line-height: 2;">
        ${quizData.study_tips.map(tip => `<li><b>${tip}</b></li>`).join('')}
      </ul>
    `;

    allSections.push({
      title: '🎯 نصائح وتوجيهات التفوق في الامتحان',
      contentHtml: tipsHtml
    });
  }

  const htmlDoc = buildAcademicHtml({
    title,
    subtitle,
    docName,
    sections: allSections,
    includeToc: scope === 'all'
  });

  const filePrefix = `Quiz_${docName ? docName.replace(/\.[^/.]+$/, '') : 'Exam'}`;

  if (format === 'pdf') {
    printAcademicDocument(htmlDoc, `${filePrefix}_PDF`);
  } else if (format === 'html') {
    const interactiveHtml = buildInteractiveQuizHtml(quizData, docName, settings);
    downloadBlob(interactiveHtml, `${filePrefix}.html`, 'text/html;charset=utf-8');
  } else if (format === 'md') {
    let mdContent = `# ${title}\n\n**المستند:** ${docName || ''}\n\n---\n\n`;
    allSections.forEach(s => {
      mdContent += `## ${s.title}\n\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      mdContent += `${cleanText}\n\n`;
    });
    downloadBlob(mdContent, `${filePrefix}.md`, 'text/markdown;charset=utf-8');
  } else if (format === 'txt') {
    let txtContent = `${title}\n${'='.repeat(title.length)}\nالمستند: ${docName || ''}\n\n`;
    allSections.forEach(s => {
      txtContent += `[ ${s.title} ]\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      txtContent += `${cleanText}\n\n${'-'.repeat(40)}\n\n`;
    });
    downloadBlob(txtContent, `${filePrefix}.txt`, 'text/plain;charset=utf-8');
  }
}

// -------------------------------------------------------------
// Proofreading Export Formatter
// -------------------------------------------------------------
export function exportProofreadDocument({ proofreadData, inputText, docName, format = 'pdf' }) {
  if (!proofreadData) return;

  const title = 'تقرير التدقيق اللغوي والأصالة الأكاديمية';
  const subtitle = `فحص الأخطاء النحوية والإملائية ومؤشرات النزاهة العلمية • ${docName || ''}`;

  const allSections = [
    {
      title: '📊 مؤشرات التقييم والأصالة الأكاديمية',
      contentHtml: `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div class="academic-card" style="text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700;">درجة الجودة اللغوية</div>
            <div style="font-size: 24px; font-weight: 800; color: #0284c7; margin-top: 4px;">${proofreadData.quality_score || 95}%</div>
          </div>
          <div class="academic-card" style="text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700;">مستوى الأسلوب الأكاديمي</div>
            <div style="font-size: 16px; font-weight: 800; color: #10b981; margin-top: 8px;">${proofreadData.academic_tone || 'فصيح ورصين'}</div>
          </div>
          <div class="academic-card" style="text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700;">عدد التنبيهات المكتشفة</div>
            <div style="font-size: 24px; font-weight: 800; color: #f59e0b; margin-top: 4px;">${proofreadData.issues?.length || 0}</div>
          </div>
        </div>
      `
    }
  ];

  if (proofreadData.issues && proofreadData.issues.length > 0) {
    const issuesHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">نوع الخطأ</th>
            <th style="width: 30%;">النص الأصلي</th>
            <th style="width: 30%;">التصحيح المقترح</th>
            <th style="width: 20%;">السبب الأكاديمي</th>
          </tr>
        </thead>
        <tbody>
          ${proofreadData.issues.map(iss => `
            <tr>
              <td><span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${iss.type || 'لغوي'}</span></td>
              <td><s style="color: #ef4444;">${iss.original}</s></td>
              <td><b style="color: #10b981;">${iss.correction}</b></td>
              <td style="font-size: 12px; color: #64748b;">${iss.reason || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    allSections.push({
      title: '🔍 قائمة الأخطاء والتصويبات التفصيلية',
      contentHtml: issuesHtml
    });
  }

  if (proofreadData.paraphrased_version) {
    allSections.push({
      title: '✨ النص بعد إعادة الصياغة والتحسين الأكاديمي',
      contentHtml: `
        <div class="academic-card" style="border-right-color: #0284c7; background: #f0f9ff;">
          <p style="font-size: 15px; line-height: 1.9; font-weight: 600;">${proofreadData.paraphrased_version}</p>
        </div>
      `
    });
  }

  if (inputText) {
    allSections.push({
      title: '📄 النص الأصلي قبل المعالجة',
      contentHtml: `
        <div class="academic-card" style="background: #f8fafc;">
          <p style="font-size: 13.5px; line-height: 1.8; color: #475569;">${inputText}</p>
        </div>
      `
    });
  }

  const htmlDoc = buildAcademicHtml({
    title,
    subtitle,
    docName,
    sections: allSections,
    includeToc: true
  });

  const filePrefix = `Proofread_Report`;

  if (format === 'pdf') {
    printAcademicDocument(htmlDoc, `${filePrefix}_PDF`);
  } else if (format === 'html') {
    downloadBlob(htmlDoc, `${filePrefix}.html`, 'text/html;charset=utf-8');
  } else if (format === 'md') {
    let mdContent = `# ${title}\n\n**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}\n\n---\n\n`;
    allSections.forEach(s => {
      mdContent += `## ${s.title}\n\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      mdContent += `${cleanText}\n\n`;
    });
    downloadBlob(mdContent, `${filePrefix}.md`, 'text/markdown;charset=utf-8');
  } else if (format === 'txt') {
    let txtContent = `${title}\n${'='.repeat(title.length)}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\n\n`;
    allSections.forEach(s => {
      txtContent += `[ ${s.title} ]\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      txtContent += `${cleanText}\n\n${'-'.repeat(40)}\n\n`;
    });
    downloadBlob(txtContent, `${filePrefix}.txt`, 'text/plain;charset=utf-8');
  }
}

// -------------------------------------------------------------
// Chat Conversation Export Formatter
// -------------------------------------------------------------
export function exportChatDocument({ messages, docName, format = 'pdf' }) {
  if (!messages || messages.length === 0) return;

  const title = 'سجل الحوار الأكاديمي والمناقشة الذكية';
  const subtitle = `جلسة مناقشة المادة التعليمية • ${docName || ''}`;

  const allSections = [
    {
      title: '💬 تفاصيل الحوار الأكاديمي',
      contentHtml: messages.map((m, idx) => `
        <div class="academic-card" style="border-right-color: ${m.role === 'user' ? '#3b82f6' : '#10b981'}; margin-bottom: 22px; background: ${m.role === 'user' ? '#f0f9ff' : '#ffffff'};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #e2e8f0;">
            <b style="color: ${m.role === 'user' ? '#1e40af' : '#065f46'}; font-size: 13.5px;">
              ${m.role === 'user' ? '👤 سؤال الطالب / الباحث' : '🤖 إجابة المساعد الأكاديمي الذكي (EduAI)'}
            </b>
            <span style="font-size: 11px; color: #94a3b8;">${m.time || ''}</span>
          </div>
          <div class="section-content" style="font-size: 14.5px; line-height: 1.85;">
            ${renderMarkdownToHtml(m.text || '')}
          </div>
        </div>
      `).join('')
    }
  ];

  const htmlDoc = buildAcademicHtml({
    title,
    subtitle,
    docName,
    sections: allSections,
    includeToc: false
  });

  const filePrefix = `Chat_Discussion`;

  if (format === 'pdf') {
    printAcademicDocument(htmlDoc, `${filePrefix}_PDF`);
  } else if (format === 'html') {
    downloadBlob(htmlDoc, `${filePrefix}.html`, 'text/html;charset=utf-8');
  } else if (format === 'md') {
    let mdContent = `# ${title}\n\n**المستند:** ${docName || ''}\n**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}\n\n---\n\n`;
    messages.forEach(m => {
      mdContent += `### ${m.role === 'user' ? '👤 الطالب' : '🤖 المساعد'}\n${m.text}\n\n`;
    });
    downloadBlob(mdContent, `${filePrefix}.md`, 'text/markdown;charset=utf-8');
  } else if (format === 'txt') {
    let txtContent = `${title}\n${'='.repeat(title.length)}\nالمستند: ${docName || ''}\n\n`;
    messages.forEach(m => {
      txtContent += `[${m.role === 'user' ? 'الطالب' : 'المساعد'}]:\n${m.text}\n\n${'-'.repeat(30)}\n\n`;
    });
    downloadBlob(txtContent, `${filePrefix}.txt`, 'text/plain;charset=utf-8');
  }
}

// -------------------------------------------------------------
// Translation Document Export Formatter
// -------------------------------------------------------------
export function exportTranslateDocument({ translateData, docName, scope = 'all', format = 'pdf' }) {
  if (!translateData) return;

  const title = translateData.translated_title || 'المستند الأكاديمي المترجم';
  const subtitle = `ترجمة أكاديمية معتمدة (${translateData.source_lang || 'en'} ➔ ${translateData.target_lang || 'ar'}) • ${docName || ''}`;

  const allSections = [];

  if (scope === 'all' || scope === 'overview') {
    allSections.push({
      title: '📋 نبذة عامة حول الترجمة',
      contentHtml: `<div style="font-size: 14.5px; line-height: 1.9;">${renderMarkdownToHtml(translateData.summary_overview || 'تمت الترجمة الأكاديمية بنجاح.')}</div>`
    });
  }

  if ((scope === 'all' || scope === 'line_by_line') && translateData.units?.length > 0) {
    const unitsHtml = translateData.units.map((u, idx) => `
      <div class="academic-card" style="margin-bottom: 16px; border-right-color: #0284c7;">
        <div style="font-size: 11.5px; font-weight: 700; color: #64748b; margin-bottom: 6px; direction: ltr; text-align: left;">
          <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${(translateData.source_lang || 'en').toUpperCase()} ${idx + 1}</span>
          ${u.original}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #1e3a8a; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
          <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${(translateData.target_lang || 'ar').toUpperCase()}</span>
          ${u.translated}
        </div>
      </div>
    `).join('');

    allSections.push({
      title: `🔤 الترجمة السطرية الموازية (${translateData.units.length} فقرة)`,
      contentHtml: unitsHtml
    });
  }

  if ((scope === 'all' || scope === 'page_by_page') && translateData.parallel_pages?.length > 0) {
    const pagesHtml = translateData.parallel_pages.map((p, idx) => `
      <div class="academic-card" style="margin-bottom: 20px;">
        <div class="academic-card-title">الصفحة رقم ${p.page_num || idx + 1}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 10px;">
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12.5px; direction: ltr; text-align: left;">
            <b style="color: #475569; font-size: 11px; display: block; margin-bottom: 6px;">ORIGINAL TEXT:</b>
            <div style="white-space: pre-wrap;">${p.original_text}</div>
          </div>
          <div style="background: #eff6ff; padding: 12px; border-radius: 6px; font-size: 13px;">
            <b style="color: #1e40af; font-size: 11px; display: block; margin-bottom: 6px;">النص المترجم:</b>
            <div style="white-space: pre-wrap; font-weight: 600;">${p.translated_text}</div>
          </div>
        </div>
      </div>
    `).join('');

    allSections.push({
      title: `📄📄 الترجمة صفحة بصفحة (${translateData.parallel_pages.length} صفحة)`,
      contentHtml: pagesHtml
    });
  }

  if ((scope === 'all' || scope === 'target_only') && translateData.full_translated_text) {
    allSections.push({
      title: '🇸🇦 النص المترجم بالكامل للغة الهدف',
      contentHtml: `<div style="font-size: 14.5px; line-height: 2;">${renderMarkdownToHtml(translateData.full_translated_text)}</div>`
    });
  }

  const htmlDoc = buildAcademicHtml({
    title,
    subtitle,
    docName,
    sections: allSections,
    includeToc: scope === 'all'
  });

  const filePrefix = `Translation_${docName ? docName.replace(/\.[^/.]+$/, '') : 'Doc'}`;

  if (format === 'pdf') {
    printAcademicDocument(htmlDoc, `${filePrefix}_PDF`);
  } else if (format === 'html') {
    downloadBlob(htmlDoc, `${filePrefix}.html`, 'text/html;charset=utf-8');
  } else if (format === 'md') {
    let mdContent = `# ${title}\n\n**المستند:** ${docName || ''}\n**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}\n\n---\n\n`;
    allSections.forEach(s => {
      mdContent += `## ${s.title}\n\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      mdContent += `${cleanText}\n\n`;
    });
    downloadBlob(mdContent, `${filePrefix}.md`, 'text/markdown;charset=utf-8');
  } else if (format === 'txt') {
    let txtContent = `${title}\n${'='.repeat(title.length)}\nالمستند: ${docName || ''}\n\n`;
    allSections.forEach(s => {
      txtContent += `[ ${s.title} ]\n`;
      const cleanText = s.contentHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      txtContent += `${cleanText}\n\n${'-'.repeat(40)}\n\n`;
    });
    downloadBlob(txtContent, `${filePrefix}.txt`, 'text/plain;charset=utf-8');
  }
}

/**
 * Export Standalone Interactive Mind Map HTML Page (Foldable/Unfoldable Tree for Students)
 */
export function exportInteractiveMindMapHTML(mindmapData, docName = 'المحاضرة', language = 'ar') {
  const root = mindmapData || {
    label: 'المفهوم الرئيسي للمحاضرة',
    children: [
      { label: 'المحور الأول: المفاهيم الأساسية', children: [{ label: 'التعريف الجوهري' }, { label: 'الأهداف والنطاق' }] },
      { label: 'المحور الثاني: النماذج والآليات', children: [{ label: 'المعادلات والقواعد' }, { label: 'طرق التطبيق' }] }
    ]
  };

  const isRtlDefault = language === 'ar' || language === 'bilingual' || !language;
  const initialDirection = isRtlDefault ? 'rtl' : 'ltr';
  const pageTitle = root.label || docName || 'خريطة المفاهيم التفاعلية';
  const dataScript = JSON.stringify(root);

  const standaloneHtml = `<!DOCTYPE html>
<html lang="${language === 'en' ? 'en' : 'ar'}" dir="${isRtlDefault ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>خريطة المفاهيم التفاعلية - ${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&family=Tajawal:wght@400;500;700;800&family=Google+Sans:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #4f46e5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Google Sans', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-color);
      color: var(--text-main);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      z-index: 10;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-title h1 {
      font-size: 16px;
      font-weight: 800;
      color: #1e1b4b;
    }
    .badge {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn {
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .btn.primary {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4338ca;
    }
    .btn.primary:hover {
      background: #4338ca;
    }
    .search-box {
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 12px;
      outline: none;
      width: 180px;
      font-family: inherit;
    }
    .search-box:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    }
    #canvas-container {
      flex: 1;
      width: 100%;
      height: 100%;
      position: relative;
      cursor: grab;
      user-select: none;
      background-color: #f8fafc;
      background-image: radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.2) 1px, transparent 0);
      background-size: 24px 24px;
    }
    #canvas-container.grabbing {
      cursor: grabbing;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
    }
    .link {
      fill: none;
      stroke-width: 2.2px;
      stroke: #94a3b8;
      stroke-linecap: round;
      transition: stroke 0.2s ease;
    }
    .node rect {
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .node rect:hover {
      filter: brightness(0.97) drop-shadow(0 4px 8px rgba(0,0,0,0.1));
    }
    .expand-btn {
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .expand-btn:hover {
      transform: scale(1.15);
    }
    .hint-pill {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.8);
      color: #ffffff;
      padding: 8px 18px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(8px);
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>

  <header>
    <div class="header-title">
      <span>🌳</span>
      <h1>${pageTitle}</h1>
      <span class="badge">Google NotebookLM Mindmap</span>
    </div>
    
    <div class="toolbar">
      <input type="text" id="search-input" class="search-box" placeholder="بحث في المفاهيم...">
      <button class="btn" id="btn-dir">⇄ <span id="dir-label">${initialDirection === 'rtl' ? 'RTL' : 'LTR'}</span></button>
      <button class="btn" id="btn-expand-all">📂 توسيع الكل</button>
      <button class="btn" id="btn-collapse-all">📁 طي الكل</button>
      <button class="btn" id="btn-zoom-in">🔍+</button>
      <button class="btn" id="btn-zoom-out">🔍-</button>
      <button class="btn" id="btn-reset">🎯 إعادة الضبط</button>
    </div>
  </header>

  <div id="canvas-container">
    <svg id="mindmap-svg" role="tree" aria-label="Interactive mindmap tree"></svg>
    <div class="hint-pill">💡 انقر على الدوائر &lt; و &gt; لطي وتوسيع الفروع • اسحب للتجول • استخدم العجلة للتكبير</div>
  </div>

  <script>
    const mindmapData = ${dataScript};
    let direction = '${initialDirection}';
    let zoom = 1;
    let pan = { x: direction === 'rtl' ? window.innerWidth * 0.75 : window.innerWidth * 0.2, y: window.innerHeight * 0.45 };
    let isPanning = false;
    let startPos = { x: 0, y: 0 };
    let collapsedPaths = new Set();
    let searchQuery = '';

    const PALETTES = [
      { rectFill: '#DDD6FE', circleFill: '#C4B5FD', textColor: '#2E1065', symbolColor: '#4C1D95' },
      { rectFill: '#BAE6FD', circleFill: '#7DD3FC', textColor: '#082F49', symbolColor: '#0369A1' },
      { rectFill: '#E0E7FF', circleFill: '#C7D2FE', textColor: '#1E1B4B', symbolColor: '#4338CA' },
      { rectFill: '#FEF3C7', circleFill: '#FDE68A', textColor: '#451A03', symbolColor: '#92400E' }
    ];

    function estimateTextWidth(text) {
      if (!text) return 100;
      let len = 0;
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 0x0600 && code <= 0x06FF) len += 0.68;
        else if (text[i] === ' ' || text[i] === '.' || text[i] === '-') len += 0.35;
        else if (text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase()) len += 0.75;
        else len += 0.55;
      }
      return Math.max(110, Math.round(len * 17) + 42);
    }

    function computeLayout(root) {
      const nodes = [];
      const links = [];
      const isRtl = direction === 'rtl';

      function measureSubtree(node, depth, path) {
        const isCollapsed = collapsedPaths.has(path);
        const text = node.label || 'عنصر';
        const rectWidth = estimateTextWidth(text);
        const rectHeight = 54.8;
        const circleOffset = (rectWidth / 2) + 14;
        const circleX = isRtl ? -circleOffset : circleOffset;

        const hasChildren = node.children && node.children.length > 0;
        let childrenMeasured = [];
        let subtreeHeight = 84;

        if (hasChildren && !isCollapsed) {
          childrenMeasured = node.children.map((child, idx) => measureSubtree(child, depth + 1, path + '-' + idx));
          const totalChildrenHeight = childrenMeasured.reduce((sum, c) => sum + c.subtreeHeight, 0);
          subtreeHeight = Math.max(84, totalChildrenHeight);
        }

        return { node, depth, path, text, rectWidth, rectHeight, circleX, hasChildren, isCollapsed, subtreeHeight, childrenMeasured };
      }

      const measuredRoot = measureSubtree(root, 0, "0");

      function positionSubtree(item, startX, startY) {
        const { depth, path, text, rectWidth, rectHeight, circleX, hasChildren, isCollapsed, subtreeHeight, childrenMeasured } = item;

        nodes.push({ id: path, depth, path, text, x: startX, y: startY, rectWidth, rectHeight, circleX, hasChildren, isCollapsed });

        if (hasChildren && !isCollapsed && childrenMeasured.length > 0) {
          const parentConnectorX = startX + circleX;
          const parentConnectorY = startY;
          let currentY = startY - (subtreeHeight / 2);

          childrenMeasured.forEach((childItem) => {
            const childCenterY = currentY + (childItem.subtreeHeight / 2);
            const gap = 110;
            const childStartX = isRtl 
              ? parentConnectorX - gap - (childItem.rectWidth / 2)
              : parentConnectorX + gap + (childItem.rectWidth / 2);
            
            const childLeadX = isRtl 
              ? childStartX + (childItem.rectWidth / 2)
              : childStartX - (childItem.rectWidth / 2);

            const midX = (parentConnectorX + childLeadX) / 2;
            const d = 'M ' + parentConnectorX + ' ' + parentConnectorY + ' C ' + midX + ' ' + parentConnectorY + ', ' + midX + ' ' + childCenterY + ', ' + childLeadX + ' ' + childCenterY;

            links.push({ id: path + '->' + childItem.path, d: d });
            positionSubtree(childItem, childStartX, childCenterY);
            currentY += childItem.subtreeHeight;
          });
        }
      }

      positionSubtree(measuredRoot, 0, 0);
      return { nodes: nodes, links: links };
    }

    function renderTree() {
      const svg = document.getElementById('mindmap-svg');
      if (!svg) return;
      const { nodes, links } = computeLayout(mindmapData);
      const isRtl = direction === 'rtl';

      let linksHtml = '';
      links.forEach(function(l) {
        linksHtml += '<path class="link" d="' + l.d + '"></path>';
      });

      let nodesHtml = '';
      nodes.forEach(function(n) {
        const p = PALETTES[Math.min(n.depth, PALETTES.length - 1)];
        const isMatch = searchQuery && n.text.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
        const stroke = isMatch ? 'stroke="#F59E0B" stroke-width="3px"' : 'stroke="none"';
        const filter = isMatch ? 'filter="drop-shadow(0 0 10px rgba(245,158,11,0.6))"' : 'filter="drop-shadow(0 2px 5px rgba(0,0,0,0.06))"';

        let circleHtml = '';
        if (n.hasChildren) {
          const sym = isRtl ? (n.isCollapsed ? '<' : '>') : (n.isCollapsed ? '>' : '<');
          circleHtml = '<g class="expand-btn" data-path="' + n.path + '" transform="translate(' + n.circleX + ', 0)">'
            + '<circle r="12" fill="' + p.circleFill + '" stroke="rgba(255,255,255,0.6)" stroke-width="1.5px"></circle>'
            + '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="' + p.symbolColor + '" font-size="16px" font-weight="bold" pointer-events="none">' + sym + '</text>'
            + '</g>';
        }

        nodesHtml += '<g class="node" data-path="' + n.path + '" transform="translate(' + n.x + ', ' + n.y + ')">'
          + '<rect x="' + (-n.rectWidth / 2) + '" y="' + (-n.rectHeight / 2) + '" width="' + n.rectWidth + '" height="' + n.rectHeight + '" rx="8" ry="8" fill="' + p.rectFill + '" ' + stroke + ' ' + filter + '></rect>'
          + '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="' + p.textColor + '" font-size="16px" font-weight="' + (n.depth === 0 ? '900' : '700') + '" pointer-events="none">' + n.text + '</text>'
          + circleHtml
          + '</g>';
      });

      svg.innerHTML = '<g transform="translate(' + pan.x + ', ' + pan.y + ') scale(' + zoom + ')">' + linksHtml + nodesHtml + '</g>';

      // Attach Node Click Listeners
      svg.querySelectorAll('.node rect, .expand-btn').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          const target = el.closest('.node');
          const path = target.getAttribute('data-path');
          if (collapsedPaths.has(path)) {
            collapsedPaths.delete(path);
          } else {
            collapsedPaths.add(path);
          }
          renderTree();
        });
      });
    }

    // Interactive Drag / Pan / Zoom
    const container = document.getElementById('canvas-container');
    container.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      isPanning = true;
      container.classList.add('grabbing');
      startPos = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    });

    window.addEventListener('mousemove', function(e) {
      if (!isPanning) return;
      pan = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };
      renderTree();
    });

    window.addEventListener('mouseup', function() {
      isPanning = false;
      container.classList.remove('grabbing');
    });

    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      zoom = Math.min(2.5, Math.max(0.4, zoom * factor));
      renderTree();
    });

    // Toolbar Event Listeners
    document.getElementById('btn-zoom-in').addEventListener('click', function() { zoom = Math.min(2.5, zoom + 0.15); renderTree(); });
    document.getElementById('btn-zoom-out').addEventListener('click', function() { zoom = Math.max(0.4, zoom - 0.15); renderTree(); });
    document.getElementById('btn-reset').addEventListener('click', function() {
      zoom = 1;
      pan = { x: direction === 'rtl' ? window.innerWidth * 0.75 : window.innerWidth * 0.2, y: window.innerHeight * 0.45 };
      renderTree();
    });
    document.getElementById('btn-dir').addEventListener('click', function() {
      direction = direction === 'rtl' ? 'ltr' : 'rtl';
      document.getElementById('dir-label').innerText = direction === 'rtl' ? 'RTL' : 'LTR';
      pan = { x: direction === 'rtl' ? window.innerWidth * 0.75 : window.innerWidth * 0.2, y: window.innerHeight * 0.45 };
      renderTree();
    });
    document.getElementById('btn-expand-all').addEventListener('click', function() { collapsedPaths.clear(); renderTree(); });
    document.getElementById('btn-collapse-all').addEventListener('click', function() {
      function collect(node, p) {
        if (!p) p = "0";
        if (node.children && node.children.length > 0) {
          collapsedPaths.add(p);
          node.children.forEach(function(c, idx) { collect(c, p + '-' + idx); });
        }
      }
      if (mindmapData.children) {
        mindmapData.children.forEach(function(c, idx) { collect(c, '0-' + idx); });
      }
      renderTree();
    });
    document.getElementById('search-input').addEventListener('input', function(e) {
      searchQuery = e.target.value;
      renderTree();
    });

    // Initial Render
    window.addEventListener('DOMContentLoaded', renderTree);
    setTimeout(renderTree, 50);
  </script>
</body>
</html>`;

  const filePrefix = `MindMap_${docName ? docName.replace(/\\.[^/.]+$/, '') : 'Interactive'}`;
  downloadBlob(standaloneHtml, `${filePrefix}.html`, 'text/html;charset=utf-8');
}

