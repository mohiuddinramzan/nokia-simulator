import { load, addItem, updateItem, removeItem, contactName, randomCaller } from './storage.js';
import { navigate, back, notify, render } from './router.js';
import { makeListScreen, makeInfoScreen, openOptions, openEditor, confirmAction } from './screens.js';
import { fmtDate, fmtTime } from './navigation.js';
import { startCall } from './calls.js';
import { isReal, realSms, noteError } from './phone.js';

const BOX_TITLES = { inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts' };
const SAMPLES = ['Hello! How are you?', 'Call me when you are free.', 'Meeting at 5 pm today.', 'Happy birthday!', 'Where are you? I am waiting.'];

const body = (m) => String(m.body || '');
const who = (m) => (m.number ? contactName(m.number) || m.number : '(no number)');
const findMessage = (id) => load('messages').find((m) => m.id === id);

function deliver(text, number, draftId) {
  if (draftId) removeItem('messages', draftId);
  addItem('messages', { box: 'sent', number, body: text, ts: Date.now(), read: true });
  notify('Message sent');
  render();
}

function send(text, number, draftId) {
  if (!isReal()) {
    deliver(text, number, draftId);
    return;
  }
  notify('Sending...');
  realSms(number, text).then(() => deliver(text, number, draftId)).catch((err) => {
    console.error('[messages] real SMS failed', err);
    noteError(err);
    saveDraft(text, number, draftId);
    notify('Send failed');
    render();
  });
}

function saveDraft(text, number, draftId) {
  const draft = { body: text, number, ts: Date.now() };
  if (!draftId || !updateItem('messages', draftId, draft)) addItem('messages', { ...draft, box: 'drafts', read: true });
  notify('Saved to drafts');
}

function chooseRecipient(text, draftId) {
  openOptions('Send to', [
    {
      label: 'Enter number',
      run: () => openEditor({ title: 'Number', max: 15, numeric: true, onDone: (n) => n && send(text, n, draftId) }),
    },
    {
      label: 'Contacts',
      run: () => navigate('contacts', { pick: (c) => send(text, c.number, draftId) }),
    },
    { label: 'Save draft', run: () => saveDraft(text, '', draftId) },
  ]);
}

export function compose({ body: text = '', number = '', draftId = null } = {}) {
  openEditor({
    title: 'Message',
    value: text,
    max: 160,
    onDone: (value) => {
      if (!value.trim()) return;
      if (number) send(value, number, draftId);
      else chooseRecipient(value, draftId);
    },
  });
}

export function simulateSms() {
  addItem('messages', {
    box: 'inbox',
    number: randomCaller(),
    body: SAMPLES[Math.floor(Math.random() * SAMPLES.length)],
    ts: Date.now(),
    read: false,
  });
  notify('New message');
}

function messageActions(m, fromView) {
  const remove = {
    label: 'Delete',
    run: () => confirmAction('Delete', 'Delete message?', () => {
      removeItem('messages', m.id);
      if (fromView) back();
    }),
  };
  const read = { label: 'Read', run: () => navigate('message', { id: m.id }) };
  const forward = { label: 'Forward', run: () => compose({ body: body(m) }) };
  const actions = {
    inbox: [read, { label: 'Reply', run: () => compose({ number: m.number }) }, forward, { label: 'Call', run: () => startCall(m.number) }, remove],
    sent: [read, forward, remove],
    drafts: [{ label: 'Edit', run: () => compose({ body: body(m), number: m.number, draftId: m.id }) }, remove],
  };
  return (actions[m.box] || [remove]).filter((a) => !(fromView && a === read));
}

export const messageMenuParams = () => ({
  title: 'Messages',
  items: () => {
    const unread = load('messages').filter((m) => m.box === 'inbox' && !m.read).length;
    return [
      { label: unread ? `Inbox (${unread})` : 'Inbox', keep: true, run: () => navigate('messagelist', { box: 'inbox' }) },
      { label: 'Sent', keep: true, run: () => navigate('messagelist', { box: 'sent' }) },
      { label: 'Drafts', keep: true, run: () => navigate('messagelist', { box: 'drafts' }) },
      { label: 'Write message', keep: true, run: () => compose() },
      ...(isReal() ? [] : [{ label: 'Simulate incoming', keep: true, run: simulateSms }]),
    ];
  },
});

export const messageListScreen = makeListScreen({
  title: (p) => BOX_TITLES[p.box] || 'Messages',
  items: (p) => load('messages').filter((m) => m.box === p.box).sort((a, b) => b.ts - a.ts),
  label: (m) => `${m.box === 'inbox' && !m.read ? '*' : ''}${who(m)}: ${body(m).replace(/\n/g, ' ')}`,
  empty: 'Empty',
  onOk: (m) => (m.box === 'drafts' ? compose({ body: body(m), number: m.number, draftId: m.id }) : navigate('message', { id: m.id })),
  onLeft: (m) => openOptions(who(m), messageActions(m, false)),
});

export const messageScreen = makeInfoScreen({
  title: ({ id }) => BOX_TITLES[(findMessage(id) || {}).box] || 'Message',
  lines: ({ id }) => {
    const m = findMessage(id);
    if (!m) return ['Not found'];
    return [`${m.box === 'inbox' ? 'From' : 'To'}: ${who(m)}`, body(m), '', `${fmtDate(m.ts)} ${fmtTime(m.ts)}`];
  },
  onEnter: ({ id }) => {
    const m = findMessage(id);
    if (m && !m.read) updateItem('messages', id, { read: true });
  },
  onLeft: ({ id }) => {
    const m = findMessage(id);
    if (m) openOptions(who(m), messageActions(m, true));
  },
});
