import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openEditor } from './new-post'
import { loadConfig } from '../config'
import { openInEditor } from '../lib/editor'
import confirm from '@inquirer/confirm'
import { writeFile } from 'fs/promises'
import matter from 'gray-matter'

// Mock dependencies
vi.mock('../config')
vi.mock('../lib/editor')
vi.mock('@inquirer/confirm')
vi.mock('fs/promises')
vi.mock('gray-matter')

const mockMatterFile = (data: Record<string, unknown>, content = 'Content') =>
  ({ data, content }) as ReturnType<typeof matter>

describe('new-post', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to prevent test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('openEditor', () => {
    it('should create a new post when user confirms save', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post\ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(openInEditor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: true })
      )
      vi.mocked(writeFile).mockResolvedValue()

      await openEditor('Test Post')

      expect(loadConfig).toHaveBeenCalled()
      expect(openInEditor).toHaveBeenCalledWith(
        expect.stringContaining('Test Post'),
        '.md'
      )
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Save post "Test Post"?',
        default: true
      }))
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_test-post.md'),
        mockPostContent,
        'utf8'
      )
    })

    it('should discard post when user declines save', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post\ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(openInEditor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(false)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: true })
      )

      await openEditor('Test Post')

      expect(loadConfig).toHaveBeenCalled()
      expect(openInEditor).toHaveBeenCalled()
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Save post "Test Post"?',
        default: true
      }))
      expect(writeFile).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Post discarded.')
    })

    it('should handle undefined title gracefully', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: \ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(openInEditor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: undefined, date: '2023-01-01T00:00:00Z', draft: true })
      )
      vi.mocked(writeFile).mockResolvedValue()

      await openEditor()

      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Save post "untitled"?',
        default: true
      }))
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_untitled.md'),
        mockPostContent,
        'utf8'
      )
    })

    it('should handle undefined date gracefully', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post\ndate: \ndraft: true\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(openInEditor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: undefined, draft: true })
      )
      vi.mocked(writeFile).mockResolvedValue()

      await openEditor('Test Post')

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^\/test\/blog\/build\/posts\/\d{4}-\d{2}-\d{2}_test-post\.md$/),
        mockPostContent,
        'utf8'
      )
    })

    it('should sanitize title for filename', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post! @#$%^&*()\ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(openInEditor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post! @#$%^&*()', date: '2023-01-01T00:00:00Z', draft: true })
      )
      vi.mocked(writeFile).mockResolvedValue()

      await openEditor()

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_test-post-.md'),
        mockPostContent,
        'utf8'
      )
    })
  })
})
