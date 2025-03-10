// quickActions.js
import { sendMessage } from './popup.js';

export function initQuickActions() {
  const quickActionButtons = document.querySelectorAll('.quick-action-btn');

  quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action') || '';
      let query = '';
      switch(action) {
        case 'what':
          query = "What's the main content of this page?";
          break;
        case 'explain':
          query = "Please explain this page in detail.";
          break;
        case 'summarize':
          query = "Summarize the key points of this page.";
          break;
        case 'extract':
          query = "Extract the important data from this page.";
          break;
      }
      if (query) {
        sendMessage(query);
        console.log(`Quick action "${action}" sent: ${query}`);
      }
    });
  });
}