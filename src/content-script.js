const Prefix = 'ruperdomdonotmodify';

const Selectors = {
  container: Prefix + '-container',
  root: Prefix + '-root',
  title: Prefix + '-title',
  button: Prefix + '-button',

  form: Prefix + '-form',
  formRow: Prefix + '-form-row',
  formLabel: Prefix + '-form-label',
  formRowTabs: Prefix + 'form-row-tabs',
  formLabelTabs: Prefix + 'form-label-tabs',
  formControl: Prefix + '-form-control',
  formOperations: Prefix + '-form-operations',

  tabsContainer: Prefix + '-rows',
  tabRow: Prefix + '-row',
  tabRowCheckbox: Prefix + '-row-checkbox',
  tabRowLabel: Prefix + '-row-label',

  groupTitleId: Prefix + '-group-title',
  closeUncheckedId: Prefix + '-close-unchecked',
  collapseId: Prefix + '-collapsed',

  checkbox: Prefix + '-checkbox',
};

const { container, shadowRoot } = initShadowRoot();
const $ = (selector) => shadowRoot.querySelector(selector);
const $$ = (selector) => shadowRoot.querySelectorAll(selector);

initForm();

window.addEventListener('keydown', async (event) => {
  var activeElement = document.activeElement;
  if (event.ctrlKey) {
    if (event.key === 'g') showGroupOptions();
    if (event.key === 'h') {
      // ctrl + h => delete one character
      if (activeElement.tagName === 'INPUT' && activeElement.type === 'text') return;
      if (activeElement.tagName === 'TEXTAREA') return;
      chrome.runtime.sendMessage({ type: 'Ungroup' });
    }
  }
  if (isVisible()) {
    if (event.key === 'Escape') hideGroupOptions();
    if (event.key === 'Enter') createGroup(event);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshForm();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'RefreshForm') refreshForm();
});

async function showGroupOptions() {
  var tab = await getCurrentTab();
  if (!tab) return;

  container.style.display = 'block';
  refreshForm();
  $('#' + Selectors.groupTitleId).focus();
}

function hideGroupOptions() {
  container.style.display = 'none';
}

function isVisible() {
  return container.style.display !== 'none';
}

function createGroup(event) {
  chrome.runtime.sendMessage({
    type: 'Group',
    options: collectGroupOptions(),
  });
  hideGroupOptions();
  if (event) event.preventDefault();
}

function initShadowRoot() {
  var container = document.createElement('div');
  container.classList.add(Selectors.container);
  container.style.display = 'none';
  container.style.position = 'fixed';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.padding = '16px 20px 4px';
  container.style.border = '1px solid rgba(0, 0, 0, 0.1)';
  container.style.borderRadius = '10px';
  container.style.boxShadow = '0px 8px 48px rgba(0,0,0,0.18)';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.zIndex = 10000;
  container.style.fontSize = '14px';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.webkitFontSmoothing = 'antialiased';
  document.body.appendChild(container);

  var shadowRoot = container.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = `
    <style>
      input[type="checkbox"] {
        margin-left: 0;
      }
      .${Selectors.root} {
        line-height: 1.3;
        color-scheme: light;
        accent-color: initial;
      }
      .${Selectors.formOperations} {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 24px;
      }
      .${Selectors.button} {
        width: 84px;
        padding: 4px 0;
        border: 1px solid lightgrey;
        border-radius: 6px;
        font-size: 12px;
        text-align: center;
        cursor: pointer;
      }
      .${Selectors.button}:not(:last-child) {
        margin-right: 10px;
      }
      form {
        margin: 24px 0 12px;
      }
      .${Selectors.formRow} {
        display: flex;
        margin: 10px 0;
      }
      .${Selectors.formRowTabs} {
        margin: 18px 0 0px;
      }
      .${Selectors.formLabel} {
        width: 120px;
        flex-shrink: 0;
        align-self: center;
        margin-right: 16px;
        text-align: right;
      }
      .${Selectors.formLabelTabs} {
        align-self: flex-start;
        margin-top: 3px;
      }
      .${Selectors.formControl} {
        flex: 1;
      }
      .${Selectors.title} {
        margin-top: 0.2em;
        font-weight: normal;
      }
      .${Selectors.tabRow} {
        display: flex;
        align-items: center;
        margin: 2px 0 4px;
      }
      .${Selectors.tabRowLabel} {
        display: inline-block;
        width: 400px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 1;
      }
      .${Selectors.tabsContainer} {
        max-height: 60vh;
        overflow: scroll;
      }
    </style>
    <div class='${Selectors.root}'>
      <h2 class='${Selectors.title}'>Group Options</h2>
      <form class='${Selectors.form}'>
        <div class='${Selectors.formRow}'>
          <label class='${Selectors.formLabel}'>Group Title</label>
          <div class='${Selectors.formControl}'>
            <input id='${Selectors.groupTitleId}' autofocus autocomplete="off" />
          </div>
        </div>
        <div class='${Selectors.formRow} ${Selectors.formRowTabs}'>
          <label class='${Selectors.formLabel} ${Selectors.formLabelTabs}'>Tabs</label>
          <div class='${Selectors.tabsContainer}'></div>
        </div>
        <div class='${Selectors.formRow}'>
          <label class='${Selectors.formLabel}'>Close Unchecked</label>
          <div class='${Selectors.formControl}'>
            <input type='checkbox' id='${Selectors.closeUncheckedId}' />
          </div>
        </div>
        <div class='${Selectors.formRow}'>
          <label class='${Selectors.formLabel}'>Collapse</label>
          <div class='${Selectors.formControl}'>
            <input type='checkbox' checked id='${Selectors.collapseId}' />
          </div>
        </div>
        <div class='${Selectors.formOperations}'>
          <div class='${Selectors.button}'>Cancel</div>
          <div class='${Selectors.button}'>Confirm</div>
        </div>
      </form>
    </div>
  `;

  return { container, shadowRoot };
}

