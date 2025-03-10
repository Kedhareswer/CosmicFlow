// utils.js
export async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("nebiusApiKey", (data) => {
        resolve(data.nebiusApiKey);
      });
    });
  }
  
  export async function setApiKey(apiKey) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ nebiusApiKey: apiKey }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  
  export async function getPageAwareState() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("pageAware", (data) => {
        resolve(data.pageAware || false);
      });
    });
  }
  
  export async function setPageAwareState(state) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ pageAware: state }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }