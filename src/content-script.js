const Prefix = 'ruperdomdonotmodify';

const Selectors = {
  container: Prefix + '-container',
  root: Prefix + '-root',
  title: Prefix + '-title',
  button: Prefix + '-button',
  checkbox: Prefix + '-checkbox',
  tag: Prefix + '-tag',
  tagActive: Prefix + '-tag-active',

  form: Prefix + '-form',
  formRow: Prefix + '-form-row',
  formLabel: Prefix + '-form-label',
  formRowTabs: Prefix + 'form-row-tabs',
  formRowColors: Prefix + 'form-row-colors',
  formLabelTop: Prefix + 'form-label-tabs',
  formControl: Prefix + '-form-control',
  formOperations: Prefix + '-form-operations',
  formInput: Prefix + '-form-input',

  colors: Prefix + '-colors',
  color: Prefix + '-color',

  tabsContainer: Prefix + '-rows',
  tabRow: Prefix + '-row',
  tabRowCheckbox: Prefix + '-row-checkbox',
  tabRowLabel: Prefix + '-row-label',

  groupsContainer: Prefix + '-groups',
  groupsTooltip: Prefix + '-tooltip',
  groupItem: Prefix + '-group',
  groupItemActive: Prefix + '-group-active',

  groupTitleId: Prefix + '-group-title',
  closeUncheckedId: Prefix + '-close-unchecked',
  collapseId: Prefix + '-collapsed',

  confirm: Prefix + '-button-confirm',
};

const colorMap = {
  grey: '#DADCE0',
  blue: '#8AB4F8',
  red: '#F28B82',
  yellow: '#FDD663',
  green: '#81C995',
  pink: '#FF8BCB',
  purple: '#C58AF9',
  cyan: '#78D9EC',
  orange: '#FCAD70',
};

const { container, shadowRoot } = initShadowRoot();
const $ = (selector) => shadowRoot.querySelector(selector);
const $$ = (selector) => shadowRoot.querySelectorAll(selector);

initForm();

