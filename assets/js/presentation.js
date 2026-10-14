const slides = [
  { label: "Introduction" },
  { label: "Company Overview" },
  { label: "Network & Volume" },
  { label: "Benchmarks" },
  { label: "Weather" },
  { label: "Cascading Effects" },
  { label: "Late Inbound by Hour" },
  { label: "Late Inbound Routes" },
  { label: "On-Site Carrier Delays" },
  { label: "Carrier Drilldown" },
  { label: "Staffing Issues" },
  { label: "Heatmap & Slot Delay" },
  { label: "Trend Shifts" },
  { label: "Our Recommendation" },
  { label: "Data Sources" },
  { label: "Lessons Learned" },
  { label: "Q&A" }
];
let currentIndex = 0;
const nav = document.getElementById('sectionNav');
const progressPill = document.getElementById('progressPill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fsPrevBtn = document.getElementById('fsPrevBtn');
const fsNextBtn = document.getElementById('fsNextBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const stageWrapper = document.getElementById('stageWrapper');
const stageCenter = document.getElementById('stageCenter');
const frameScale = document.getElementById('frameScale');
const slideEls = [...document.querySelectorAll('.deck-slide')];
let plotsInitialized = false;
function animateLine(x, y) {
  if (_animTimer) clearTimeout(_animTimer);
  var gen = ++_animGen;
  var visitToken = _slide7VisitToken;

  var STEPS = 8;
  var mc = x.map(function(h) { return (h >= 14 && h <= 19) ? '#b22543' : '#122f5e'; });

  var xs = [x[0]], ys = [y[0]], colors = [mc[0]], sizes = [9];
  for (var i = 0; i < x.length - 1; i++) {
    for (var s = 1; s <= STEPS; s++) {
      var t = s / STEPS;
      xs.push(x[i] + t * (x[i + 1] - x[i]));
      ys.push(y[i] + t * (y[i + 1] - y[i]));
      if (s === STEPS) { colors.push(mc[i + 1]); sizes.push(9); }
      else             { colors.push('rgba(0,0,0,0)'); sizes.push(0); }
    }
  }

  var n = 0;
  function tick() {
    if (gen !== _animGen) return;
    if (visitToken !== _slide7VisitToken) return;
    if (typeof currentIndex !== 'undefined' && currentIndex !== 6) return;
    n++;
    Plotly.restyle('todChart', {
      x: [xs.slice(0, n)],
      y: [ys.slice(0, n)],
      marker: [{ color: colors.slice(0, n), size: sizes.slice(0, n), line: { color: '#ffffff', width: 1.5 } }]
    }, [1]);
    if (n < xs.length) _animTimer = setTimeout(tick, 15);
  }
  _animTimer = setTimeout(tick, 150);
}


function buildNav() {
  nav.innerHTML = '';
  slides.forEach((slide, index) => {
    const btn = document.createElement('button');
    btn.className = 'section-link' + (index === currentIndex ? ' active' : '');
    btn.type = 'button';
    btn.innerHTML = `<span class="num">${index + 1}</span><span><span class="meta">Slide ${index + 1}</span><span class="title-text">${slide.label}</span></span>`;
    btn.addEventListener('click', () => goTo(index));
    nav.appendChild(btn);
  });
}

function updateScale() {
  const baseW = 1380;
  const baseH = 776;
  const availableW = stageCenter.clientWidth;
  const availableH = stageCenter.clientHeight;
  const scale = Math.min(availableW / baseW, availableH / baseH);

  let offsetX = 0;
  let offsetY = 0;
  if (document.fullscreenElement === stageWrapper) {
    offsetX = Math.max(0, (availableW - baseW * scale) / 2);
    offsetY = Math.max(0, (availableH - baseH * scale) / 2);
  }

  frameScale.style.left = `${offsetX}px`;
  frameScale.style.top = `${offsetY}px`;
  frameScale.style.transform = `scale(${scale})`;
}

function updateUI() {
  const targetSlide = slideEls[currentIndex];
  slideEls.forEach((slide, i) => {
    if (i !== currentIndex) slide.classList.remove('active', 'transition-prep');
  });
  if (targetSlide) targetSlide.classList.add('transition-prep');

  [...nav.children].forEach((el, i) => el.classList.toggle('active', i === currentIndex));
  progressPill.textContent = `${currentIndex + 1} / ${slides.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === slides.length - 1;
  fsPrevBtn.disabled = currentIndex === 0;
  fsNextBtn.disabled = currentIndex === slides.length - 1;

  if (!plotsInitialized) initPlots();
  if (typeof Chart !== 'undefined') initCarrierDrill();
  if (typeof Chart !== 'undefined') initSlotHeat();
  if (typeof Chart !== 'undefined') initTrendShift();

  requestAnimationFrame(() => {
    updateScale();
    if (targetSlide) targetSlide.classList.add('active');

    if (currentIndex !== 6) {
      _slide7VisitToken += 1;
      clearLateHourChart();
    }

    if (plotsInitialized && typeof Plotly !== 'undefined') {
      ['map','bar','ontime','satisfaction','todChart','routeMap'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          try { Plotly.Plots.resize(el); } catch (e) {}
        }
      });
    }
    if (typeof Chart !== 'undefined' && window.dispatchEvent) {
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    }
    clearTimeout(_slideReplayTimer);
    if (currentIndex === 6) {
      _slideReplayTimer = setTimeout(() => {
        if (targetSlide) targetSlide.classList.remove('transition-prep');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const allYearsBtn = document.querySelector('.latehour-year-btn[data-year="All Years"], .year-btn[data-year="All Years"]');
            if (allYearsBtn) {
              allYearsBtn.click();
            } else {
              applyYearSelection('All Years');
            }
          });
        });
      }, 140);
    } else {
      _slideReplayTimer = setTimeout(() => {
        replaySlideTransitions(currentIndex);
      }, 20);
    }
  });
}

function goTo(index) {
  if (index < 0 || index >= slides.length) return;
  currentIndex = index;
  updateUI();
}

prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
fsPrevBtn.addEventListener('click', () => goTo(currentIndex - 1));
fsNextBtn.addEventListener('click', () => goTo(currentIndex + 1));
toggleSidebarBtn.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-collapsed');
  setTimeout(updateScale, 260);
});
fullscreenBtn.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageWrapper.requestFullscreen();
  } catch (e) {
    console.error(e);
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreenBtn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
  setTimeout(updateScale, 40);
  setTimeout(updateScale, 220);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1); }
  if (e.key.toLowerCase() === 'f') { e.preventDefault(); fullscreenBtn.click(); }
});
window.addEventListener('resize', () => {
  updateScale();
  if (plotsInitialized) {
    ['map', 'bar', 'ontime', 'satisfaction', 'todChart', 'routeMap'].forEach((id) => { const el = document.getElementById(id); if (el) { try { Plotly.Plots.resize(el); } catch (e) {} } });
  }
  if (typeof Chart !== 'undefined') {
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
});


function initCarrierDrill() {
  if (window._carrierDrillInitialized || typeof Chart === 'undefined') return;
  window._carrierDrillInitialized = true;

  var YEARS = ['2022','2023','2024','2025'];
  var YR_LABELS = ["'22","'23","'24","'25"];
  var C_YMAX = 15;
  var CL_YMAX = 25;
  var C_TICKS = [0, 5, 10, 15];

  var CARRIERS = [
    { name: 'Alaska Airlines', short: 'Alaska', color: '#0E7490' },
    { name: 'American Airlines', short: 'American', color: '#C41230' },
    { name: 'Delta Air Lines', short: 'Delta', color: '#1B2A6B' },
    { name: 'Endeavor Air', short: 'Endeavor', color: '#7C3AED' },
    { name: 'Envoy Air', short: 'Envoy', color: '#0891B2' },
    { name: 'JetBlue Airways', short: 'JetBlue', color: '#0033A0' },
    { name: 'Republic Airways', short: 'Republic', color: '#16A34A' },
    { name: 'Spirit Airlines', short: 'Spirit', color: '#D97706' },
    { name: 'United Airlines', short: 'United', color: '#1D4ED8' }
  ];

  var CLASS_SHORTS = {
    'Regional Jet': 'Regional Jet',
    'Small Narrow-body': 'Small NB',
    'Standard Narrow-body': 'Std NB',
    'Large Narrow-body': 'Large NB',
    'Wide-body': 'Wide-body'
  };

  var carrierYearData = {
    'Alaska Airlines':   { '2022':{'avg':2.41,'count':3273},  '2023':{'avg':3.33,'count':2947},  '2024':{'avg':2.25,'count':3184},  '2025':{'avg':3.51,'count':2985}  },
    'American Airlines': { '2022':{'avg':6.95,'count':8162},  '2023':{'avg':7.04,'count':7414},  '2024':{'avg':7.72,'count':6665},  '2025':{'avg':4.94,'count':5773}  },
    'Delta Air Lines':   { '2022':{'avg':8.65,'count':4874},  '2023':{'avg':7.60,'count':6178},  '2024':{'avg':8.71,'count':6426},  '2025':{'avg':8.53,'count':6334}  },
    'Endeavor Air':      { '2022':{'avg':4.52,'count':1702},  '2023':{'avg':2.86,'count':1675},  '2024':{'avg':4.09,'count':1570},  '2025':{'avg':2.46,'count':1347}  },
    'Envoy Air':         { '2022':{'avg':0.72,'count':218},   '2023':{'avg':2.39,'count':588},   '2024':{'avg':4.80,'count':910},   '2025':{'avg':2.48,'count':1032}  },
    'JetBlue Airways':   { '2022':{'avg':10.95,'count':7456}, '2023':{'avg':8.14,'count':6520},  '2024':{'avg':7.34,'count':5436},  '2025':{'avg':5.97,'count':5174}  },
    'Republic Airways':  { '2022':{'avg':5.74,'count':28178}, '2023':{'avg':3.07,'count':27809}, '2024':{'avg':2.62,'count':22678}, '2025':{'avg':3.27,'count':18008} },
    'Spirit Airlines':   { '2022':{'avg':3.31,'count':6565},  '2023':{'avg':5.15,'count':8309},  '2024':{'avg':3.84,'count':10042}, '2025':{'avg':4.45,'count':8538}  },
    'United Airlines':   { '2022':{'avg':7.65,'count':57942}, '2023':{'avg':7.60,'count':69364}, '2024':{'avg':5.09,'count':67596}, '2025':{'avg':5.08,'count':61843} }
  };

  var carrierClassYearData = {
    'Alaska Airlines': { 'Large Narrow-body': { '2022':{'avg':2.23,'count':2944}, '2023':{'avg':3.56,'count':2268}, '2024':{'avg':2.14,'count':2677}, '2025':{'avg':3.51,'count':2717} }, 'Standard Narrow-body': { '2022':{'avg':3.99,'count':329}, '2023':{'avg':2.53,'count':679}, '2024':{'avg':2.85,'count':507}, '2025':{'avg':3.51,'count':268} } },
    'American Airlines': { 'Large Narrow-body': { '2022':{'avg':10.35,'count':2066}, '2023':{'avg':5.98,'count':2313}, '2024':{'avg':9.27,'count':1892}, '2025':{'avg':5.24,'count':1287} }, 'Small Narrow-body': { '2022':{'avg':7.82,'count':315}, '2023':{'avg':15.15,'count':248}, '2024':{'avg':3.55,'count':218}, '2025':{'avg':23.63,'count':41} }, 'Standard Narrow-body': { '2022':{'avg':5.69,'count':5781}, '2023':{'avg':7.13,'count':4853}, '2024':{'avg':7.28,'count':4555}, '2025':{'avg':4.67,'count':4445} } },
    'Delta Air Lines': { 'Large Narrow-body': { '2022':{'avg':8.73,'count':584}, '2023':{'avg':8.15,'count':778}, '2024':{'avg':6.87,'count':2437}, '2025':{'avg':7.67,'count':2786} }, 'Small Narrow-body': { '2022':{'avg':9.09,'count':2539}, '2023':{'avg':6.98,'count':3933}, '2024':{'avg':9.70,'count':3618}, '2025':{'avg':9.80,'count':2606} }, 'Standard Narrow-body': { '2022':{'avg':7.97,'count':1751}, '2023':{'avg':8.97,'count':1467}, '2024':{'avg':11.07,'count':371}, '2025':{'avg':7.54,'count':942} } },
    'Endeavor Air': { 'Regional Jet': { '2022':{'avg':4.52,'count':1702}, '2023':{'avg':2.86,'count':1675}, '2024':{'avg':4.09,'count':1570}, '2025':{'avg':2.46,'count':1347} } },
    'Envoy Air': { 'Regional Jet': { '2022':{'avg':0.72,'count':218}, '2023':{'avg':2.39,'count':588}, '2024':{'avg':4.80,'count':910}, '2025':{'avg':2.48,'count':1032} } },
    'JetBlue Airways': { 'Large Narrow-body': { '2022':{'avg':7.93,'count':1965}, '2023':{'avg':6.73,'count':1589}, '2024':{'avg':4.13,'count':1015}, '2025':{'avg':5.18,'count':963} }, 'Regional Jet': { '2022':{'avg':9.51,'count':974}, '2023':{'avg':6.69,'count':395}, '2024':{'avg':2.75,'count':4}, '2025':null }, 'Small Narrow-body': { '2022':null, '2023':{'avg':9.50,'count':2}, '2024':{'avg':7.27,'count':98}, '2025':{'avg':5.66,'count':38} }, 'Standard Narrow-body': { '2022':{'avg':12.57,'count':4517}, '2023':{'avg':8.76,'count':4534}, '2024':{'avg':8.11,'count':4319}, '2025':{'avg':6.16,'count':4173} } },
    'Republic Airways': { 'Regional Jet': { '2022':{'avg':5.74,'count':28178}, '2023':{'avg':3.07,'count':27809}, '2024':{'avg':2.62,'count':22678}, '2025':{'avg':3.27,'count':18008} } },
    'Spirit Airlines': { 'Large Narrow-body': { '2022':{'avg':2.91,'count':2675}, '2023':{'avg':3.75,'count':1874}, '2024':{'avg':4.14,'count':1766}, '2025':{'avg':5.44,'count':2483} }, 'Small Narrow-body': { '2022':{'avg':6.29,'count':73}, '2023':{'avg':2.86,'count':78}, '2024':{'avg':4.98,'count':102}, '2025':{'avg':0.00,'count':5} }, 'Standard Narrow-body': { '2022':{'avg':3.54,'count':3817}, '2023':{'avg':5.59,'count':6357}, '2024':{'avg':3.77,'count':8174}, '2025':{'avg':4.06,'count':6050} } },
    'United Airlines': { 'Large Narrow-body': { '2022':{'avg':7.78,'count':15066}, '2023':{'avg':8.14,'count':21163}, '2024':{'avg':5.49,'count':32829}, '2025':{'avg':5.26,'count':34104} }, 'Small Narrow-body': { '2022':{'avg':7.27,'count':12709}, '2023':{'avg':7.05,'count':13307}, '2024':{'avg':4.99,'count':13175}, '2025':{'avg':5.40,'count':10332} }, 'Standard Narrow-body': { '2022':{'avg':6.82,'count':23820}, '2023':{'avg':6.59,'count':29523}, '2024':{'avg':3.43,'count':17632}, '2025':{'avg':3.30,'count':13702} }, 'Wide-body': { '2022':{'avg':11.26,'count':6347}, '2023':{'avg':12.38,'count':5371}, '2024':{'avg':9.46,'count':3960}, '2025':{'avg':9.19,'count':3705} } }
  };

  function weightedAvg(yearObj) {
    var td = 0, tc = 0;
    YEARS.forEach(function(y) { if (yearObj && yearObj[y]) { td += yearObj[y].avg * yearObj[y].count; tc += yearObj[y].count; } });
    return { avg: tc > 0 ? Math.round(td / tc * 100) / 100 : 0, count: tc };
  }

  function makeDataset(avgs, counts, color, yMax) {
    var capped = avgs.map(function(v) { return v !== null ? Math.min(v, yMax) : null; });
    var ptClrs = avgs.map(function(v) { return (v !== null && v > yMax) ? '#ef4444' : color; });
    return {
      data: capped, _rawAvg: avgs, _counts: counts,
      borderColor: color, backgroundColor: color + '18', fill: true, tension: 0.3, borderWidth: 2,
      pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: ptClrs, pointBorderColor: '#fff', pointBorderWidth: 1.5
    };
  }

  var TT = { titleFont:{family:'Figtree,Arial,sans-serif',size:11,weight:'600'}, bodyFont:{family:'Figtree,Arial,sans-serif',size:10}, backgroundColor:'rgba(13,31,60,0.92)', titleColor:'#f0f2f4', bodyColor:'#dde4f0', padding:8, cornerRadius:6, displayColors:false };

  function lineOpts(yMax, xSz, showY) {
    return {
      responsive:false, animation:{duration:260},
      layout:{padding:{top:6,right:4,bottom:0,left:showY?0:4}},
      scales:{
        y:{display:showY,min:0,max:yMax,ticks:{font:{size:15,family:'Figtree,Arial,sans-serif'},color:'#3d5278',maxTicksLimit:4},grid:{color:'rgba(192,205,230,0.4)',lineWidth:0.5},border:{display:false}},
        x:{ticks:{font:{size:xSz||15,family:'Figtree,Arial,sans-serif'},color:'#3d5278',maxRotation:0,minRotation:0},grid:{display:false},border:{display:false}}
      },
      plugins:{legend:{display:false},tooltip:Object.assign({},TT,{callbacks:{title:function(i){return '20'+i[0].label.slice(1);},label:function(c){var r=c.dataset._rawAvg[c.dataIndex],n=c.dataset._counts[c.dataIndex]; return [r!==null?'Carrier Delay: '+r.toFixed(2)+' min':'No data',n?'Flights: '+n.toLocaleString():''].filter(Boolean);}}})}
    };
  }

  function barOpts(yMax, onClickFn) {
    return {
      responsive:true, maintainAspectRatio:false, animation:{duration:300},
      scales:{
        y:{min:0,max:yMax,ticks:{font:{size:15,family:'Figtree,Arial,sans-serif'},color:'#3d5278',stepSize:5},grid:{color:'rgba(192,205,230,0.4)',lineWidth:0.5},border:{display:false},title:{display:true,text:'Avg Carrier Delay (min)',font:{size:15},color:'#3d5278'}},
        x:{ticks:{font:{size:15,family:'Figtree,Arial,sans-serif'},color:'#3d5278',maxRotation:0},grid:{display:false},border:{display:false}}
      },
      onClick:onClickFn||null,
      plugins:{legend:{display:false},tooltip:Object.assign({},TT,{callbacks:{title:function(i){return i[0].label;},label:function(c){var r=c.dataset._rawAvgs[c.dataIndex],n=c.dataset._counts[c.dataIndex]; return ['Avg Carrier Delay: '+r.toFixed(2)+' min','Total Flights: '+n.toLocaleString(),c.dataset._clickable?'Click to see aircraft classes →':''].filter(Boolean);}}})}
    };
  }

  function posAxis(railId, chartInst, ticks, yMax) {
    requestAnimationFrame(function() {
      var rail = document.getElementById(railId);
      if (!rail || !chartInst) return;
      while (rail.firstChild) rail.removeChild(rail.firstChild);
      var area = chartInst.chartArea;
      var cR = chartInst.canvas.getBoundingClientRect();
      var rR = rail.getBoundingClientRect();
      var yOff = cR.top - rR.top, plotH = area.bottom - area.top;
      ticks.forEach(function(t) {
        var el = document.createElement('span');
        el.className = 'carrierdrill-tick-label';
        el.style.top = Math.round(yOff + area.top + (1 - t / yMax) * plotH) + 'px';
        el.textContent = t;
        rail.appendChild(el);
      });
    });
  }

  var chartType = 'column';
  var selectedCarr = null;
  var allColChart = null;
  var allLineCharts = [];
  var drillCharts = [];
  var AREA_H = 250;

  function buildAllColumn() {
    var container = document.getElementById('carrierdrill-allColumnView');
    container.innerHTML = '';
    container.style.height = (AREA_H + 10) + 'px';
    var cv = document.createElement('canvas');
    cv.style.width = '100%';
    cv.style.height = '100%';
    container.appendChild(cv);
    var totals = CARRIERS.map(function(c) { return weightedAvg(carrierYearData[c.name]); });

    allColChart = new Chart(cv, {
      type:'bar',
      data:{labels:CARRIERS.map(function(c){return c.short;}),datasets:[{data:totals.map(function(t){return t.avg;}),_rawAvgs:totals.map(function(t){return t.avg;}),_counts:totals.map(function(t){return t.count;}),_clickable:true,backgroundColor:CARRIERS.map(function(c){return c.color+'cc';}),borderColor:CARRIERS.map(function(c){return c.color;}),borderWidth:1.5,borderRadius:5,borderSkipped:false}]},
      options:barOpts(C_YMAX,function(evt,elements){ if(elements.length>0){ selectedCarr=CARRIERS[elements[0].index]; buildDrillCharts(); showView(); } })
    });
  }

  function buildAllLine() {
    var container = document.getElementById('carrierdrill-allLineView');
    container.innerHTML = '';
    allLineCharts = [];
    var canvasH = Math.max(180, AREA_H - 8);
    var scrollW = document.getElementById('carrierdrill-panelsScroll').clientWidth || container.clientWidth || 900;
    var gaps = (CARRIERS.length - 1) * 6;
    var panelW = Math.max(90, Math.floor((scrollW - gaps - 8) / CARRIERS.length));

    CARRIERS.forEach(function(carrier){
      var grp = document.createElement('div');
      grp.className = 'carrierdrill-carrier-panel';
      grp.title = 'Click to see ' + carrier.name + ' by aircraft class';
      grp.style.width = panelW + 'px';
      grp.style.maxWidth = panelW + 'px';

      var hdr = document.createElement('div');
      hdr.className = 'carrierdrill-panel-header';
      hdr.textContent = carrier.short;
      grp.appendChild(hdr);

      var wrap = document.createElement('div');
      wrap.className = 'carrierdrill-chart-wrap';
      wrap.style.width = panelW + 'px';

      var cv = document.createElement('canvas');
      cv.width = panelW;
      cv.height = canvasH;
      wrap.appendChild(cv);
      grp.appendChild(wrap);
      container.appendChild(grp);

      var d = carrierYearData[carrier.name];
      var avgs = YEARS.map(function(y){ return d[y] ? d[y].avg : null; });
      var cnts = YEARS.map(function(y){ return d[y] ? d[y].count : 0; });

      var chart = new Chart(cv, {
        type:'line',
        data:{labels:YR_LABELS,datasets:[makeDataset(avgs,cnts,carrier.color,C_YMAX)]},
        options:lineOpts(C_YMAX,8,false)
      });
      allLineCharts.push(chart);

      grp.addEventListener('click', function(){
        selectedCarr = carrier;
        buildDrillCharts();
        showView();
      });
    });
  }

  function clearDrillCharts() {
    drillCharts.forEach(function(c){ try { c.destroy(); } catch(e) {} });
    drillCharts = [];
    document.getElementById('carrierdrill-drillColumnView').innerHTML = '';
    document.getElementById('carrierdrill-drillLineView').innerHTML = '';
  }

  function buildDrillCharts() {
    if (!selectedCarr) return;
    clearDrillCharts();
    buildDrillColumn();
    buildDrillLine();
  }

  function buildDrillColumn() {
    var container = document.getElementById('carrierdrill-drillColumnView');
    container.innerHTML = '';
    container.style.height = (AREA_H + 10) + 'px';
    var cv = document.createElement('canvas');
    cv.style.width = '100%';
    cv.style.height = '100%';
    container.appendChild(cv);

    var clsData = carrierClassYearData[selectedCarr.name];
    var classNames = Object.keys(clsData);
    var totals = classNames.map(function(cls){ return weightedAvg(clsData[cls]); });
    var color = selectedCarr.color;

    drillCharts.push(new Chart(cv, {
      type:'bar',
      data:{labels:classNames.map(function(cls){ return CLASS_SHORTS[cls] || cls; }),datasets:[{data:totals.map(function(t){return t.avg;}),_rawAvgs:totals.map(function(t){return t.avg;}),_counts:totals.map(function(t){return t.count;}),backgroundColor:classNames.map(function(){return color+'cc';}),borderColor:classNames.map(function(){return color;}),borderWidth:1.5,borderRadius:5,borderSkipped:false}]},
      options:barOpts(CL_YMAX,null)
    }));
  }

  function buildDrillLine() {
    var container = document.getElementById('carrierdrill-drillLineView');
    container.innerHTML = '';
    var clsData = carrierClassYearData[selectedCarr.name];
    var classNames = Object.keys(clsData);
    var canvasH = Math.max(180, AREA_H - 8);
    var scrollW = document.getElementById('carrierdrill-panelsScroll').clientWidth || 900;
    var gaps = (classNames.length - 1) * 8;
    var panelW = Math.max(120, Math.floor((scrollW - gaps) / classNames.length));
    var color = selectedCarr.color;

    classNames.forEach(function(cls, ci){
      var panel = document.createElement('div');
      panel.className = 'carrierdrill-drill-class-panel';

      var hdr = document.createElement('div');
      hdr.className = 'carrierdrill-panel-header';
      hdr.textContent = CLASS_SHORTS[cls] || cls;
      hdr.style.color = color;
      panel.appendChild(hdr);

      var wrap = document.createElement('div');
      wrap.className = 'carrierdrill-chart-wrap';

      var cv = document.createElement('canvas');
      cv.width = panelW;
      cv.height = canvasH;
      wrap.appendChild(cv);
      panel.appendChild(wrap);
      container.appendChild(panel);

      var yd = clsData[cls];
      var avgs = YEARS.map(function(y){ return yd && yd[y] ? yd[y].avg : null; });
      var cnts = YEARS.map(function(y){ return yd && yd[y] ? yd[y].count : 0; });

      var chart = new Chart(cv, {
        type:'line',
        data:{labels:YR_LABELS,datasets:[makeDataset(avgs,cnts,color,CL_YMAX)]},
        options:lineOpts(CL_YMAX,9,ci===0)
      });
      drillCharts.push(chart);
    });
  }

  function showView() {
    document.getElementById('carrierdrill-allColumnView').style.display = 'none';
    document.getElementById('carrierdrill-allLineView').style.display = 'none';
    document.getElementById('carrierdrill-drillColumnView').style.display = 'none';
    document.getElementById('carrierdrill-drillLineView').style.display = 'none';
    document.getElementById('carrierdrill-yAxisRail').style.display = 'none';

    var backBtn = document.getElementById('carrierdrill-backBtn');
    var drillLbl = document.getElementById('carrierdrill-drillLabel');
    var axisHint = document.getElementById('carrierdrill-axisHint');
    var typeBtn = document.getElementById('carrierdrill-typeToggleBtn');
    var isDrill = (selectedCarr !== null);

    backBtn.style.display = isDrill ? 'inline-block' : 'none';
    drillLbl.style.display = isDrill ? 'block' : 'none';
    if (isDrill) {
      drillLbl.innerHTML = selectedCarr.name + '<span class="drill-sub">— by aircraft class</span>';
    }

    if (!isDrill && chartType === 'column') {
      document.getElementById('carrierdrill-allColumnView').style.display = 'block';
      typeBtn.textContent = '∼ Line Chart';
      typeBtn.classList.remove('active');
      axisHint.textContent = '4-yr weighted avg — click any bar to drill in';
    } else if (!isDrill && chartType === 'line') {
      document.getElementById('carrierdrill-allLineView').style.display = 'flex';
      document.getElementById('carrierdrill-yAxisRail').style.display = 'block';
      typeBtn.textContent = '▮ Column Chart';
      typeBtn.classList.add('active');
      axisHint.textContent = 'Avg carrier delay (min) per year — click any panel to drill in';
      if (allLineCharts[0]) posAxis('carrierdrill-yAxisRail', allLineCharts[0], C_TICKS, C_YMAX);
    } else if (isDrill && chartType === 'column') {
      document.getElementById('carrierdrill-drillColumnView').style.display = 'block';
      typeBtn.textContent = '∼ Line Chart';
      typeBtn.classList.remove('active');
      axisHint.textContent = '4-yr weighted avg — by aircraft class';
    } else if (isDrill && chartType === 'line') {
      document.getElementById('carrierdrill-drillLineView').style.display = 'flex';
      typeBtn.textContent = '▮ Column Chart';
      typeBtn.classList.add('active');
      axisHint.textContent = 'Avg carrier delay (min) per year — by aircraft class';
    }
  }

  document.getElementById('carrierdrill-typeToggleBtn').addEventListener('click', function() {
    chartType = (chartType === 'column') ? 'line' : 'column';
    if (chartType === 'line') {
      buildAllLine();
      if (selectedCarr) buildDrillLine();
    }
    showView();
  });
  document.getElementById('carrierdrill-backBtn').addEventListener('click', function() {
    selectedCarr = null;
    showView();
  });

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var area = document.querySelector('.carrierdrill-viz-chart-area');
      AREA_H = Math.max(520, area ? area.clientHeight + 12 : 560);
      buildAllColumn();
      buildAllLine();
      showView();
    });
  });
}



function initSlotHeat() {
  if (window._slotHeatInitialized || typeof Chart === 'undefined') return;
  window._slotHeatInitialized = true;

  const NAVY = '#122f5e', RED = '#b22543', MUTED = '#3d5278', INK = '#0d1f3c';

  (function () {
    const canvas = document.getElementById('slotheatHeatmapCanvas');
    const tooltip = document.getElementById('slotheatTooltip');
    if (!canvas || !tooltip) return;
    const container = canvas.parentElement;
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const hours = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
    const heatData = {
      Monday:    [10.19,6.46,7.07,7.72,7.84,7.93,7.40,9.22,10.97,13.47,14.05,12.88,14.61,15.91,14.54,15.99,14.54,21.93],
      Tuesday:   [7.23,5.97,5.28,7.44,5.94,7.23,6.49,6.85,7.22,8.93,10.31,9.16,10.42,11.89,12.26,13.06,11.89,15.95],
      Wednesday: [10.16,4.96,5.01,6.43,5.05,7.04,5.92,6.71,7.36,9.69,10.22,11.38,11.02,12.58,11.98,15.02,13.73,20.23],
      Thursday:  [6.80,6.53,5.44,7.68,6.49,7.19,7.35,9.04,8.38,11.58,12.77,15.19,15.32,16.22,15.51,18.08,17.15,22.71],
      Friday:    [8.40,6.62,7.07,8.61,7.34,8.13,8.69,9.18,10.21,12.65,12.84,14.41,15.06,17.20,16.26,18.86,16.84,26.38],
      Saturday:  [7.78,8.16,8.44,10.32,7.90,9.67,10.39,9.38,10.47,12.67,12.83,12.75,14.64,15.42,16.11,16.14,16.22,22.64],
      Sunday:    [9.61,9.02,8.61,9.64,7.63,9.57,9.57,10.89,11.20,13.00,12.76,14.28,16.17,16.83,17.23,20.25,19.98,28.50]
    };
    const PAD = { l: 72, t: 34, r: 18, b: 52 };
    const MIN_VAL = 4, MAX_VAL = 29;

    function heatColor(val) {
      const t = Math.max(0, Math.min(1, (val - MIN_VAL) / (MAX_VAL - MIN_VAL)));
      let r, g, b;
      if (t < 0.5) {
        const u = t * 2;
        r = Math.round(76 + (255 - 76) * u);
        g = Math.round(175 + (235 - 175) * u);
        b = Math.round(80 + (160 - 80) * u);
      } else {
        const u = (t - 0.5) * 2;
        r = Math.round(255 + (178 - 255) * u);
        g = Math.round(235 + (37 - 235) * u);
        b = Math.round(160 + (67 - 160) * u);
      }
      return `rgb(${r},${g},${b})`;
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      const drawW = W - PAD.l - PAD.r;
      const drawH = H - PAD.t - PAD.b;
      const cellW = drawW / hours.length;
      const cellH = drawH / days.length;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px Figtree, Arial';

      days.forEach((day, di) => {
        hours.forEach((hr, hi) => {
          const val = heatData[day][hi];
          const x = PAD.l + hi * cellW;
          const y = PAD.t + di * cellH;
          ctx.fillStyle = heatColor(val);
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          const isBest = day === 'Wednesday' && hr === 9;
          const isWorst = day === 'Sunday' && hr === 22;
          if (isBest || isWorst) {
            ctx.strokeStyle = '#122f5e';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
          }
        });
      });

      ctx.fillStyle = INK;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      days.forEach((day, di) => ctx.fillText(day.slice(0, 3), PAD.l - 10, PAD.t + di * cellH + cellH / 2));

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '11px Figtree, Arial';
      hours.forEach((hr, hi) => {
        if (hi % 2 === 0 || hi === hours.length - 1) {
          ctx.fillText(hr + 'h', PAD.l + hi * cellW + cellW / 2, PAD.t - 7);
        }
      });

      const legW = 150, legH = 12;
      const legX = W - PAD.r - legW;
      const legY = H - PAD.b + 8;
      const grad = ctx.createLinearGradient(legX, 0, legX + legW, 0);
      grad.addColorStop(0, heatColor(MIN_VAL));
      grad.addColorStop(0.5, heatColor((MIN_VAL + MAX_VAL) / 2));
      grad.addColorStop(1, heatColor(MAX_VAL));
      ctx.fillStyle = grad;
      ctx.fillRect(legX, legY, legW, legH);

      ctx.fillStyle = MUTED;
      ctx.font = '10px Figtree, Arial';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('Good · 4 min', legX, legY + legH + 4);
      ctx.textAlign = 'right';
      ctx.fillText('Bad · 29+ min', legX + legW, legY + legH + 4);
    }

    canvas.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const drawW = canvas.width - PAD.l - PAD.r;
      const drawH = canvas.height - PAD.t - PAD.b;
      const cellW = drawW / hours.length;
      const cellH = drawH / days.length;
      const hi = Math.floor((mx - PAD.l) / cellW);
      const di = Math.floor((my - PAD.t) / cellH);
      if (hi >= 0 && hi < hours.length && di >= 0 && di < days.length) {
        const day = days[di], hour = hours[hi], val = heatData[day][hi];
        tooltip.textContent = `${day}, ${hour}:00 → ${val} min avg controllable delay`;
        tooltip.style.display = 'block';
        const pct_x = e.offsetX / canvas.offsetWidth;
        tooltip.style.left = (pct_x > 0.6 ? e.offsetX - 230 : e.offsetX + 10) + 'px';
        tooltip.style.top = (e.offsetY - 30) + 'px';
      } else {
        tooltip.style.display = 'none';
      }
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    function resize() {
      const rect = container.getBoundingClientRect();
      const targetWidth = Math.max(300, Math.floor(rect.width));
      const targetHeight = Math.max(320, Math.floor(rect.height));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      draw();
    }

    window.addEventListener('resize', resize);
    resize();
  })();

  (function () {
    const el = document.getElementById('slotheatSlotCanvas');
    if (!el) return;
    const ctx = el.getContext('2d');
    const sunLabels = ['Sun 19h', 'Sun 20h', 'Sun 21h', 'Sun 22h'];
    const wedLabels = ['Wed 07h', 'Wed 08h', 'Wed 09h', 'Wed 10h', 'Wed 11h'];
    const allLabels = [...sunLabels, '', ...wedLabels];
    const sunDelays = [17.23, 20.25, 19.98, 28.50];
    const wedDelays = [5.01, 6.43, 5.05, 7.04, 5.92];
    const sunPadded = [...sunDelays, null, null, null, null, null, null];
    const wedPadded = [null, null, null, null, null, ...wedDelays];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets: [
          { label: 'Sunday evening problem zone', data: sunPadded, backgroundColor: 'rgba(178,37,67,0.78)', borderColor: RED, borderWidth: 1, borderRadius: 4 },
          { label: 'Wednesday morning sweet spot', data: wedPadded, backgroundColor: 'rgba(18,47,94,0.72)', borderColor: NAVY, borderWidth: 1, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 15, family: 'Figtree' }, color: INK, boxWidth: 12, padding: 10 } },
          tooltip: { filter: item => item.raw !== null, callbacks: { label: item => ` ${item.raw} min average delay` } }
        },
        scales: {
          x: { ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED, maxRotation: 35, callback: function(val, idx) { return allLabels[idx]; } }, grid: { display: false } },
          y: { min: 0, max: 32, ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED, stepSize: 4 }, grid: { color: 'rgba(18,47,94,0.08)' }, title: { display: true, text: 'Average delay (min)', font: { size: 20, family: 'Figtree' }, color: MUTED } }
        }
      },
      plugins: [{
        id: 'slotAnnotations',
        beforeDatasetsDraw(chart) {
          const c = chart.ctx, x = chart.scales.x, chartArea = chart.chartArea;
          const leftZoneStart = chart.getDatasetMeta(0).data[0].x - x.width / allLabels.length * 0.55;
          const leftZoneEnd = chart.getDatasetMeta(0).data[3].x + x.width / allLabels.length * 0.55;
          const rightZoneStart = chart.getDatasetMeta(1).data[5].x - x.width / allLabels.length * 0.55;
          const rightZoneEnd = chart.getDatasetMeta(1).data[9].x + x.width / allLabels.length * 0.55;
          c.save();
          c.fillStyle = 'rgba(178,37,67,0.04)';
          c.fillRect(leftZoneStart, chartArea.top, leftZoneEnd - leftZoneStart, chartArea.bottom - chartArea.top);
          c.fillStyle = 'rgba(18,47,94,0.04)';
          c.fillRect(rightZoneStart, chartArea.top, rightZoneEnd - rightZoneStart, chartArea.bottom - chartArea.top);
          c.restore();
        },
        afterDatasetsDraw(chart) {
          const c = chart.ctx, chartArea = chart.chartArea, sunMeta = chart.getDatasetMeta(0), wedMeta = chart.getDatasetMeta(1);
          c.save();
          c.font = 'bold 9px Figtree, Arial';
          c.fillStyle = RED;
          c.textAlign = 'center';
          c.fillText('Problem Zone', (sunMeta.data[0].x + sunMeta.data[3].x) / 2, chartArea.top + 12);
          c.fillStyle = NAVY;
          c.fillText('Sweet Spot', (wedMeta.data[5].x + wedMeta.data[9].x) / 2, chartArea.top + 12);
          c.restore();
        }
      }]
    });
  })();
}



function initTrendShift() {
  if (window._trendShiftInitialized || typeof Chart === 'undefined') return;
  window._trendShiftInitialized = true;

  const NAVY = '#122f5e', RED = '#b22543', MUTED = '#3d5278', INK = '#0d1f3c';
  let nasChart, staffChart;

  (function () {
    const el = document.getElementById('trendshiftNasCanvas');
    if (!el) return;
    const ctx = el.getContext('2d');
    const nasData = [3.772, 3.525, 4.167, 5.708];
    const carrierData = [7.024, 6.284, 4.914, 4.846];

    nasChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2022', '2023', '2024', '2025'],
        datasets: [
          {
            label: 'NAS delay (minutes)',
            data: nasData,
            borderColor: RED,
            backgroundColor: 'rgba(178,37,67,0.10)',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: RED,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Carrier delay (minutes)',
            data: carrierData,
            borderColor: NAVY,
            backgroundColor: 'rgba(18,47,94,0.08)',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: NAVY,
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 15, family: 'Figtree' }, color: INK, boxWidth: 12, padding: 12 }
          },
          tooltip: {
            callbacks: { label(ctx) { return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)} min`; } }
          }
        },
        scales: {
          x: { ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED }, grid: { display: false } },
          y: {
            min: 2, max: 9,
            ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED, stepSize: 1 },
            grid: { color: 'rgba(18,47,94,0.08)' },
            title: { display: true, text: 'Average minutes per flight', font: { size: 15, family: 'Figtree' }, color: MUTED }
          }
        }
      },
      plugins: [{
        id: 'trendLabels',
        afterDatasetsDraw(chart) {
          const c = chart.ctx;
          const nasMeta = chart.getDatasetMeta(0);
          const carMeta = chart.getDatasetMeta(1);
          c.save();
          c.font = 'bold 20px Figtree, Arial';
          c.fillStyle = RED;
          c.textAlign = 'left';
          c.fillText('+5', Math.min(nasMeta.data[3].x + 10, chart.chartArea.right - 48), nasMeta.data[3].y + 10);
          c.fillStyle = NAVY;
          c.fillText('−3', Math.min(carMeta.data[3].x + 10, chart.chartArea.right - 48), carMeta.data[3].y + 16);
          c.restore();
        }
      }]
    });

    window.addEventListener('resize', function () {
      try { if (nasChart) nasChart.resize(); } catch (e) {}
    });
  })();

  (function () {
    const el = document.getElementById('trendshiftStaffCanvas');
    if (!el) return;
    const ctx = el.getContext('2d');
    const totalDelay = [7.38, 10.14, 13.54, 16.13];
    const nasDelay = [2.89, 4.39, 6.01, 4.87];
    const carrDelay = totalDelay.map((t, i) => +(t - nasDelay[i]).toFixed(2));
    const gapNotes  = ['Adequate', 'Monitor', '+2–3 ATC\n+1–2 Gate', '+2–3 ATC\n+2 Crew'];
    const gapColors = ['#2e8a32', '#a07800', RED, RED];

    staffChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [['Morning','05–12'], ['Midday','12–15'], ['Afternoon','15–19'], ['Evening','19–24']],
        datasets: [
          {
            label: 'Carrier / Other Delay  (airline-side)',
            data: carrDelay,
            backgroundColor: 'rgba(61,82,120,0.50)',
            borderColor: 'rgba(61,82,120,0.85)',
            borderWidth: 1,
            borderRadius: 4,
            stack: 'delay'
          },
          {
            label: 'NAS Delay  (airport-driven — staffing-sensitive)',
            data: nasDelay,
            backgroundColor: 'rgba(178,37,67,0.78)',
            borderColor: 'rgba(178,37,67,1.0)',
            borderWidth: 1,
            borderRadius: 4,
            stack: 'delay'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 15, family: 'Figtree' }, color: INK, boxWidth: 12, padding: 10 }
          },
          tooltip: {
            callbacks: {
              footer(items) {
                const notes = ['No staffing gap', 'Monitor closely', '+2–3 ATC coordinators, +1–2 gate staff', '+2–3 ATC coordinators, +2 crew dispatchers'];
                return `Staffing gap: ${notes[items[0].dataIndex]}`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true, ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED }, grid: { display: false } },
          y: {
            stacked: true,
            min: 0, max: 18,
            ticks: { font: { size: 15, family: 'Figtree' }, color: MUTED, stepSize: 4 },
            grid: { color: 'rgba(18,47,94,0.08)' },
            title: { display: true, text: 'Average delay (min)', font: { size: 15, family: 'Figtree' }, color: MUTED }
          }
        }
      },
      plugins: [{
        id: 'gapLabels',
        afterDatasetsDraw(chart) {
          const c = chart.ctx;
          const y = chart.scales.y;
          const meta0 = chart.getDatasetMeta(0);
          c.save();
          gapNotes.forEach((note, i) => {
            const bar = meta0.data[i];
            const topY = y.getPixelForValue(totalDelay[i]);
            c.font = 'bold 13px Figtree, Arial';
            c.fillStyle = gapColors[i];
            c.textAlign = 'center';
            note.split('\n').forEach((line, li, arr) => {
              c.fillText(line, bar.x, topY - 6 - (arr.length - 1 - li) * 15);
            });
          });
          c.restore();
        }
      }]
    });

    window.addEventListener('resize', function () {
      try { if (staffChart) staffChart.resize(); } catch (e) {}
    });
  })();
}



