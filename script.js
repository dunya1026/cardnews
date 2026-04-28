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