function initForm() {
  var form = $('form');
  form.addEventListener('submit', createGroup);

  var buttons = $$('.' + Selectors.formOperations + ' .' + Selectors.button);
  buttons[0].addEventListener('click', hideGroupOptions);
  buttons[1].addEventListener('click', createGroup);

  refreshForm();
}

async function refreshForm() {
  if (!isVisible()) return;

  var tabs = await getTabs();
  if (tabs.length === 0) {
    return hideGroupOptions();
  }

  var titleInput = $('#' + Selectors.groupTitleId);
  var group = await getCurrentGroup();
  if (group) {
    titleInput.value = group.title;
  } else {
    titleInput.value = 'New Group';
  }

  var tabsContainer = $('.' + Selectors.tabsContainer);
  tabsContainer.querySelectorAll('.' + Selectors.tabRow).forEach((row) => row.remove());

  tabs.forEach((tab) => {
    var row = document.createElement('div');
    row.classList.add(Selectors.tabRow);
    tabsContainer.appendChild(row);

    var id = Math.random().toString().slice(2, 12);
    var checkbox = document.createElement('input');
    checkbox.classList.add(Selectors.tabRowCheckbox, Selectors.checkbox);
    checkbox.id = id;
    checkbox.tabId = tab.id;
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    row.append(checkbox);

    var label = document.createElement('label');
    label.classList.add(Selectors.tabRowLabel);
    label.innerText = tab.title || tab.url;
    label.htmlFor = id;
    row.append(label);
  });
}

function collectGroupOptions() {
  var title = $('#' + Selectors.groupTitleId).value;
  var excludes = [...$$('.' + Selectors.tabRowCheckbox)]
    .filter((checkbox) => !checkbox.checked)
    .map((x) => x.tabId)
    .filter((x) => !!x);
  var closeUnchecked = $('#' + Selectors.closeUncheckedId).checked;
  var collapsed = $('#' + Selectors.collapseId).checked;
  return { title, excludes, closeUnchecked, collapsed };
}

async function getCurrentTab() {
  return promiseWithTimeout((resolve, reject, clearTimer) => {
    chrome.runtime.sendMessage({ type: 'GetCurrentTab' }, (response) => {
      clearTimer();
      if (!response) {
        return reject(new Error('Failed to get current tab'));
      }
      resolve(response);
    });
  });
}

async function getTabs() {
  return promiseWithTimeout((resolve, reject, clearTimer) => {
    chrome.runtime.sendMessage({ type: 'GetTabs' }, (response) => {
      clearTimer();
      if (!response || !(response instanceof Array)) {
        return reject(new Error('Failed to retrive tabs'));
      }
      resolve(response);
    });
  });
}

async function getCurrentGroup() {
  return promiseWithTimeout((resolve, _, clearTimer) => {
    chrome.runtime.sendMessage({ type: 'GetCurrentGroup' }, (response) => {
      resolve(response);
      clearTimer();
    });
  });
}

function promiseWithTimeout(callback, timeout = 3000) {
  return new Promise((resolve, reject) => {
    var timer = setTimeout(() => {
      reject(new Error('Promise timeout'));
    }, timeout);
    var clearTimer = () => clearTimeout(timer);
    callback(resolve, reject, clearTimer);
  });
}
