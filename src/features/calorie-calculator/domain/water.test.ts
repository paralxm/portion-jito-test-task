import { describe, expect, it } from 'vitest';

import { announceWaterAdded, describeWaterState, formatWater, parseWaterAmount, speakWater, WATER_ADD_MAX_ML, WATER_TOTAL_MAX_ML, waterState } from './water';

describe('water', () => {
  it('formats millilitres below a litre and litres above, without trailing zeros', () => {
    expect(formatWater(0)).toBe('0 ml');
    expect(formatWater(250)).toBe('250 ml');
    expect(formatWater(1000)).toBe('1 L');
    expect(formatWater(1250)).toBe('1.25 L');
    expect(formatWater(1500)).toBe('1.5 L');
    expect(formatWater(2000)).toBe('2 L');
  });

  it('speaks the figure for the announcement', () => {
    expect(speakWater(1500)).toBe('1.5 litres');
    expect(speakWater(1000)).toBe('1 litre');
    expect(speakWater(250)).toBe('250 millilitres');
    expect(announceWaterAdded(250, 1500)).toBe('250 ml added. 1.5 litres today.');
  });

  it('parses whole millilitres within bounds and refuses everything else', () => {
    const add = { min: 1, max: WATER_ADD_MAX_ML };
    expect(parseWaterAmount('250', add)).toEqual({ ok: true, ml: 250 });
    expect(parseWaterAmount(' 500 ', add)).toEqual({ ok: true, ml: 500 });
    expect(parseWaterAmount('', add)).toEqual({ ok: false, reason: 'empty' });
    expect(parseWaterAmount('1.5', add)).toEqual({ ok: false, reason: 'invalid' });
    expect(parseWaterAmount('abc', add)).toEqual({ ok: false, reason: 'invalid' });
    expect(parseWaterAmount('0', add)).toEqual({ ok: false, reason: 'range' });
    expect(parseWaterAmount('5001', add)).toEqual({ ok: false, reason: 'range' });
    expect(parseWaterAmount('0', { min: 0, max: WATER_TOTAL_MAX_ML })).toEqual({ ok: true, ml: 0 });
  });

  it('names the state against the reference and states the excess', () => {
    expect(waterState(0)).toBe('empty');
    expect(waterState(1250)).toBe('partial');
    expect(waterState(2000)).toBe('reached');
    expect(waterState(2250)).toBe('exceeded');
    expect(describeWaterState(1250)).toBeNull();
    expect(describeWaterState(2000)).toBe('Daily reference reached.');
    expect(describeWaterState(2250)).toBe('250 ml over the daily reference.');
  });
});
