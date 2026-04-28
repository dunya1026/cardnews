/* ============================================================
   인스타그램 카드뉴스 시스템 — script.js
   ============================================================ */

var EDITABLE = [
  '.hook-title', '.hook-sub', '.hook-badge',
  '.section-title', '.section-sub', '.body-text',
  '.quote-text', '.quote-sub',
  '.info-title', '.info-body', '.info-num',
  '.bar-label', '.bar-value',
  '.indicator-name', '.indicator-desc',
  '.check-text',
  '.scenario-cond', '.scenario-result',
  '.persona-header', '.persona-list li',
  '.cta-title', '.cta-body', '.cta-question', '.cta-btn',
  '.category-label', '.page-num',
  '.account-tag', '.source-text', '.disclaimer',
  '.myth-wrong', '.myth-correct',
].join(',');

var editMode = false;
var savedRange = null; /* 색상 적용을 위한 선택 영역 저장 */

/* ============================================================
   탭 전환
   ============================================================ */
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    document.querySelectorAll('.card-set').forEach(function(s) {
      s.classList.toggle('active', s.id === tab.dataset.target);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ============================================================
   미리보기 스케일 슬라이더
   ============================================================ */
var slider   = document.getElementById('scaleSlider');
var scaleVal = document.getElementById('scaleValue');

function applyScale(v) {
  var s = v / 100;
  document.documentElement.style.setProperty('--scale', s);
  document.querySelectorAll('.card-preview-wrap').forEach(function(w) {
    w.style.width  = (1080 * s) + 'px';
    w.style.height = (1350 * s) + 'px';
  });
  if (scaleVal) scaleVal.textContent = v + '%';
}

if (slider) {
  slider.addEventListener('input', function() { applyScale(+slider.value); });
  applyScale(+slider.value);
}

/* ============================================================
   편집 모드 토글
   ============================================================ */
var editBtn      = document.getElementById('editBtn');
var colorToolbar = document.getElementById('colorToolbar');

if (editBtn) {
  editBtn.addEventListener('click', function() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    editBtn.classList.toggle('edit-active', editMode);
    editBtn.textContent = editMode ? '✅ 편집 완료' : '✏️ 편집 모드';

    /* 색상 툴바 표시/숨김 */
    if (colorToolbar) colorToolbar.classList.toggle('visible', editMode);

    /* contenteditable 토글 */
    document.querySelectorAll(EDITABLE).forEach(function(el) {
      if (editMode) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      } else {
        el.removeAttribute('contenteditable');
      }
    });
  });
}

/* ============================================================
   글씨 색상 툴바
   ============================================================ */

/* 선택 영역 저장 (색상 버튼 클릭 시 selection 유지용) */
document.addEventListener('selectionchange', function() {
  if (!editMode) return;
  var sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    try { savedRange = sel.getRangeAt(0).cloneRange(); } catch(e) {}
  }
});

/* 프리셋 색상 스와치 */
document.querySelectorAll('.swatch').forEach(function(swatch) {
  swatch.addEventListener('mousedown', function(e) {
    e.preventDefault(); /* 포커스 빼앗기지 않도록 */
    applyTextColor(this.dataset.color);
  });
});

/* 직접 색상 선택 */
var customPicker = document.getElementById('customColorPicker');
if (customPicker) {
  /* 색상 입력창 열기 전 선택 저장 */
  customPicker.addEventListener('focus', function() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try { savedRange = sel.getRangeAt(0).cloneRange(); } catch(e) {}
    }
  });
  /* 색상 변경될 때마다 적용 */
  customPicker.addEventListener('input', function() {
    applyTextColor(this.value);
  });
}

function applyTextColor(color) {
  /* 저장된 선택 영역 복원 */
  if (savedRange) {
    var sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  }
  /* execCommand로 색상 적용 (deprecated이지만 현재 가장 안정적) */
  document.execCommand('foreColor', false, color);
}

/* ============================================================
   PNG 저장 (단일 카드)
   ============================================================ */
