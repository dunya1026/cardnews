/* ============================================================
   인스타그램 카드뉴스 시스템 — script.js
   기능: 탭 전환 / 스케일 슬라이더 / 편집 모드 / PNG 저장 / 확대 오버레이
   ============================================================ */

(function () {
  'use strict';

  /* ── 편집 가능한 CSS 선택자 목록 ── */
  const EDITABLE_SELECTORS = [
    '.hook-title', '.hook-sub', '.hook-badge',
    '.section-title', '.section-sub', '.body-text',
    '.quote-text', '.quote-sub',
    '.info-title', '.info-body', '.info-num',
    '.bar-label', '.bar-value',
    '.indicator-name', '.indicator-desc', '.indicator-num',
    '.check-text',
    '.scenario-cond', '.scenario-result',
    '.persona-header', '.persona-list li',
    '.cta-title', '.cta-body', '.cta-question',
    '.cta-btn',
    '.category-label', '.page-num',
    '.account-tag', '.source-text', '.disclaimer',
    '.myth-wrong', '.myth-correct',
  ].join(',');

  /* ============================================================
     탭 전환
     ============================================================ */
  const tabs = document.querySelectorAll('.tab');
  const sets = document.querySelectorAll('.card-set');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sets.forEach(s => s.classList.toggle('active', s.id === tab.dataset.target));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ============================================================
     미리보기 스케일 슬라이더
     ============================================================ */
  const slider   = document.getElementById('scaleSlider');
  const scaleVal = document.getElementById('scaleValue');

  function applyScale(v) {
    const s = v / 100;
    document.documentElement.style.setProperty('--scale', s);
    document.querySelectorAll('.card-preview-wrap').forEach(w => {
      w.style.width  = `${1080 * s}px`;
      w.style.height = `${1350 * s}px`;
    });
    if (scaleVal) scaleVal.textContent = `${v}%`;
  }

  if (slider) {
    slider.addEventListener('input', () => applyScale(+slider.value));
    applyScale(+slider.value);
  }

  /* ============================================================
     편집 모드
     ============================================================ */
  let editMode = false;

  const editBtn = document.createElement('button');
  editBtn.className = 'btn';
  editBtn.textContent = '✏️ 편집 모드';
  document.querySelector('.controls').prepend(editBtn);

  editBtn.addEventListener('click', () => {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    editBtn.classList.toggle('edit-active', editMode);
    editBtn.textContent = editMode ? '✏️ 편집 완료' : '✏️ 편집 모드';

    document.querySelectorAll(EDITABLE_SELECTORS).forEach(el => {
      if (editMode) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      } else {
        el.removeAttribute('contenteditable');
      }
    });
  });

  /* ============================================================
     PNG 저장 (html2canvas)
     ============================================================ */
  async function downloadCard(wrap) {
    if (typeof html2canvas === 'undefined') {
      alert('html2canvas 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const btn  = wrap.querySelector('.download-btn');
    const card = wrap.querySelector('.card');
    if (!card) return;

    const origText = btn.textContent;
    btn.textContent = '⏳ 저장 중...';
    btn.disabled = true;

    /* 폰트 완전 로딩 대기 */
    await document.fonts.ready;

    /* 풀사이즈(1080×1350) 임시 컨테이너 생성 */
    const tmp = document.createElement('div');
    Object.assign(tmp.style, {
      position:   'fixed',
      left:       '-9999px',
      top:        '0',
      width:      '1080px',
      height:     '1350px',
      overflow:   'hidden',
      zIndex:     '-1',
    });

    const clone = card.cloneNode(true);
    Object.assign(clone.style, {
      width:        '1080px',
      height:       '1350px',
      transform:    'none',
      position:     'relative',
      borderRadius: '24px',
    });

    /* contenteditable 흔적 제거 후 캡처 */
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
    });

    tmp.appendChild(clone);
    document.body.appendChild(tmp);

    try {
      const canvas = await html2canvas(tmp, {
        width:           1080,
        height:          1350,
        scale:           2,        /* 2x = 2160×2700 고해상도 */
        useCORS:         true,
        allowTaint:      false,
        logging:         false,
        backgroundColor: null,
      });

      /* 파일명: cardnews_CARD01.png */
      const indexEl = wrap.querySelector('.card-index');
      const label   = indexEl
        ? indexEl.textContent.match(/CARD\s*\d+/i)?.[0]?.replace(/\s/, '') ?? 'card'
        : 'card';

      const link = document.createElement('a');
      link.download = `cardnews_${label}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

    } catch (err) {
      console.error('[download]', err);
      alert('이미지 저장 중 오류가 발생했습니다.\n브라우저 콘솔(F12)에서 자세한 내용을 확인할 수 있습니다.');
    } finally {
      document.body.removeChild(tmp);
      btn.textContent = origText;
      btn.disabled    = false;
    }
  }

  /* ── 각 카드에 PNG 저장 버튼 추가 ── */
  document.querySelectorAll('.card-preview-wrap').forEach(wrap => {
    const btn = document.createElement('button');
    btn.className   = 'download-btn';
    btn.textContent = '📥 PNG 저장';
    btn.title       = '이 카드를 고해상도 PNG로 저장합니다';
    btn.addEventListener('click', e => {
      e.stopPropagation(); /* 확대 오버레이 방지 */
      downloadCard(wrap);
    });
    wrap.appendChild(btn);
  });

  /* ============================================================
     카드 클릭 → 풀사이즈 오버레이
     ============================================================ */
  const overlay = document.createElement('div');
  overlay.id = 'card-overlay';
  Object.assign(overlay.style, {
    display:    'none',
    position:   'fixed',
    inset:      '0',
    background: 'rgba(0,0,0,0.90)',
    zIndex:     '9999',
    overflowY:  'auto',
    cursor:     'zoom-out',
  });

  const overlayHint = document.createElement('p');
  Object.assign(overlayHint.style, {
    textAlign:  'center',
    color:      'rgba(255,255,255,0.45)',
    fontSize:   '13px',
    padding:    '16px 0 0',
    fontFamily: 'sans-serif',
  });
  overlayHint.textContent = '클릭하거나 ESC 키로 닫기';
  overlay.appendChild(overlayHint);

  document.body.appendChild(overlay);

  document.querySelectorAll('.card-preview-wrap').forEach(wrap => {
    wrap.style.cursor = 'zoom-in';
    wrap.addEventListener('click', () => {
      if (editMode) return; /* 편집 모드에서는 오버레이 비활성 */

      const card = wrap.querySelector('.card');
      if (!card) return;

      const clone = card.cloneNode(true);
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      Object.assign(clone.style, {
        transform:       'none',
        position:        'relative',
        margin:          '48px auto',
        borderRadius:    '24px',
        boxShadow:       '0 40px 120px rgba(0,0,0,0.85)',
        display:         'block',
      });

      /* 기존 클론 제거 후 새 클론 삽입 */
      overlay.querySelectorAll('.card').forEach(c => c.remove());
      overlay.appendChild(clone);
      overlay.style.display    = 'block';
      document.body.style.overflow = 'hidden';
    });
  });

  overlay.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

  function closeOverlay() {
    overlay.style.display        = 'none';
    document.body.style.overflow = '';
  }

})();