let _slideReplayTimer = null;
let _animTimer = null;
let _animGen = 0;
let _lateHourAnimTimer = null;
let _lateHourAnimGen = 0;
let _slide7VisitToken = 0;
let _slotHeatDiagTimer = null;
let _slide7SuppressAutoDraw = false;

function clearLateHourChart() {
  if (typeof _animTimer !== 'undefined' && _animTimer) clearTimeout(_animTimer);
  _animGen += 1;
  const chartEl = document.getElementById('todChart');
  if (chartEl) {
    try { chartEl.innerHTML = ''; } catch (e) {}
  }
}

let _lateHourAnimating = false;

function restartCssAnimations(root) {
  if (!root) return;
  const animatedEls = [root, ...root.querySelectorAll('*')];
  animatedEls.forEach((el) => {
    const cs = window.getComputedStyle(el);
    if (cs.animationName && cs.animationName !== 'none') {
      const prev = el.style.animation;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = prev || '';
    }
  });
}

function replayPlotlyHorizontalBar(plotId, duration) {
  if (typeof Plotly === 'undefined') return Promise.resolve();
  const el = document.getElementById(plotId);
  if (!el || !el.data || !el.data[0] || !Array.isArray(el.data[0].x)) return Promise.resolve();

  const finalX = el.data[0].x.slice();
  const total = duration || 1500;
  el.classList.add('transition-prep');

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return Plotly.restyle(plotId, { x: [finalX.map(() => 0)] }, [0]).then(() => {
    requestAnimationFrame(() => {
      el.classList.remove('transition-prep');
      const start = performance.now();

      function step(now) {
        const progress = Math.min(1, (now - start) / total);
        const eased = easeInOutCubic(progress);
        const currentX = finalX.map(v => v * eased);
        Plotly.restyle(plotId, { x: [currentX] }, [0]);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          Plotly.restyle(plotId, { x: [finalX] }, [0]);
        }
      }

      // Kick immediately so there is no visible pause at zero before movement starts.
      step(start + 16);
      requestAnimationFrame(step);
    });
  }).catch(() => {
    el.classList.remove('transition-prep');
  });
}

