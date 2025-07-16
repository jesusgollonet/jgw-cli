import { describe, it, expect } from 'vitest'
import { getUnitAndValueFormat } from './time-ago'

describe('time-ago', () => {
  describe('getUnitAndValueFormat', () => {
    it('should return seconds for elapsed time under 1 minute', () => {
      const [value, unit] = getUnitAndValueFormat(30 * 1000) // 30 seconds
      expect(unit).toBe('seconds')
      expect(value).toBe(1000)
    })

    it('should return minutes for elapsed time under 1 hour', () => {
      const [value, unit] = getUnitAndValueFormat(30 * 60 * 1000) // 30 minutes
      expect(unit).toBe('minutes')
      expect(value).toBe(60 * 1000)
    })

    it('should return hours for elapsed time under 1 day', () => {
      const [value, unit] = getUnitAndValueFormat(12 * 60 * 60 * 1000) // 12 hours
      expect(unit).toBe('hours')
      expect(value).toBe(60 * 60 * 1000)
    })

    it('should return days for elapsed time under 1 week', () => {
      const [value, unit] = getUnitAndValueFormat(3 * 24 * 60 * 60 * 1000) // 3 days
      expect(unit).toBe('days')
      expect(value).toBe(24 * 60 * 60 * 1000)
    })

    it('should return weeks for elapsed time under 1 month', () => {
      const [value, unit] = getUnitAndValueFormat(2 * 7 * 24 * 60 * 60 * 1000) // 2 weeks
      expect(unit).toBe('weeks')
      expect(value).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('should return months for elapsed time under 1 year', () => {
      const [value, unit] = getUnitAndValueFormat(6 * 30 * 24 * 60 * 60 * 1000) // 6 months
      expect(unit).toBe('months')
      expect(value).toBe(30 * 24 * 60 * 60 * 1000)
    })

    it('should return years for elapsed time over 1 year', () => {
      const [value, unit] = getUnitAndValueFormat(2 * 365 * 24 * 60 * 60 * 1000) // 2 years
      expect(unit).toBe('years')
      expect(value).toBe(365 * 24 * 60 * 60 * 1000)
    })
  })
})