(() => {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = year; });

  const copyButton = document.querySelector('[data-copy-email]');
  copyButton?.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText('rojae@kakao.com');
      status.textContent = '이메일 주소를 복사했습니다.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = '이메일을 선택했습니다. 직접 복사해 주세요.';
    }
  });

  document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
})();

// 다이어그램 · 이미지 확대 보기 (라이트박스): 드래그로 이동, 휠 · 핀치 · 버튼으로 확대
(() => {
  const targets = document.querySelectorAll('.diagram-figure svg, .shot img, .project-media img');
  if (!targets.length || !('HTMLDialogElement' in window)) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = '<div class="lightbox-bar"><span class="lightbox-title"></span><span class="lightbox-tools"><button type="button" data-zoom="-" aria-label="축소">−</button><span class="lightbox-level">100%</span><button type="button" data-zoom="+" aria-label="확대">+</button><button type="button" data-zoom="0" aria-label="화면에 맞춤">맞춤</button><button type="button" data-close aria-label="닫기">✕</button></span></div><div class="lightbox-stage"><div class="lightbox-content"></div></div><p class="lightbox-hint">드래그로 이동 · 휠 / 두 손가락으로 확대</p>';
  document.body.append(dialog);
  const stage = dialog.querySelector('.lightbox-stage');
  const content = dialog.querySelector('.lightbox-content');
  const level = dialog.querySelector('.lightbox-level');
  const title = dialog.querySelector('.lightbox-title');
  const hint = dialog.querySelector('.lightbox-hint');
  const MIN = 0.5, MAX = 5;
  let scale = 1, x = 0, y = 0, base = 1; // base: 패널에 맞는 배율, scale: 사용자 배율
  const render = () => {
    content.style.transform = `translate(${x}px, ${y}px) scale(${base * scale})`;
    level.textContent = `${Math.round(scale * 100)}%`;
  };
  const size = () => ({ w: content.offsetWidth, h: content.offsetHeight, sw: stage.clientWidth, sh: stage.clientHeight });
  const center = () => { const { w, h, sw, sh } = size(); x = (sw - w * base * scale) / 2; y = Math.max(16, (sh - h * base * scale) / 2); };
  const fit = () => {
    const { w, h, sw, sh } = size();
    base = Math.min((sw - 32) / w, (sh - 32) / h, 1);
    // 좁은 화면에서는 읽히도록 처음부터 조금 키워서 연다 (드래그로 이동 가능)
    scale = sw < 700 ? Math.min(2, Math.round((760 / (w * base)) * 4) / 4) : 1;
    center(); render();
  };
  const zoomAt = (next, cx, cy) => {
    next = Math.min(MAX, Math.max(MIN, next));
    const k = next / scale;
    x = cx - (cx - x) * k; y = cy - (cy - y) * k; scale = next; render();
  };
  const open = (el) => {
    const clone = el.cloneNode(true);
    clone.removeAttribute('tabindex'); clone.removeAttribute('role'); clone.classList.remove('zoomable');
    content.replaceChildren(clone);
    const fig = el.closest('figure');
    title.textContent = (fig && fig.querySelector('figcaption')?.textContent) || el.getAttribute('alt') || el.getAttribute('aria-label') || '';
    dialog.showModal();
    hint.classList.remove('is-hidden');
    requestAnimationFrame(() => { content.style.width = '1200px'; fit(); });
  };
  targets.forEach(el => {
    el.classList.add('zoomable');
    el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
  });
  // 버튼
  dialog.addEventListener('click', e => {
    const zoom = e.target.closest('[data-zoom]');
    if (zoom) {
      const { sw, sh } = size();
      const z = zoom.dataset.zoom;
      if (z === '0') fit(); else zoomAt(scale + (z === '+' ? 0.25 : -0.25), sw / 2, sh / 2);
      return;
    }
    if (e.target.closest('[data-close]') || e.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', e => {
    const { sw, sh } = size();
    if (e.key === '+' || e.key === '=') zoomAt(scale + 0.25, sw / 2, sh / 2);
    if (e.key === '-') zoomAt(scale - 0.25, sw / 2, sh / 2);
    if (e.key === '0') fit();
  });
  // 휠: 확대 / 축소 (커서 기준)
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const factor = Math.exp(-e.deltaY * 0.0015);
    zoomAt(scale * factor, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  // 더블클릭 · 더블탭: 2배 ↔ 맞춤
  stage.addEventListener('dblclick', e => {
    const r = stage.getBoundingClientRect();
    if (scale > 1.05) fit(); else zoomAt(2, e.clientX - r.left, e.clientY - r.top);
  });
  // 포인터: 한 손가락 · 마우스 드래그 = 이동, 두 손가락 = 핀치 줌
  const pointers = new Map();
  let last = null, pinch = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { last = { x: e.clientX, y: e.clientY }; stage.classList.add('is-dragging'); hint.classList.add('is-hidden'); }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = stage.getBoundingClientRect();
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      zoomAt(pinch.scale * (dist / pinch.dist), mid.x, mid.y);
    } else if (pointers.size === 1 && last) {
      x += e.clientX - last.x; y += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; render();
    }
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) { last = null; stage.classList.remove('is-dragging'); }
    else if (pointers.size === 1) { const [a] = [...pointers.values()]; last = { x: a.x, y: a.y }; }
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  window.addEventListener('resize', () => { if (dialog.open) fit(); });
})();