function downloadCard(wrap) {
  if (!wrap) { alert('카드를 찾을 수 없습니다.'); return; }
  if (typeof html2canvas === 'undefined') { alert('잠시 후 다시 시도해주세요.'); return; }

  var btn      = wrap.querySelector('.download-btn');
  var card     = wrap.querySelector('.card');
  if (!card) return;

  var origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳ 저장 중...'; btn.disabled = true; }

  return document.fonts.ready.then(function() {
    var tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1350px;overflow:hidden;z-index:-1;';

    var clone = card.cloneNode(true);
    clone.style.cssText = 'width:1080px;height:1350px;transform:none;position:relative;border-radius:24px;';
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    clone.querySelectorAll('.download-btn').forEach(function(el) { el.style.display = 'none'; });

    tmp.appendChild(clone);
    document.body.appendChild(tmp);

    return html2canvas(tmp, {
      width: 1080, height: 1350,
      scale: 2, useCORS: true, allowTaint: false, logging: false, backgroundColor: null,
    }).then(function(canvas) {
      var indexEl = wrap.querySelector('.card-index');
      var label   = 'card';
      if (indexEl) {
        var m = indexEl.textContent.match(/CARD\s*0*(\d+)/i);
        if (m) label = 'CARD' + ('0' + m[1]).slice(-2);
      }
      var link = document.createElement('a');
      link.download = 'cardnews_' + label + '.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }).catch(function(err) {
      console.error(err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }).then(function() {
      /* finally 대체 */
      document.body.removeChild(tmp);
      if (btn) { btn.textContent = origText; btn.disabled = false; }
    });
  });
}

/* ============================================================
   일괄 저장 (범위 지정)
   ============================================================ */
var batchBtn   = document.getElementById('batchBtn');
var rangeFrom  = document.getElementById('rangeFrom');
var rangeTo    = document.getElementById('rangeTo');

if (batchBtn) {
  batchBtn.addEventListener('click', function() {
    var from = Math.max(1, parseInt(rangeFrom.value) || 1);
    var to   = Math.min(8, parseInt(rangeTo.value)   || 8);

    if (from > to) {
      alert('시작 번호가 끝 번호보다 클 수 없습니다.');
      return;
    }

    /* 현재 활성 탭의 카드들만 */
    var activeSet = document.querySelector('.card-set.active');
    if (!activeSet) return;
    var wraps = Array.prototype.slice.call(activeSet.querySelectorAll('.card-preview-wrap'));

    var targets = wraps.slice(from - 1, to);
    if (targets.length === 0) { alert('저장할 카드가 없습니다.'); return; }

    batchBtn.disabled = true;
    batchBtn.textContent = '📦 1/' + targets.length + ' 준비 중...';

    /* 순서대로 다운로드 (Promise 체인) */
    var chain = Promise.resolve();
    targets.forEach(function(wrap, i) {
      chain = chain.then(function() {
        batchBtn.textContent = '📦 ' + (i + 1) + '/' + targets.length + ' 저장 중...';
        return downloadCard(wrap);
      }).then(function() {
        /* 브라우저가 연속 다운로드를 막지 않도록 짧은 딜레이 */
        return new Promise(function(resolve) { setTimeout(resolve, 600); });
      });
    });

    chain.then(function() {
      batchBtn.textContent = '✅ 완료!';
      setTimeout(function() {
        batchBtn.textContent = '📦 저장';
        batchBtn.disabled = false;
      }, 2000);
    }).catch(function() {
      batchBtn.textContent = '📦 저장';
      batchBtn.disabled = false;
    });
  });
}

/* ============================================================
   카드 클릭 → 풀사이즈 오버레이
   ============================================================ */
var overlay = document.createElement('div');
overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;overflow-y:auto;cursor:zoom-out;';
document.body.appendChild(overlay);

document.querySelectorAll('.card-preview-wrap').forEach(function(wrap) {
  var article = wrap.querySelector('article');
  if (!article) return;

  article.addEventListener('click', function() {
    if (editMode) return;
    var card = wrap.querySelector('.card');
    if (!card) return;

    var clone = card.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    clone.querySelectorAll('.download-btn').forEach(function(el) { el.style.display = 'none'; });
    clone.style.cssText = 'transform:none;position:relative;margin:48px auto;border-radius:24px;display:block;box-shadow:0 40px 120px rgba(0,0,0,0.8);';

    overlay.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.4);font-size:13px;padding:16px 0 0;font-family:sans-serif;">클릭하거나 ESC로 닫기</p>';
    overlay.appendChild(clone);
    overlay.style.display    = 'block';
    document.body.style.overflow = 'hidden';
  });
});