window.addEventListener('keydown', async (event) => {
  var activeElement = document.activeElement;
  if (event.ctrlKey) {
    if (event.key === 'g') showGroupOptions();
    if (event.key === 'u') {
      // ctrl + h => delete one character
      if (activeElement.tagName === 'INPUT' && activeElement.type === 'text') return;
      if (activeElement.tagName === 'TEXTAREA') return;
      chrome.runtime.sendMessage({ type: 'Ungroup' });
    }
  }
  if (isFormVisible()) {
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

function isFormVisible() {
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

function removeGroupSelection(...excludes) {
  var groupsContainer = $('.' + Selectors.groupsContainer);
  var tags = [...groupsContainer.querySelectorAll('.' + Selectors.groupItem)];
  tags.forEach((tag) => {
    if (excludes.includes(tag)) return;
    tag.classList.remove(Selectors.tagActive);
    tag.classList.remove(Selectors.groupItemActive);
  });
  var tooltip = $('.' + Selectors.groupsTooltip);
  tooltip.style.display = 'none';
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
      .${Selectors.tag} {
        display: inline-block;
        margin: 0 4px 0 0;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.9em;
        cursor: pointer;
      }
      .${Selectors.tagActive} {
        border: 1px solid #2A59D8;
      }
      form {
        margin: 24px 0 12px;
      }
      .${Selectors.formInput} {
        padding: 4px 8px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        font-size: 0.95em;
        appearence: none;
      }
      .${Selectors.formRow} {
        display: flex;
        margin: 10px 0;
      }
      .${Selectors.formRowTabs} {
        margin: 14px 0 0px;
      }
      .${Selectors.formRowColors} {
        margin-top: 14px;
      }
      .${Selectors.formLabel} {
        width: 120px;
        flex-shrink: 0;
        align-self: center;
        margin-right: 16px;
        text-align: right;
      }
      .${Selectors.formLabelTop} {
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
      .${Selectors.groupItem} {
        margin-top: 8px;
      }
      .${Selectors.groupsTooltip} {
        margin-top: 8px;
      }
      .${Selectors.colors} {
        display: flex;
        align-items: center;
      }
      .${Selectors.color} {
        display: inline-block;
        margin-right: 12px;
      }
      .${Selectors.color} input {
        appearence: none;
        -webkit-appearance: none;
        display: block;
        position: relative;
        width: 16px;
        height: 16px;
        margin: 0;
        border: none;
        border-radius: 50%;
      }
      .${Selectors.color} input:checked:before {
        content: '';
        position: absolute;
        width: 68%;
        height: 68%;
        top: 16%;
        left: 16%;
        background-color: transparent;
        border: 2px solid black;
        box-sizing: border-box;
        border-radius: 50%;
      }
      ${Object.keys(colorMap)
        .map((key) => {
          return `
            .${Selectors.color}-${key} input {
              background-color: ${colorMap[key]};
              border-color: ${colorMap[key]};
            }
          `;
        })
        .join('\n')}
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
      .${Selectors.confirm} {
        background-color: #0075FF;
        color: white;
        border: 1px solid #0075FF;
      }
    </style>
    <div class='${Selectors.root}'>
      <h2 class='${Selectors.title}'>Group Options</h2>
      <form class='${Selectors.form}'>
        <div class='${Selectors.formRow}'>
          <label class='${Selectors.formLabel} ${Selectors.formLabelTop}'>Group Title</label>
          <div class='${Selectors.formControl}'>
            <input id='${Selectors.groupTitleId}' class='${Selectors.formInput}' autofocus autocomplete="off" />
            <div class='${Selectors.groupsContainer}'></div>
            <div class='${Selectors.groupsTooltip}'></div>
          </div>
        </div>
        <div class='${Selectors.formRow} ${Selectors.formRowColors}'>
          <label class='${Selectors.formLabel}'>Color</label>
          <div class='${Selectors.formControl} ${Selectors.colors}'>
            <div class='${Selectors.color} ${Selectors.color}-grey'>
              <input type='radio' id="grey" value="grey" name="group-color" checked />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-blue'>
              <input type='radio' id="blue" value="blue" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-red'>
              <input type='radio' id="red" value="red" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-yellow'>
              <input type='radio' id="yellow" value="yellow" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-green'>
              <input type='radio' id="green" value="green" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-pink'>
              <input type='radio' id="pink" value="pink" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-purple'>
              <input type='radio' id="purple" value="purple" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-cyan'>
              <input type='radio' id="cyan" value="cyan" name="group-color" />
            </div>
            <div class='${Selectors.color} ${Selectors.color}-orange'>
              <input type='radio' id="orange" value="orange" name="group-color" />
            </div>
          </div>
        </div>
        <div class='${Selectors.formRow} ${Selectors.formRowTabs}'>
          <label class='${Selectors.formLabel} ${Selectors.formLabelTop}'>Tabs</label>
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
          <div class='${Selectors.button} ${Selectors.confirm}'>Confirm</div>
        </div>
      </form>
    </div>
  `;

  return { container, shadowRoot };
}

function initForm() {
  var form = $('form');
  form.addEventListener('submit', createGroup);

  var titleInput = $('#' + Selectors.groupTitleId);
  titleInput.addEventListener('input', () => removeGroupSelection());

  var buttons = $$('.' + Selectors.formOperations + ' .' + Selectors.button);
  buttons[0].addEventListener('click', hideGroupOptions);
  buttons[1].addEventListener('click', createGroup);

  refreshForm();
}

async function refreshForm() {
  if (!isFormVisible()) return;

  var tabs = await getTabs();
  if (tabs.length === 0) {
    return hideGroupOptions();
  }
  var groups = await getGroups();

  var titleInput = $('#' + Selectors.groupTitleId);
  var currentGroup = await getCurrentGroup();
  if (currentGroup) {
    titleInput.value = currentGroup.title;
  } else {
    titleInput.value = 'New Group';
  }

  var tabsContainer = $('.' + Selectors.tabsContainer);
  tabsContainer.querySelectorAll('.' + Selectors.tabRow).forEach((el) => el.remove());

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

  var groupsContainer = $('.' + Selectors.groupsContainer);
  groupsContainer.querySelectorAll('.' + Selectors.groupItem).forEach((el) => {
    el.removeEventListener('click', onGroupToggle);
    el.remove();
  });
  groups.forEach((group) => {
    if (currentGroup && group.id === currentGroup.id) return;
    var item = document.createElement('div');
    item.innerText = group.title;
    item.classList.add(Selectors.tag, Selectors.groupItem);
    item.style.backgroundColor = colorMap[group.color] || colorMap.grey;
    item.groupId = group.id;
    item.addEventListener('click', onGroupToggle);
    groupsContainer.appendChild(item);
  });
  refreshGroupTooltip();
}

function onGroupToggle(event) {
  var item = event.currentTarget;
  item.classList.toggle(Selectors.tagActive);
  item.classList.toggle(Selectors.groupItemActive);
  removeGroupSelection(item);
  refreshGroupTooltip();
}

async function refreshGroupTooltip() {
  var currentGroup = await getCurrentGroup();
  var tooltip = $('.' + Selectors.groupsTooltip);
  var active = $('.' + Selectors.groupItemActive);
  if (active) {
    if (currentGroup) {
      tooltip.innerText = 'Move selected tabs to ' + active.innerText;
    } else {
      tooltip.innerText = 'Add selected tabs to ' + active.innerText;
    }
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
}

function collectGroupOptions() {
  var title = $('#' + Selectors.groupTitleId).value;
  var excludes = [...$$('.' + Selectors.tabRowCheckbox)]
    .filter((checkbox) => !checkbox.checked)
    .map((x) => x.tabId)
    .filter((x) => !!x);
  var closeUnchecked = $('#' + Selectors.closeUncheckedId).checked;
  var collapsed = $('#' + Selectors.collapseId).checked;
  var groupId = null;
  var selectedGroup = $('.' + Selectors.groupItemActive);
  if (selectedGroup) {
    groupId = selectedGroup.groupId;
  }
  var color = 'grey';
  var radio = $(`.${Selectors.color} input:checked`);
  if (radio) {
    color = radio.value;
  }
  return { title, excludes, closeUnchecked, collapsed, groupId, color };
}

function getCurrentTab() {
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

function getTabs() {
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

function getGroups() {
  return promiseWithTimeout((resolve, reject, clearTimer) => {
    chrome.runtime.sendMessage({ type: 'GetGroups' }, (response) => {
      clearTimer();
      if (!response || !(response instanceof Array)) {
        return reject(new Error('Failed to retrive groups'));
      }
      resolve(response);
    });
  });
}

function getCurrentGroup() {
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