function replayWeatherTransition() {
  const key = window._weatherCurrentKey || (document.getElementById('winterBtn')?.classList.contains('active') ? 'winter' : 'all');
  if (typeof applyDataset === 'function') applyDataset(key);

  const container = document.querySelector('.weather-bar-chart');
  if (container) container.classList.add('transition-prep');

  const bars = ['lateBar','carrierBar','nasBar','weatherBar','securityBar']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const values = [...document.querySelectorAll('.weather-bar-value, .weather-security-inline')];
  const targets = bars.map((bar) => ({ el: bar, width: parseFloat(bar.style.width || '0') || 0 }));

  bars.forEach((bar) => {
    bar.style.transition = 'none';
    bar.style.width = '0%';
  });
  values.forEach(v => { v.style.transition = 'none'; v.style.opacity = '0'; });

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  requestAnimationFrame(() => {
    if (container) container.classList.remove('transition-prep');
    const start = performance.now();
    const total = 1200;
    function frame(now) {
      const p = Math.min(1, (now - start) / total);
      const e = easeInOut(p);
      targets.forEach(({el, width}) => { el.style.width = (width * e) + '%'; });
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        values.forEach(v => { v.style.transition = 'opacity 220ms ease'; v.style.opacity = '1'; });
      }
    }
    requestAnimationFrame(frame);
  });
}