overlay.addEventListener('click', closeOverlay);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeOverlay(); });

function closeOverlay() {
  overlay.style.display        = 'none';
  document.body.style.overflow = '';
}

/* ============================================================
   🤖 AI 콘텐츠 자동 생성
   ============================================================ */

/* ── 모달 열기/닫기 ── */
var aiModal       = document.getElementById('aiModal');
var openAiModal   = document.getElementById('openAiModal');
var aiModalClose  = document.getElementById('aiModalClose');
var aiModalOverlay= document.getElementById('aiModalOverlay');

function openModal()  { aiModal.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { aiModal.classList.remove('open'); document.body.style.overflow = ''; }

if (openAiModal)    openAiModal.addEventListener('click', openModal);
if (aiModalClose)   aiModalClose.addEventListener('click', closeModal);
if (aiModalOverlay) aiModalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

/* ── API 키 저장/로드 ── */
var aiKeyInput  = document.getElementById('aiKeyInput');
var aiKeySave   = document.getElementById('aiKeySave');
var aiKeyStatus = document.getElementById('aiKeyStatus');

(function loadSavedKey() {
  var saved = localStorage.getItem('cn_api_key');
  if (saved && aiKeyInput) {
    aiKeyInput.value = saved;
    setKeyStatus('✅ 저장된 키가 있습니다', 'ok');
  }
})();

function setKeyStatus(msg, type) {
  if (!aiKeyStatus) return;
  aiKeyStatus.textContent = msg;
  aiKeyStatus.className = 'ai-key-status ' + (type || '');
}

if (aiKeySave) {
  aiKeySave.addEventListener('click', function() {
    var key = (aiKeyInput.value || '').trim();
    if (!key.startsWith('sk-ant-')) {
      setKeyStatus('❌ 올바른 Anthropic API 키 형식이 아닙니다', 'err');
      return;
    }
    localStorage.setItem('cn_api_key', key);
    setKeyStatus('✅ 저장되었습니다 (브라우저에만 보관)', 'ok');
  });
}

/* ── 카테고리 탭 ── */
var aiCatTabs   = document.querySelectorAll('.ai-cat-tab');
var selectedCat = 'stock';

aiCatTabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    aiCatTabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    selectedCat = tab.dataset.cat;
  });
});

