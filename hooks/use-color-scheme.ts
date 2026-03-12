import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from '../src/store/themeStore';

export function useColorScheme() {
    const systemTheme = useSystemColorScheme();
    const mode = useThemeStore((state) => state.mode);

    if (mode === 'system') return systemTheme;
    return mode;
}
