/**
 * Chat Sender Pro - Popup Logic
 * - Kết nối / kiểm tra content script trên tab đang mở
 * - Bắt đầu / dừng / gửi thử vòng lặp gửi tin
 * - Hiển thị thống kê realtime: đã gửi, thời gian, tốc độ, bỏ qua
 * - Lưu cài đặt (chrome.storage.local), phím Esc để dừng
 */
(() => {
  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

  const $ = (id) => document.getElementById(id);
  const els = {
    message: $('message'), interval: $('interval'), max: $('max'),
    startBtn: $('startBtn'), stopBtn: $('stopBtn'), testBtn: $('testBtn'), refreshBtn: $('refreshBtn'),
    statusPill: $('statusPill'), statusDot: $('statusDot'), statusText: $('statusText'),
    inputFound: $('inputFound'), submitFound: $('submitFound'), nextLine: $('nextLine'),
    statsCard: $('statsCard'), statCount: $('statCount'), statTime: $('statTime'),
    statRate: $('statRate'), statSkipped: $('statSkipped'), progressBar: $('progressBar'),
    errorLine: $('errorLine'), charCount: $('charCount'), lineCount: $('lineCount'), toast: $('toast')
  };

  let running = false;
  let clockTimer = null;
  let toastTimer = null;
  let lastStatus = null;
  let statBase = { elapsed: 0, syncedAt: Date.now() };

  // ===== TOAST =====
  function toast(msg, type) {
    els.toast.textContent = msg;
    els.toast.className = 'toast show ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.className = 'toast'; }, 2600);
  }

  // ===== CHROME HELPERS =====
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('Khong co tab dang mo');
    return tab;
  }

  async function ensureInjected(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  }

  function sendCmd(tabId, payload) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, payload, (resp) => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve(resp);
      });
    });
  }

  // ===== VALIDATE =====
  function validate() {
    const message = els.message.value;
    if (!message || !message.trim()) throw new Error('Nhap noi dung tin nhan truoc');
    let delay = parseInt(els.interval.value, 10);
    if (isNaN(delay) || delay < 50) delay = 1000;
    let maxIterations = Infinity;
    const raw = els.max.value.trim();
    if (raw !== '') {
      const p = parseInt(raw, 10);
      if (isNaN(p) || p < 1) throw new Error('So lan toi da phai la so duong hoac de trong (khong gioi han)');
      maxIterations = p;
    }
    return { message, delay, maxIterations };
  }

  // ===== RENDER TRẠNG THÁI =====
  function renderStatus(st) {
    if (!st || !st.injected) {
      els.statusPill.className = 'pill';
      els.statusPill.textContent = 'Chưa kết nối';
      els.statusDot.className = 'dot idle';
      els.statusText.textContent = 'Chưa kết nối - bấm Bắt đầu để tiêm script';
      els.inputFound.textContent = '-';
      els.submitFound.textContent = '-';
      els.nextLine.textContent = '-';
      return;
    }
    els.statusPill.className = 'pill ' + (st.running ? 'running' : 'on');
    els.statusPill.textContent = st.running ? 'ĐANG CHẠY' : 'Đã kết nối';
    els.statusDot.className = 'dot ' + (st.running ? 'on' : 'on');
    els.statusText.textContent = st.running
      ? 'Đang gửi tin... (đóng popup vẫn chạy, xem badge)'
      : 'Đã kết nối với trang chat';
    els.inputFound.textContent = st.inputFound ? 'Có' : 'Không';
    els.inputFound.className = 'v ' + (st.inputFound ? 'yes' : 'no');
    els.submitFound.textContent = st.submitFound ? 'Có' : 'Không';
    els.submitFound.className = 'v ' + (st.submitFound ? 'yes' : 'no');
    els.nextLine.textContent = st.totalLines > 0 ? (st.lineIndex + 1) + '/' + st.totalLines : '-';
  }

  function syncStats(st) {
    lastStatus = st;
    statBase = { elapsed: st.elapsed || 0, syncedAt: Date.now() };
  }

  function currentElapsed() {
    return statBase.elapsed + (Date.now() - statBase.syncedAt);
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function updateStats(st) {
    if (!st) return;
    const elapsed = currentElapsed();
    const rate = elapsed > 500 ? Math.round((st.count / (elapsed / 1000)) * 60) : 0;
    els.statCount.textContent = String(st.count);
    els.statTime.textContent = fmtTime(elapsed);
    els.statRate.textContent = String(rate);
    els.statSkipped.textContent = String(st.skipped || 0);
    if (st.maxIterations && st.maxIterations !== Infinity) {
      els.progressBar.style.width = Math.min(100, (st.count / st.maxIterations) * 100) + '%';
    } else {
      els.progressBar.style.width = st.running ? '30%' : '0%';
    }
    if (st.lastError) {
      els.errorLine.textContent = 'Lỗi: ' + st.lastError;
      els.errorLine.classList.remove('hidden');
    } else {
      els.errorLine.classList.add('hidden');
    }
  }

  function enterRunningMode(st) {
    running = true;
    els.startBtn.disabled = true;
    els.startBtn.innerHTML = 'Đang chạy...';
    els.stopBtn.disabled = false;
    els.statsCard.classList.remove('hidden');
    syncStats(st);
    updateStats(st);
    startClock();
  }

  function exitRunningMode(finished) {
    running = false;
    stopClock();
    els.startBtn.disabled = false;
    els.startBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8Z"></path></svg> Bắt đầu';
    els.stopBtn.disabled = true;
    if (finished) {
      els.progressBar.style.width = '100%';
      toast('Hoàn tất - da gui xong!', 'success');
    }
    renderStatus(lastStatus);
  }

  function startClock() {
    stopClock();
    clockTimer = setInterval(() => { if (lastStatus) updateStats(lastStatus); }, 1000);
  }
  function stopClock() { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }

  // ===== KIỂM TRA TRẠNG THÁI =====
  async function refreshStatus() {
    if (!isExtension) {
      renderStatus(null);
      return;
    }
    try {
      const tab = await getActiveTab();
      await sendCmd(tab.id, { action: 'PING' });
      const st = await sendCmd(tab.id, { action: 'STATUS' });
      lastStatus = st;
      renderStatus(st);
      if (st.running) {
        enterRunningMode(st);
      } else {
        els.statsCard.classList.remove('hidden');
        syncStats(st);
        updateStats(st);
        els.progressBar.style.width = '0%';
      }
    } catch (e) {
      lastStatus = null;
      renderStatus(null);
      els.statsCard.classList.add('hidden');
    }
  }

  // ===== HÀNH ĐỘNG =====
  async function startExecution() {
    if (!isExtension) { toast('Mở popup này trong trình duyệt có cài extension', 'error'); return; }
    let params;
    try { params = validate(); }
    catch (e) { toast(e.message, 'error'); return; }

    const infinite = params.maxIterations === Infinity;
    if (infinite && params.delay < 300) {
      const ok = confirm('Chay KHONG GIOI HAN voi toc do nhanh (' + params.delay + 'ms) co the bi Discord rate-limit hoac khoa tai khoan.\n\nBan co chac muon tiep tuc?');
      if (!ok) return;
    }

    try {
      const tab = await getActiveTab();
      await ensureInjected(tab.id);
      await new Promise((r) => setTimeout(r, 150));
      const resp = await sendCmd(tab.id, {
        action: 'START',
        message: params.message,
        delay: params.delay,
        maxIterations: params.maxIterations
      });
      if (resp && resp.status) {
        renderStatus(resp.status);
        enterRunningMode(resp.status);
      }
      saveSettings();
    } catch (e) {
      toast('Loi: ' + e.message, 'error');
    }
  }

  async function stopExecution() {
    if (!isExtension) { toast('Mở popup này trong trình duyệt có cài extension', 'error'); return; }
    try {
      const tab = await getActiveTab();
      await sendCmd(tab.id, { action: 'STOP' });
    } catch (e) { /* tab đã đóng hoặc chưa tiêm */ }
    exitRunningMode(false);
    toast('Da dung', 'success');
  }

  async function testSend() {
    if (!isExtension) { toast('Mở popup này trong trình duyệt có cài extension', 'error'); return; }
    const message = els.message.value;
    if (!message || !message.trim()) { toast('Nhap noi dung tin nhan truoc', 'error'); return; }
    try {
      const tab = await getActiveTab();
      await ensureInjected(tab.id);
      await new Promise((r) => setTimeout(r, 150));
      const resp = await sendCmd(tab.id, { action: 'SEND_ONE', message });
      if (resp && resp.ok) {
        toast('Da gui 1 tin thu thanh cong', 'success');
      } else {
        const err = (resp && resp.status && resp.status.lastError) || 'chua mo dung tab Discord';
        toast('Gui thu that bai - ' + err, 'error');
      }
      if (resp && resp.status) refreshStatus();
    } catch (e) {
      toast('Loi: ' + e.message, 'error');
    }
  }

  // ===== LƯU / KHÔI PHỤC CÀI ĐẶT =====
  async function saveSettings() {
    try {
      await chrome.storage.local.set({
        msg: els.message.value, interval: els.interval.value, max: els.max.value
      });
    } catch (e) { /* ignore */ }
  }

  async function loadSettings() {
    try {
      const d = await chrome.storage.local.get(['msg', 'interval', 'max']);
      if (d.msg !== undefined) els.message.value = d.msg;
      if (d.interval !== undefined) els.interval.value = d.interval;
      if (d.max !== undefined) els.max.value = d.max;
    } catch (e) { /* ignore */ }
    updateCounters();
  }

  function updateCounters() {
    const v = els.message.value;
    els.charCount.textContent = String(v.length);
    els.lineCount.textContent = String(v.split('\n').filter((l) => l.trim().length > 0).length);
  }

  // ===== CHIPS =====
  function bindChips() {
    document.querySelectorAll('.chip[data-ms]').forEach((chip) => {
      chip.addEventListener('click', () => {
        els.interval.value = chip.dataset.ms;
        markActive('.chip[data-ms]', chip);
      });
    });
    document.querySelectorAll('.chip[data-max]').forEach((chip) => {
      chip.addEventListener('click', () => {
        els.max.value = chip.dataset.max;
        markActive('.chip[data-max]', chip);
      });
    });
  }
  function markActive(sel, chip) {
    document.querySelectorAll(sel).forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
  }

  // ===== SỰ KIỆN =====
  function bindEvents() {
    els.startBtn.addEventListener('click', startExecution);
    els.stopBtn.addEventListener('click', stopExecution);
    els.testBtn.addEventListener('click', testSend);
    els.refreshBtn.addEventListener('click', refreshStatus);
    els.message.addEventListener('input', updateCounters);
    els.interval.addEventListener('change', () => saveSettings());
    els.max.addEventListener('change', () => saveSettings());
    els.message.addEventListener('change', () => saveSettings());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && running) stopExecution();
    });
  }

  // ===== NHẬN UPDATE TỪ CONTENT SCRIPT =====
  function listenContent() {
    if (!isExtension) return;
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || msg.from !== 'content' || msg.action !== 'UPDATE') return;
      if (msg.running) {
        syncStats(msg);
        renderStatus(msg);
        updateStats(msg);
      } else if (msg.done) {
        syncStats(msg);
        lastStatus = msg;
        exitRunningMode(true);
        renderStatus(msg);
      }
    });
  }

  // ===== KHỞI ĐỘNG =====
  bindChips();
  bindEvents();
  listenContent();

  if (isExtension) {
    loadSettings().then(() => refreshStatus());
    // Lấy trạng thái badge gần nhất từ background
    try {
      chrome.runtime.sendMessage({ action: 'GET_STATE' }, () => { /* bỏ qua */ });
    } catch (e) { /* ignore */ }
  } else {
    els.message.value = 'Hello Discord!\nDong thu hai - test rotation';
    updateCounters();
    renderStatus(null);
    els.refreshBtn.disabled = true;
    console.log('[Chat Sender Pro] Demo mode (khong co extension context).');
  }
})();
