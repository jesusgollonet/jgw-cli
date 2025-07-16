import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadConfig } from './config'
import fs from 'node:fs/promises'
import { homedir } from 'os'

// Mock fs and homedir
vi.mock('node:fs/promises')
vi.mock('os')

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadConfig', () => {
    it('should load config from ~/.jgbrc.json', async () => {
      const mockHomedir = '/Users/test'
      const mockConfig = { path: '/path/to/blog' }
      
      vi.mocked(homedir).mockReturnValue(mockHomedir)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig))

      const config = await loadConfig()

      expect(fs.readFile).toHaveBeenCalledWith('/Users/test/.jgbrc.json', 'utf8')
      expect(config).toEqual({ path: '/path/to/blog' })
    })

    it('should handle config file read errors', async () => {
      const mockHomedir = '/Users/test'
      
      vi.mocked(homedir).mockReturnValue(mockHomedir)
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      await expect(loadConfig()).rejects.toThrow('File not found')
    })

    it('should handle invalid JSON in config file', async () => {
      const mockHomedir = '/Users/test'
      
      vi.mocked(homedir).mockReturnValue(mockHomedir)
      vi.mocked(fs.readFile).mockResolvedValue('invalid json')

      await expect(loadConfig()).rejects.toThrow()
    })
  })
})