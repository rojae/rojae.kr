(() => {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = year; });

  const copyButton = document.querySelector('[data-copy-email]');
  copyButton?.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText('jaeseoh96@gmail.com');
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
