/* ============================================================
   인스타그램 카드뉴스 시스템 — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ── 탭 전환 ── */
  const tabs = document.querySelectorAll('.tab');
  const sets = document.querySelectorAll('.card-set');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      sets.forEach(s => {
        s.classList.toggle('active', s.id === target);
      });

      // 탭 전환 시 맨 위로 스크롤 (헤더 높이 보정)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ── 미리보기 스케일 슬라이더 ── */
  const slider   = document.getElementById('scaleSlider');
  const scaleVal = document.getElementById('scaleValue');

  function applyScale(value) {
    const scale = value / 100;
    document.documentElement.style.setProperty('--scale', scale);

    // 미리보기 래퍼 크기 갱신 (CSS calc 재계산)
    document.querySelectorAll('.card-preview-wrap').forEach(wrap => {
      wrap.style.width  = `${1080 * scale}px`;
      wrap.style.height = `${1350 * scale}px`;
    });

    scaleVal.textContent = `${value}%`;
  }

  if (slider) {
    slider.addEventListener('input', () => applyScale(parseInt(slider.value)));
    applyScale(parseInt(slider.value)); // 초기 적용
  }

  /* ── 카드 클릭 → 풀사이즈 오버레이 ── */
  const overlay = document.createElement('div');
  overlay.id = 'card-overlay';
  Object.assign(overlay.style, {
    display:         'none',
    position:        'fixed',
    inset:           '0',
    background:      'rgba(0,0,0,0.88)',
    zIndex:          '9999',
    overflowY:       'auto',
    cursor:          'zoom-out',
    display:         'none',
  });
  document.body.appendChild(overlay);

  document.querySelectorAll('.card-preview-wrap').forEach(wrap => {
    wrap.style.cursor = 'zoom-in';
    wrap.addEventListener('click', () => {
      const card = wrap.querySelector('.card');
      if (!card) return;

      // 카드 복제 후 스케일 1:1 로 표시
      const clone = card.cloneNode(true);
      Object.assign(clone.style, {
        transform:       'none',
        position:        'relative',
        margin:          '48px auto',
        borderRadius:    '24px',
        boxShadow:       '0 40px 100px rgba(0,0,0,0.8)',
        display:         'block',
      });

      overlay.innerHTML = '';
      overlay.appendChild(clone);
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  });

  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

})();
