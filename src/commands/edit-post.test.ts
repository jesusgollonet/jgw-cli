import { describe, it, expect, vi, beforeEach } from 'vitest'
import { editPost } from './edit-post'
import { getPosts, getPostByIndex } from './list-posts'
import select from '@inquirer/select'
import editor from '@inquirer/editor'
import confirm from '@inquirer/confirm'
import fs from 'fs/promises'

// Mock dependencies
vi.mock('./list-posts')
vi.mock('@inquirer/select')
vi.mock('@inquirer/editor')
vi.mock('@inquirer/confirm')
vi.mock('fs/promises')

describe('edit-post', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to prevent test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('editPost', () => {
    it('should show "No posts found" when no posts exist', async () => {
      vi.mocked(getPosts).mockResolvedValue([])

      await editPost()

      expect(getPosts).toHaveBeenCalledWith(false)
      expect(console.log).toHaveBeenCalledWith('No posts found.')
      expect(select).not.toHaveBeenCalled()
    })

    it('should show numbered list of posts for selection', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false },
        { fileName: 'post2.md', title: 'Second Post', date: '2023-01-02', draft: true }
      ]

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(null)

      await editPost()

      expect(select).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select post to edit:',
        choices: [
          { name: '1. First Post', value: 0 },
          { name: '2. Second Post [DRAFT]', value: 1 }
        ],
        pageSize: 10
      }))
    })

    it('should truncate long titles in selection list', async () => {
      const mockPosts = [
        {
          fileName: 'long-post.md',
          title: 'This is a very long title that should be truncated because it exceeds the limit',
          date: '2023-01-01',
          draft: false
        }
      ]

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(null)

      await editPost()

      expect(select).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select post to edit:',
        choices: [
          { name: '1. This is a very long title that should be trunca...', value: 0 }
        ],
        pageSize: 10
      }))
    })

    it('should handle error when post cannot be loaded', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(null)

      await editPost()

      expect(console.log).toHaveBeenCalledWith('Error: Could not load the selected post.')
      expect(editor).not.toHaveBeenCalled()
    })

    it('should open editor with existing content when post is selected', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]
      const mockPostWithContent = {
        ...mockPosts[0],
        content: '---\ntitle: First Post\n---\nContent',
        filePath: '/path/to/post1.md'
      }

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(mockPostWithContent)
      vi.mocked(editor).mockResolvedValue('---\ntitle: First Post\n---\nUpdated content')
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(fs.writeFile).mockResolvedValue()

      await editPost()

      expect(editor).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Edit post: First Post',
        default: '---\ntitle: First Post\n---\nContent',
        postfix: '.md'
      }))
    })

    it('should handle no changes made to content', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]
      const mockPostWithContent = {
        ...mockPosts[0],
        content: '---\ntitle: First Post\n---\nContent',
        filePath: '/path/to/post1.md'
      }

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(mockPostWithContent)
      vi.mocked(editor).mockResolvedValue('---\ntitle: First Post\n---\nContent')

      await editPost()

      expect(console.log).toHaveBeenCalledWith('No changes made.')
      expect(confirm).not.toHaveBeenCalled()
      expect(fs.writeFile).not.toHaveBeenCalled()
    })

    it('should save changes when user confirms', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]
      const mockPostWithContent = {
        ...mockPosts[0],
        content: '---\ntitle: First Post\n---\nContent',
        filePath: '/path/to/post1.md'
      }

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(mockPostWithContent)
      vi.mocked(editor).mockResolvedValue('---\ntitle: First Post\n---\nUpdated content')
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(fs.writeFile).mockResolvedValue()

      await editPost()

      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Save changes to "First Post"?',
        default: true
      }))
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/post1.md',
        '---\ntitle: First Post\n---\nUpdated content',
        'utf-8'
      )
      expect(console.log).toHaveBeenCalledWith('Post updated: /path/to/post1.md')
    })

    it('should discard changes when user declines', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]
      const mockPostWithContent = {
        ...mockPosts[0],
        content: '---\ntitle: First Post\n---\nContent',
        filePath: '/path/to/post1.md'
      }

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(mockPostWithContent)
      vi.mocked(editor).mockResolvedValue('---\ntitle: First Post\n---\nUpdated content')
      vi.mocked(confirm).mockResolvedValue(false)

      await editPost()

      expect(console.log).toHaveBeenCalledWith('Changes discarded.')
      expect(fs.writeFile).not.toHaveBeenCalled()
    })

    it('should handle file write errors', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: false }
      ]
      const mockPostWithContent = {
        ...mockPosts[0],
        content: '---\ntitle: First Post\n---\nContent',
        filePath: '/path/to/post1.md'
      }

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(mockPostWithContent)
      vi.mocked(editor).mockResolvedValue('---\ntitle: First Post\n---\nUpdated content')
      vi.mocked(confirm).mockResolvedValue(true)
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'))

      await editPost()

      expect(console.error).toHaveBeenCalledWith('Error saving post: Error: Write failed')
    })

    it('should include drafts when includeDrafts is true', async () => {
      const mockPosts = [
        { fileName: 'post1.md', title: 'First Post', date: '2023-01-01', draft: true }
      ]

      vi.mocked(getPosts).mockResolvedValue(mockPosts)
      vi.mocked(select).mockResolvedValue(0)
      vi.mocked(getPostByIndex).mockResolvedValue(null)

      await editPost(true)

      expect(getPosts).toHaveBeenCalledWith(true)
      expect(getPostByIndex).toHaveBeenCalledWith(0, true)
    })
  })
})
