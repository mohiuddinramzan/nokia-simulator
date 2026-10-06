import { getSettings } from './storage.js';

const BN = {
  Menu: 'মেনু', Names: 'নাম', Select: 'বাছাই', Back: 'পিছনে', Options: 'অপশন', OK: 'ঠিক আছে', Clear: 'মুছুন',
  Yes: 'হ্যাঁ', No: 'না', Add: 'যোগ', Call: 'কল', End: 'শেষ', Cancel: 'বাতিল', Accept: 'ধরুন', Reject: 'কাটুন',
  Start: 'শুরু', Stop: 'থামান', Pause: 'বিরতি', Resume: 'চালু', Retry: 'আবার', Reset: 'রিসেট', Today: 'আজ',
  Recheck: 'আবার দেখুন', Next: 'পরের', Again: 'আবার', Hit: 'চাপুন', Snooze: 'স্নুজ',
  Messages: 'বার্তা', Contacts: 'কন্টাক্ট', 'Call Log': 'কল লগ', Games: 'গেম', Settings: 'সেটিংস', Alarm: 'অ্যালার্ম',
  Calculator: 'ক্যালকুলেটর', Calendar: 'ক্যালেন্ডার', Clock: 'ঘড়ি', Profiles: 'প্রোফাইল', About: 'সম্পর্কে',
  Inbox: 'ইনবক্স', Sent: 'পাঠানো', Drafts: 'খসড়া', 'Write message': 'বার্তা লিখুন', 'Simulate incoming': 'নকল ইনকামিং',
  'Inbox ({n})': 'ইনবক্স ({n})', Message: 'বার্তা', Read: 'পড়ুন', Reply: 'উত্তর দিন', Forward: 'ফরওয়ার্ড', Edit: 'এডিট',
  Delete: 'মুছে ফেলুন', 'Delete message?': 'বার্তা মুছবেন?', 'Send to': 'পাঠান', 'Enter number': 'নম্বর দিন',
  'Save draft': 'খসড়া রাখুন', 'Message sent': 'বার্তা গেছে', 'Sending...': 'পাঠানো হচ্ছে...', 'Send failed': 'পাঠানো যায়নি',
  'Saved to drafts': 'খসড়ায় রাখা হলো', 'New message': 'নতুন বার্তা', From: 'প্রেরক', To: 'প্রাপক', '(no number)': '(নম্বর নেই)',
  Empty: 'খালি', 'Not found': 'পাওয়া যায়নি', Number: 'নম্বর', Name: 'নাম', Search: 'খুঁজুন', Contact: 'কন্টাক্ট',
  'No contacts': 'কন্টাক্ট নেই', View: 'দেখুন', 'Send message': 'বার্তা পাঠান', 'Add contact': 'কন্টাক্ট যোগ', Saved: 'সংরক্ষিত',
  'Delete {name}?': '{name} মুছবেন?',
  'Missed calls': 'মিসড কল', 'Received calls': 'ধরা কল', 'Dialled numbers': 'ডায়াল করা', 'Clear all': 'সব মুছুন',
  'Clear log': 'লগ মুছুন', 'Delete all calls?': 'সব কল মুছবেন?', 'Delete this entry?': 'এটি মুছবেন?',
  'Simulate missed': 'নকল মিসড কল', 'Missed call': 'মিসড কল', 'Call failed': 'কল হয়নি', 'Incoming Call': 'ইনকামিং কল',
  Calling: 'কল হচ্ছে', 'No calls': 'কল নেই', Missed: 'মিসড', Received: 'ধরা', Dialled: 'ডায়াল', 'Time {t}': 'সময় {t}', Calls: 'কল',
  Snake: 'স্নেক', Reaction: 'রিঅ্যাকশন', 'Snake (Hi {n})': 'স্নেক (সেরা {n})', 'Reaction ({n}ms)': 'রিঅ্যাকশন ({n}ms)',
  'Press OK': 'OK চাপুন', Paused: 'বিরতিতে', 'Game over': 'খেলা শেষ', 'Score {n}': 'স্কোর {n}', 'New best!': 'নতুন রেকর্ড!',
  Hi: 'সেরা', 'Wait...': 'অপেক্ষা করুন...', 'PRESS NOW!': 'এখনই চাপুন!', 'Too soon!': 'বড্ড তাড়াতাড়ি!',
  'OK to retry': 'আবার OK চাপুন', 'OK for next': 'পরেরটায় OK', 'Average {n} ms': 'গড় {n} ms', 'Best {n} ms': 'সেরা {n} ms',
  '5 rounds': '5 রাউন্ড', 'OK to start': 'শুরুতে OK চাপুন',
  Error: 'ত্রুটি',
  'Time and date': 'সময় ও তারিখ', Stopwatch: 'স্টপওয়াচ', 'Countdown timer': 'কাউন্টডাউন টাইমার', Timer: 'টাইমার',
  '↑↓ 1 min  ←→ 10 s': '↑↓ 1 মিনিট  ←→ 10 সেকেন্ড',
  'No alarms': 'অ্যালার্ম নেই', ON: 'চালু', OFF: 'বন্ধ', off: 'বন্ধ', 'Turn off': 'বন্ধ করুন', 'Turn on': 'চালু করুন',
  'Edit time': 'সময় বদলান', 'Add alarm': 'অ্যালার্ম যোগ', 'Time HHMM': 'সময় HHMM', 'Invalid time': 'ভুল সময়',
  'Alarm set': 'অ্যালার্ম সেট হলো', "Time's up!": 'সময় শেষ!',
  Display: 'ডিসপ্লে', Theme: 'থিম', 'Pixel grid: {v}': 'পিক্সেল গ্রিড: {v}', 'Screen glow: {v}': 'স্ক্রিন আভা: {v}',
  'Sound: {v}': 'শব্দ: {v}', 'Vibration: {v}': 'ভাইব্রেশন: {v}', 'Time format: {v}': 'সময় ফরম্যাট: {v}', Language: 'ভাষা',
  'Reset app': 'অ্যাপ রিসেট', 'Real mode: {v}': 'আসল মোড: {v}', 'Phone status': 'ফোনের অবস্থা', 'Real mode': 'আসল মোড',
  'Erase all data?': 'সব তথ্য মুছবেন?', 'App reset': 'অ্যাপ রিসেট হয়েছে', 'Simulation mode': 'নকল মোড',
  'Android app only': 'শুধু অ্যান্ড্রয়েড অ্যাপে', 'Real mode on': 'আসল মোড চালু',
  'Real calls and SMS may cost money. Turn on?': 'আসল কল ও এসএমএসে টাকা কাটতে পারে। চালু করবেন?',
  'Call {c} SMS {s}': 'কল {c} এসএমএস {s}', no: 'না',
  'Classic Green': 'ক্লাসিক সবুজ', Monochrome: 'মনোক্রোম', 'Dark Retro': 'ডার্ক রেট্রো',
  General: 'সাধারণ', Silent: 'নীরব', 'Vibrate only': 'শুধু ভাইব্রেশন', '{name} on': '{name} চালু',
  'Retro Phone Simulator': 'রেট্রো ফোন সিমুলেটর', 'Version {v}': 'সংস্করণ {v}', 'Original retro design': 'মৌলিক রেট্রো নকশা',
  Sunday: 'রবিবার', Monday: 'সোমবার', Tuesday: 'মঙ্গলবার', Wednesday: 'বুধবার', Thursday: 'বৃহস্পতিবার', Friday: 'শুক্রবার', Saturday: 'শনিবার',
  Jan: 'জানু', Feb: 'ফেব্রু', Mar: 'মার্চ', Apr: 'এপ্রি', May: 'মে', Jun: 'জুন', Jul: 'জুলাই', Aug: 'আগস্ট',
  Sep: 'সেপ্টে', Oct: 'অক্টো', Nov: 'নভে', Dec: 'ডিসে',
  January: 'জানুয়ারি', February: 'ফেব্রুয়ারি', March: 'মার্চ', April: 'এপ্রিল', June: 'জুন', July: 'জুলাই',
  August: 'আগস্ট', September: 'সেপ্টেম্বর', October: 'অক্টোবর', November: 'নভেম্বর', December: 'ডিসেম্বর',
  'Hello! How are you?': 'হ্যালো! কেমন আছেন?', 'Call me when you are free.': 'ফ্রি হলে ফোন দিন।',
  'Meeting at 5 pm today.': 'আজ বিকেল 5টায় মিটিং।', 'Happy birthday!': 'শুভ জন্মদিন!',
  'Where are you? I am waiting.': 'কোথায় আপনি? আমি অপেক্ষায় আছি।',
  'Not available': 'নেই', Unavailable: 'পাওয়া যায়নি',
};

export const isBengali = () => getSettings().language === 'bn';

export function t(text, vars) {
  let out = text;
  if (isBengali() && Object.prototype.hasOwnProperty.call(BN, text)) out = BN[text];
  return vars ? out.replace(/\{(\w+)\}/g, (_, key) => (vars[key] === undefined ? '' : vars[key])) : out;
}
