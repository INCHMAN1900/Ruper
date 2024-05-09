console.log('Ruper Activated.');

const EXCLUDE_URLS = /^chrome:\/\//;

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.type) {
    case 'GetCurrentTab':
      getCurrentTab().then((res) => sendResponse(res));
      break;
    case 'GetCurrentGroup':
      getCurrentGroup().then((res) => sendResponse(res));
      break;
    case 'GetTabs':
      getTabs().then((res) => sendResponse(res));
      break;
    case 'GetGroups':
      getGroups().then((res) => sendResponse(res));
      break;
    case 'Group':
      group(message.options);
      break;
    case 'Ungroup':
      ungroup();
      break;
  }
  return true;
});

chrome.tabGroups.onCreated.addListener(sendRefreshFormMessage);
chrome.tabGroups.onUpdated.addListener(sendRefreshFormMessage);
chrome.tabGroups.onRemoved.addListener(sendRefreshFormMessage);
chrome.tabGroups.onMoved.addListener(sendRefreshFormMessage);
chrome.tabs.onCreated.addListener(sendRefreshFormMessage);
chrome.tabs.onDetached.addListener(sendRefreshFormMessage);
chrome.tabs.onRemoved.addListener(sendRefreshFormMessage);
chrome.tabs.onUpdated.addListener(sendRefreshFormMessage);
chrome.tabs.onMoved.addListener(sendRefreshFormMessage);
chrome.tabs.onReplaced.addListener(sendRefreshFormMessage);

async function sendRefreshFormMessage() {
  var tab = await getCurrentTab();
  if (tab && tab.id && tab.status === 'complete' && shouldIncludeTab(tab)) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'RefreshForm' });
    } catch (error) {
      console.log('Send message to tab error:', tab, tab.url, error);
    }
  }
}

async function group(options = {}) {
  var tab = await getCurrentTab();
  if (!tab) return;

  var targetGroupId = options.groupId;
  var currentGroupId = tab.groupId || chrome.tabGroups.TAB_GROUP_ID_NONE;
  var tabs = await chrome.tabs.query({
    groupId: currentGroupId,
    windowId: chrome.windows.WINDOW_ID_CURRENT,
  });

  var excludes = options.excludes || [];
  var tabIds = tabs.filter((tab) => shouldIncludeTab(tab) && excludes.indexOf(tab.id) === -1).map((tab) => tab.id);

  if (tabIds.length > 0) {
    var updates = { tabIds };
    if (targetGroupId || currentGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      updates.groupId = targetGroupId || currentGroupId;
    } else {
      updates.createProperties = {};
    }
    chrome.tabs.group(updates, (groupId) => {
      if (targetGroupId) return;

      var updates = {};
      if (typeof options.title === 'string') {
        updates.title = options.title.trim();
      }
      if (typeof options.collapsed === 'boolean') {
        updates.collapsed = options.collapsed;
      }
      if (Object.keys(updates).length > 0) {
        chrome.tabGroups.update(groupId, updates);
      }
    });
  }
  // Just move if targetGroupId is present
  if (!targetGroupId && excludes.length > 0) {
    chrome.tabs.ungroup(excludes);
  }

  if (options.closeUnchecked) {
    excludes.forEach((id) => chrome.tabs.remove(id));
  }
}

async function ungroup() {
  var tab = await getCurrentTab();
  if (!tab || tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) return;
  var tabs = await chrome.tabs.query({ groupId: tab.groupId });
  await chrome.tabs.ungroup(tabs.map((tab) => tab.id));
}

async function getCurrentTab() {
  var tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  if (tabs.length === 0) {
    return null;
  }
  return tabs[0];
}

async function getCurrentGroup() {
  var currentTab = await getCurrentTab();
  if (!currentTab) return null;
  if (currentTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    return null;
  }
  return await chrome.tabGroups.get(currentTab.groupId);
}

async function getCurrentWindow() {
  return await chrome.windows.getCurrent();
}

/**
 * retrive ungrouped tabs or tabs in the same group
 */
async function getTabs() {
  var currentTab = await getCurrentTab();
  if (!currentTab) return null;

  var tabs = await chrome.tabs.query({
    groupId: currentTab.groupId,
    windowId: chrome.windows.WINDOW_ID_CURRENT,
    windowType: 'normal',
  });
  return tabs.filter((tab) => shouldIncludeTab(tab));
}

async function getGroups() {
  return await chrome.tabGroups.query({});
}

function shouldIncludeTab(tab) {
  return !EXCLUDE_URLS.test(tab.url);
}
