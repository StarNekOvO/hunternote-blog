# GitHub Copilot Instructions for hunternote

This repository is a personal security research blog built with **VitePress**. It focuses on CTF writeups, CVE reproductions, and system security notes.

## Project Architecture
- **Framework**: VitePress 1.x
- **Content Root**: `docs/`
- **Configuration**: `docs/.vitepress/config.ts`
- **Static Assets**: `docs/public/` (referenced as `/` in Markdown)
- **Primary Language**: Chinese (`zh-CN`)

## Content Structure
- `docs/ctfs/`: Writeups for CTF platforms (BUUCTF, CTFshow, NSSCTF).
- `docs/labs/`: Writeups for lab platforms (HTB, pwn.college).
- `docs/cves/`: CVE analysis and reproduction.
- `docs/notes/`: General security research notes (e.g., Android).

## Critical Workflows
- **Development**: `npm run dev` to start the local preview server.
- **Build**: `npm run build` to generate the static site in `docs/.vitepress/dist`.
- **Adding Content**:
    1. Create a `.md` file in the appropriate subdirectory under `docs/`.
    2. **Crucial**: Update `getSidebar()` in `docs/.vitepress/config.ts` to include the new file in the sidebar navigation.
    3. **Crucial**: Update `docs/sitemap/index.md` and `public/sitemap.xml` to maintain the manual sitemap.
    4. If adding images, place them in `docs/public/img/` and reference them as `![alt](/img/filename.png)`.

## Coding Conventions & Patterns
- **Markdown**: Use standard Markdown. VitePress features like custom containers (`::: info`) are encouraged.
- **Sidebar**: Maintain the hierarchical structure in `docs/.vitepress/config.ts`. Use `collapsed: false` for active sections.
- **Links Page**: `docs/links/index.md` uses a custom HTML structure for the friends list. Follow the `<div class="friend-item">` pattern when adding new links.
- **Internal Links**: Use root-relative links (e.g., `/notes/android/android-evolution`) for internal navigation.
- **Images**: Always use the `/img/` prefix for images stored in `docs/public/img/`.

## Example: Adding a new CTF Writeup
1. Create `docs/ctfs/new-platform/challenge.md`.
2. Update `docs/.vitepress/config.ts`:
```typescript
{
  text: 'New Platform',
  link: '/ctfs/new-platform/',
  items: [
    { text: 'Challenge Name', link: '/ctfs/new-platform/challenge' }
  ]
}
```
