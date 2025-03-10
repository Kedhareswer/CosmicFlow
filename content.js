// CosmicFlow Content Script
(function () {
  let isSidebarOpen = false;
  let isSelectMode = false;
  let pageAwareMode = true;
  let conversationHistory = [];
  let selectedPageContent = null;

  // Initialize after DOM is fully loaded
  window.addEventListener('load', initCosmicFlow);

  function initCosmicFlow() {
    // Create sidebar HTML
    createSidebar();

    // Load settings
    chrome.storage.sync.get(['pageAwareMode'], function (result) {
      if (result.pageAwareMode !== undefined) {
        pageAwareMode = result.pageAwareMode;
        updatePageAwareModeUI();
      }
    });

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  }

  function togglePageAwareMode() {
    pageAwareMode = !pageAwareMode;
    chrome.storage.sync.set({ pageAwareMode: pageAwareMode });
    updatePageAwareModeUI();

    if (pageAwareMode) {
      showNotification('Page-aware mode enabled');
    } else {
      showNotification('Page-aware mode disabled');
      selectedPageContent = null;
    }
  }

  function updatePageAwareModeUI() {
    const pageAwareToggle = document.getElementById('cosmicflow-page-aware-toggle');
    const contextBanner = document.getElementById('cosmicflow-context-banner');

    if (pageAwareMode) {
      pageAwareToggle.classList.add('active');
      contextBanner.classList.remove('hidden');
      contextBanner.classList.add('active');
    } else {
      pageAwareToggle.classList.remove('active');
      contextBanner.classList.add('hidden');
      contextBanner.classList.remove('active');

      // Clear any cached page content when disabling page-aware mode
      selectedPageContent = null;
    }
  }

  function capturePageContent() {
    selectedPageContent = getPageContent();
    if (selectedPageContent) {
      showNotification('Page content captured successfully');
    } else {
      showNotification('No relevant content found on this page');
    }
  }

  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'cosmicflow-sidebar';

    sidebar.innerHTML = `
      <div class="cosmicflow-header">
        <div class="cosmicflow-header-top">
          <h2 class="cosmicflow-title">
            CosmicFlow
          </h2>
          <button class="cosmicflow-close-btn" title="Close sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="cosmicflow-header-bottom">
          <button id="cosmicflow-page-aware-toggle" class="cosmicflow-toggle-btn" title="Toggle page-aware mode">
            <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Page-aware mode
          </button>
          
          <button id="cosmicflow-select-mode-btn" class="cosmicflow-toggle-btn" title="Select text from page">
            <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 8H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Select text
          </button>
        </div>
      </div>
      
      <div id="cosmicflow-context-banner" class="cosmicflow-context-banner hidden">
        <div class="context-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Page-aware mode is active</span>
        </div>
        <button id="cosmicflow-capture-page" class="cosmicflow-capture-btn" title="Capture current page content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Capture Page
        </button>
      </div>
      
      <div class="cosmicflow-chat-container" id="cosmicflow-chat-container"></div>
      
      <div class="cosmicflow-input-container">
        <textarea 
          class="cosmicflow-input" 
          id="cosmicflow-input" 
          placeholder="Ask me anything about this page..."
          rows="1"></textarea>
        <button class="cosmicflow-send-btn" id="cosmicflow-send-btn" title="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Event listeners
    sidebar.querySelector('.cosmicflow-close-btn').addEventListener('click', toggleSidebar);

    // Page-aware mode toggle
    const pageAwareToggle = document.getElementById('cosmicflow-page-aware-toggle');
    pageAwareToggle.addEventListener('click', togglePageAwareMode);

    // Select mode toggle
    const selectModeBtn = document.getElementById('cosmicflow-select-mode-btn');
    selectModeBtn.addEventListener('click', toggleSelectMode);

    // Update UI based on current settings
    updatePageAwareModeUI();
    updateSelectModeUI();

    // Capture page button
    const capturePageBtn = document.getElementById('cosmicflow-capture-page');
    capturePageBtn.addEventListener('click', capturePageContent);

    const textarea = document.getElementById('cosmicflow-input');
    const sendButton = document.getElementById('cosmicflow-send-btn');

    // Auto-resize textarea
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Send message on Enter (but allow Shift+Enter for new line)
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Send button click
    sendButton.addEventListener('click', sendMessage);
  }

  function setupKeyboardShortcuts() {
    // Listen for keyboard commands from background script
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.command === 'toggle-sidebar') {
        toggleSidebar();
      } else if (request.command === 'select-text') {
        toggleSelectMode();
      }
    });
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('cosmicflow-sidebar');

    if (sidebar) {
      isSidebarOpen = !isSidebarOpen;

      if (isSidebarOpen) {
        sidebar.classList.add('open');
      } else {
        sidebar.classList.remove('open');
        // Exit select mode if active when closing sidebar
        if (isSelectMode) {
          toggleSelectMode();
        }
      }
    }
  }

  function updateSelectModeUI() {
    const selectModeBtn = document.getElementById('cosmicflow-select-mode-btn');

    if (selectModeBtn) {
      if (isSelectMode) {
        selectModeBtn.classList.add('active');
      } else {
        selectModeBtn.classList.remove('active');
      }
    }
  }

  function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    updateSelectModeUI();

    if (isSelectMode) {
      document.body.classList.add('cosmicflow-select-mode');
      showNotification('Select mode active. Click on any element to capture text.');

      // Add hover effect and click handler
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);
      document.addEventListener('click', handleSelectClick);
    } else {
      document.body.classList.remove('cosmicflow-select-mode');
      showNotification('Select mode deactivated.');

      // Remove hover effect and click handler
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleSelectClick);

      // Clean up any lingering hover styles
      const hoveredElements = document.querySelectorAll('.cosmicflow-select-hover');
      hoveredElements.forEach(el => el.classList.remove('cosmicflow-select-hover'));
    }
  }

  function handleMouseOver(e) {
    if (isSelectMode) {
      e.target.classList.add('cosmicflow-select-hover');
    }
  }

  function handleMouseOut(e) {
    if (isSelectMode) {
      e.target.classList.remove('cosmicflow-select-hover');
    }
  }

  function handleSelectClick(e) {
    if (isSelectMode) {
      e.preventDefault();
      e.stopPropagation();

      // Capture the text
      let selectedText = e.target.innerText || e.target.textContent;

      if (selectedText && selectedText.trim()) {
        const textarea = document.getElementById('cosmicflow-input');
        textarea.value = selectedText.trim();
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

        // Exit select mode
        toggleSelectMode();

        // Make sure sidebar is open
        if (!isSidebarOpen) {
          toggleSidebar();
        }

        // Focus on textarea
        textarea.focus();
      }
    }
  }

  // Handle selected text from context menu
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command === 'ask-about-selection' && request.text) {
      // Open sidebar if closed
      if (!isSidebarOpen) {
        toggleSidebar();
      }
      // Set the text and send
      const textarea = document.getElementById('cosmicflow-input');
      textarea.value = `Tell me about this: "${request.text}"`;
      sendMessage();
    }
  });

  function sendMessage() {
    const textarea = document.getElementById('cosmicflow-input');
    const chatContainer = document.getElementById('cosmicflow-chat-container');

    const message = textarea.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessageToChat('user', message);

    // Clear input
    textarea.value = '';
    textarea.style.height = 'auto';

    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'cosmicflow-loading';
    loadingElement.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(loadingElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Prepare message with page context if page-aware mode is on
    let finalMessage = message;
    let contextIncluded = false;

    // Check if we should include page context
    const needsPageContext = pageAwareMode && (
      message.toLowerCase().includes('this') ||
      message.toLowerCase().includes('here') ||
      message.toLowerCase().includes('current')
    );

    if (needsPageContext) {
      // First try to get selected text
      const selection = window.getSelection();
      let contextContent = selection && !selection.isCollapsed ?
        selection.toString().trim() : null;

      // If no selection, use cached content or get fresh content
      if (!contextContent) {
        contextContent = selectedPageContent || getPageContent();
      }

      if (contextContent) {
        finalMessage = `
### Current Page Context ###
${contextContent}

### User Question ###
${message}

Please provide a helpful response based on the above context.`;
        contextIncluded = true;

        // Cache the content if it's not from a selection
        if (!selection || selection.isCollapsed) {
          selectedPageContent = contextContent;
        }
      }
    }

    // Update conversation history
    if (contextIncluded) {
      conversationHistory.push({ role: 'user', content: `Context: [Page content included] \nQuery: ${message}` });
    } else {
      conversationHistory.push({ role: 'user', content: message });
    }

    // Send to background script for API processing
    chrome.runtime.sendMessage({
      action: 'processQuery',
      message: finalMessage,
      history: conversationHistory
    }, function (response) {
      // Remove loading indicator
      if (loadingElement) {
        loadingElement.remove();
      }

      if (response && response.success) {
        // Add AI response to chat with typewriter effect
        const aiMessage = response.data.content;
        conversationHistory.push({ role: 'assistant', content: aiMessage });

        typewriterEffect(aiMessage);
      } else {
        // Handle error
        const errorMessage = response ? response.error : 'Failed to get a response. Please check your API key.';
        addMessageToChat('ai', `Error: ${errorMessage}`);
      }
    });
  }

  function addMessageToChat(sender, content) {
    const chatContainer = document.getElementById('cosmicflow-chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `cosmicflow-message cosmicflow-${sender}-message`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (sender === 'user') {
      messageContent.textContent = content;
      messageDiv.appendChild(messageContent);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'message-time';
      timeSpan.textContent = timestamp;
      messageDiv.appendChild(timeSpan);
    } else {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'ai-avatar';
      avatarDiv.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const messageWrapper = document.createElement('div');
      messageWrapper.className = 'message-wrapper';

      // Simple approach: Replace code blocks first, then set as innerHTML
      messageContent.innerHTML = formatContentWithCodeBlocks(content);

      messageContent.querySelectorAll('.cosmicflow-code-block').forEach(block => {
        initializeCodeBlockButtons(block);
      });

      messageWrapper.appendChild(avatarDiv);
      messageWrapper.appendChild(messageContent);
      messageDiv.appendChild(messageWrapper);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function typewriterEffect(content) {
    const chatContainer = document.getElementById('cosmicflow-chat-container');
    const messageElement = document.createElement('div');
    messageElement.className = 'cosmicflow-message cosmicflow-ai-message';
    chatContainer.appendChild(messageElement);

    const formattedContent = formatContentWithCodeBlocks(content);

    let currentIndex = 0;
    let inTag = false;
    let htmlContent = '';
    let plainText = stripHtml(formattedContent);

    const typeInterval = setInterval(() => {
      if (currentIndex < formattedContent.length) {
        const char = formattedContent[currentIndex];

        if (char === '<') {
          inTag = true;
        }

        htmlContent += char;

        if (char === '>') {
          inTag = false;
        }

        if (!inTag) {
          messageElement.innerHTML = htmlContent;
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        currentIndex++;
      } else {
        clearInterval(typeInterval);

        messageElement.querySelectorAll('.cosmicflow-code-block').forEach(block => {
          const code = block.querySelector('code').textContent;
          // Create copy button
          const copyButton = document.createElement('button');
          copyButton.className = 'cosmicflow-copy-btn';
          copyButton.title = 'Copy code';
          copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
              copyButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `;
              setTimeout(() => {
                copyButton.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `;
              }, 2000);
            });
          });

          // Create paste button
          const pasteButton = document.createElement('button');
          pasteButton.className = 'cosmicflow-paste-btn';
          pasteButton.title = 'Paste to page';
          pasteButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          pasteButton.addEventListener('click', () => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
              const start = activeElement.selectionStart;
              const end = activeElement.selectionEnd;
              const value = activeElement.value || activeElement.textContent;
              const before = value.substring(0, start);
              const after = value.substring(end);

              if (activeElement.isContentEditable) {
                activeElement.textContent = before + code + after;
              } else {
                activeElement.value = before + code + after;
              }

              // Show success feedback
              pasteButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `;
              setTimeout(() => {
                pasteButton.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `;
              }, 2000);
            }
          });

          block.appendChild(copyButton);
          block.appendChild(pasteButton);
        });
      }
    }, 10); // Adjust speed as needed
  }

  function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function initializeCodeBlockButtons(codeBlock) {
    const code = codeBlock.dataset.code;
    const copyBtn = codeBlock.querySelector('.cosmicflow-copy-btn');
    const pasteBtn = codeBlock.querySelector('.cosmicflow-paste-btn');

    const formatJSBtn = codeBlock.querySelector('.cosmicflow-format-js-btn');
    if (!copyBtn || !pasteBtn || copyBtn.hasAttribute('data-initialized')) return;

    copyBtn.setAttribute('data-initialized', 'true');
    pasteBtn.setAttribute('data-initialized', 'true');
    if (formatJSBtn) formatJSBtn.setAttribute('data-initialized', 'true');

    copyBtn.textContent = 'Copy';
    pasteBtn.textContent = 'Paste';
    if (formatJSBtn) formatJSBtn.textContent = 'JS';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Done';
        setTimeout(() => copyBtn.textContent = originalText, 1000);
      });
    });

    pasteBtn.addEventListener('click', () => {
      const activeElement = document.activeElement;
      if (!activeElement || (!activeElement.isContentEditable && activeElement.tagName !== 'TEXTAREA' && activeElement.tagName !== 'INPUT')) {
        return;
      }

      try {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        const value = activeElement.value || activeElement.textContent || '';
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newValue = before + code + after;

        if (activeElement.isContentEditable) {
          activeElement.textContent = newValue;
        } else {
          activeElement.value = newValue;
          // Trigger input event for frameworks that rely on it
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Update cursor position
        const newPosition = start + code.length;
        if (activeElement.setSelectionRange) {
          activeElement.setSelectionRange(newPosition, newPosition);
        }

        const originalText = pasteBtn.textContent;
        pasteBtn.textContent = 'Done';
        setTimeout(() => pasteBtn.textContent = originalText, 1000);
      } catch (error) {
        console.error('Failed to paste code:', error);
      }
    });
  }

  function formatContentWithCodeBlocks(content) {
    // First separate text and code blocks
    let formattedContent = '<div class="message-blocks-container">';
    const parts = content.split(/(```[a-z]*\n[\s\S]*?\n```)/g);

    parts.forEach(part => {
      if (part.startsWith('```')) {
        // Process code block
        const match = part.match(/```([a-z]*)\n([\s\S]*?)\n```/);
        if (match) {
          const language = match[1] || 'code';
          const code = match[2].trim();
          const highlightedCode = applySyntaxHighlighting(code, language || 'text');

          // Add styled code block within its own block
          formattedContent += `<div class="message-block">
              <div class="cosmicflow-code-block" data-code="${code.replace(/"/g, '"')}">
               <div class="cosmicflow-code-language">${language}</div>
                <pre><code>${highlightedCode}</code></pre>
                <div class="cosmicflow-code-buttons">
                  <button class="cosmicflow-copy-btn" title="Copy code">Copy</button>
                  <button class="cosmicflow-paste-btn" title="Paste to page">Paste</button>
                  <button class="cosmicflow-format-js-btn" title="Format as JavaScript">JS</button>
      </div>
     </div>
 </div>`;
        }
      } else if (part.trim()) {
        // Process text - add with proper margins in its own block
        formattedContent += `<div class="message-block"><div class="message-text">`;

        const paragraphs = part.split('\n\n');
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            formattedContent += `<p>${paragraph.trim()}</p>`;
          }
        });

        formattedContent += `</div></div>`;
      }
    });

    formattedContent += '</div>';

    // Initialize buttons immediately after content is added
    requestAnimationFrame(() => {
      document.querySelectorAll('.cosmicflow-code-block').forEach(block => {
        initializeCodeBlockButtons(block);
      });
    });

    return formattedContent;
  }

  function applySyntaxHighlighting(code, language) {
    const keywords = ['function', 'if', 'else', 'for', 'while', 'return', 'class', 'def', 'import', 'from', 'var', 'let', 'const', 'print', 'in', 'of', 'new', 'try', 'catch', 'throw', 'async', 'await'];
    const operators = ['+', '-', '*', '/', '=', '==', '===', '!=', '!==', '>', '<', '>=', '<=', '&&', '||', '=>', '->', ':'];

    let escapedCode = code.replace(/[&<>"']/g, (m) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });

    if (['python', 'javascript', 'js', 'typescript', 'ts'].includes(language.toLowerCase())) {
      escapedCode = escapedCode.replace(/(["'])(?:\\\1|.)*?\1/g, '<span class="string">$&</span>');

      if (language === 'python') {
        escapedCode = escapedCode.replace(/(#.*)$/gm, '<span class="comment">$1</span>');
      } else {
        escapedCode = escapedCode.replace(/\/\/.*/g, '<span class="comment">$&</span>'); // Single line comments
        escapedCode = escapedCode.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>'); // Multi-line comments
      }

      escapedCode = escapedCode.replace(/\b(\d+(\.\d+)?|\.\d+)\b/g, '<span class="number">$&</span>');

      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        escapedCode = escapedCode.replace(regex, '<span class="keyword">$&</span>');
      });

      escapedCode = escapedCode.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="function">$1</span>(');

      if (language === 'python') {
        escapedCode = escapedCode.replace(/\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]+)\)/g, (match, params) => {
          return match.replace(params, params.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*[,=)])/g, '<span class="variable">$1</span>'));
        });
      }
    }

    return escapedCode;
  }

  function pasteSnippet(code) {
    const activeElement = document.activeElement;

    if (activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable)) {

      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;

        activeElement.value = value.substring(0, start) + code + value.substring(end);

        activeElement.selectionStart = activeElement.selectionEnd = start + code.length;
      }
      else if (activeElement.isContentEditable) {
        document.execCommand('insertText', false, code);
      }

      showNotification('Code pasted successfully!');
    } else {
      navigator.clipboard.writeText(code)
        .then(() => {
          showNotification('Code copied to clipboard. Click where you want to paste it and press Ctrl+V.');
        })
        .catch(err => {
          showNotification('Failed to copy code. Please try again.');
          console.error('Failed to copy: ', err);
        });
    }
  }

  function getPageContent() {
    const contentSelectors = [
      '[class*="video-title"]', '[class*="video-description"]',
      '[class*="title"]', '[class*="description"]',
      '[class*="comment"]', '[class*="caption"]',

      'article', 'main', '[role="main"]',
      'h1, h2, h3', '.content', '.post',
      '[class*="content"]', '[class*="article"]',

      'p', '.text', '[class*="text"]',

      'form', '[role="form"]',
      'input[type="text"]', 'textarea',

      'pre', 'code', '.code', '[class*="code"]',
      '.CodeMirror', '.ace_editor',

      '#watch-description', // YouTube
      '.watch-title',      // YouTube
      '.ytd-video-primary-info-renderer', // YouTube
      '[class*="player"]', // Video players
      '[class*="subtitle"]' // Subtitles/captions
    ];

    try {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const selectedText = selection.toString().trim();
        if (selectedText.length > 10) {
          return selectedText;
        }
      }

      const mainContent = document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('article') ||
        document.body;

      const selector = contentSelectors.join(', ');
      const elements = mainContent.querySelectorAll(selector);

      const processedElements = new Set();
      const contentPieces = [];

      elements.forEach(element => {
        if (processedElements.has(element)) return;

        if (element.offsetParent === null) return;

        let text = element.innerText || element.textContent || element.value;
        if (!text || typeof text !== 'string') return;

        text = text.trim();
        if (text.length < 10) return;

        if (element.tagName === 'CODE' || element.tagName === 'PRE' ||
          element.className.includes('code')) {
          text = '```\n' + text + '\n```';
        } else if (element.tagName.match(/^H[1-6]$/)) {
          text = '## ' + text;
        }

        contentPieces.push(text);
        processedElements.add(element);

        Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .forEach(node => {
            const text = node.textContent.trim();
            if (text.length > 10) {
              contentPieces.push(text);
            }
          });
      });

      if (contentPieces.length === 0) {
        const activeElement = document.activeElement;
        if (activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable)) {
          const text = activeElement.value || activeElement.innerText;
          if (text && text.trim().length > 10) {
            contentPieces.push(text.trim());
          }
        }
      }

      let combinedContent = contentPieces
        .filter((text, index, array) =>
          array.indexOf(text) === index &&
          text.split('\n').some(line => line.trim().length > 10)
        )
        .join('\n\n');

      if (combinedContent.length > 4000) {
        const truncated = combinedContent.substring(0, 4000);
        const lastBreak = Math.max(
          truncated.lastIndexOf('.'),
          truncated.lastIndexOf('?'),
          truncated.lastIndexOf('!'),
          truncated.lastIndexOf('\n')
        );

        combinedContent = combinedContent.substring(0,
          lastBreak > 3500 ? lastBreak + 1 : 4000
        ) + ' [...]';
      }

      return combinedContent.length > 50 ? combinedContent : null;

    } catch (error) {
      console.error('Error extracting page content:', error);
      return null;
    }
  }

  function showNotification(message) {
    const existingNotification = document.querySelector('.cosmicflow-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'cosmicflow-notification';
    notification.innerHTML = `
      <div class="cosmicflow-notification-icon">ℹ️</div>
      <div>${message}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300); // Wait for fade out animation
    }, 3000);
  }
})();
