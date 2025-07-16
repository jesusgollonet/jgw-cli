import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openEditor } from './new-post'
import { loadConfig } from '../config'
import editor from '@inquirer/editor'
import confirm from '@inquirer/confirm'
import fs from 'fs'
import matter from 'gray-matter'

// Mock dependencies
vi.mock('../config')
vi.mock('@inquirer/editor')
vi.mock('@inquirer/confirm')
vi.mock('fs')
vi.mock('gray-matter')

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
      const mockParsedPost = {
        data: { title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: true },
        content: 'Content'
      }
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(editor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(mockParsedPost)
      vi.mocked(fs.writeFile).mockImplementation((path, content, callback) => {
        callback(null)
      })

      await openEditor('Test Post')

      expect(loadConfig).toHaveBeenCalled()
      expect(editor).toHaveBeenCalledWith({
        message: 'Create a new post',
        default: expect.stringContaining('Test Post'),
        postfix: '.md'
      })
      expect(confirm).toHaveBeenCalledWith({
        message: 'Save post "Test Post"?',
        default: true
      })
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_test-post.md'),
        mockPostContent,
        expect.any(Function)
      )
    })

    it('should discard post when user declines save', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post\ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'
      const mockParsedPost = {
        data: { title: 'Test Post', date: '2023-01-01T00:00:00Z', draft: true },
        content: 'Content'
      }
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(editor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(false)
      vi.mocked(matter).mockReturnValue(mockParsedPost)

      await openEditor('Test Post')

      expect(loadConfig).toHaveBeenCalled()
      expect(editor).toHaveBeenCalled()
      expect(confirm).toHaveBeenCalledWith({
        message: 'Save post "Test Post"?',
        default: true
      })
      expect(fs.writeFile).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Post discarded.')
    })

    it('should handle undefined title gracefully', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: \ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'
      const mockParsedPost = {
        data: { title: undefined, date: '2023-01-01T00:00:00Z', draft: true },
        content: 'Content'
      }
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(editor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(mockParsedPost)
      vi.mocked(fs.writeFile).mockImplementation((path, content, callback) => {
        callback(null)
      })

      await openEditor()

      expect(confirm).toHaveBeenCalledWith({
        message: 'Save post "untitled"?',
        default: true
      })
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_untitled.md'),
        mockPostContent,
        expect.any(Function)
      )
    })

    it('should handle undefined date gracefully', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post\ndate: \ndraft: true\n---\nContent'
      const mockParsedPost = {
        data: { title: 'Test Post', date: undefined, draft: true },
        content: 'Content'
      }
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(editor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(mockParsedPost)
      vi.mocked(fs.writeFile).mockImplementation((path, content, callback) => {
        callback(null)
      })

      await openEditor('Test Post')

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/^\/test\/blog\/build\/posts\/\d{4}-\d{2}-\d{2}_test-post\.md$/),
        mockPostContent,
        expect.any(Function)
      )
    })

    it('should sanitize title for filename', async () => {
      const mockConfig = { path: '/test/blog' }
      const mockPostContent = '---\ntitle: Test Post! @#$%^&*()\ndate: 2023-01-01T00:00:00Z\ndraft: true\n---\nContent'
      const mockParsedPost = {
        data: { title: 'Test Post! @#$%^&*()', date: '2023-01-01T00:00:00Z', draft: true },
        content: 'Content'
      }
      
      vi.mocked(loadConfig).mockResolvedValue(mockConfig)
      vi.mocked(editor).mockResolvedValue(mockPostContent)
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(matter).mockReturnValue(mockParsedPost)
      vi.mocked(fs.writeFile).mockImplementation((path, content, callback) => {
        callback(null)
      })

      await openEditor()

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01_test-post-.md'),
        mockPostContent,
        expect.any(Function)
      )
    })
  })
})