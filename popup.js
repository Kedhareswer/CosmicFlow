document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const pageAwareToggle = document.getElementById('page-aware-toggle');
  const saveButton = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  
  // Load saved settings
  chrome.storage.sync.get(['nebiusApiKey', 'pageAwareMode'], function(result) {
    if (result.nebiusApiKey) {
      apiKeyInput.value = result.nebiusApiKey;
    }
    
    if (result.pageAwareMode !== undefined) {
      pageAwareToggle.checked = result.pageAwareMode;
    } else {
      // Default to enabled
      pageAwareToggle.checked = true;
    }
  });
  
  // Save settings when button is clicked
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const pageAwareMode = pageAwareToggle.checked;
    
    if (!apiKey) {
      statusMessage.textContent = 'Please enter a valid API key';
      statusMessage.style.color = '#ff6b6b';
      return;
    }
    
    chrome.storage.sync.set({
      nebiusApiKey: apiKey,
      pageAwareMode: pageAwareMode
    }, function() {
      statusMessage.textContent = 'Settings saved successfully!';
      statusMessage.style.color = '#4caf50';
      
      // Clear status message after 2 seconds
      setTimeout(function() {
        statusMessage.textContent = '';
      }, 2000);
    });
  });
});
