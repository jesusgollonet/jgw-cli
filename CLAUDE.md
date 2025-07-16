# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript CLI tool called "jgw" for managing blog posts. It provides commands to create new posts and list existing posts, with support for draft/published states.

## Development Commands

### Build and Development
```bash
# Install dependencies
bun install

# Run in development mode (direct TypeScript execution)
bun run dev

# Build TypeScript to JavaScript (outputs to ./bin directory)
bun run build

# Create single executable binary
bun run compile

# Link globally to use `jgw` command system-wide
bun run install-global
```

### Running the CLI
```bash
# Direct TypeScript execution (no compilation needed)
bun run dev post new --title "Post Title"
./src/index.ts post new --title "Post Title"

# List published posts
bun run dev post list

# List all posts including drafts
bun run dev post list --all
```

## Architecture

### Core Structure
- `src/index.ts` - Main CLI entry point using yargs for command parsing
- `src/commands/` - Command implementations
  - `new-post.ts` - Creates new blog posts using interactive editor
  - `list-posts.ts` - Lists and displays existing posts
- `src/config.ts` - Configuration loading from `~/.jgbrc.json`
- `src/lib/` - Utility functions

### Key Dependencies
- **Bun** - JavaScript runtime with native TypeScript support
- **yargs** - CLI argument parsing and command structure
- **@inquirer/editor** - Interactive editor for post creation
- **gray-matter** - Frontmatter parsing for markdown files
- **TypeScript** - Primary language with strict mode enabled

### Configuration
The CLI requires a `~/.jgbrc.json` file with the following structure:
```json
{
  "path": "/path/to/blog/directory"
}
```

Posts are stored in `{config.path}/build/posts/` directory with frontmatter containing title, date, and draft status.

### Post File Format
Posts use markdown with YAML frontmatter:
```markdown
---
title: 'Post Title'
date: '2023-01-01T00:00:00.000Z'
draft: true
---

Post content here...
```

File naming convention: `YYYY-MM-DD_post-title.md`

## Build Configuration

- Bun provides native TypeScript support - no compilation needed for development
- TypeScript compiles to `./bin` directory when using `bun run build`
- Target: ES2022 with Node.js module resolution
- Executable entry point: `./bin/index.js` (compiled) or `./src/index.ts` (direct execution)
- Single executable binary can be created with `bun run compile`