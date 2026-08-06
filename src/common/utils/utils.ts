export function mintuesToMilliseconds(minutes: number): number {
    return minutes * 60 * 1000;
}

export function hoursToMilliseconds(hours: number): number {
    return hours * 60 *60 * 1000;
}

export function daysToMilliseconds(days: number): number {
    return days * 24 *  60 * 60 * 1000;
}