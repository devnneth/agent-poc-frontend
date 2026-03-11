
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTheme, saveTheme } from '../../src/repositories/preference-repository';

// 로컬 스토리지 모킹을 위한 헬퍼
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        })
    };
})();

describe('Preference Repository', () => {
    beforeEach(() => {
        // window.localStorage를 모킹으로 교체
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('loadTheme', () => {
        it('저장된 테마가 "light"일 때 "light"를 반환해야 한다', () => {
            window.localStorage.setItem('gplanner.theme', 'light');
            const theme = loadTheme();
            expect(theme).toBe('light');
        });

        it('저장된 테마가 "dark"일 때 "dark"를 반환해야 한다', () => {
            window.localStorage.setItem('gplanner.theme', 'dark');
            const theme = loadTheme();
            expect(theme).toBe('dark');
        });

        it('저장된 테마가 유효하지 않은 값일 때 null을 반환해야 한다', () => {
            window.localStorage.setItem('gplanner.theme', 'invalid-theme');
            const theme = loadTheme();
            expect(theme).toBeNull();
        });

        it('저장된 테마가 없을 때 null을 반환해야 한다', () => {
            const theme = loadTheme();
            expect(theme).toBeNull();
        });

        it('localStorage 접근 중 에러 발생 시 null을 반환하고 에러를 로깅해야 한다', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            window.localStorage.getItem.mockImplementationOnce(() => {
                throw new Error('Storage access denied');
            });

            const theme = loadTheme();

            expect(theme).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('테마 저장소 읽기 실패:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('saveTheme', () => {
        it('테마를 로컬 스토리지에 저장해야 한다', () => {
            saveTheme('dark');
            expect(window.localStorage.setItem).toHaveBeenCalledWith('gplanner.theme', 'dark');
        });

        it('저장 중 에러 발생 시 에러를 로깅해야 한다', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            window.localStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage full');
            });

            saveTheme('light');

            expect(consoleSpy).toHaveBeenCalledWith('테마 저장소 저장 실패:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });
});
