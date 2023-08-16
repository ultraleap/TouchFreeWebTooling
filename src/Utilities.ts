/**
 * Map value from one range to the equivalent value within a new range
 * @param value - Value to map
 * @param oldMin - original range's minimum
 * @param oldMax - original range's maximum
 * @param newMin - new range's minimum
 * @param newMax - new range's maximum
 *
 * @example
 * ```
 * mapRangeToRange(0.5, 0, 1, 0, 8) // returns 4
 * ```
 * @public
 */
export function mapRangeToRange(value: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number {
    const oldRange = oldMax - oldMin;
    let newValue;

    if (oldRange === 0) {
        newValue = newMin;
    } else {
        const newRange = newMax - newMin;
        newValue = ((value - oldMin) * newRange) / oldRange + newMin;
    }

    return newValue;
}
