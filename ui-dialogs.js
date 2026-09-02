// Queue site dialogs so each action waits for the user's response.
let dialogQueue = Promise.resolve();
function showSiteDialog(message, options = {}) {
  const show = () => new Promise(resolve => {
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'site-dialog';
    dialog.setAttribute('aria-labelledby', 'site-dialog-title');
    dialog.setAttribute('aria-describedby', 'site-dialog-message');
    const form = document.createElement('form');
    const brand = document.createElement('div');
    brand.className = 'site-dialog-brand';
    brand.textContent = 'OneHealth';
    const title = document.createElement('h2');
    title.id = 'site-dialog-title';
    title.textContent = options.title || (options.kind === 'confirm' ? 'Please confirm' : options.kind === 'prompt' ? 'Update details' : 'Notification');
    const description = document.createElement('p');
    description.id = 'site-dialog-message';
    description.textContent = message;
    form.append(brand, title, description);
    let input;
    if (options.kind === 'prompt') {
      input = document.createElement('input');
      input.type = options.inputType || 'text';
      input.value = options.value || '';
      input.setAttribute('aria-label', message);
      input.required = true;
      form.append(input);
    }
    const actions = document.createElement('div');
    actions.className = 'site-dialog-actions';
    let result = options.kind === 'confirm' ? false : null;
    let cancel;
    if (options.kind === 'confirm' || options.kind === 'prompt') {
      cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancel';
      cancel.className = 'site-dialog-cancel';
      cancel.onclick = () => dialog.close();
      actions.append(cancel);
    }
    const accept = document.createElement('button');
    accept.type = 'submit';
    accept.className = 'site-dialog-accept';
    accept.textContent = options.confirmText || (options.kind === 'confirm' ? 'Confirm' : options.kind === 'prompt' ? 'Save' : 'OK');
    actions.append(accept);
    form.append(actions);
    dialog.append(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      result = input ? input.value.trim() : true;
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
      resolve(result);
    }, {once:true});
    document.body.append(dialog);
    dialog.showModal();
    (input || cancel || accept).focus();
    input?.select();
  });
  const response = dialogQueue.then(show);
  dialogQueue = response.catch(() => {});
  return response;
}
function appAlert(message) { return showSiteDialog(message); }
function appConfirm(message) { return showSiteDialog(message, {kind:'confirm'}); }
function appPrompt(message, value = '') { return showSiteDialog(message, {kind:'prompt', value, inputType:'email'}); }
