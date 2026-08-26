/**
 * Chat Sender Pro - Background Service Worker
 * Nhiệm vụ: nhận trạng thái từ content script, hiển thị badge đếm tin trên icon extension.
 */
(() => {
  let lastState = { running: false, count: 0 };

  // Khôi phục trạng thái gần nhất (nếu service worker bị kill rồi khởi động lại)
  try {
    chrome.storage.session.get('state').then((data) => {
      if (data && data.state) {
        lastState = data.state;
        updateBadge();
      }
    }).catch(() => {});
  } catch (e) { /* session storage không hỗ trợ thì bỏ qua */ }

  function updateBadge() {
    try {
      if (lastState.running) {
        const text = String(Math.min(lastState.count || 0, 999));
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (e) { /* ignore */ }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== 'object') return;

    // Content script báo cáo tiến trình -> cập nhật badge + lưu state
    if (msg.from === 'content' && msg.action === 'UPDATE') {
      lastState = {
        running: !!msg.running,
        count: msg.count || 0,
        skipped: msg.skipped || 0,
        tabId: sender && sender.tab ? sender.tab.id : null
      };
      updateBadge();
      try {
        chrome.storage.session.set({ state: lastState }).catch(() => {});
      } catch (e) { /* ignore */ }
      return;
    }

    // Popup hỏi trạng thái gần nhất
    if (msg.action === 'GET_STATE') {
      sendResponse(lastState);
      return true;
    }
  });

  console.log('[Chat Sender Pro] Background ready.');
})();
