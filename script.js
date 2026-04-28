/* ============================================================
   인스타그램 카드뉴스 시스템 — script.js
   ============================================================ */

/* ── 편집 가능한 요소 선택자 ── */
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

/* ── 탭 전환 ── */
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

/* ── 스케일 슬라이더 ── */
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

/* ── 편집 모드 토글 ── */
var editBtn = document.getElementById('editBtn');

if (editBtn) {
  editBtn.addEventListener('click', function() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    editBtn.classList.toggle('edit-active', editMode);
    editBtn.textContent = editMode ? '✅ 편집 완료' : '✏️ 편집 모드';

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

/* ── PNG 저장 ── */
function downloadCard(wrap) {
  if (!wrap) { alert('카드를 찾을 수 없습니다.'); return; }
  if (typeof html2canvas === 'undefined') { alert('잠시 후 다시 시도해주세요. (라이브러리 로딩 중)'); return; }

  var btn  = wrap.querySelector('.download-btn');
  var card = wrap.querySelector('.card');
  if (!card || !btn) return;

  var origText = btn.textContent;
  btn.textContent = '⏳ 저장 중...';
  btn.disabled = true;

  /* 폰트 로딩 완료 후 캡처 */
  document.fonts.ready.then(function() {

    /* 풀사이즈 임시 컨테이너 */
    var tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1350px;overflow:hidden;z-index:-1;';

    var clone = card.cloneNode(true);
    clone.style.cssText = 'width:1080px;height:1350px;transform:none;position:relative;border-radius:24px;';
    clone.querySelectorAll('[contenteditable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
    });
    /* 저장 버튼 숨기기 */
    clone.querySelectorAll('.download-btn').forEach(function(el) { el.style.display='none'; });

    tmp.appendChild(clone);
    document.body.appendChild(tmp);

    html2canvas(tmp, {
      width: 1080,
      height: 1350,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: null,
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
      alert('이미지 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }).finally(function() {
      document.body.removeChild(tmp);
      btn.textContent = origText;
      btn.disabled    = false;
    });

  });
}

/* ── 카드 클릭 → 풀사이즈 오버레이 ── */
var overlay = document.createElement('div');
overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;overflow-y:auto;cursor:zoom-out;';
document.body.appendChild(overlay);

document.querySelectorAll('.card-preview-wrap').forEach(function(wrap) {
  wrap.querySelector('article').addEventListener('click', function() {
    if (editMode) return;

    var card = wrap.querySelector('.card');
    if (!card) return;

    var clone = card.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    clone.style.cssText = 'transform:none;position:relative;margin:48px auto;border-radius:24px;display:block;box-shadow:0 40px 120px rgba(0,0,0,0.8);';

    overlay.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.4);font-size:13px;padding:16px 0 0;font-family:sans-serif;">클릭하거나 ESC로 닫기</p>';
    overlay.appendChild(clone);
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });
});

overlay.addEventListener('click', closeOverlay);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeOverlay(); });

function closeOverlay() {
  overlay.style.display = 'none';
  document.body.style.overflow = '';
}