function replayLateHourTransition(forceAllYears) {
  if (typeof Plotly === 'undefined' || typeof drawTodChart !== 'function' || typeof seriesByYear === 'undefined') return;
  const visitToken = ++_slide7VisitToken;

  clearLateHourChart();

  if (forceAllYears) {
    currentSelection = 'All Years';
    const yearValueEl = document.getElementById('yearValue');
    const yearButtons = Array.from(document.querySelectorAll('.latehour-year-btn, .year-btn'));
    if (yearValueEl) yearValueEl.textContent = currentSelection;
    yearButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.year === 'All Years'));
    if (typeof updateKpis === 'function') updateKpis(currentSelection);
  }

  const key = (typeof currentSelection !== 'undefined' && currentSelection) ? currentSelection : 'All Years';
  if (visitToken !== _slide7VisitToken) return;
  if (typeof currentIndex !== 'undefined' && currentIndex !== 6) return;

  drawTodChart(key);
}

function replayRouteStateTransition() {
  const list = document.getElementById('stateList');
  if (list) list.classList.add('transition-prep');
  const fills = [...document.querySelectorAll('#stateList .bar-fill')];
  fills.forEach((el) => {
    const target = parseFloat(el.style.width || (el.getAttribute('style')?.match(/width:\s*([^;]+)/)?.[1] || '0')) || 0;
    el.dataset.targetWidth = String(target);
    el.style.transition = 'none';
    el.style.width = '0%';
  });

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  requestAnimationFrame(() => {
    if (list) list.classList.remove('transition-prep');
    const start = performance.now();
    const total = 1200;
    function frame(now) {
      const p = Math.min(1, (now - start) / total);
      const e = easeInOut(p);
      fills.forEach((el) => {
        const target = parseFloat(el.dataset.targetWidth || '0') || 0;
        el.style.width = (target * e) + '%';
      });
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  const replayBtn = document.getElementById('replayBtn');
  if (replayBtn) replayBtn.click();
}

function replaySlotHeatDiagonal() {
  const canvas = document.getElementById('slotheatHeatmapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const hours = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
  const heatData = {
    Monday:[10.19,6.46,7.07,7.72,7.84,7.93,7.40,9.22,10.97,13.47,14.05,12.88,14.61,15.91,14.54,15.99,14.54,21.93],
    Tuesday:[7.23,5.97,5.28,7.44,5.94,7.23,6.49,6.85,7.22,8.93,10.31,9.16,10.42,11.89,12.26,13.06,11.89,15.95],
    Wednesday:[10.16,4.96,5.01,6.43,5.05,7.04,5.92,6.71,7.36,9.69,10.22,11.38,11.02,12.58,11.98,15.02,13.73,20.23],
    Thursday:[6.80,6.53,5.44,7.68,6.49,7.19,7.35,9.04,8.38,11.58,12.77,15.19,15.32,16.22,15.51,18.08,17.15,22.71],
    Friday:[8.40,6.62,7.07,8.61,7.34,8.13,8.69,9.18,10.21,12.65,12.84,14.41,15.06,17.20,16.26,18.86,16.84,26.38],
    Saturday:[7.78,8.16,8.44,10.32,7.90,9.67,10.39,9.38,10.47,12.67,12.83,12.75,14.64,15.42,16.11,16.14,16.22,22.64],
    Sunday:[9.61,9.02,8.61,9.64,7.63,9.57,9.57,10.89,11.20,13.00,12.76,14.28,16.17,16.83,17.23,20.25,19.98,28.50]
  };
  const PAD = { l: 72, t: 34, r: 18, b: 52 };
  const MIN_VAL = 4, MAX_VAL = 29;
  function heatColor(val) {
    const t = Math.max(0, Math.min(1, (val - MIN_VAL) / (MAX_VAL - MIN_VAL)));
    let r, g, b;
    if (t < 0.5) {
      const u = t * 2;
      r = Math.round(76 + (255 - 76) * u);
      g = Math.round(175 + (235 - 175) * u);
      b = Math.round(80 + (160 - 80) * u);
    } else {
      const u = (t - 0.5) * 2;
      r = Math.round(255 + (178 - 255) * u);
      g = Math.round(235 + (37 - 235) * u);
      b = Math.round(160 + (67 - 160) * u);
    }
    return `rgb(${r},${g},${b})`;
  }
  function drawLabelsAndLegend(W, H) {
    const drawW = W - PAD.l - PAD.r, drawH = H - PAD.t - PAD.b;
    const cellW = drawW / hours.length, cellH = drawH / days.length;
    ctx.fillStyle = '#0d1f3c';
    ctx.font = '12px Figtree, Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    days.forEach((day, di) => ctx.fillText(day.slice(0,3), PAD.l - 10, PAD.t + di * cellH + cellH / 2));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '11px Figtree, Arial';
    hours.forEach((hr, hi) => { if (hi % 2 === 0 || hi === hours.length - 1) ctx.fillText(hr + 'h', PAD.l + hi * cellW + cellW / 2, PAD.t - 7); });
    const legW = 150, legH = 12, legX = W - PAD.r - legW, legY = H - PAD.b + 8;
    const grad = ctx.createLinearGradient(legX, 0, legX + legW, 0);
    grad.addColorStop(0, heatColor(MIN_VAL)); grad.addColorStop(0.5, heatColor((MIN_VAL + MAX_VAL) / 2)); grad.addColorStop(1, heatColor(MAX_VAL));
    ctx.fillStyle = grad; ctx.fillRect(legX, legY, legW, legH);
    ctx.fillStyle = '#3d5278'; ctx.font = '10px Figtree, Arial'; ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; ctx.fillText('Good · 4 min', legX, legY + legH + 4);
    ctx.textAlign = 'right'; ctx.fillText('Bad · 29+ min', legX + legW, legY + legH + 4);
  }
  function drawTilesUpToDiag(W, H, maxD) {
    const drawW = W - PAD.l - PAD.r, drawH = H - PAD.t - PAD.b;
    const cellW = drawW / hours.length, cellH = drawH / days.length;
    days.forEach((day, di) => {
      hours.forEach((hr, hi) => {
        if (di + hi !== maxD) return;
        const val = heatData[day][hi], x = PAD.l + hi * cellW, y = PAD.t + di * cellH;
        ctx.fillStyle = heatColor(val);
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        const isBest = day === 'Wednesday' && hr === 9;
        const isWorst = day === 'Sunday' && hr === 22;
        if (isBest || isWorst) {
          ctx.strokeStyle = '#122f5e';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
        }
      });
    });
  }
  clearTimeout(_slotHeatDiagTimer);
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  drawLabelsAndLegend(W, H);
  const maxD = (hours.length - 1) + (days.length - 1);
  let d = 0;
  function step() {
    drawTilesUpToDiag(W, H, d);
    if (d < maxD) { d++; _slotHeatDiagTimer = setTimeout(step, 34); }
  }
  step();

  const slotChart = (typeof Chart !== 'undefined' && Chart.getChart) ? Chart.getChart(document.getElementById('slotheatSlotCanvas')) : null;
  if (slotChart) { try { slotChart.reset(); slotChart.update(); } catch (e) {} }
}

function replayChartJsInSlide(slideEl) {
  if (typeof Chart === 'undefined' || !Chart.getChart || !slideEl) return;
  slideEl.querySelectorAll('canvas').forEach((canvas) => {
    const chart = Chart.getChart(canvas);
    if (chart) {
      try {
        chart.stop();
        chart.reset();
        chart.render();
        chart.update();
      } catch (e) {}
    }
  });
}

function replaySlideTransitions(index) {
  const slide = document.querySelector('.deck-slide[data-slide-index="' + index + '"]');
  if (!slide) return;

  restartCssAnimations(slide);

  if (index === 2) replayPlotlyHorizontalBar('bar', 1500);
  if (index === 3) { replayPlotlyHorizontalBar('ontime', 2600); replayPlotlyHorizontalBar('satisfaction', 2600); }
  if (index === 4) replayWeatherTransition();
  if (index === 6) return;
  if (index === 7) replayRouteStateTransition();
  if (index === 9) replayChartJsInSlide(slide);
  if (index === 11) replaySlotHeatDiagonal();
  if (index === 12) replayChartJsInSlide(slide);
  if (index === 15) restartCssAnimations(slide);

  setTimeout(() => {
    if (slide.classList.contains('transition-prep')) slide.classList.remove('transition-prep');
  }, 30);
}


buildNav();
updateUI();

const planeConfigs = [
  { top: '14%', dur: 19, delay: 0,  anim: 'fly1', size: 52 },
  { top: '30%', dur: 26, delay: 7,  anim: 'fly2', size: 36 },
  { top: '50%', dur: 21, delay: 2,  anim: 'fly3', size: 62 },
  { top: '65%', dur: 30, delay: 14, anim: 'fly1', size: 42 },
  { top: '24%', dur: 23, delay: 9,  anim: 'fly2', size: 46 },
  { top: '78%', dur: 17, delay: 5,  anim: 'fly3', size: 30 }
];
const canvas = document.getElementById('planeCanvas');
if (canvas) {
  planeConfigs.forEach(function(cfg) {
    const w = document.createElement('div');
    w.className = 'plane';
    w.style.cssText =
      'top:' + cfg.top +
      ';left:0px' +
      ';font-size:' + cfg.size + 'px' +
      ';color:rgba(255,255,255,0.85)' +
      ';line-height:1' +
      ';animation:' + cfg.anim + ' ' + cfg.dur + 's linear ' + cfg.delay + 's infinite';
    w.textContent = '✈';
    canvas.appendChild(w);
  });
}

function initPlots() {
  if (plotsInitialized || typeof Plotly === 'undefined') return;
  plotsInitialized = true;

  const routeData = [["ORD", 6709, "Chicago", "Chicago O'Hare International Airport"], ["MCO", 6447, "Orlando", "Orlando International Airport"], ["ATL", 5952, "Atlanta", "Hartsfield Jackson Atlanta International Airport"], ["LAX", 5147, "Los Angeles", "Los Angeles International Airport"], ["FLL", 4721, "Fort Lauderdale", "Fort Lauderdale Hollywood International Airport"], ["SFO", 4343, "San Francisco", "San Francisco International Airport"], ["MIA", 3990, "Miami", "Miami International Airport"], ["IAH", 3673, "Houston", "George Bush Intercontinental Airport"], ["BOS", 3588, "Boston", "Boston Logan International Airport"], ["CLT", 3583, "Charlotte", "Charlotte Douglas International Airport"], ["PBI", 3423, "West Palm Beach", "Palm Beach International Airport"], ["DFW", 3354, "Dallas-Fort Worth", "Dallas Fort Worth International Airport"], ["DTW", 3224, "Detroit", "Detroit Metropolitan Wayne County Airport"], ["DEN", 3193, "Denver", "Denver International Airport"], ["LAS", 2983, "Las Vegas", "Harry Reid International Airport"], ["TPA", 2713, "Tampa", "Tampa International Airport"], ["RDU", 2562, "Raleigh/Durham", "Raleigh-Durham International Airport"], ["PHX", 2481, "Phoenix", "Phoenix Sky Harbor International Airport"], ["MSP", 2075, "Minneapolis", "Minneapolis–Saint Paul International Airport / Wold–Chamberlain Field"], ["RSW", 2061, "Fort Myers", "Southwest Florida International Airport"], ["IND", 2006, "Indianapolis", "Indianapolis International Airport"], ["SEA", 1980, "Seattle", "Seattle–Tacoma International Airport"], ["CLE", 1939, "Cleveland", "Cleveland Hopkins International Airport"], ["AUS", 1928, "Austin", "Austin Bergstrom International Airport"], ["BNA", 1872, "Nashville", "Nashville International Airport"], ["PIT", 1850, "Pittsburgh", "Pittsburgh International Airport"], ["CMH", 1672, "Columbus", "John Glenn Columbus International Airport"], ["SAN", 1534, "San Diego", "San Diego International Airport"], ["IAD", 1477, "Dulles", "Washington Dulles International Airport"], ["CHS", 1380, "Charleston", "Charleston International Airport"], ["JAX", 1281, "Jacksonville", "Jacksonville International Airport"], ["SLC", 1236, "Salt Lake City", "Salt Lake City International Airport"], ["MSY", 1216, "New Orleans", "Louis Armstrong New Orleans International Airport"], ["SNA", 1075, "Santa Ana", "John Wayne Orange County International Airport"], ["CVG", 1070, "Cincinnati / Covington", "Cincinnati Northern Kentucky International Airport"], ["SAV", 1002, "Savannah", "Savannah Hilton Head International Airport"], ["MYR", 983, "Myrtle Beach", "Myrtle Beach International Airport"], ["STL", 939, "St Louis", "St. Louis Lambert International Airport"], ["PWM", 924, "Portland", "Portland International Jetport"], ["SRQ", 915, "Sarasota/Bradenton", "Sarasota Bradenton International Airport"], ["SDF", 862, "Louisville", "Louisville Muhammad Ali International Airport"], ["PDX", 797, "Portland", "Portland International Airport"], ["GRR", 751, "Grand Rapids", "Gerald R. Ford International Airport"], ["MKE", 745, "Milwaukee", "General Mitchell International Airport"], ["ORF", 669, "Norfolk", "Norfolk International Airport"], ["BTV", 651, "Burlington", "Patrick Leahy Burlington International Airport"], ["ROC", 577, "Rochester", "Frederick Douglass Greater Rochester International Airport"], ["GSP", 548, "Greenville/Greer/Spartanburg", "Greenville-Spartanburg International Airport"], ["SAT", 507, "San Antonio", "San Antonio International Airport"], ["SYR", 495, "Syracuse", "Syracuse Hancock International Airport"], ["BGR", 427, "Bangor", "Bangor International Airport"], ["BUF", 409, "Buffalo", "Buffalo Niagara International Airport"], ["EYW", 375, "Key West", "Key West International Airport"], ["MCI", 366, "Kansas City", "Kansas City International Airport"], ["BZN", 365, "Bozeman", "Bozeman Yellowstone International Airport"], ["MEM", 357, "Memphis", "Memphis International Airport"], ["DCA", 342, "Washington", "Ronald Reagan Washington National Airport"], ["MSN", 333, "Madison", "Dane County Regional Truax Field"], ["JAC", 290, "Jackson", "Jackson Hole Airport"], ["SMF", 281, "Sacramento", "Sacramento International Airport"], ["AVL", 259, "Asheville", "Asheville Regional Airport"], ["RIC", 235, "Richmond", "Richmond International Airport"], ["ILM", 210, "Wilmington", "Wilmington International Airport"], ["HHH", 210, "Hilton Head Island", "Hilton Head Airport"], ["TYS", 164, "Knoxville/Maryville", "McGhee Tyson Airport"], ["HNL", 127, "Honolulu, Oahu", "Daniel K. Inouye International Airport"], ["VPS", 121, "Valparaiso", "Destin-Fort Walton Beach Airport"], ["EGE", 102, "Eagle", "Eagle County Regional Airport"], ["ANC", 102, "Anchorage", "Ted Stevens Anchorage International Airport"], ["MTJ", 84, "Montrose", "Montrose Regional Airport"], ["HDN", 84, "Hayden", "Yampa Valley Airport"], ["BHM", 79, "Birmingham", "Birmingham-Shuttlesworth International Airport"], ["DSM", 68, "Des Moines", "Des Moines International Airport"], ["CAE", 58, "Columbia", "Columbia Metropolitan Airport"], ["CHA", 56, "Chattanooga", "Chattanooga Metropolitan Airport (Lovell Field)"], ["ALB", 42, "Albany", "Albany International Airport"], ["MDW", 33, "Chicago", "Chicago Midway International Airport"], ["ATW", 26, "Appleton", "Appleton International Airport"], ["FNT", 22, "Flint", "Bishop International Airport"], ["GSO", 22, "Greensboro", "Piedmont Triad International Airport"], ["PSP", 14, "Palm Springs", "Palm Springs International Airport"], ["PVD", 11, "Providence/Warwick", "Rhode Island T. F. Green International Airport"], ["SBN", 7, "South Bend", "South Bend International Airport"], ["ITH", 4, "Ithaca", "Ithaca Tompkins Regional Airport"], ["OMA", 4, "Omaha", "Eppley Airfield"], ["OGG", 3, "Kahului", "Kahului International Airport"], ["RNO", 3, "Reno", "Reno Tahoe International Airport"], ["XNA", 2, "Fayetteville/Springdale/Rogers", "Northwest Arkansas National Airport"]];
  const destLats = [41.9786, 28.429399, 33.6367, 33.942501, 26.072599, 37.619806, 25.796011, 29.9844, 42.36197, 35.214001, 26.683201, 32.896801, 42.21377, 39.860027, 36.083361, 27.9755, 35.878659, 33.435302, 44.880081, 26.534685, 39.7173, 47.447943, 41.411701, 30.197535, 36.1245, 40.491501, 39.998001, 32.733601, 38.9445, 32.896159, 30.492469, 40.78886, 29.993401, 33.675063, 39.048801, 32.126591, 33.679699, 38.748697, 43.646198, 27.394631, 38.1706, 45.588699, 42.880798, 42.947201, 36.895341, 44.471901, 43.1189, 34.895699, 29.533701, 43.111198, 44.806364, 42.940498, 24.556119, 39.301699, 45.778853, 35.043845, 38.8521, 43.1399, 43.6073, 38.6954, 35.435488, 37.505199, 34.272345, 32.2244, 35.811001, 21.318387, 30.481315, 39.642601, 61.179004, 38.5098, 40.481201, 33.562877, 41.534027, 33.938172, 35.035301, 42.748299, 41.785999, 44.258515, 42.969294, 36.09937, 33.8297, 41.725038, 41.708304, 42.491001, 41.3032, 20.896263, 39.4991, 36.281898];
  const destLons = [-87.9048, -81.308998, -84.428101, -118.407997, -80.152702, -122.374821, -80.289751, -95.3414, -71.0079, -80.9431, -80.095596, -97.038002, -83.353786, -104.673792, -115.151817, -82.533203, -78.7873, -112.005905, -93.221741, -81.752816, -86.294403, -122.310276, -81.8498, -97.662015, -86.6782, -80.232903, -82.891899, -117.190002, -77.455803, -80.038151, -81.687813, -111.979866, -90.264673, -117.869281, -84.667801, -81.19998, -78.928299, -90.370003, -70.309303, -82.554359, -85.735076, -122.598, -85.522797, -87.896599, -76.201, -73.153297, -77.672401, -82.218903, -98.469803, -76.1063, -68.826668, -78.732201, -81.759579, -94.713893, -111.153711, -89.97634, -77.037697, -89.337502, -110.737999, -121.591003, -82.541853, -77.319702, -77.905117, -80.697502, -83.994003, -157.92567, -86.515839, -106.917999, -149.992561, -107.893997, -107.218002, -86.750712, -93.656719, -81.123022, -85.203796, -73.801697, -87.752403, -88.519, -83.743355, -79.937262, -116.507004, -71.425668, -86.316922, -76.458397, -95.894096, -156.431837, -119.767998, -94.306801];
  const topBarCodes = ["LAS", "DEN", "DTW", "DFW", "PBI", "CLT", "BOS", "IAH", "MIA", "SFO", "FLL", "LAX", "ATL", "MCO", "ORD"];
  const mapEl = document.getElementById('map');
  const barEl = document.getElementById('bar');
  const ewrLat = 40.6894;
  const ewrLon = -74.170545;

  const codeToIndex = Object.fromEntries(routeData.map((row, i) => [row[0], i]));
  const topCodeToBarIndex = Object.fromEntries(topBarCodes.map((code, i) => [code, i]));

  const lineTraces = routeData.map((row, i) => ({
    type: 'scattergeo',
    mode: 'lines',
    lat: [ewrLat, destLats[i]],
    lon: [ewrLon, destLons[i]],
    customdata: [[row[0], row[1], row[2], row[3]]],
    hovertemplate: '<b>%{customdata[0]}</b> — %{customdata[2]}<br>%{customdata[3]}<br>Departures: %{customdata[1]:,}<extra></extra>',
    line: {width: 2.2, color: 'rgba(31,95,191,0.22)'},
    showlegend: false
  }));

  const markerTrace = {
    type: 'scattergeo',
    mode: 'markers',
    lat: destLats,
    lon: destLons,
    customdata: routeData,
    hovertemplate: '<b>%{customdata[0]}</b> — %{customdata[2]}<br>%{customdata[3]}<br>Departures: %{customdata[1]:,}<extra></extra>',
    marker: {
      size: routeData.map(r => Math.max(10, 8 + Math.sqrt(r[1]) / 3.6)),
      color: routeData.map(r => r[1]),
      colorscale: 'Blues',
      reversescale: true,
      opacity: 0.92,
      line: {color: '#ffffff', width: 1.3},
      colorbar: {title: 'Departures', thickness: 12, len: 0.6, x: 0.98, y: 0.5, outlinewidth: 0}
    },
    showlegend: false
  };

  const newarkTrace = {
    type: 'scattergeo',
    mode: 'markers+text',
    lat: [ewrLat],
    lon: [ewrLon],
    text: ['EWR'],
    textposition: 'top center',
    hovertemplate: '<b>EWR</b><br>Newark Liberty International Airport<extra></extra>',
    marker: {size: 15, color: '#c62828', line: {color:'#fff', width: 1.6}},
    showlegend: false
  };

  Plotly.newPlot('map', [...lineTraces, markerTrace, newarkTrace], {
    margin: {l: 0, r: 0, t: 6, b: 0},
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    geo: {
      scope: 'usa', projection: {type: 'albers usa'}, bgcolor: 'rgba(0,0,0,0)',
      showland: true, landcolor: '#eef2f8', subunitcolor: '#c2cee0', countrycolor: '#c2cee0', showlakes: true, lakecolor: '#ffffff'
    }
  }, {responsive: true, displaylogo: false});

  Plotly.newPlot('bar', [{
    type: 'bar',
    orientation: 'h',
    x: topBarCodes.map(code => routeData[codeToIndex[code]][1]),
    y: topBarCodes,
    customdata: topBarCodes.map(code => routeData[codeToIndex[code]]),
    text: topBarCodes.map(code => {
      const val = routeData[codeToIndex[code]][1];
      const total = routeData.reduce((s, r) => s + r[1], 0);
      return `${val.toLocaleString()} (${(val / total * 100).toFixed(1)}%)`;
    }),
    textposition: 'inside',
    insidetextanchor: 'start',
    textfont: {size: 11, color: '#ffffff'},
    cliponaxis: true,
    marker: {
      color: topBarCodes.map(code => routeData[codeToIndex[code]][1]),
      colorscale: 'Blues',
      reversescale: true,
      line: {color: '#ffffff', width: 1}
    },
    hovertemplate: '<b>%{customdata[0]}</b> — %{customdata[2]}<br>%{customdata[3]}<br>Departures: %{x:,}<extra></extra>'
  }], {
    margin: {l: 50, r: 6, t: 4, b: 40},
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    bargap: 0.22,
    uniformtext: {mode: 'hide', minsize: 9},
    xaxis: { title: 'Departures', gridcolor: '#dbe4f2', zeroline: false, automargin: true, tickfont: {size: 11}, range: [0, Math.max(...topBarCodes.map(code => routeData[codeToIndex[code]][1])) * 1.04] },
    yaxis: { title: '', automargin: true, tickfont: {size: 11} }
  }, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d','lasso2d','toggleSpikelines']
  });

  function hoverBarForCode(code) {
    if (code in topCodeToBarIndex) {
      Plotly.Fx.hover('bar', [{curveNumber: 0, pointNumber: topCodeToBarIndex[code]}]);
    }
  }

  function hoverMapForCode(code) {
    const routeIdx = codeToIndex[code];
    if (routeIdx == null) return;
    const markerTraceIndex = lineTraces.length;
    Plotly.Fx.hover('map', [{curveNumber: markerTraceIndex, pointNumber: routeIdx}], ['geo']);
  }

  mapEl.on('plotly_hover', (ev) => {
    const pt = ev.points && ev.points[0];
    if (!pt) return;
    let code = null;
    if (Array.isArray(pt.customdata)) code = pt.customdata[0];
    else if (pt.data && Array.isArray(pt.data.customdata) && Array.isArray(pt.data.customdata[0])) code = pt.data.customdata[0][0];
    if (code) hoverBarForCode(code);
  });

  barEl.on('plotly_hover', (ev) => {
    const pt = ev.points && ev.points[0];
    if (!pt || !Array.isArray(pt.customdata)) return;
    const code = pt.customdata[0];
    if (code) hoverMapForCode(code);
  });

  mapEl.on('plotly_unhover', () => { Plotly.Fx.unhover('bar'); });
  barEl.on('plotly_unhover', () => { Plotly.Fx.unhover('map'); });

  setTimeout(() => {
    ['map', 'bar', 'ontime', 'satisfaction', 'todChart', 'routeMap'].forEach((id) => { const el = document.getElementById(id); if (el) { try { Plotly.Plots.resize(el); } catch (e) {} } });
  }, 120);


  const airportData = [{"code": "MSP", "name": "Minneapolis–St. Paul International Airport", "ontime": 80, "ontime_rank": 4, "sat": 660}, {"code": "LAS", "name": "Harry Reid International Airport", "ontime": 76, "ontime_rank": 12, "sat": 619}, {"code": "JFK", "name": "John F. Kennedy International Airport", "ontime": 77, "ontime_rank": 9, "sat": 618}, {"code": "MCO", "name": "Orlando International Airport", "ontime": 74, "ontime_rank": 21, "sat": 618}, {"code": "MIA", "name": "Miami International Airport", "ontime": 73, "ontime_rank": 26, "sat": 615}, {"code": "SFO", "name": "San Francisco International Airport", "ontime": 78, "ontime_rank": 8, "sat": 613}, {"code": "FLL", "name": "Fort Lauderdale-Hollywood International Airport", "ontime": 74, "ontime_rank": 24, "sat": 606}, {"code": "DEN", "name": "Denver International Airport", "ontime": 74, "ontime_rank": 25, "sat": 596}, {"code": "ATL", "name": "Hartsfield-Jackson Atlanta International Airport", "ontime": 75, "ontime_rank": 18, "sat": 590}, {"code": "LAX", "name": "Los Angeles International Airport", "ontime": 81, "ontime_rank": 3, "sat": 589}, {"code": "SEA", "name": "Seattle-Tacoma International Airport", "ontime": 78, "ontime_rank": 8, "sat": 583}, {"code": "CLT", "name": "Charlotte Douglas International Airport", "ontime": 74, "ontime_rank": 19, "sat": 581}, {"code": "EWR", "name": "Newark Liberty International Airport", "ontime": 75, "ontime_rank": 16, "sat": 565}];
  const ontimeOrder = ["LAX", "MSP", "SFO", "SEA", "JFK", "LAS", "ATL", "EWR", "MCO", "FLL", "DEN", "CLT", "MIA"];
  const satisfactionOrder = ["MSP", "LAS", "JFK", "MCO", "MIA", "SFO", "FLL", "DEN", "ATL", "LAX", "SEA", "CLT", "EWR"];
  const byCode = Object.fromEntries(airportData.map(d => [d.code, d]));
  const ewrColor = '#b22543';
  const baseColor = '#122f5e';
  const mutedLine = '#0d1f3c';
  const colorsFor = order => order.map(code => code === 'EWR' ? ewrColor : baseColor);
  const outlineFor = order => order.map(code => code === 'EWR' ? '#ffffff' : mutedLine);
  const ontimeCodes = ontimeOrder.slice().reverse();
  const satCodes = satisfactionOrder.slice().reverse();

  const ontimeTrace = {
    type: 'bar',
    orientation: 'h',
    x: ontimeCodes.map(c => byCode[c].ontime),
    y: ontimeCodes,
    customdata: ontimeCodes.map(c => [byCode[c].name, byCode[c].ontime_rank, byCode[c].sat]),
    hovertemplate: '<b>%{y}</b> — %{customdata[0]}<br>On-time departures: %{x}%<br>BTS rank among major U.S. airports: %{customdata[1]}<br>Satisfaction score: %{customdata[2]}<extra></extra>',
    marker: { color: colorsFor(ontimeCodes), line: {color: outlineFor(ontimeCodes), width: 0.5} },
    hoverlabel: {bgcolor: '#ffffff', bordercolor: '#122f5e', font: {color: '#0d1f3c'}}
  };

  const satisfactionTrace = {
    type: 'bar',
    orientation: 'h',
    x: satCodes.map(c => byCode[c].sat),
    y: satCodes,
    customdata: satCodes.map(c => [byCode[c].name, byCode[c].ontime, byCode[c].ontime_rank]),
    hovertemplate: '<b>%{y}</b> — %{customdata[0]}<br>Satisfaction score: %{x} / 1000<br>On-time departures: %{customdata[1]}%<br>BTS rank among major U.S. airports: %{customdata[2]}<extra></extra>',
    marker: { color: colorsFor(satCodes), line: {color: outlineFor(satCodes), width: 0.5} },
    hoverlabel: {bgcolor: '#ffffff', bordercolor: '#122f5e', font: {color: '#0d1f3c'}}
  };

  const commonLayout = {
    margin: {l: 78, r: 24, t: 8, b: 42},
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      gridcolor: '#d6deeb',
      zeroline: false,
      tickfont: {color: '#3d5278'},
      titlefont: {color: '#122f5e'}
    },
    yaxis: { automargin: true, tickfont: {color: '#122f5e', size: 12} },
    showlegend: false,
    hovermode: 'closest'
  };

  function makeInsideAnnotations(order, valueFn, xStart, xOffset) {
    return order.map(code => ({
      x: xStart + xOffset,
      y: code,
      xref: 'x',
      yref: 'y',
      text: String(valueFn(code)),
      showarrow: false,
      xanchor: 'left',
      align: 'left',
      font: {family: 'Figtree, Arial, sans-serif', size: 12, color: '#ffffff'}
    }));
  }

  Plotly.newPlot('ontime', [ontimeTrace], {
    ...commonLayout,
    xaxis: { ...commonLayout.xaxis, title: 'On-time departures (%)', range: [68, 84] },
    annotations: makeInsideAnnotations(ontimeCodes, c => byCode[c].ontime + '%', 68, 0.35)
  }, {responsive: true, displaylogo: false});

  Plotly.newPlot('satisfaction', [satisfactionTrace], {
    ...commonLayout,
    xaxis: { ...commonLayout.xaxis, title: 'Satisfaction score', range: [550, 675] },
    annotations: makeInsideAnnotations(satCodes, c => byCode[c].sat, 550, 3)
  }, {responsive: true, displaylogo: false});

  const ontimeDiv = document.getElementById('ontime');
  const satisfactionDiv = document.getElementById('satisfaction');
  const ontimeIndex = Object.fromEntries(ontimeCodes.map((c, i) => [c, i]));
  const satisfactionIndex = Object.fromEntries(satCodes.map((c, i) => [c, i]));
  let syncing = false;

  function hoverOther(source, code) {
    if (syncing) return;
    syncing = true;
    try {
      if (source === 'ontime' && satisfactionIndex[code] !== undefined) {
        Plotly.Fx.hover(satisfactionDiv, [{curveNumber: 0, pointNumber: satisfactionIndex[code]}]);
      } else if (source === 'satisfaction' && ontimeIndex[code] !== undefined) {
        Plotly.Fx.hover(ontimeDiv, [{curveNumber: 0, pointNumber: ontimeIndex[code]}]);
      }
    } finally {
      setTimeout(() => syncing = false, 0);
    }
  }

  ontimeDiv.on('plotly_hover', (ev) => hoverOther('ontime', ev.points[0].y));
  satisfactionDiv.on('plotly_hover', (ev) => hoverOther('satisfaction', ev.points[0].y));
  ontimeDiv.on('plotly_unhover', () => Plotly.Fx.unhover(satisfactionDiv));
  satisfactionDiv.on('plotly_unhover', () => Plotly.Fx.unhover(ontimeDiv));

  const datasets = {
    all: {
      subnote: "Full period",
      rows: {
        late:    { pct: 36.0,  minutes: "3,740K Min.", group: "internal" },
        carrier: { pct: 28.1,  minutes: "2,920K Min.", group: "internal" },
        nas:     { pct: 20.7,  minutes: "2,150K Min.", group: "internal" },
        weather: { pct: 4.15,  minutes: "431K Min.",   group: "external" },
        security:{ pct: 0.12,  minutes: "12K Min.",    group: "internal" }
      }
    },
    winter: {
      subnote: "Winter window: Nov 15 – Mar 15",
      rows: {
        late:    { pct: 40.76, minutes: "1,021K Min.", group: "internal" },
        carrier: { pct: 33.17, minutes: "831K Min.",   group: "internal" },
        nas:     { pct: 23.25, minutes: "582K Min.",   group: "internal" },
        weather: { pct: 2.58,  minutes: "64.5K Min.",  group: "external" },
        security:{ pct: 0.21,  minutes: "5.2K Min.",   group: "internal" }
      }
    }
  };

  function formatPct(pct) {
    if (pct < 10) return pct.toFixed(2) + "%";
    return pct.toFixed(1) + "%";
  }

  function scaledWidth(pct, maxPct) {
    return Math.max((pct / maxPct) * 100, 1);
  }

  let _weatherAnimFrame = null;

  function parseMinutesLabel(txt) {
    const clean = String(txt || '').replace(/,/g, '').trim();
    const m = clean.match(/([\d.]+)\s*K\s*Min\.?/i);
    if (m) return parseFloat(m[1]);
    return 0;
  }

  function formatMinutesK(v) {
    return (v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')) + "K Min.";
  }

  function applyDataset(key) {
    window._weatherCurrentKey = key;
    const ds = datasets[key];
    document.getElementById("subnote").textContent = ds.subnote;

    const maxPct = Math.max(...Object.values(ds.rows).map(d => d.pct));
    const mapping = [
      ["late", "lateBar", "lateVal"],
      ["carrier", "carrierBar", "carrierVal"],
      ["nas", "nasBar", "nasVal"],
      ["weather", "weatherBar", "weatherVal"],
      ["security", "securityBar", "securityVal"]
    ];

    if (_weatherAnimFrame) cancelAnimationFrame(_weatherAnimFrame);

    const starts = mapping.map(([rowKey, barId, valId]) => {
      const bar = document.getElementById(barId);
      const val = document.getElementById(valId);
      const item = ds.rows[rowKey];

      const startWidth = parseFloat(bar.style.width || "0") || 0;
      const targetWidth = scaledWidth(item.pct, maxPct);

      let startPctText = 0;
      if (rowKey === "security") {
        startPctText = parseFloat((document.getElementById("securityPct").textContent || "0").replace("%","")) || 0;
      } else {
        startPctText = parseFloat((bar.textContent || "0").replace("%","")) || 0;
      }

      const startMinutes = parseMinutesLabel(val.textContent);
      const targetMinutes = parseMinutesLabel(item.minutes);

      bar.classList.remove("weather-internal", "weather-external");
      bar.classList.add(item.group === "external" ? "weather-external" : "weather-internal");

      if (rowKey !== "security") {
        bar.style.minWidth = item.pct < 6 ? "88px" : "";
      }

      return {
        rowKey, bar, val,
        startWidth, targetWidth,
        startPctText, targetPctText: item.pct,
        startMinutes, targetMinutes
      };
    });

    document.getElementById("allBtn").classList.toggle("active", key === "all");
    document.getElementById("winterBtn").classList.toggle("active", key === "winter");

    const startTime = performance.now();
    const duration = 900;
    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
      const p = Math.min(1, (now - startTime) / duration);
      const e = ease(p);

      starts.forEach(({rowKey, bar, val, startWidth, targetWidth, startPctText, targetPctText, startMinutes, targetMinutes}) => {
        const curWidth = startWidth + (targetWidth - startWidth) * e;
        const curPct = startPctText + (targetPctText - startPctText) * e;
        const curMinutes = startMinutes + (targetMinutes - startMinutes) * e;

        bar.style.width = curWidth + "%";
        if (rowKey === "security") {
          document.getElementById("securityPct").textContent = formatPct(curPct);
        } else {
          bar.textContent = formatPct(curPct);
        }
        val.textContent = formatMinutesK(curMinutes);
      });

      if (p < 1) {
        _weatherAnimFrame = requestAnimationFrame(step);
      } else {
        starts.forEach(({rowKey, bar, val, targetWidth, targetPctText, targetMinutes}) => {
          bar.style.width = targetWidth + "%";
          if (rowKey === "security") {
            document.getElementById("securityPct").textContent = formatPct(targetPctText);
          } else {
            bar.textContent = formatPct(targetPctText);
          }
          val.textContent = formatMinutesK(targetMinutes);
        });
        _weatherAnimFrame = null;
      }
    }

    _weatherAnimFrame = requestAnimationFrame(step);
  }

  document.getElementById("allBtn").addEventListener("click", () => applyDataset("all"));
  document.getElementById("winterBtn").addEventListener("click", () => applyDataset("winter"));
  applyDataset("all");

  const seriesByYear = {"2022": {"x": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "y": [1.19, 1.27, 1.9, 2.57, 3.44, 5.07, 4.82, 5.7, 6.5, 6.94, 7.5, 9.16, 9.78, 12.06, 15.36, 15.59, 13.72, 17.55, 7.14]}, "2023": {"x": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "y": [0.56, 1.31, 2.12, 3.0, 3.96, 3.45, 3.69, 5.17, 5.28, 6.14, 7.17, 7.44, 9.28, 9.7, 13.07, 11.94, 10.28, 11.02, 0.06]}, "2024": {"x": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "y": [2.28, 1.27, 2.25, 2.88, 3.81, 4.04, 4.66, 5.59, 5.75, 6.73, 7.96, 9.27, 11.71, 11.58, 15.31, 13.97, 12.3, 10.9, 1.15]}, "2025": {"x": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "y": [1.23, 1.39, 2.42, 2.69, 4.14, 4.94, 5.75, 7.23, 7.14, 9.19, 10.69, 12.9, 14.26, 14.2, 18.34, 16.69, 15.27, 16.69, 9.65]}, "All Years": {"x": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "y": [1.35, 1.31, 2.17, 2.8, 3.83, 4.38, 4.71, 5.91, 6.14, 7.25, 8.26, 9.65, 11.12, 11.77, 15.42, 14.41, 12.81, 13.56, 5.68]}};
  const kpisByYear = {"All Years": {"affected": 58947, "share": 11.7, "total": 3739612}, "2022": {"affected": 15965, "share": 12.9, "total": 923334}, "2023": {"affected": 14269, "share": 10.5, "total": 853522}, "2024": {"affected": 14151, "share": 11.2, "total": 913657}, "2025": {"affected": 14562, "share": 12.2, "total": 1049099}};
  let currentSelection = 'All Years';
  function updateKpis(key) { document.getElementById('kpiAffected').textContent = kpisByYear[key].affected.toLocaleString(); document.getElementById('kpiShare').textContent = `${kpisByYear[key].share.toFixed(1)}%`; document.getElementById('kpiTotal').textContent = kpisByYear[key].total.toLocaleString(); }
  function drawTodChart(yearKey) {
    const hourX = seriesByYear[yearKey].x;
    const hourY = seriesByYear[yearKey].y;
    const maxY = Math.max(...hourY);

    Plotly.newPlot('todChart', [
      {
        type: 'scatter',
        x: [14, 14, 19, 19, 14],
        y: [0, maxY * 1.12, maxY * 1.12, 0, 0],
        fill: 'toself',
        fillcolor: 'rgba(178,37,67,0.07)',
        line: {width: 0},
        hoverinfo: 'skip',
        showlegend: false
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        x: [],
        y: [],
        line: {color: '#122f5e', width: 3.5, shape: 'linear'},
        marker: {
          size: 9,
          color: hourX.map(h => (h >= 14 && h <= 19) ? '#b22543' : '#122f5e'),
          line: {color: '#ffffff', width: 1.5}
        },
        hovertemplate: '<b>%{x}:00</b><br>%{y:.2f} min / scheduled departure<extra></extra>',
        showlegend: false
      }
    ], {
      margin: {l: 64, r: 30, t: 14, b: 52},
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: {
        title: {text: 'Scheduled departure hour', font: {size: 15, color: '#3d5278'}},
        tickmode: 'linear',
        dtick: 1,
        tick0: 5,
        range: [4.5, 23.5],
        gridcolor: 'rgba(18,47,94,0.07)',
        zeroline: false,
        tickfont: {size: 11, color: '#3d5278'},
        ticksuffix: ':00'
      },
      yaxis: {
        title: {text: 'Avg late-inbound minutes / flight', font: {size: 12, color: '#3d5278'}},
        gridcolor: 'rgba(18,47,94,0.07)',
        zeroline: false,
        tickfont: {size: 15, color: '#3d5278'},
        range: [0, maxY * 1.1]
      },
      shapes: [{
        type: 'line',
        xref: 'x', yref: 'paper',
        x0: 14, x1: 14, y0: 0, y1: 1,
        line: {color: '#b22543', width: 2, dash: 'dash'}
      }],
      annotations: [
        {
          x: 14.15,
          y: hourY[hourX.indexOf(14)] || 0,
          xref: 'x', yref: 'y',
          text: '14:00 tipping point',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#b22543',
          arrowsize: 0.9,
          ax: 68,
          ay: -32,
          font: {size: 14, color: '#b22543'},
          bgcolor: 'rgba(255,255,255,0.82)',
          borderpad: 3,
          bordercolor: 'rgba(178,37,67,0.25)',
          borderwidth: 1
        },
        {
          x: 9,
          y: (hourY[hourX.indexOf(9)] || 0) + 1.4,
          xref: 'x', yref: 'y',
          text: 'Before 11:00<br><b>2.8 min/flight</b>',
          showarrow: false,
          font: {size: 14, color: '#3d5278'},
          bgcolor: 'rgba(255,255,255,0.75)',
          borderpad: 3
        },
        {
          x: 19,
          y: (hourY[hourX.indexOf(19)] || 0) - 2,
          xref: 'x', yref: 'y',
          text: '19:00 peak<br><b>17.4 min/flight</b>',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#b22543',
          arrowsize: 0.9,
          ax: -90,
          ay: 40,
          font: {size: 14, color: '#3d5278'},
          bgcolor: 'rgba(255,255,255,0.82)',
          borderpad: 3,
          bordercolor: 'rgba(178,37,67,0.2)',
          borderwidth: 1
        }
      ]
    }, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
      displayModeBar: 'hover'
    }).then(function() { animateLine(hourX, hourY); });
  }
  const yearValueEl = document.getElementById('yearValue'); const yearButtons = Array.from(document.querySelectorAll('.latehour-year-btn'));
  function applyYearSelection(year) {
    currentSelection = year;
    yearValueEl.textContent = currentSelection;
    yearButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.year === year));
    updateKpis(currentSelection);
    drawTodChart(currentSelection);
    if (typeof currentIndex !== 'undefined' && currentIndex === 6) {
      setTimeout(() => replayLateHourTransition(), 180);
    }
  }
  yearButtons.forEach(btn => btn.addEventListener('click', function() { applyYearSelection(btn.dataset.year); }));
  applyYearSelection('All Years');

  const stateCodes = ["FL","NC","GA","CA","IL","MI","KY","TX","PA","OH","MN","SC","IN","WA","MA","AZ","NY","ME","TN","UT","OR","WI","NV","MO","VA","VT","LA","RI","NH","DC","IA","AL","AR","SD","NE"];
  const stateMinutes = [288401,170356,137900,127758,110800,99963,82529,72361,51475,47919,46545,46459,46272,39955,39658,36130,28742,25200,22999,20769,19840,18571,12344,12229,12023,8478,6846,6806,5823,5761,984,283,112,6,0];
  const listEl = document.getElementById('stateList');
  if (listEl && !listEl.dataset.built) { const maxMin = stateMinutes[0]; stateCodes.forEach(function(code, i) { if (stateMinutes[i] === 0) return; var pct = (stateMinutes[i] / maxMin * 100).toFixed(1); var isTop = i < 3; listEl.insertAdjacentHTML('beforeend', '<div class="routestate-state-row ' + (isTop ? 'top-3' : '') + '"><div class="rank">' + (i + 1) + '</div><div class="code">' + code + '</div><div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%"></div></div><div class="minutes">' + (stateMinutes[i]/1000).toFixed(0) + 'k</div></div>'); }); listEl.dataset.built = '1'; }
  const EWR = { code:'EWR', name:'Newark Liberty Intl', lat:40.6895, lon:-74.1745 };
  const ORIGINS = [{ code:'ORD', name:"O'Hare Intl (Chicago)", lat:41.9742, lon:-87.9073, state:'IL', delayMin:110800, color:'#b22543' }, { code:'FLL', name:'Fort Lauderdale-Hollywood Intl', lat:26.0726, lon:-80.1527, state:'FL', delayMin:288401, color:'#b22543', note:'FL total (incl. MCO)' }, { code:'MCO', name:'Orlando Intl', lat:28.4312, lon:-81.3081, state:'FL', delayMin:288401, color:'#b22543', note:'FL total (incl. FLL)' }, { code:'CLT', name:'Charlotte Douglas Intl', lat:35.2140, lon:-80.9431, state:'NC', delayMin:170356, color:'#b22543' }, { code:'ATL', name:'Hartsfield-Jackson Atlanta Intl', lat:33.6367, lon:-84.4281, state:'GA', delayMin:137900, color:'#b22543' }, { code:'LAX', name:'Los Angeles Intl', lat:33.9425, lon:-118.4081, state:'CA', delayMin:127758, color:'#b22543' }];
  var N_PTS=80, TICK_MS=30, STAGGER=12, animTick=0, animTimer=null;
  function runAnimStep() { var lats=[], lons=[]; ORIGINS.forEach(function(o, i) { var rt=Math.max(0, animTick - i * STAGGER); var n=Math.min(N_PTS, rt); var rLats=[], rLons=[]; for (var j=0; j<=n; j++) { var t=j/N_PTS; rLats.push(o.lat + (EWR.lat - o.lat) * t); rLons.push(o.lon + (EWR.lon - o.lon) * t); } lats.push(rLats); lons.push(rLons); }); Plotly.restyle('routeMap', {lat:lats, lon:lons}, [2,3,4,5,6,7]); animTick++; var maxTick=N_PTS + STAGGER * (ORIGINS.length - 1) + 5; if (animTick <= maxTick) animTimer=setTimeout(runAnimStep, TICK_MS); }
  function startAnim() { clearTimeout(animTimer); animTick=0; Plotly.restyle('routeMap', {lat:ORIGINS.map(function(){ return []; }), lon:ORIGINS.map(function(){ return []; })}, [2,3,4,5,6,7]); setTimeout(runAnimStep, 300); }
  var traceChoro={ type:'choropleth', locationmode:'USA-states', locations:stateCodes, z:stateMinutes, colorscale:[[0,'#dde4f0'],[0.15,'#b0c1e0'],[0.4,'#6e8fbd'],[0.7,'#3a6195'],[1,'#122f5e']], marker:{line:{color:'#ffffff', width:1.2}}, colorbar:{title:{text:'Delay<br>minutes', font:{size:11, color:'#3d5278'}}, thickness:12, len:.75, outlinewidth:0, tickfont:{size:10, color:'#3d5278'}, tickformat:',d'}, hovertemplate:'<b>%{location}</b><br>Late-aircraft delay: <b>%{z:,} min</b><extra></extra>'};
  var traceDots={ type:'scattergeo', mode:'markers', lat:[EWR.lat].concat(ORIGINS.map(function(o){ return o.lat; })), lon:[EWR.lon].concat(ORIGINS.map(function(o){ return o.lon; })), marker:{ size:[14,10,10,10,10,10,10], color:['#b22543'].concat(ORIGINS.map(function(o){ return o.color; })), line:{color:'#ffffff', width:1.5}}, customdata:[['EWR','Newark Liberty Intl','Hub Airport','']].concat(ORIGINS.map(function(o){ return [o.code, o.name, (o.delayMin/1000).toFixed(0)+'k min total', o.note||'']; })), hovertemplate:'<b>%{customdata[0]}</b> — %{customdata[1]}<br>Late-inbound delay: <b>%{customdata[2]}</b><br><i>%{customdata[3]}</i><extra></extra>', showlegend:false };
  var routeTraces=ORIGINS.map(function(o){ return { type:'scattergeo', mode:'lines', lat:[], lon:[], line:{ color:o.color, width:2.5 }, hoverinfo:'none', showlegend:false }; });
  Plotly.newPlot('routeMap', [traceChoro, traceDots].concat(routeTraces), {margin:{l:0,r:0,t:0,b:0}, geo:{scope:'usa', projection:{type:'albers usa'}, bgcolor:'rgba(0,0,0,0)', lakecolor:'#eef2f8', showlakes:true, landcolor:'#f4f6fb', subunitcolor:'#ffffff', showcoastlines:false, framecolor:'rgba(0,0,0,0)'}, paper_bgcolor:'rgba(0,0,0,0)', showlegend:false}, {responsive:true, displaylogo:false, modeBarButtonsToRemove:['select2d','lasso2d'], displayModeBar:'hover'});
  document.getElementById('replayBtn').addEventListener('click', startAnim);
  startAnim();

}
