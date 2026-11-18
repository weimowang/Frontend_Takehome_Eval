import { fields, parseCard, type Card } from '../schema/card';
import '../styles/editor.css';

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type FieldName = keyof typeof fields;
const labels: Record<FieldName, string> = {
  schemaVersion: '資料版本', id: '商品 ID', variant: '卡片版型', title: '商品名稱',
  image: '商品圖片', price: '售價', originalPrice: '原價', tagline: '活動文案',
  stock: '剩餘庫存', badges: '商品標籤', productUrl: '商品連結', videoUrl: '影片連結',
};
const help: Partial<Record<FieldName, string>> = {
  price: '新台幣整數，0 代表免費。', originalPrice: '留白不顯示；有值一律保留劃線價。',
  stock: '留白隱藏庫存；0 顯示已售完。', badges: '最多 3 個標籤；文字留白即移除該標籤。',
  productUrl: '接受 HTTP(S) 或相對網址；留白時以選取事件回應。',
  videoUrl: '接受 HTTP(S) 或相對網址；留白不顯示播放按鈕。',
};
function create<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** The editor owns raw input only; the host owns accepted Card state and persistence. */
export function createEditor(container: HTMLElement, initial: Card, onChange: (card: Card) => void) {
  let accepted = parseCard(initial);
  let invalid = false;
  let destroyed = false;
  let listeners = new AbortController();
  const form = create('form', 'card-editor');
  form.noValidate = true;
  const controls = new Map<string, Control>();
  const errors = new Map<string, HTMLElement>();
  const groups = new Map<string, HTMLElement>();
  const status = create('p', 'editor-status');
  container.append(form);

  function wrapper(name: string, label: string, hint?: string) {
    const group = create('div', 'editor-field');
    const heading = create('label', 'editor-label', label);
    heading.htmlFor = `field-${name}`;
    group.append(heading);
    const error = create('p', 'editor-error');
    error.id = `error-${name}`;
    error.hidden = true;
    errors.set(name, error);
    groups.set(name, group);
    if (hint) {
      const description = create('p', 'editor-help', hint);
      description.id = `help-${name}`;
      group.append(description);
    }
    group.append(error);
    form.append(group);
    return group;
  }

  function attach(name: string, control: Control, group: HTMLElement, hint = false) {
    control.id = `field-${name}`;
    control.name = name;
    control.setAttribute('aria-describedby', `${hint ? `help-${name} ` : ''}error-${name}`);
    control.addEventListener('input', validate, { signal: listeners.signal });
    controls.set(name, control);
    group.insertBefore(control, group.querySelector('.editor-help,.editor-error'));
    return control;
  }

  function textControl(name: string, value: string, label: string, required: boolean, max?: number, hint?: string) {
    const group = wrapper(name, `${label}${required ? ' *' : ''}`, hint);
    const control = name === 'title' || name === 'tagline' ? create('textarea') : create('input');
    control.value = value;
    control.required = required;
    if (max) control.maxLength = max;
    if (control instanceof HTMLTextAreaElement) control.rows = 2;
    return attach(name, control, group, Boolean(hint));
  }

  function clearErrors() {
    errors.forEach(error => { error.textContent = ''; error.hidden = true; });
    controls.forEach(control => control.removeAttribute('aria-invalid'));
  }
  function showError(name: string, message: string) {
    const groupName = name.startsWith('badges') || name.startsWith('badge.') ? 'badges' : name.replace('image.', 'image-');
    const error = errors.get(groupName);
    if (error) { error.textContent = message; error.hidden = false; }
    if (groupName === 'badges') {
      groups.get('badges')?.querySelectorAll('input,select').forEach(control => control.setAttribute('aria-invalid', 'true'));
    } else controls.get(groupName)?.setAttribute('aria-invalid', 'true');
    status.textContent = `尚未套用：${message}`;
  }
  function collect() {
    const data: Record<string, unknown> = { schemaVersion: accepted.schemaVersion, id: accepted.id };
    for (const [name, definition] of Object.entries(fields)) {
      if (name === 'id' || definition.kind === 'version') continue;
      if (definition.kind === 'image') {
        data.image = { src: controls.get('image-src')!.value, alt: controls.get('image-alt')!.value };
      } else if (definition.kind === 'badges') {
        data.badges = [0, 1, 2].flatMap(index => {
          const label = controls.get(`badges-${index}-label`)!.value;
          return label.trim() ? [{ kind: controls.get(`badges-${index}-kind`)!.value, label }] : [];
        });
      } else {
        const control = controls.get(name)!;
        const raw = control.value;
        if (definition.kind === 'money' || definition.kind === 'integer') {
          if (control instanceof HTMLInputElement && control.validity.badInput) throw new Error(`${name}：請輸入有效整數`);
          if (raw.trim() !== '') data[name] = Number(raw);
          // Missing optional numeric fields stay undefined; empty required numbers fail parseCard.
        } else if (raw.trim() !== '' || definition.required) data[name] = raw;
      }
    }
    return data;
  }
  function validate() {
    if (destroyed) return;
    clearErrors();
    try {
      const next = parseCard(collect());
      invalid = false;
      accepted = next;
      status.textContent = '已更新預覽';
      onChange(structuredClone(next));
    } catch (error) {
      invalid = true;
      const message = error instanceof Error ? error.message : '欄位內容有誤';
      showError(message.split('：')[0], message);
    }
  }
  function render() {
    listeners.abort();
    listeners = new AbortController();
    form.replaceChildren();
    controls.clear(); errors.clear(); groups.clear();
    form.addEventListener('submit', event => event.preventDefault(), { signal: listeners.signal });
    form.append(create('p', 'editor-intro', '修改後立即更新預覽；標示 * 的欄位為必填。'));
    for (const [key, definition] of Object.entries(fields)) {
      const name = key as FieldName;
      if (definition.kind === 'version' || name === 'id') {
        const group = wrapper(name, labels[name]);
        const input = create('input');
        input.value = String(accepted[name]);
        input.readOnly = true;
        attach(name, input, group);
      } else if (definition.kind === 'image') {
        textControl('image-src', accepted.image.src, '圖片路徑', true, undefined, '本地 SVG 或 HTTP(S) 圖片網址。');
        textControl('image-alt', accepted.image.alt, '圖片替代文字', true, 200);
      } else if (definition.kind === 'variant') {
        const group = wrapper(name, labels[name]);
        const select = create('select');
        for (const [value, label] of [['ranking', '橫式・今日暢銷卡'], ['flash-sale', '直式・限時搶購卡']]) {
          const option = create('option', '', label); option.value = value; select.append(option);
        }
        select.value = accepted.variant ?? 'ranking';
        attach(name, select, group);
      } else if (definition.kind === 'badges') {
        const group = wrapper(name, labels[name], help[name]);
        group.querySelector('label')!.removeAttribute('for');
        for (let index = 0; index < 3; index++) {
          const row = create('div', 'editor-badge-row');
          const select = create('select');
          for (const [value, label] of [['promotion', '活動'], ['preorder', '預購']]) {
            const option = create('option', '', label); option.value = value; select.append(option);
          }
          select.value = accepted.badges?.[index]?.kind ?? 'promotion';
          select.setAttribute('aria-label', `標籤 ${index + 1} 類型`);
          const input = create('input');
          input.value = accepted.badges?.[index]?.label ?? '';
          input.maxLength = 20;
          input.placeholder = `標籤 ${index + 1} 文字`;
          input.setAttribute('aria-label', `標籤 ${index + 1} 文字`);
          for (const [suffix, control] of [['kind', select], ['label', input]] as const) {
            const controlName = `badges-${index}-${suffix}`;
            control.id = `field-${controlName}`;
            control.setAttribute('aria-describedby', 'help-badges error-badges');
            control.addEventListener('input', validate, { signal: listeners.signal });
            controls.set(controlName, control); row.append(control);
          }
          group.insertBefore(row, group.querySelector('.editor-help'));
        }
      } else if (definition.kind === 'money' || definition.kind === 'integer') {
        const group = wrapper(name, `${labels[name]}${definition.required ? ' *' : ''}`, help[name]);
        const input = create('input');
        input.type = 'number'; input.min = '0'; input.step = '1';
        input.required = definition.required;
        input.value = accepted[name] === undefined ? '' : String(accepted[name]);
        attach(name, input, group, Boolean(help[name]));
      } else {
        textControl(name, String(accepted[name] ?? ''), labels[name], definition.required,
          'max' in definition ? definition.max : undefined, help[name]);
      }
    }
    status.textContent = '可開始調整商品內容';
    form.append(status);
  }
  render();
  return {
    setCard(card: Card) {
      if (destroyed) return;
      accepted = parseCard(card); invalid = false; render();
    },
    hasInvalidDraft() { return invalid; },
    destroy() { if (destroyed) return; destroyed = true; listeners.abort(); form.remove(); },
  };
}