/* ── 프롬프트 생성 ── */
function buildPrompt(topic, category, keywords) {
  var isStock = category === 'stock';
  var catKr   = isStock ? '주식·경제' : '부동산';

  var card4Schema = isStock
    ? '"card4": { "title":"제목","sub":"부제목","b1_label":"항목1","b1_value":"설명 ↑↑↑","b1_dir":"up","b1_width":92,"b2_label":"항목2","b2_value":"설명 ↑↑","b2_dir":"up","b2_width":76,"b3_label":"항목3","b3_value":"설명 ↑","b3_dir":"up","b3_width":60,"b4_label":"항목4","b4_value":"중립 →","b4_dir":"neutral","b4_width":50,"b5_label":"항목5","b5_value":"제한 ↓","b5_dir":"down","b5_width":28 }'
    : '"card4": { "title":"제목","sub":"부제목","s1_badge":"A","s1_cond":"조건","s1_result":"해석","s1_dir":"up","s2_badge":"B","s2_cond":"조건","s2_result":"해석","s2_dir":"caution","s3_badge":"C","s3_cond":"조건","s3_result":"해석","s3_dir":"caution","s4_badge":"D","s4_cond":"조건","s4_result":"해석","s4_dir":"down" }';

  var card6Schema = isStock
    ? '"card6": { "title":"제목","i1_num":"01","i1_name":"지표명","i1_desc":"설명","i2_num":"02","i2_name":"지표명","i2_desc":"설명","i3_num":"03","i3_name":"지표명","i3_desc":"설명","i4_num":"04","i4_name":"지표명","i4_desc":"설명","i5_num":"05","i5_name":"지표명","i5_desc":"설명" }'
    : '"card6": { "title":"제목","p1_header":"무주택자","p1_items":["항목1","항목2","항목3","항목4","항목5"],"p2_header":"1주택자","p2_items":["항목1","항목2","항목3","항목4","항목5"] }';

  return '한국 인스타그램 ' + catKr + ' 카드뉴스 8장을 작성해주세요.\n\n'
    + '주제: ' + topic + '\n'
    + '키워드: ' + (keywords || '없음') + '\n\n'
    + '규칙:\n'
    + '- 모든 텍스트는 한국어\n'
    + '- 투자 추천·수익 보장·공포 조장 금지\n'
    + '- 제목 한 줄 15자 이내, 줄바꿈은 \\n 사용\n'
    + '- 반드시 아래 JSON 구조만 반환 (마크다운 코드블록 없이)\n\n'
    + '{\n'
    + '  "card1": { "badge":"이모지+짧은라벨","title":"후킹제목(\\n 구분)","emphasis":"강조단어1개","sub":"부제목" },\n'
    + '  "card2": { "title":"섹션제목","quote":"공감인용구","quote_sub":"인용부연","point1_title":"포인트1","point1_body":"설명","point2_title":"포인트2","point2_body":"설명","comment":"💬 댓글유도문구 ↓" },\n'
    + '  "card3": { "title":"섹션제목","sub":"부제목","p1_num":"1","p1_title":"이유1","p1_body":"설명","p2_num":"2","p2_title":"이유2","p2_body":"설명","p3_num":"3","p3_title":"이유3","p3_body":"설명" },\n'
    + '  ' + card4Schema + ',\n'
    + '  "card5": { "title":"오해섹션제목","m1_wrong":"통념1","m1_correct":"실제1","m2_wrong":"통념2","m2_correct":"실제2","m3_wrong":"통념3","m3_correct":"실제3" },\n'
    + '  ' + card6Schema + ',\n'
    + '  "card7": { "title":"체크리스트제목","c1":"항목1","c2":"항목2","c3":"항목3","c4":"항목4","c5":"항목5","c6":"항목6","c7":"항목7" },\n'
    + '  "card8": { "title":"CTA제목(\\n구분)","body":"설명2-3문장","comment":"💬 댓글유도질문 ↓" }\n'
    + '}';
}

/* ── Claude API 호출 ── */
function callClaude(apiKey, prompt) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error ? data.error.message : 'API 오류 (' + res.status + ')');
      return data;
    });
  });
}

/* ── 카드 채우기 ── */
function fill(el, text) {
  if (el && text !== undefined && text !== null)
    el.innerHTML = String(text).replace(/\n/g, '<br>');
}
function fillText(el, text) {
  if (el && text !== undefined && text !== null) el.textContent = String(text);
}

