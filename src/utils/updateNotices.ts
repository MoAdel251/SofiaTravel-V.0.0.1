export const WEBSITE_UPDATE_CATEGORY = 'Website Update';

const NOTICES = {
  en: 'This message is part of a website update: some sections or features may have changed. Please refresh the page or reopen the app to load the latest version.',
  ar: 'هذه الرسالة ضمن تحديث الموقع: قد تكون بعض الأقسام أو الخصائص قد تغيّرت. يرجى تحديث الصفحة أو إعادة فتح التطبيق لتحميل أحدث إصدار.',
};

const STICKY_INSTRUCTIONS = {
  en: 'The website has been updated. Please refresh the page to view the latest version. If you use the home-screen shortcut, uninstall it first, then reinstall it from the browser so the update appears correctly.',
  ar: 'تم تحديث الموقع. يرجى تحديث الصفحة لعرض أحدث إصدار. وإذا كنت تستخدم اختصار الشاشة الرئيسية، فاحذف الاختصار أولاً ثم أعد تثبيته من المتصفح ليظهر التحديث بشكل صحيح.',
};

export function getStickyUpdateMessage(language?: string): string {
  return String(language || '').trim().toLowerCase().startsWith('ar')
    ? STICKY_INSTRUCTIONS.ar
    : STICKY_INSTRUCTIONS.en;
}

export function getWebsiteUpdateNotice(language?: string): string {
  return String(language || '').trim().toLowerCase().startsWith('ar') ? NOTICES.ar : NOTICES.en;
}

export function stripWebsiteUpdateNotice(message: string): string {
  let out = String(message || '');
  for (const notice of Object.values(NOTICES)) {
    out = out.split(notice).join('');
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export function withWebsiteUpdateNotice(message: string, language?: string): string {
  const base = stripWebsiteUpdateNotice(message);
  const notice = getWebsiteUpdateNotice(language);
  return base ? `${base}\n\n${notice}` : notice;
}

export function isWebsiteUpdateCategory(category?: string): boolean {
  return String(category || '').trim().toLowerCase() === WEBSITE_UPDATE_CATEGORY.toLowerCase();
}
