# Project Overview

This is a personal blog/website built using [Hugo](https://gohugo.io/), a fast and modern static site generator written in Go.

## Project Structure

```
.
├── archetypes/        # Template files for new content
├── assets/           # Unprocessed assets (SCSS, JS, etc.)
├── content/         # Main content directory (markdown files)
│   └── posts/      # Blog posts
├── data/           # Configuration files and data for templates
├── layouts/        # Template files
├── static/         # Static files (images, CSS, JS)
├── themes/         # Theme files
├── public/         # Generated static site (output)
└── hugo.toml       # Hugo configuration file
```

## Main Components

1. **Content**: All blog posts and pages are written in Markdown format and stored in the `content` directory.
2. **Theme**: The site uses Hugo themes for styling and layout.
3. **Static Assets**: Images, CSS, and JavaScript files are stored in the `static` directory.
4. **Configuration**: Site settings are managed through `hugo.toml`.

## Development

### Prerequisites
- [Hugo](https://gohugo.io/installation/) installed on your machine

### Local Development
1. Clone the repository
2. Run the development server:
   ```bash
   hugo server -D
   ```
   This will start a local server at `http://localhost:1313/`

### Building
To build the site for production:
```bash
hugo
```
The output will be in the `public/` directory.

## Deployment
The site is deployed to GitHub Pages. The deployment process is automated through GitHub Actions workflows in the `.github` directory.

## Writing Content
New blog posts can be created using Hugo's built-in commands:
```bash
hugo new content/posts/my-new-post.md
```

## Best Practices
1. Always include front matter in Markdown files
2. Optimize images before adding them to the repository
3. Test changes locally before pushing
4. Follow the established content structure
5. Use meaningful commit messages