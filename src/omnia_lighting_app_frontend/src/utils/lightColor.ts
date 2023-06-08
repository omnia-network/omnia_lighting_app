export type AvailableLightColors = 'red' | 'green' | 'blue';

export const printLightColor = (color: AvailableLightColors): string => {
    return color.toUpperCase();
}
