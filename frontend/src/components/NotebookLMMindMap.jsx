import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Search, 
  FolderPlus, 
  FolderMinus, 
  Download, 
  Image as ImageIcon,
  Sparkles,
  Network,
  ArrowLeftRight,
  Globe
} from 'lucide-react';
import { exportInteractiveMindMapHTML } from '../services/exportService';

/**
 * Text width estimation helper
 */
function estimateTextWidth(text, fontSize = 17) {
  if (!text) return 110;
  let len = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0600 && code <= 0x06FF) {
      len += 0.68; // Arabic character scaling factor
    } else if (text[i] === ' ' || text[i] === '.' || text[i] === '-' || text[i] === ':') {
      len += 0.35;
    } else if (text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase()) {
      len += 0.75;
    } else {
      len += 0.55;
    }
  }
  return Math.max(110, Math.round(len * fontSize) + 42);
}

// Color Palettes matching Google NotebookLM
const DEPTH_PALETTES = [
  {
    // Depth 0 (Root - Soft Lilac / emerald)
    rectFill: '#DDD6FE', // violet-200
    rectStroke: '#8B5CF6',
    circleFill: '#C4B5FD',
    textColor: '#2E1065',
    symbolColor: '#4C1D95',
  },
  {
    // Depth 1 (Primary Branches - Sky Blue)
    rectFill: '#BAE6FD', // sky-200
    rectStroke: '#38BDF8',
    circleFill: '#7DD3FC',
    textColor: '#082F49',
    symbolColor: '#0369A1',
  },
  {
    // Depth 2 (Sub-branches - emerald / Periwinkle)
    rectFill: '#E0E7FF', // emerald-100
    rectStroke: '#818CF8',
    circleFill: '#C7D2FE',
    textColor: '#1E1B4B',
    symbolColor: '#4338CA',
  },
  {
    // Depth 3+ (Amber / Mint)
    rectFill: '#FEF3C7', // amber-100
    rectStroke: '#FBBF24',
    circleFill: '#FDE68A',
    textColor: '#451A03',
    symbolColor: '#92400E',
  }
];

export default function NotebookLMMindMap({ mindmapData, defaultTitle, language = 'ar' }) {
  const isArabicDefault = language === 'ar' || language === 'bilingual' || !language;
  const [direction, setDirection] = useState(isArabicDefault ? 'rtl' : 'ltr');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: isArabicDefault ? 650 : 200, y: 320 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedPaths, setCollapsedPaths] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
