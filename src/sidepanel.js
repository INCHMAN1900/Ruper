initGroups();

/** @type {HTMLDivElement} */
const root = document.querySelector('.root');
/** @type {HTMLDivElement} */
const groupDialog = document.querySelector('.group-dialog');
/** @type {HTMLDivElement} */
const groupSelector = document.querySelector('.group-selector');

// document.querySelector('#refresh').addEventListener('click', refresh);
document.querySelector('#removeAllGroups').addEventListener('click', () => removeAllGroups());
document.querySelector('#removeAllGroupsAndCloseTabs').addEventListener('click', removeAllGroupsAndClearTabs);
document.querySelector('#ungroupTabs').addEventListener('click', ungroupTabs);
document.querySelector('#removeTabs').addEventListener('click', removeTabs);
document.querySelector('#moveTabs').addEventListener('click', showGroupSelector);

var groupOperations = document.querySelectorAll('.group-selector-operations .group-selector-button');
groupOperations[0].addEventListener('click', hideGroupSelector);
groupOperations[1].addEventListener('click', moveTabs);

chrome.tabGroups.onCreated.addListener(refresh);
chrome.tabGroups.onUpdated.addListener(refresh);
chrome.tabGroups.onRemoved.addListener(refresh);
chrome.tabGroups.onMoved.addListener(refresh);
chrome.tabs.onCreated.addListener(refresh);
chrome.tabs.onDetached.addListener(refresh);
chrome.tabs.onRemoved.addListener(refresh);
chrome.tabs.onUpdated.addListener(refresh);
chrome.tabs.onMoved.addListener(refresh);
chrome.tabs.onReplaced.addListener(refresh);

function refresh() {
  initGroups();
}

async function initGroups() {
  var groups = await chrome.tabGroups.query({});
  var tabs = await Promise.all(groups.map((group) => chrome.tabs.query({ groupId: group.id })));
  root.innerHTML = '';
  for (var i = 0; i < groups.length; i++) {
    initGroup(groups[i], tabs[i]);
  }
}

async function removeAllGroups(clear = false) {
  var tooltip =
    clear === true ? 'This will close all tabs.' : 'Do you want to ungroup all tabs?\nThis will not close any tab.';
  if (window.confirm(tooltip)) {
    var groups = await chrome.tabGroups.query({});
    for (var group of groups) {
      await removeGroup(group.id, clear);
    }
  }
}

async function removeAllGroupsAndClearTabs() {
  removeAllGroups(true);
}

function removeSingleGroup(groupId, clear = false) {
  var tooltip =
    clear === true
      ? 'This will close all tabs in this group.'
      : 'Do you want to ungroup all tabs in this group?\nThis will not close any tab.';
  if (window.confirm(tooltip)) {
    removeGroup(groupId, clear);
  }
}

async function removeGroup(groupId, clear = false) {
  try {
    var tabs = await chrome.tabs.query({ groupId: groupId });
    var tabIds = tabs.map((tab) => tab.id);
    await chrome.tabs.ungroup(tabIds);
    if (clear === true) {
      await Promise.all(tabIds.map((tabId) => chrome.tabs.remove(tabId)));
    }
  } catch (error) {
    alert(error);
  }
  refresh();
}

async function ungroupTabs() {
  try {
    var tabIds = getSelectedTabs();
    if (tabIds.length > 0) {
      await chrome.tabs.ungroup(tabIds);
    }
  } catch (error) {
    alert(error);
  }
  refresh();
}

async function removeTabs() {
  try {
    var tabIds = getSelectedTabs();
    for (var tabId of tabIds) {
      await chrome.tabs.remove(tabId);
    }
  } catch (error) {
    alert(error);
  }
  refresh();
}

function showGroupSelector() {
  var tabIds = getSelectedTabs();
  if (tabIds.length === 0) {
    return alert('You need to select some tabs first');
  }
  initGroupSelector();
  groupDialog.style.display = 'block';
}

function hideGroupSelector() {
  groupDialog.style.display = 'none';
}

async function moveTabs() {
  try {
    var tabIds = getSelectedTabs();
    if (tabIds.length === 0) {
      return alert('You need to select some tabs first');
    }
    var groupId = getTargetGroup();
    if (!groupId) {
      return alert('You need to select a group');
    }
    await chrome.tabs.group({ groupId, tabIds });
    hideGroupSelector();
    refresh();
  } catch (error) {
    alert(error);
  }
}

/**
 * @param {chrome.tabGroups.TabGroup} group
 * @param {chrome.tabs.Tab} tabs
 */
