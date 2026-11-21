import { createStore } from '../../shared/storage.ts';
import { type Condition, FORMS, KEYS } from './fields.ts';

const store = createStore<Condition | null>('lastCondition', null);

function fire(el: Element, ...types: string[]) {
  for (const type of types) el.dispatchEvent(new Event(type, { bubbles: true }));
}

/** Sets a field by name. Values not offered by a select or radio group are skipped. */
function setField(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name);
  if (el instanceof RadioNodeList) {
    for (const radio of el) {
      if (radio instanceof HTMLInputElement && radio.type === 'radio' && radio.value === value) {
        radio.checked = true;
        fire(radio, 'change');
      }
    }
  } else if (el instanceof HTMLSelectElement) {
    if (![...el.options].some((o) => o.value === value)) return;
    el.value = value;
    fire(el, 'change');
  } else if (el instanceof HTMLInputElement) {
    el.value = value;
    fire(el, 'input', 'change');
  }
}

function getText(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name);
  return el instanceof HTMLInputElement ? el.value : '';
}

for (const spec of FORMS) {
  const form = document.querySelector<HTMLFormElement>(spec.form);
  if (!form) continue;

  form.addEventListener('formdata', (e) => {
    const condition = {} as Condition;
    for (const key of KEYS) condition[key] = String(e.formData.get(spec.names[key]) ?? '');
    store.set(condition);
  });

  // Leave conditions the site filled in itself (e.g. when coming back to change them).
  const saved = store.get();
  if (saved && !getText(form, spec.names.from) && !getText(form, spec.names.to)) {
    for (const key of KEYS) setField(form, spec.names[key], saved[key]);
  }
}
