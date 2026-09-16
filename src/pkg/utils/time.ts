type TimeUnit = 'd' | 'h' | 'm' | 's';

const multipliersInSeconds: Record<TimeUnit, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
};

export function toSec(value: number, unit: TimeUnit): number {
    return value * multipliersInSeconds[unit];
}

export function toMs(value: number, unit: TimeUnit): number {
    return toSec(value, unit) * 1000;
}