// Sumi (墨) - Background Service Worker

// Enable side panel toggle when clicking the extension icon
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel behavior error:', error));
}
