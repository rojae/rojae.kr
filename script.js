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

// 다이어그램 · 이미지 확대 보기 (라이트박스)
(() => {
  const targets = document.querySelectorAll('.diagram-figure svg, .shot img, .project-media img');
  if (!targets.length || !('HTMLDialogElement' in window)) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = '<div class="lightbox-bar"><span class="lightbox-title"></span><span class="lightbox-tools"><button type="button" data-zoom="-" aria-label="축소">−</button><span class="lightbox-level">100%</span><button type="button" data-zoom="+" aria-label="확대">+</button><button type="button" data-zoom="0" aria-label="원래 크기">맞춤</button><button type="button" data-close aria-label="닫기">✕</button></span></div><div class="lightbox-stage"><div class="lightbox-content"></div></div>';
  document.body.append(dialog);
  const content = dialog.querySelector('.lightbox-content');
  const stage = dialog.querySelector('.lightbox-stage');
  const level = dialog.querySelector('.lightbox-level');
  const title = dialog.querySelector('.lightbox-title');
  let scale = 1;
  const apply = () => { content.style.width = `${Math.round(scale * 100)}%`; level.textContent = `${Math.round(scale * 100)}%`; };
  const open = (el) => {
    content.replaceChildren(el.cloneNode(true));
    const fig = el.closest('figure');
    title.textContent = (fig && fig.querySelector('figcaption')?.textContent) || el.getAttribute('alt') || el.getAttribute('aria-label') || '';
    // 좁은 화면에서는 다이어그램이 읽히도록 처음부터 키워서 연다
    scale = Math.max(1, Math.round((820 / window.innerWidth) * 4) / 4); apply(); stage.scrollTo(0, 0);
    dialog.showModal();
  };
  targets.forEach(el => {
    el.classList.add('zoomable');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
  });
  dialog.addEventListener('click', e => {
    const zoom = e.target.closest('[data-zoom]');
    if (zoom) {
      const z = zoom.dataset.zoom;
      scale = z === '0' ? 1 : Math.min(4, Math.max(0.5, scale + (z === '+' ? 0.25 : -0.25)));
      apply(); return;
    }
    if (e.target.closest('[data-close]') || e.target === dialog || e.target === stage) dialog.close();
  });
  dialog.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') { scale = Math.min(4, scale + 0.25); apply(); }
    if (e.key === '-') { scale = Math.max(0.5, scale - 0.25); apply(); }
  });
})();
