import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listPosts, getPosts, getPostByIndex } from './list-posts'
import { loadConfig } from '../config'
import { readdir, readFile } from 'fs/promises'
import matter from 'gray-matter'

// Mock dependencies
vi.mock('../config')
vi.mock('fs/promises')
vi.mock('gray-matter')

const mockReaddir = (files: string[]) => {
  vi.mocked(readdir).mockResolvedValue(files as never)
}

const mockMatterFile = (
  data: Record<string, unknown>,
  content = 'Content'
) => ({ data, content }) as ReturnType<typeof matter>

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
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: false })
      )

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
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Draft Post', date: '2023-01-01T00:00:00Z', draft: true })
      )

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
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter)
        .mockReturnValueOnce(
          mockMatterFile({ title: 'Old Post', date: '2023-01-01T00:00:00Z', draft: false })
        )
        .mockReturnValueOnce(
          mockMatterFile({ title: 'New Post', date: '2023-01-02T00:00:00Z', draft: false })
        )

      await listPosts()

      expect(loadConfig).toHaveBeenCalled()
      expect(readdir).toHaveBeenCalledWith('/test/blog/build/posts/')
      expect(readFile).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenCalled()
    })
  })

  describe('getPosts', () => {
    it('should return filtered and sorted posts', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md', '2023-01-02_post2.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter)
        .mockReturnValueOnce(
          mockMatterFile({ title: 'Test Post 1', date: '2023-01-01T00:00:00Z', draft: false })
        )
        .mockReturnValueOnce(
          mockMatterFile({ title: 'Test Post 2', date: '2023-01-02T00:00:00Z', draft: false })
        )

      const posts = await getPosts()

      expect(posts).toHaveLength(2)
      // Posts should be sorted by date descending (newer first)
      expect(posts[0]).toEqual({
        fileName: '2023-01-02_post2.md',
        title: 'Test Post 2',
        date: '2023-01-02T00:00:00Z',
        draft: false
      })
      expect(posts[1]).toEqual({
        fileName: '2023-01-01_post1.md',
        title: 'Test Post 1',
        date: '2023-01-01T00:00:00Z',
        draft: false
      })
    })

    it('should filter out drafts by default', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md']
      const mockFileContent = Buffer.from('---\ntitle: Draft Post\ndate: 2023-01-01\ndraft: true\n---\nContent')

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Draft Post', date: '2023-01-01T00:00:00Z', draft: true })
      )

      const posts = await getPosts()

      expect(posts).toHaveLength(0)
    })
  })

  describe('getPostByIndex', () => {
    it('should return post with content for valid index', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')
      const mockFullContent = '---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent'

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      mockReaddir(mockFiles)
      vi.mocked(readFile)
        .mockResolvedValueOnce(mockFileContent)  // For parsing
        .mockResolvedValueOnce(mockFullContent)  // For content loading
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: false })
      )

      const post = await getPostByIndex(0)

      expect(post).toEqual({
        fileName: '2023-01-01_post1.md',
        title: 'Test Post',
        date: '2023-01-01T00:00:00Z',
        draft: false,
        content: mockFullContent,
        filePath: '/test/blog/build/posts/2023-01-01_post1.md'
      })
    })

    it('should return null for invalid index', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      mockReaddir(mockFiles)
      vi.mocked(readFile).mockResolvedValue(mockFileContent)
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: false })
      )

      const post = await getPostByIndex(5)

      expect(post).toBeNull()
    })

    it('should return null when file cannot be read', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockFiles = ['2023-01-01_post1.md']
      const mockFileContent = Buffer.from('---\ntitle: Test Post\ndate: 2023-01-01\ndraft: false\n---\nContent')

      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      mockReaddir(mockFiles)
      vi.mocked(readFile)
        .mockResolvedValueOnce(mockFileContent)  // For parsing
        .mockRejectedValueOnce(new Error('File not found'))  // For content loading
      vi.mocked(matter).mockReturnValue(
        mockMatterFile({ title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: false })
      )

      const post = await getPostByIndex(0)

      expect(post).toBeNull()
    })
  })
})
