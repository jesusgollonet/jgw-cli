import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chmod, mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { openInEditor } from './editor'

describe('editor', () => {
  let testDirectory: string
  let originalEditor: string | undefined
  let originalVisual: string | undefined

  beforeEach(async () => {
    testDirectory = await mkdtemp(path.join(tmpdir(), 'jgw-editor-test-'))
    originalEditor = process.env.EDITOR
    originalVisual = process.env.VISUAL
    delete process.env.VISUAL
  })

  afterEach(async () => {
    if (originalEditor === undefined) {
      delete process.env.EDITOR
    } else {
      process.env.EDITOR = originalEditor
    }

    if (originalVisual === undefined) {
      delete process.env.VISUAL
    } else {
      process.env.VISUAL = originalVisual
    }

    await rm(testDirectory, { recursive: true, force: true })
  })

  it('reads edited markdown back as utf8', async () => {
    const editorPath = path.join(testDirectory, 'editor.sh')
    const editedContent = `---
title: 'café'
date: '2026-05-29T16:00:00.000Z'
draft: true
---
`

    await writeFile(
      editorPath,
      `#!/bin/sh
cat > "$1" <<'EOF'
${editedContent}EOF
`,
      'utf8',
    )
    await chmod(editorPath, 0o755)
    process.env.EDITOR = editorPath

    await expect(openInEditor('initial content', '.md')).resolves.toBe(
      editedContent,
    )
  })
})
