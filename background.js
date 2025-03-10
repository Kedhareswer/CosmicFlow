// Cosmosisooo Background Script

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'cosmosisooo-ask',
    title: 'Ask Cosmosisooo about this',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'cosmosisooo-ask' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      command: 'ask-about-selection',
      text: info.selectionText
    });
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { command: command });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processQuery') {
    handleQuery(request, sendResponse);
    return true; // Will respond asynchronously
  }
});

// Handle API queries
async function handleQuery(request, sendResponse) {
  try {
    // Get API key
    const result = await chrome.storage.sync.get(['nebiusApiKey']);
    const apiKey = result.nebiusApiKey;
    
    if (!apiKey) {
      throw new Error('API key not found. Please add your Nebius API key in the extension settings.');
    }
    
    // Process the query
    const response = await callNebiusAPI(apiKey, request.message, request.history);
    sendResponse({ success: true, data: response });
    
  } catch (error) {
    console.error('Query processing error:', error);
    sendResponse({
      success: false,
      error: error.message || 'An unexpected error occurred.'
    });
  }
}

// Call the Nebius API
async function callNebiusAPI(apiKey, message, history = []) {
  const baseUrl = "https://api.studio.nebius.ai/v1/";
  const endpoint = "chat/completions";
  
  try {
    // Prepare messages with system prompt
    const messages = [
      {
        role: "system",
        content: "You are Cosmosisooo, a helpful AI assistant that provides clear, accurate, and concise responses. When code is involved, you focus on practical solutions and best practices."
      },
      ...history,
      { role: "user", content: message }
    ];
    
    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-fast",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
        `API request failed (${response.status}): ${response.statusText}`
      );
    }
    
    const data = await response.json();
    
    if (!data.choices?.[0]?.message) {
      throw new Error('Invalid response format from API');
    }
    
    return data.choices[0].message;
    
  } catch (error) {
    console.error('Nebius API error:', error);
    // Enhance error message for user display
    if (error.message.includes('401')) {
      throw new Error('Invalid API key. Please check your Nebius API key in the extension settings.');
    } else if (error.message.includes('429')) {
      throw new Error('Too many requests. Please try again in a few moments.');
    } else if (error.message.includes('500')) {
      throw new Error('Nebius API service error. Please try again later.');
    }
    throw new Error(`Failed to get response: ${error.message}`);
  }
}