function initGroup(group, tabs) {
  var container = document.createElement('div');
  root.appendChild(container);

  var head = document.createElement('div');
  head.classList.add('tabs-head', 'tabs-head-' + group.color);
  container.append(head);

  var title = document.createElement('h2');
  title.innerText = group.title;
  title.classList.add('group-title');
  head.appendChild(title);

  var disconnectButton = document.createElement('img');
  disconnectButton.src =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPgo8c3ZnIGZpbGw9IiMwMDAwMDAiIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBjbGFzcz0iaWNvbiI+CiAgPHBhdGggZD0iTTgzMi42IDE5MS40Yy04NC42LTg0LjYtMjIxLjUtODQuNi0zMDYgMGwtOTYuOSA5Ni45IDUxIDUxIDk2LjktOTYuOWM1My44LTUzLjggMTQ0LjYtNTkuNSAyMDQgMCA1OS41IDU5LjUgNTMuOCAxNTAuMiAwIDIwNGwtOTYuOSA5Ni45IDUxLjEgNTEuMSA5Ni45LTk2LjljODQuNC04NC42IDg0LjQtMjIxLjUtLjEtMzA2LjF6TTQ0Ni41IDc4MS42Yy01My44IDUzLjgtMTQ0LjYgNTkuNS0yMDQgMC01OS41LTU5LjUtNTMuOC0xNTAuMiAwLTIwNGw5Ni45LTk2LjktNTEuMS01MS4xLTk2LjkgOTYuOWMtODQuNiA4NC42LTg0LjYgMjIxLjUgMCAzMDZzMjIxLjUgODQuNiAzMDYgMGw5Ni45LTk2LjktNTEtNTEtOTYuOCA5N3pNMjYwLjMgMjA5LjRhOC4wMyA4LjAzIDAgMCAwLTExLjMgMEwyMDkuNCAyNDlhOC4wMyA4LjAzIDAgMCAwIDAgMTEuM2w1NTQuNCA1NTQuNGMzLjEgMy4xIDguMiAzLjEgMTEuMyAwbDM5LjYtMzkuNmMzLjEtMy4xIDMuMS04LjIgMC0xMS4zTDI2MC4zIDIwOS40eiIvPgo8L3N2Zz4=';
  disconnectButton.classList.add('tabs-head-button', 'tabs-disconnect');
  disconnectButton.onclick = () => removeSingleGroup(group.id, false);
  head.appendChild(disconnectButton);

  var deleteButton = document.createElement('img');
  deleteButton.src =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIGZpbGw9IiMwMDAwMDAiIGhlaWdodD0iODAwcHgiIHdpZHRoPSI4MDBweCIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiANCgkgdmlld0JveD0iMCAwIDQ2MC43NzUgNDYwLjc3NSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cGF0aCBkPSJNMjg1LjA4LDIzMC4zOTdMNDU2LjIxOCw1OS4yN2M2LjA3Ni02LjA3Nyw2LjA3Ni0xNS45MTEsMC0yMS45ODZMNDIzLjUxMSw0LjU2NWMtMi45MTMtMi45MTEtNi44NjYtNC41NS0xMC45OTItNC41NQ0KCWMtNC4xMjcsMC04LjA4LDEuNjM5LTEwLjk5Myw0LjU1bC0xNzEuMTM4LDE3MS4xNEw1OS4yNSw0LjU2NWMtMi45MTMtMi45MTEtNi44NjYtNC41NS0xMC45OTMtNC41NQ0KCWMtNC4xMjYsMC04LjA4LDEuNjM5LTEwLjk5Miw0LjU1TDQuNTU4LDM3LjI4NGMtNi4wNzcsNi4wNzUtNi4wNzcsMTUuOTA5LDAsMjEuOTg2bDE3MS4xMzgsMTcxLjEyOEw0LjU3NSw0MDEuNTA1DQoJYy02LjA3NCw2LjA3Ny02LjA3NCwxNS45MTEsMCwyMS45ODZsMzIuNzA5LDMyLjcxOWMyLjkxMSwyLjkxMSw2Ljg2NSw0LjU1LDEwLjk5Miw0LjU1YzQuMTI3LDAsOC4wOC0xLjYzOSwxMC45OTQtNC41NQ0KCWwxNzEuMTE3LTE3MS4xMmwxNzEuMTE4LDE3MS4xMmMyLjkxMywyLjkxMSw2Ljg2Niw0LjU1LDEwLjk5Myw0LjU1YzQuMTI4LDAsOC4wODEtMS42MzksMTAuOTkyLTQuNTVsMzIuNzA5LTMyLjcxOQ0KCWM2LjA3NC02LjA3NSw2LjA3NC0xNS45MDksMC0yMS45ODZMMjg1LjA4LDIzMC4zOTd6Ii8+DQo8L3N2Zz4=';
  deleteButton.classList.add('tabs-head-button', 'tabs-delete');
  deleteButton.onclick = () => removeSingleGroup(group.id, true);
  head.appendChild(deleteButton);

  if (tabs.length === 0) return;

  var tabsContainer = document.createElement('div');
  tabsContainer.classList.add('tabs-container');
  tabs.forEach((tab) => {
    var row = document.createElement('div');
    row.classList.add('tab');
    tabsContainer.appendChild(row);

    var checkboxId = Math.random().toString().slice(2, 10);
    var checkbox = document.createElement('input');
    checkbox.classList.add('tab-checkbox');
    checkbox.type = 'checkbox';
    checkbox.tabId = tab.id;
    checkbox.id = checkboxId;
    row.appendChild(checkbox);

    var tabTitle = document.createElement('label');
    tabTitle.htmlFor = checkboxId;
    tabTitle.classList.add('tab-title');
    tabTitle.innerText = tab.title;
    row.appendChild(tabTitle);
  });
  container.appendChild(tabsContainer);
}

async function initGroupSelector() {
  var groups = await chrome.tabGroups.query({});
  groupSelector.innerHTML = '';
  for (var group of groups) {
    var row = document.createElement('div');
    row.classList.add('group-selector-row');

    var radio = document.createElement('input');
    radio.id = group.id;
    radio.type = 'radio';
    radio.name = 'selected-group';
    radio.value = group.id;
    radio.groupId = group.id;
    row.appendChild(radio);

    var label = document.createElement('label');
    label.htmlFor = radio.id;
    label.innerHTML = group.title;
    row.appendChild(label);

    groupSelector.appendChild(row);
  }
}

function getSelectedTabs() {
  return [...document.querySelectorAll('.tab-checkbox')]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.tabId);
}

function getTargetGroup() {
  var radios = document.querySelectorAll('.group-selector-row input[type="radio"]');
  for (var radio of radios) {
    if (radio.checked) {
      return radio.groupId;
    }
  }
  return null;
}
