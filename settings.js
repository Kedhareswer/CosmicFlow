// settings.js
import { getApiKey, setApiKey, getPageAwareState, setPageAwareState } from './utils.js';

document.addEventListener("DOMContentLoaded", async () => {
  const saveApiKeyButton = document.getElementById("save-api-key");
  const apiKeyInput = document.getElementById("api-key");
  const apiKeyStatus = document.getElementById("api-status");
  const pageAwareToggle = document.getElementById("page-aware-toggle");
  const settingsCloseButton = document.querySelector('.cosmic-flow-close');
  const resetApiKeyButton = document.getElementById("reset-api-key");

  // Load any stored API key and toggle state from Chrome storage
  const apiKey = await getApiKey();
  const pageAware = await getPageAwareState();
  
  if (apiKey) {
    apiKeyInput.value = apiKey;
    apiKeyStatus.innerText = "API key saved.";
    apiKeyStatus.style.color = "green";
  }
  
  if (pageAware !== undefined) {
    pageAwareToggle.checked = pageAware;
  }

  // Save API key when the "Save API Key" button is clicked
  saveApiKeyButton.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      apiKeyStatus.innerText = "Please enter a valid API key.";
      apiKeyStatus.style.color = "red";
      return;
    }
    setApiKey(key)
      .then(() => {
        apiKeyStatus.innerText = "API key saved.";
        apiKeyStatus.style.color = "green";
      })
      .catch(err => {
        apiKeyStatus.innerText = "Failed to save API key.";
        apiKeyStatus.style.color = "red";
        console.error("Error saving API key:", err);
      });
  });

  // Save page-aware toggle state
  pageAwareToggle.addEventListener("change", () => {
    setPageAwareState(pageAwareToggle.checked)
      .then(() => {
        console.log(`Page-aware mode set to ${pageAwareToggle.checked}`);
      })
      .catch(err => {
        console.error("Error saving page-aware state:", err);
      });
  });

  // Reset API key when the "Reset API Key" button is clicked
  resetApiKeyButton.addEventListener("click", () => {
    apiKeyInput.value = "";
    setApiKey("")
      .then(() => {
        apiKeyStatus.innerText = "API key reset.";
        apiKeyStatus.style.color = "orange";
      })
      .catch(err => {
        apiKeyStatus.innerText = "Failed to reset API key.";
        apiKeyStatus.style.color = "red";
        console.error("Error resetting API key:", err);
      });
  });

  // Close the settings page when the close button is clicked
  settingsCloseButton.addEventListener('click', () => {
    window.close();
  });
});