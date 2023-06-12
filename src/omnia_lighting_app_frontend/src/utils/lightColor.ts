export type AvailableLightColors = 'red' | 'green' | 'blue';

export const printLightColor = (color: AvailableLightColors): string => {
    return color.toUpperCase();
}

export const getCardColorScheme = (color: AvailableLightColors | string | undefined) => {
    if (!color) {
        return;
    }

    switch (color) {
        case 'red':
            return 'red.600';
        case 'green':
            return 'green.600';
        case 'blue':
            return 'blue.600';
        default:
            return;
    }
};
