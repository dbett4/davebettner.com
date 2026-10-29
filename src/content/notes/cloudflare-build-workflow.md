---
title: How I ship this site with Cloudflare
description: The roles of Astro, Cloudflare Workers, Wrangler, AI coding tools, and browser checks in publishing this site.
date: '2026-10-28'
project: ai-workflows
draft: false
---
This site is one example of how I build with Cloudflare and AI coding tools. I use Astro to generate the pages, Cloudflare Workers to serve the static files, and Wrangler to deploy them. The source and release history live in [GitHub](https://github.com/dbett4/davebettner.com).

## Start with the page someone needs

The site needs to explain my work, show the products, and give people a way to follow what I am building. Most of that is text, screenshots, and links. Astro turns that content into HTML during the build, so the project pages and notes are readable without JavaScript.

The interactive workflow lesson uses JavaScript for its controls. Its explanation stays in the page when scripts are unavailable. I want the information to remain useful even when an interaction cannot run.

## Give each tool a job

Cloudflare Workers serves the built site on my own domain. This deployment uses Workers' static asset hosting. It does not need an application server to generate each page when someone visits.

Wrangler is the deployment interface. My release script checks that the source is committed, pushed, and in a clean release checkout before it uploads the build. That connects a visible release to a specific source revision.

Codex and Claude help with implementation, reviewing changes, and working through failures. I set the direction and acceptance criteria, inspect the result, and decide whether it meets the requirement. Their output goes through the same build and browser checks as the rest of the site.

I work with those agents in T3 Code, whose backend runs on my Linux VPS alongside the repositories and development tools. Hermes handles ongoing agent coordination there. The [operating stack note](/notes/operating-stack/) explains how that environment fits together; Cloudflare serves the published website.

## Check what a visitor actually gets

The build checks the Astro components and generates the pages. Playwright then opens the built site at desktop and phone widths. The checks cover navigation, internal destinations, the résumé download, no-JavaScript behavior, and the homepage media. Axe checks accessibility rules alongside the browser tests.

For build notes, the checks also compare the Notes index with RSS and follow the links through to the complete articles. Both read the same Markdown collection, so a published note appears in each place without maintaining separate lists.

After deployment, I open the live pages, follow the changed links, and inspect screenshots. A successful upload establishes that a release was published. The live walkthrough checks that the visitor can reach and use it.

## Match the stack to the product

This site uses Astro because its main job is publishing readable pages. [Homebase](/work/homebase/) has a React and TypeScript interface for business records, content, and agent work. [Passal](https://passal.app/) uses Next.js for its study application.

The tools support different workflows. I am sharing the choices and checks in these [build notes](/notes/) as I develop the products, with [Homebase as my current focus](/now/).
