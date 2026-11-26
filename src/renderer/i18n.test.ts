import { describe, expect, it } from 'vitest';
import { copy, errorText } from './i18n';

describe('English UI copy', () => {
  it('provides English labels for layouts, actions, confirmations and errors', () => {
    expect(copy.en.layouts.ten).toBe('10 panes');
    expect(copy.en.actions.compose).toBe('Compose');
    expect(copy.en.deleteSlot('Work')).toContain('Work');
    expect(errorText(new Error('Error invoking remote method: INVALID_HANDLE'), 'en')).toContain('X handle');
    expect(errorText(new Error('INVALID_HANDLE'), 'ja')).toContain('ユーザーID');
  });
});
