document.addEventListener('DOMContentLoaded', () => {
  const messageEl = document.getElementById('message');
  const intervalEl = document.getElementById('interval');
  const maxIterationsEl = document.getElementById('maxIterations');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const presetBtns = document.querySelectorAll('.presets button[data-ms]');

  // Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      intervalEl.value = btn.dataset.ms;
    });
  });

  // Lấy tab active
  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');
    return tab.id;
  }

  // Validate input
  function validateInputs() {
    const message = messageEl.value; // không trim để giữ dấu cách nếu cần
    let delay = parseInt(intervalEl.value, 10);
    if (isNaN(delay) || delay < 1) delay = 1000;

    let maxIterations = Infinity;
    const raw = maxIterationsEl.value.trim();
    if (raw !== '') {
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new Error('Max iterations must be a positive number or empty.');
      }
      maxIterations = parsed;
    }

    console.log('[Popup] Inputs validated:', { message, delay, maxIterations });
    return { message, delay, maxIterations };
  }

  // Bắt đầu
  async function startExecution() {
    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';
    try {
      const params = validateInputs();
      const tabId = await getActiveTabId();

      // Luôn tiêm content.js (không cần PING)
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });

      // Chờ script sẵn sàng
      await new Promise(r => setTimeout(r, 200));

      // Gửi lệnh START
      chrome.tabs.sendMessage(tabId, {
        action: 'START',
        message: params.message,
        delay: params.delay,
        maxIterations: params.maxIterations
      });

      startBtn.textContent = 'Running...';
      console.log('[Popup] START command sent.');
    } catch (err) {
      alert('Error: ' + err.message);
      startBtn.textContent = '▶ Start Execution';
    } finally {
      startBtn.disabled = false;
    }
  }

  // Dừng
  async function stopExecution() {
    try {
      const tabId = await getActiveTabId();
      chrome.tabs.sendMessage(tabId, { action: 'STOP' });
    } catch (err) {}
    startBtn.textContent = '▶ Start Execution';
    console.log('[Popup] STOP sent.');
  }

  startBtn.addEventListener('click', startExecution);
  stopBtn.addEventListener('click', stopExecution);

  console.log('[Popup] Ready. Blank Max Iterations = Infinite.');
});