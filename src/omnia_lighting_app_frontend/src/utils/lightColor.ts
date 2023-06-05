import { LightColorEnum } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";

export type AvailableLightColors = 'red' | 'green' | 'blue';

export const parseLightColor = (color: LightColorEnum | undefined): AvailableLightColors => {
    if (!color) {
        throw new Error("Color is undefined");
    }

    if ("Red" in color!) {
        return 'red';
    } else if ("Green" in color!) {
        return 'green';
    } else if ("Blue" in color!) {
        return 'blue';
    }

    throw new Error(`Unknown color: ${color}`);
};

export const getLightColorEnum = (color: AvailableLightColors): LightColorEnum => {
    if (color === 'red') {
        return { Red: null };
    } else if (color === 'green') {
        return { Green: null };
    } else if (color === 'blue') {
        return { Blue: null };
    }

    throw new Error(`Unknown color: ${color}`);
}