function fillCards(data, category) {
  var setEl = document.getElementById(category);
  if (!setEl) return;
  var wraps = Array.prototype.slice.call(setEl.querySelectorAll('.card-preview-wrap'));
  function q(w, s) { return w.querySelector(s); }

  /* Card 1 — 후킹 */
  var d, w;
  if ((d = data.card1) && (w = wraps[0])) {
    fill(q(w, '.hook-badge'), d.badge);
    var te = q(w, '.hook-title');
    if (te && d.title) {
      var html = String(d.title).replace(/\n/g, '<br>');
      if (d.emphasis) html = html.replace(d.emphasis, '<em>' + d.emphasis + '</em>');
      te.innerHTML = html;
    }
    fill(q(w, '.hook-sub'), d.sub);
  }

  /* Card 2 — 문제 제기 */
  if ((d = data.card2) && (w = wraps[1])) {
    fill(q(w, '.section-title'), d.title);
    fill(q(w, '.quote-text'),    d.quote);
    fill(q(w, '.quote-sub'),     d.quote_sub);
    var infos = w.querySelectorAll('.info-card');
    if (infos[0]) { fillText(infos[0].querySelector('.info-title'), d.point1_title); fillText(infos[0].querySelector('.info-body'), d.point1_body); }
    if (infos[1]) { fillText(infos[1].querySelector('.info-title'), d.point2_title); fillText(infos[1].querySelector('.info-body'), d.point2_body); }
    fill(q(w, '.cta-question'), d.comment);
  }

  /* Card 3 — 원리 */
  if ((d = data.card3) && (w = wraps[2])) {
    fill(q(w, '.section-title'), d.title);
    fillText(q(w, '.section-sub'), d.sub);
    var infos = w.querySelectorAll('.info-card');
    [[d.p1_num, d.p1_title, d.p1_body], [d.p2_num, d.p2_title, d.p2_body], [d.p3_num, d.p3_title, d.p3_body]].forEach(function(p, i) {
      if (!infos[i]) return;
      fillText(infos[i].querySelector('.info-num'),   p[0]);
      fillText(infos[i].querySelector('.info-title'), p[1]);
      fillText(infos[i].querySelector('.info-body'),  p[2]);
    });
  }

  /* Card 4 — 데이터 */
  if ((d = data.card4) && (w = wraps[3])) {
    fill(q(w, '.section-title'), d.title);
    fill(q(w, '.section-sub'),   d.sub);

    /* 주식: bar chart */
    var rows = w.querySelectorAll('.bar-row');
    if (rows.length) {
      var bars = [
        {label:d.b1_label,val:d.b1_value,dir:d.b1_dir,width:d.b1_width},
        {label:d.b2_label,val:d.b2_value,dir:d.b2_dir,width:d.b2_width},
        {label:d.b3_label,val:d.b3_value,dir:d.b3_dir,width:d.b3_width},
        {label:d.b4_label,val:d.b4_value,dir:d.b4_dir,width:d.b4_width},
        {label:d.b5_label,val:d.b5_value,dir:d.b5_dir,width:d.b5_width},
      ];
      bars.forEach(function(b, i) {
        if (!rows[i] || !b.label) return;
        fillText(rows[i].querySelector('.bar-label'), b.label);
        var ve = rows[i].querySelector('.bar-value');
        if (ve) { ve.textContent = b.val; ve.className = 'bar-value ' + (b.dir==='up'?'up':b.dir==='down'?'down':'neutral'); }
        var fe = rows[i].querySelector('.bar-fill');
        if (fe) { fe.style.width = (b.width||50)+'%'; fe.className = 'bar-fill'+(b.dir==='down'?' fill-down':b.dir==='neutral'?' fill-warn':''); }
      });
    }

    /* 부동산: scenario list */
    var scenarios = w.querySelectorAll('.scenario-item');
    if (scenarios.length) {
      var ss = [
        {badge:d.s1_badge,cond:d.s1_cond,result:d.s1_result,dir:d.s1_dir},
        {badge:d.s2_badge,cond:d.s2_cond,result:d.s2_result,dir:d.s2_dir},
        {badge:d.s3_badge,cond:d.s3_cond,result:d.s3_result,dir:d.s3_dir},
        {badge:d.s4_badge,cond:d.s4_cond,result:d.s4_result,dir:d.s4_dir},
      ];
      ss.forEach(function(s, i) {
        if (!scenarios[i] || !s.cond) return;
        fillText(scenarios[i].querySelector('.scenario-badge'),  s.badge);
        fillText(scenarios[i].querySelector('.scenario-cond'),   s.cond);
        fillText(scenarios[i].querySelector('.scenario-result'), s.result);
        var ae = scenarios[i].querySelector('.scenario-arrow');
        if (ae) { ae.className = 'scenario-arrow '+(s.dir||'caution'); ae.textContent = s.dir==='up'?'↑':s.dir==='down'?'↓':'⚠'; }
      });
    }
  }

  /* Card 5 — 오해 */
  if ((d = data.card5) && (w = wraps[4])) {
    fill(q(w, '.section-title'), d.title);
    var myths = w.querySelectorAll('.myth-item');
    [[d.m1_wrong,d.m1_correct],[d.m2_wrong,d.m2_correct],[d.m3_wrong,d.m3_correct]].forEach(function(m,i) {
      if (!myths[i]) return;
      var we = myths[i].querySelector('.myth-wrong');
      var ce = myths[i].querySelector('.myth-correct');
      if (we) we.innerHTML = '<span class="myth-icon-x">✗</span> ' + (m[0]||'');
      if (ce) ce.innerHTML = '<span class="myth-icon-o">→</span> ' + (m[1]||'');
    });
  }

  /* Card 6 — 의미 */
  if ((d = data.card6) && (w = wraps[5])) {
    fill(q(w, '.section-title'), d.title);
    /* 주식: indicator list */
    var items = w.querySelectorAll('.indicator-item');
    if (items.length) {
      [[d.i1_num,d.i1_name,d.i1_desc],[d.i2_num,d.i2_name,d.i2_desc],[d.i3_num,d.i3_name,d.i3_desc],[d.i4_num,d.i4_name,d.i4_desc],[d.i5_num,d.i5_name,d.i5_desc]].forEach(function(it,i) {
        if (!items[i]||!it[1]) return;
        fillText(items[i].querySelector('.indicator-num'),  it[0]);
        fillText(items[i].querySelector('.indicator-name'), it[1]);
        fillText(items[i].querySelector('.indicator-desc'), it[2]);
      });
    }
    /* 부동산: persona split */
    var personas = w.querySelectorAll('.persona-card');
    if (personas.length && d.p1_header) {
      fillText(personas[0].querySelector('.persona-header'), d.p1_header);
      var lis0 = personas[0].querySelectorAll('.persona-list li');
      (d.p1_items||[]).forEach(function(item,i){ if(lis0[i]) lis0[i].textContent = item; });
      fillText(personas[1].querySelector('.persona-header'), d.p2_header);
      var lis1 = personas[1].querySelectorAll('.persona-list li');
      (d.p2_items||[]).forEach(function(item,i){ if(lis1[i]) lis1[i].textContent = item; });
    }
  }

  /* Card 7 — 체크리스트 */
  if ((d = data.card7) && (w = wraps[6])) {
    fill(q(w, '.section-title'), d.title);
    var checks = w.querySelectorAll('.check-text');
    [d.c1,d.c2,d.c3,d.c4,d.c5,d.c6,d.c7].forEach(function(item,i){ if(checks[i]&&item) fillText(checks[i], item); });
  }

  /* Card 8 — CTA */
  if ((d = data.card8) && (w = wraps[7])) {
    fill(q(w, '.cta-title'),    d.title);
    fill(q(w, '.cta-body'),     d.body);
    fill(q(w, '.cta-question'), d.comment);
  }
}

