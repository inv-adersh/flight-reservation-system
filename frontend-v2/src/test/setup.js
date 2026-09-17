import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Global react-i18next mock ─────────────────────────────────────────────────
// Loads the real en.json translations so t('admin.analytics.title') returns
// "Booking Analytics Dashboard" rather than the raw key string.
import enTranslations from '../i18n/resources/en.json';

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : path), obj);
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => resolve(enTranslations, key),
    i18n: { changeLanguage: vi.fn(), language: 'en' },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));