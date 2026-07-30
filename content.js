(function () {
  if (window.__loadTestInjected) return;
  window.__loadTestInjected = true;

  // ===== SELECTOR DÀNH RIÊNG CHO DISCORD =====
  // Chỉ lấy ô nhập trong kênh chat hiện tại (có class channelTextArea)
  const INPUT_SELECTOR = '[class*="channelTextArea"] [role="textbox"]';
  // Nút gửi nằm cùng vùng chat
  const SUBMIT_BUTTON_SELECTOR = '[class*="channelTextArea"] button[aria-label="Send Message"]';

  let isRunning = false;
  let loopTimeoutId = null;

  // ===== HÀM NHẬP VĂN BẢN TỐI ƯU CHO SLATE/REACT =====
  function setInputValue(element, text) {
    if (!element) return;
    // Focus để đảm bảo con trỏ trong ô
    element.focus();
    // Xóa nội dung cũ (nếu có) – có thể bỏ qua nếu muốn thêm vào cuối
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    // Sự kiện beforeinput – React sẽ lắng nghe để cập nhật state
    element.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true
    }));
    // Chèn văn bản thực tế vào DOM
    document.execCommand('insertText', false, text);
    // Kích hoạt các sự kiện thay đổi
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[Load Tester] Text inserted into:', element, 'Message:', text);
  }

  // ===== HÀM GỬI TIN NHẮN =====
  function submitForm() {
    // Tìm nút gửi trong cùng vùng chat
    const submitBtn = document.querySelector(SUBMIT_BUTTON_SELECTOR);
    if (submitBtn) {
      console.log('[Load Tester] Clicking send button:', submitBtn);
      submitBtn.click();
      return;
    }
    // Fallback: Enter key trên ô nhập
    const inputEl = document.querySelector(INPUT_SELECTOR);
    if (inputEl) {
      console.log('[Load Tester] Simulating Enter key on input');
      inputEl.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
    } else {
      console.error('[Load Tester] No send button or input found!');
    }
  }

  // ===== VÒNG LẶP CHÍNH =====
  function executeCycle(count, maxIterations, message, delay) {
    console.log(`[Load Tester] Cycle ${count}, max=${maxIterations}, running=${isRunning}`);
    if (!isRunning) return;
    if (maxIterations !== Infinity && count > maxIterations) {
      console.log('[Load Tester] Max iterations reached.');
      isRunning = false;
      return;
    }

    const inputEl = document.querySelector(INPUT_SELECTOR);
    if (!inputEl) {
      console.error('[Load Tester] Không tìm thấy ô nhập chat! Selector:', INPUT_SELECTOR);
      // Thử fallback selector cũ để debug
      const fallbackEl = document.querySelector('div[role="textbox"]');
      console.log('Fallback found:', fallbackEl);
      isRunning = false;
      return;
    }

    setInputValue(inputEl, message);
    // Đợi một chút để React kịp cập nhật state trước khi gửi
    setTimeout(() => {
      submitForm();
      // Lên lịch chu kỳ tiếp theo
      loopTimeoutId = setTimeout(
        () => executeCycle(count + 1, maxIterations, message, delay),
        delay
      );
    }, 100); // 100ms đệm
  }

  function startLoop({ message, delay, maxIterations }) {
    console.log('[Load Tester] START nhận:', { message, delay, maxIterations });
    // Dừng vòng lặp cũ nếu có
    if (isRunning || loopTimeoutId) {
      isRunning = false;
      clearTimeout(loopTimeoutId);
      loopTimeoutId = null;
    }
    isRunning = true;
    executeCycle(1, maxIterations, message, delay);
  }

  function stopLoop() {
    isRunning = false;
    if (loopTimeoutId) {
      clearTimeout(loopTimeoutId);
      loopTimeoutId = null;
    }
    console.log('[Load Tester] Force stopped.');
  }

  // ===== LẮNG NGHE LỆNH TỪ POPUP =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START') {
      startLoop({ message: request.message, delay: request.delay, maxIterations: request.maxIterations });
    } else if (request.action === 'STOP') {
      stopLoop();
    }
    // Giữ PING để test
    if (request.action === 'PING') {
      sendResponse({ status: 'PONG' });
      return true;
    }
  });

  console.log('[Load Tester] Content script ready. (Discord optimized)');
  console.log('Target input:', INPUT_SELECTOR);
  console.log('Target submit:', SUBMIT_BUTTON_SELECTOR);
})();