const [isFullscreen, setIsFullscreen] = useState(false);
const [selectedNodeId, setSelectedNodeId] = useState(null);
const [exportOpen, setExportOpen] = useState(false);
  
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Sync direction if language changes
  useEffect(() => {
    const isAr = language === 'ar' || language === 'bilingual';
    setDirection(isAr ? 'rtl' : 'ltr');
    setPan({ x: isAr ? 650 : 200, y: 320 });
  }, [language]);

  // Normalize Root Node
  const rootNode = useMemo(() => {
    if (mindmapData && mindmapData.label) {
      return mindmapData;
    }
    return {
      label: defaultTitle || 'المفهوم الرئيسي للمحاضرة',
      children: [
        { label: 'المحور الأول: المفاهيم الأساسية', children: [{ label: 'التعريف الجوهري' }, { label: 'الأهداف والنطاق' }] },
        { label: 'المحور الثاني: النماذج والآليات', children: [{ label: 'المعادلات والقواعد' }, { label: 'طرق التطبيق' }] },
        { label: 'المحور الثالث: المقارنات والنتائج', children: [{ label: 'الفروقات الجوهرية' }, { label: 'الأخطاء الشائعة' }] }
      ]
    };
  }, [mindmapData, defaultTitle]);

  // Toggle Collapse State
  const toggleNode = useCallback((path, e) => {
    e?.stopPropagation();
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleExpandAll = () => {
    setCollapsedPaths(new Set());
  };

  const handleCollapseAll = () => {
    const allPaths = new Set();
    const collectPaths = (node, path = "0") => {
      if (node.children && node.children.length > 0) {
        allPaths.add(path);
        node.children.forEach((child, idx) => {
          collectPaths(child, `${path}-${idx}`);
        });
      }
    };
    if (rootNode.children) {
      rootNode.children.forEach((c, i) => collectPaths(c, `0-${i}`));
    }
    setCollapsedPaths(allPaths);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: direction === 'rtl' ? 650 : 200, y: 320 });
  };

  const toggleDirection = () => {
    const newDir = direction === 'rtl' ? 'ltr' : 'rtl';
    setDirection(newDir);
    setPan({ x: newDir === 'rtl' ? 650 : 200, y: 320 });
  };

  // Drag & Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prevZoom) => Math.min(2.5, Math.max(0.4, prevZoom * zoomFactor)));
  };

  // ---------------------------------------------------------------------------
  // NotebookLM Layout Calculation Engine with True Centering & RTL/LTR Support
  // ---------------------------------------------------------------------------
  const layoutTree = useMemo(() => {
    const nodes = [];
    const links = [];
    const isRtl = direction === 'rtl';

    // Step 1: Pre-calculate node dimensions & subtree vertical span
    function measureSubtree(node, depth = 0, path = "0") {
      const isCollapsed = collapsedPaths.has(path);
      const text = node.label || 'عنصر';
      const textWidth = estimateTextWidth(text, 17);
      const rectWidth = textWidth;
      const rectHeight = 54.8;
      
      // Connector circle positioned outside the pill edge
      const circleOffset = (rectWidth / 2) + 14;
      const circleX = isRtl ? -circleOffset : circleOffset;

      const hasChildren = node.children && node.children.length > 0;
      let childrenMeasured = [];
      let subtreeHeight = 84;

      if (hasChildren && !isCollapsed) {
        childrenMeasured = node.children.map((child, idx) => 
          measureSubtree(child, depth + 1, `${path}-${idx}`)
        );
        const totalChildrenHeight = childrenMeasured.reduce((sum, c) => sum + c.subtreeHeight, 0);
        subtreeHeight = Math.max(84, totalChildrenHeight);
      }

      return {
        node,
        depth,
        path,
        text,
        rectWidth,
        rectHeight,
        circleX,
        hasChildren,
        isCollapsed,
        subtreeHeight,
        childrenMeasured
      };
    }

    const measuredRoot = measureSubtree(rootNode, 0, "0");

    // Step 2: Position nodes centered at (startX, startY)
    function positionSubtree(item, startX = 0, startY = 0) {
      const {
        depth,
        path,
        text,
        rectWidth,
        rectHeight,
        circleX,
        hasChildren,
        isCollapsed,
        subtreeHeight,
        childrenMeasured
      } = item;

      // Register current node
      nodes.push({
        id: path,
        depth,
        path,
        text,
        x: startX,
        y: startY,
        rectWidth,
        rectHeight,
        circleX,
        hasChildren,
        isCollapsed,
        numChildren: item.node.children ? item.node.children.length : 0
      });

      // If children are expanded, layout them vertically centered
      if (hasChildren && !isCollapsed && childrenMeasured.length > 0) {
        const parentConnectorX = startX + circleX;
        const parentConnectorY = startY;

        let currentY = startY - (subtreeHeight / 2);

        childrenMeasured.forEach((childItem) => {
          const childCenterY = currentY + (childItem.subtreeHeight / 2);
          
          // Compute child X position based on layout direction
          const gap = 110;
          const childStartX = isRtl 
            ? parentConnectorX - gap - (childItem.rectWidth / 2)
            : parentConnectorX + gap + (childItem.rectWidth / 2);
          
          // Child lead point (connecting to the edge of the child pill)
          const childLeadX = isRtl 
            ? childStartX + (childItem.rectWidth / 2)
            : childStartX - (childItem.rectWidth / 2);

          // Symmetric Bezier midpoint
          const midX = (parentConnectorX + childLeadX) / 2;

          // NotebookLM Cubic Bezier Link Path
          const d = `M ${parentConnectorX} ${parentConnectorY} C ${midX} ${parentConnectorY}, ${midX} ${childCenterY}, ${childLeadX} ${childCenterY}`;
          
          links.push({
            id: `${path}->${childItem.path}`,
            depth,
            d
          });

          // Recurse into child
          positionSubtree(childItem, childStartX, childCenterY);

          currentY += childItem.subtreeHeight;
        });
      }
    }

    positionSubtree(measuredRoot, 0, 0);

    return { nodes, links };
  }, [rootNode, collapsedPaths, direction]);

  // Export as SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${rootNode.label || 'mindmap'}_notebooklm.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Export as PNG (High Quality 2x Retina)
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = (svgEl.clientWidth || 1200) * 2;
      canvas.height = (svgEl.clientHeight || 700) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${rootNode.label || 'mindmap'}_notebooklm.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl p-6 overflow-hidden flex flex-col justify-between' : ''}`}>
      
      {/* Interactive Controls Bar */}
      <div className="glass-card rounded-2xl p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black theme-text-primary">الخريطة الذهنية التفاعلية (Google NotebookLM)</h4>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-teal-400 font-bold text-xs">
                {direction === 'rtl' ? 'اتجاه عربي (يمين ← يسار)' : 'LTR Direction (Left → Right)'}
              </span>
            </div>
            <p className="text-[13px] theme-text-muted">اسحب للتحريك في أي اتجاه، واستخدم العجلة للتكبير، وانقر على الدوائر للطي والفرد</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 theme-text-muted absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المفاهيم..."
              className="pr-8 pl-3 py-1.5 rounded-xl theme-card-inner border text-sm theme-text-primary placeholder-slate-400 outline-none w-36 sm:w-48 font-['Tajawal']"
            />
          </div>

          {/* Direction Toggle (RTL / LTR) */}
            <button
              onClick={toggleDirection}
              className="px-3 py-1.5 rounded-xl theme-card-inner border text-sm font-bold theme-text-primary hover:border-teal-500 transition flex items-center gap-1.5"
              title="تبديل اتجاه الشجرة (عربي / إنجليزي)"
            >
              <ArrowLeftRight className="w-4 h-4 text-teal-500" />
              <span>{direction === 'rtl' ? 'RTL' : 'LTR'}</span>
            </button>

          {/* Expand / Collapse All */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border">
            <button
              onClick={handleExpandAll}
              className="p-1.5 rounded-lg theme-header-btn hover:text-emerald-600 transition"
              title="توسيع كافة الفروع"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1.5 rounded-lg theme-header-btn hover:text-emerald-600 transition"
              title="طي كافة الفروع"
            >
              <FolderMinus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 rounded-lg theme-header-btn hover:text-teal-500 transition"
              title="تكبير (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold px-2 theme-text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 rounded-lg theme-header-btn hover:text-teal-500 transition"
              title="تصغير (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg theme-header-btn hover:text-teal-500 transition"
              title="إعادة ضبط الموقع"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold shadow-md shadow-emerald-600/25 transition flex items-center gap-2 border border-white/20"
              title="تصدير الخريطة بصيغ متعددة"
            >
              <Download className="w-4 h-4 text-white" />
              <span>تصدير</span>
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute z-40 left-0 mt-2 w-56 rounded-2xl glass-panel border shadow-2xl p-2 space-y-1">
                  <button
                    onClick={() => { exportInteractiveMindMapHTML(rootNode, defaultTitle || rootNode.label, language); setExportOpen(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2.5 text-sm font-bold theme-text-primary"
                  >
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>HTML تفاعلي</span>
                  </button>
                  <button
                    onClick={() => { handleExportPNG(); setExportOpen(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2.5 text-sm font-bold theme-text-primary"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>صورة PNG عالية الدقة</span>
                  </button>
                  <button
                    onClick={() => { handleExportSVG(); setExportOpen(false); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2.5 text-sm font-bold theme-text-primary"
                  >
                    <Download className="w-4 h-4 text-teal-500" />
                    <span>SVG فيكتوري</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl theme-card-inner border theme-text-primary hover:border-teal-500 transition"
            title={isFullscreen ? "تصغير الشاشة" : "عرض ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative overflow-hidden rounded-3xl border theme-card select-none shadow-inner cursor-grab ${
          isPanning ? 'cursor-grabbing' : ''
        } ${isFullscreen ? 'flex-1 h-full min-h-[500px]' : 'h-[620px]'}`}
        style={{
          backgroundColor: 'var(--canvas-bg, #f8fafc)',
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.18) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Helper Navigation Floating Pill */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span>اسحب للتجول • انقر على المفاتيح &lt; و &gt; للطي والتوسيع</span>
        </div>

        {/* The Exact NotebookLM SVG Structure */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          role="tree"
          aria-label="Interactive mindmap tree. Use arrow keys to navigate."
          className="w-full h-full block"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* 1. Connecting Bezier Links */}
            {layoutTree.links.map((link) => (
              <path
                key={link.id}
                className="link transition-all duration-300"
                data-depth={link.depth}
                d={link.d}
                style={{
                  fill: 'none',
                  strokeWidth: '2.2px',
                  stroke: 'var(--mindmap-link-color, #94A3B8)',
                  strokeLinecap: 'round'
                }}
              />
            ))}

            {/* 2. Interactive Nodes */}
            {layoutTree.nodes.map((node) => {
              const palette = DEPTH_PALETTES[Math.min(node.depth, DEPTH_PALETTES.length - 1)];
              const isMatch = searchQuery && node.text.toLowerCase().includes(searchQuery.toLowerCase());
              const isSelected = selectedNodeId === node.id;
              const isRtl = direction === 'rtl';

              return (
                <g
                  key={node.id}
                  className="node group transition-transform duration-200"
                  data-depth={node.depth}
                  role="treeitem"
                  aria-level={node.depth + 1}
                  aria-expanded={node.hasChildren ? !node.isCollapsed : undefined}
                  aria-label={`${node.text}${node.hasChildren ? `, ${node.numChildren} children` : ''}`}
                  tabIndex={node.depth === 0 ? 0 : -1}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ outline: 'none' }}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  {/* Node Pill Shape (Centered at 0, 0) */}
                  <rect
                    rx="8"
                    ry="8"
                    x={-node.rectWidth / 2}
                    y={-node.rectHeight / 2}
                    width={node.rectWidth}
                    height={node.rectHeight}
                    className="transition-all duration-150"
                    style={{
                      cursor: 'pointer',
                      fill: palette.rectFill,
                      stroke: isMatch ? '#F59E0B' : (isSelected ? '#6366F1' : 'transparent'),
                      strokeWidth: isMatch || isSelected ? '3px' : '0px',
                      filter: isMatch ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))' : 'drop-shadow(0 2px 5px rgba(0,0,0,0.07))'
                    }}
                    onClick={(e) => {
                      if (node.hasChildren) toggleNode(node.path, e);
                    }}
                  />

                  {/* Node Text Label (100% Mathematically Centered inside Pill) */}
                  <text
                    className="node-name select-none font-bold"
                    aria-hidden="true"
                    x="0"
                    y="0"
                    style={{
                      textAnchor: 'middle',
                      dominantBaseline: 'central',
                      fontSize: '17px',
                      fontFamily: '"Google Sans", "Tajawal", "IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fill: palette.textColor,
                      pointerEvents: 'none',
                      fontWeight: node.depth === 0 ? '900' : '700'
                    }}
                  >
                    {node.text}
                  </text>

                  {/* Connector Circle & Toggle Symbol (NotebookLM < and > button) */}
                  {node.hasChildren && (
                    <g
                      transform={`translate(${node.circleX}, 0)`}
                      onClick={(e) => toggleNode(node.path, e)}
                      style={{ cursor: 'pointer' }}
                      className="transition-transform duration-150 hover:scale-110"
                    >
                      <circle
                        r="12"
                        fillOpacity="1"
                        style={{
                          fill: palette.circleFill,
                          stroke: 'rgba(255, 255, 255, 0.6)',
                          strokeWidth: '1.5px',
                          cursor: 'pointer'
                        }}
                      />
                      <text
                        className="expand-symbol select-none"
                        aria-hidden="true"
                        x="0"
                        y="0"
                        style={{
                          fontSize: '17px',
                          textAnchor: 'middle',
                          dominantBaseline: 'central',
                          fontFamily: '"Google Sans", monospace, sans-serif',
                          fill: palette.symbolColor,
                          pointerEvents: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        {isRtl 
                          ? (node.isCollapsed ? '<' : '>') 
                          : (node.isCollapsed ? '>' : '<')
                        }
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          </g>
        </svg>

      </div>

    </div>
  );
}
