# ⏱️ Auto Message Sender - Interval Messaging Extension

Auto Message Sender is a powerful browser extension that allows you to automate sending messages on any web-based chat platform or text input field. Whether you need to send bulk messages for testing, reminders, or automated announcements, this extension lets you send a list of messages at custom time intervals (e.g., every 100ms, 1000ms, 10s, etc.).

## ✨ Features

*   **Custom Intervals:** Send messages exactly when you want to. Supports high-speed sending (e.g., every 100ms) or slower pacing (e.g., every 1000ms / 1 second).
*   **Bulk Messaging:** Input a list of messages (separated by new lines) and the extension will send them one by one.
*   **Loop Functionality:** Option to loop the message list infinitely or stop after the list is completed.
*   **Universal Compatibility:** Works on almost any website with a text input field (Discord Web, WhatsApp Web, Slack, Messenger, custom web apps, etc.).
*   **Start/Stop Control:** Easily pause or cancel the automation process at any time with a single click.
*   **Lightweight & Fast:** Built with performance in mind to ensure precise timing without lagging your browser.

## 🚀 Installation

### From Source (Developer Mode)
1. Download or clone this repository to your local machine.
2. Open your Chromium-based browser (Chrome, Edge, Brave) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the folder containing the extension's code.
6. The extension icon should now appear in your browser toolbar!

## 📖 How to Use

1. **Pin the Extension:** Click the puzzle piece icon in your browser toolbar and pin the "Auto Message Sender" extension for easy access.
2. **Open Your Target Tab:** Navigate to the web page or chat application where you want to send messages.
3. **Click the Extension Icon:** The popup UI will appear.
4. **Enter Your Messages:** 
   * In the text area, type or paste the messages you want to send. 
   * *Note: Press `Enter` after each message to send them as separate messages.*
5. **Set the Interval:** 
   * Enter the delay between each message in milliseconds (ms). 
   * *Example: `100` = 0.1 seconds, `1000` = 1 second, `5000` = 5 seconds.*
6. **Optional - Loop:** Check the "Loop messages" box if you want the list to repeat from the top once it finishes.
7. **Click "Start":** The extension will begin typing and sending your messages automatically. 
8. **Stop:** Click the "Stop" button at any time to halt the automation.

## 💡 Use Cases

*   **QA & Load Testing:** Simulate heavy chat traffic to test the latency and stability of your custom web applications.
*   **Reminders & Announcements:** Post periodic reminders in a team channel (e.g., Slack or Discord).
*   **Data Entry Automation:** Auto-fill repetitive text fields on web forms.
*   **Game Bots:** Send automated commands in browser-based text games.

## ⚠️ Disclaimer & Responsible Use

**This extension is intended for educational, testing, and productivity purposes only.** 

* **Respect Platform ToS:** Many platforms (like Discord, WhatsApp, etc.) have strict Terms of Service against spamming and automated messaging. Using this tool to spam others may result in your account being **banned, suspended, or rate-limited**.
* **High-Speed Warning:** Setting the interval too low (e.g., `10ms`) on heavy websites may cause the browser tab to crash or trigger the website's anti-spam filters immediately.
* **Use at Your Own Risk:** The developer of this extension is not responsible for any damages, account bans, or loss of data resulting from the use of this software. Please use it responsibly.

## 🔧 Permissions Explained

*   `activeTab` & `scripting`: Required to read the text you input into the extension popup and simulate keystrokes into the active web page's text fields.
*   `storage`: Used to remember your last used settings (interval, loop preference) so you don't have to re-enter them every time.

## 🤝 Contributing

Pull requests are welcome! If you have suggestions for how to improve the timing precision, add randomization features (to avoid spam filters), or improve the UI, feel free to fork the repo and submit a PR.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
