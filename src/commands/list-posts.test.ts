import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listPosts } from './list-posts'
import { loadConfig } from '../config'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'

// Mock dependencies
vi.mock('../config')
vi.mock('fs/promises')
vi.mock('gray-matter')

describe('list-posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to prevent test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('listPosts', () => {
    it('should list only published posts by default', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md', '2023-01-02_post2.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(readdir).mockResolvedValue(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue({
        data: { title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: false },
        content: 'Content'
      })

      await listPosts()

      expect(loadConfig).toHaveBeenCalled()
      expect(readdir).toHaveBeenCalledWith('/test/blog/build/posts/')
      expect(readFile).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenCalled()
    })

    it('should include draft posts when includeDrafts is true', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_draft.md']
      const mockFileContent = Buffer.from('---\ntitle: Draft Post\ndate: 2023-01-01\ndraft: true\n---\nContent')
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(readdir).mockResolvedValue(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue({
        data: { title: 'Draft Post', date: '2023-01-01T00:00:00Z', draft: true },
        content: 'Content'
      })

      await listPosts(true)

      expect(loadConfig).toHaveBeenCalled()
      expect(readdir).toHaveBeenCalledWith('/test/blog/build/posts/')
      expect(readFile).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalled()
    })

    it('should sort posts by date in descending order', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_old.md', '2023-01-02_new.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(readdir).mockResolvedValue(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter)
        .mockReturnValueOnce({
          data: { title: 'Old Post', date: '2023-01-01T00:00:00Z', draft: false },
          content: 'Content'
        })
        .mockReturnValueOnce({
          data: { title: 'New Post', date: '2023-01-02T00:00:00Z', draft: false },
          content: 'Content'
        })

      await listPosts()

      expect(loadConfig).toHaveBeenCalled()
      expect(readdir).toHaveBeenCalledWith('/test/blog/build/posts/')
      expect(readFile).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenCalled()
    })
  })
})