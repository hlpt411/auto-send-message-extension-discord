/**
 * Chat Sender Pro - Content Script
 * Gửi tin nhắn hàng loạt trên Discord (tối ưu cho ô nhập Slate/React).
 * - Nhập văn bản chuẩn React/Slate (beforeinput + execCommand) kèm fallback native setter
 * - Loop ổn định, không gửi tin trống, đếm tin đã gửi / bỏ qua
 * - Hỗ trợ nhiều dòng tin nhắn gửi xoay vòng
 * - Báo cáo trạng thái realtime về background (badge) + popup
 */
(() => {
  if (window.__chatSender) return;

  // ===== SELECTOR DÀNH RIÊNG CHO DISCORD =====
  const INPUT_SELECTOR = '[class*="channelTextArea"] [role="textbox"]';
  const SUBMIT_SELECTOR = '[class*="channelTextArea"] button[aria-label="Send Message"]';

  const state = {
    running: false,
    count: 0,        // số tin đã gửi THÀNH CÔNG
    skipped: 0,      // số lần bỏ qua (trống / không tìm thấy ô / lỗi nhập)
    startTime: 0,
    lastError: null,
    timerId: null,
    delay: 1000,
    maxIterations: Infinity,
    lines: [],       // danh sách tin (mỗi dòng = 1 tin)
    lineIndex: 0
  };

  const findInput = () => document.querySelector(INPUT_SELECTOR);
  const findSubmit = () => document.querySelector(SUBMIT_SELECTOR);
  const getText = (el) => ((el && (el.value || el.textContent || '')) || '').trim();

  // ===== NHẬP VĂN BẢN TỐI ƯU CHO SLATE/REACT =====
  function setInputValue(el, text) {
    if (!el) return false;
    el.focus();
    try {
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      el.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true
      }));
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (getText(el).length > 0) return true;
    } catch (e) { /* fallthrough -> fallback */ }

    // Fallback: native setter (textarea/input) hoặc textContent (contenteditable)
    try {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, text);
        else el.value = text;
      } else if (el.isContentEditable) {
        el.textContent = text;
      }
      el.dispatchEvent(new InputEvent('input', {
        inputType: 'insertText', data: text, bubbles: true, composed: true
      }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return getText(el).length > 0;
    } catch (e) {
      return false;
    }
  }

  // ===== GỬI TIN =====
  function submitForm() {
    const btn = findSubmit();
    if (btn && !btn.disabled) {
      btn.click();
      return 'click';
    }
    // Fallback: phím Enter trên ô nhập
    const inputEl = findInput();
    if (inputEl) {
      ['keydown', 'keypress', 'keyup'].forEach((type) => {
        inputEl.dispatchEvent(new KeyboardEvent(type, {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
      });
      return 'enter';
    }
    return null;
  }

  function nextLine() {
    if (!state.lines.length) return '';
    const line = state.lines[state.lineIndex];
    state.lineIndex = (state.lineIndex + 1) % state.lines.length;
    return line;
  }

  // Gửi 1 tin, resolve(true) nếu gửi thành công
  function sendOneMessage() {
    return new Promise((resolve) => {
      // Nếu đây là tin trong vòng lặp, bắt token trước:
      // nếu loop bị STOP giữa chừng thì huỷ luôn, không gửi thêm.
      const isLoopSend = state.running;
      const inputEl = findInput();
      if (!inputEl) {
        state.lastError = 'Khong tim thay o nhap chat (mo tab Discord + chon kenh chat)';
        resolve(false);
        return;
      }
      const text = nextLine();
      if (!text) {
        state.lastError = 'Tin nhan trong - bo qua';
        resolve(false);
        return;
      }
      if (!setInputValue(inputEl, text)) {
        state.lastError = 'Khong chen duoc van ban vao o nhap';
        resolve(false);
        return;
      }
      // Đợi React/Slate cập nhật state rồi mới bấm gửi
      setTimeout(() => {
        // Loop đã bị STOP trong lúc chờ -> huỷ, không gửi tin cuối
        if (isLoopSend && !state.running) {
          resolve(false);
          return;
        }
        const res = submitForm();
        if (!res) {
          state.lastError = 'Khong tim thay nut gui tin';
          resolve(false);
          return;
        }
        state.count += 1;
        state.lastError = null;
        broadcast();
        resolve(true);
      }, 80);
    });
  }

  // ===== VÒNG LẶP CHÍNH =====
  async function loopTick() {
    if (!state.running) return;
    if (state.maxIterations !== Infinity && state.count >= state.maxIterations) {
      state.running = false;
      broadcast({ done: true });
      return;
    }
    const ok = await sendOneMessage();
    if (!ok) state.skipped += 1;
    if (!state.running) return;
    state.timerId = setTimeout(loopTick, state.delay);
  }

  function start(opts = {}) {
    stop(); // dọn vòng lặp cũ nếu có

    const rawMessage = String(opts.message || '');
    state.lines = rawMessage.split('\n');
    state.lineIndex = 0;
    state.delay = Math.max(50, parseInt(opts.delay, 10) || 1000);
    state.maxIterations =
      opts.maxIterations === undefined || opts.maxIterations === null || opts.maxIterations === Infinity
        ? Infinity
        : Math.max(1, parseInt(opts.maxIterations, 10) || 1);
    state.count = 0;
    state.skipped = 0;
    state.lastError = null;
    state.startTime = Date.now();
    state.running = true;
    broadcast();
    state.timerId = setTimeout(loopTick, 0);
  }

  function stop() {
    state.running = false;
    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
    broadcast();
  }

  function getStatus() {
    return {
      injected: true,
      running: state.running,
      count: state.count,
      skipped: state.skipped,
      delay: state.delay,
      maxIterations: state.maxIterations,
      elapsed: state.startTime ? Date.now() - state.startTime : 0,
      lastError: state.lastError,
      inputFound: !!findInput(),
      submitFound: !!findSubmit(),
      lineIndex: state.lineIndex,
      totalLines: state.lines.length
    };
  }

  function broadcast(extra) {
    try {
      chrome.runtime.sendMessage(Object.assign({
        from: 'content',
        action: 'UPDATE',
        running: state.running,
        count: state.count,
        skipped: state.skipped,
        elapsed: state.startTime ? Date.now() - state.startTime : 0,
        lastError: state.lastError
      }, extra || {}));
    } catch (e) { /* ignore */ }
  }

  // ===== LẮNG NGHE LỆNH TỪ POPUP =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || typeof request !== 'object') {
      sendResponse({ ok: false, error: 'bad request' });
      return;
    }

    switch (request.action) {
      case 'PING':
        sendResponse({ status: 'PONG' });
        break;

      case 'STATUS':
        sendResponse(getStatus());
        break;

      case 'SEND_ONE': {
        // Gửi thử 1 tin (dòng đầu tiên)
        const msg = String(request.message || '').split('\n');
        state.lines = msg;
        state.lineIndex = 0;
        if (!state.running) {
          state.count = 0;
          state.skipped = 0;
          state.lastError = null;
          state.startTime = Date.now();
        }
        sendOneMessage().then((ok) => {
          if (!ok) state.skipped += 1;
          sendResponse({ ok, status: getStatus() });
        });
        return true; // gửi phản hồi bất đồng bộ
      }

      case 'START':
        start(request);
        sendResponse({ ok: true, status: getStatus() });
        break;

      case 'STOP':
        stop();
        sendResponse({ ok: true, status: getStatus() });
        break;

      default:
        sendResponse({ ok: false, error: 'unknown action: ' + request.action });
    }
  });

  // API debug - tiện cho việc test và gỡ lỗi
  window.__chatSender = {
    start,
    stop,
    getStatus,
    sendOnce: sendOneMessage,
    setInputValue,
    findInput,
    findSubmit,
    _state: state
  };

  console.log('[Chat Sender Pro] Content script ready (Discord optimized).');
})();
