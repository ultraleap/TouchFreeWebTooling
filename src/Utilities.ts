/**
 * Map value from one range to the equivalent value within a new range
 * @param _value - Value to map
 * @param _oldMin - original range's minimum
 * @param _oldMax - original range's maximum
 * @param _newMin - new range's minimum
 * @param _newMax - new range's maximum
 *
 * @example
 * ```
 * MapRangeToRange(0.5, 0, 1, 0, 8) // returns 4
 * ```
 * @public
 */
export function MapRangeToRange(
    _value: number,
    _oldMin: number,
    _oldMax: number,
    _newMin: number,
    _newMax: number
): number {
    const oldRange = _oldMax - _oldMin;
    let newValue;

    if (oldRange === 0) {
        newValue = _newMin;
    } else {
        const newRange = _newMax - _newMin;
        newValue = ((_value - _oldMin) * newRange) / oldRange + _newMin;
    }

    return newValue;
}
