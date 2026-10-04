import { load, addItem, updateItem, removeItem } from './storage.js';
import { navigate, back, notify } from './router.js';
import { makeListScreen, makeInfoScreen, openOptions, openEditor, confirmAction } from './screens.js';
import { startCall } from './calls.js';
import { compose } from './messages.js';

const clean = (c) => ({ ...c, name: String(c.name || ''), number: String(c.number || '') });
const sortedContacts = () => load('contacts').map(clean).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
const findContact = (id) => sortedContacts().find((c) => c.id === id);
const matches = (c, query) => c.name.toLowerCase().includes(query.toLowerCase()) || c.number.includes(query);

const askName = (value, next) => openEditor({ title: 'Name', value, max: 20, onDone: (name) => name.trim() && next(name.trim()) });
const askNumber = (value, next) => openEditor({ title: 'Number', value, max: 15, numeric: true, onDone: (number) => number && next(number) });

export function addContact() {
  askName('', (name) => askNumber('', (number) => {
    addItem('contacts', { name, number });
    notify('Saved');
  }));
}

function editContact(c) {
  askName(c.name, (name) => askNumber(c.number, (number) => {
    updateItem('contacts', c.id, { name, number });
    notify('Saved');
  }));
}

function searchContacts() {
  openEditor({ title: 'Search', max: 20, onDone: (query) => query.trim() && navigate('contacts', { query: query.trim() }) });
}

function contactActions(c, fromView) {
  return [
    { label: 'Call', run: () => startCall(c.number) },
    { label: 'Send message', run: () => compose({ number: c.number }) },
    { label: 'Edit', run: () => editContact(c) },
    {
      label: 'Delete',
      run: () => confirmAction('Delete', `Delete ${c.name}?`, () => {
        removeItem('contacts', c.id);
        if (fromView) back();
      }),
    },
  ];
}

function pick(c, params) {
  back();
  params.pick(c);
}

export const contactsScreen = makeListScreen({
  title: (p) => (p.pick ? 'Select' : p.query ? 'Search' : 'Contacts'),
  items: (p) => sortedContacts().filter((c) => !p.query || matches(c, p.query)),
  label: (c) => c.name,
  left: (p) => (p.pick ? 'Select' : 'Options'),
  empty: 'No contacts',
  emptyLeft: { label: 'Add', run: addContact },
  onOk: (c, p) => (p.pick ? pick(c, p) : navigate('contact', { id: c.id })),
  onLeft: (c, p) => {
    if (p.pick) {
      pick(c, p);
      return;
    }
    openOptions(c.name, [
      { label: 'View', run: () => navigate('contact', { id: c.id }) },
      ...contactActions(c, false),
      { label: 'Add contact', run: addContact },
      { label: 'Search', run: searchContacts },
    ]);
  },
});

export const contactScreen = makeInfoScreen({
  title: 'Contact',
  lines: ({ id }) => {
    const c = findContact(id);
    return c ? [c.name, c.number] : ['Not found'];
  },
  onLeft: ({ id }) => {
    const c = findContact(id);
    if (c) openOptions(c.name, contactActions(c, true));
  },
  onOk: ({ id }) => {
    const c = findContact(id);
    if (c) startCall(c.number);
  },
});