/* ── 생성 버튼 ── */
var aiGenerateBtn = document.getElementById('aiGenerateBtn');
var aiTopic       = document.getElementById('aiTopic');
var aiKeywords    = document.getElementById('aiKeywords');
var aiStatus      = document.getElementById('aiStatus');

function setStatus(msg, type) {
  if (!aiStatus) return;
  aiStatus.textContent = msg;
  aiStatus.className = 'ai-status ' + (type||'');
}

if (aiGenerateBtn) {
  aiGenerateBtn.addEventListener('click', function() {
    var apiKey = localStorage.getItem('cn_api_key');
    if (!apiKey) { setStatus('❌ 먼저 API 키를 저장해주세요.', 'err'); return; }
    var topic = (aiTopic ? aiTopic.value : '').trim();
    if (!topic) { setStatus('❌ 주제를 입력해주세요.', 'err'); return; }

    aiGenerateBtn.disabled = true;
    setStatus('⏳ Claude가 콘텐츠를 생성 중입니다... (10~20초)', 'loading');

    var prompt = buildPrompt(topic, selectedCat, aiKeywords ? aiKeywords.value : '');

    callClaude(apiKey, prompt).then(function(res) {
      var raw = res.content && res.content[0] && res.content[0].text;
      if (!raw) throw new Error('응답 내용이 비어있습니다.');

      /* JSON 파싱 — 코드블록 제거 후 시도 */
      var cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      /* { ... } 범위만 추출 */
      var start = cleaned.indexOf('{');
      var end   = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('JSON 형식을 찾을 수 없습니다.');
      var data = JSON.parse(cleaned.slice(start, end + 1));

      /* 탭을 생성한 카테고리로 전환 */
      document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.target === selectedCat);
      });
      document.querySelectorAll('.card-set').forEach(function(s) {
        s.classList.toggle('active', s.id === selectedCat);
      });

      fillCards(data, selectedCat);
      setStatus('✅ 완성! 카드 내용이 자동으로 채워졌습니다. 편집 모드에서 수정할 수 있어요.', 'ok');

      setTimeout(function() { closeModal(); }, 1800);

    }).catch(function(err) {
      console.error(err);
      setStatus('❌ 오류: ' + err.message, 'err');
    }).then(function() {
      aiGenerateBtn.disabled = false;
    });
  });
}
