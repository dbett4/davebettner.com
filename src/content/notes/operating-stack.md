---
title: My operating stack with T3 and a VPS
description: How I use T3 Code, a Linux VPS, Codex, Claude, Hermes, and repository memory to build and carry work between sessions.
date: '2026-10-28'
project: ai-workflows
draft: false
---
I work with Codex and Claude through T3 Code, with the backend running on a Linux VPS at Netcup. The server holds the repositories and runs the development tools. Hermes coordinates ongoing agent work there, and Cloudflare Workers publishes this site.

## T3 is where I work with coding agents

T3 gives me a workspace for projects and agent threads. I use it to set the task, inspect changes, run commands, and work through the result with a coding agent. Its backend connects those sessions to the configured provider runtimes.

The models help with implementation, analysis, and review. I own product direction and acceptance criteria, and I check whether the result meets the requirement. A useful session ends with a working change and evidence from the application or its tests.

## The backend runs on my VPS

T3’s server runs as a systemd service on the VPS and stores project and thread state in SQLite. The same machine holds the active repositories, isolated Git worktrees, command-line tools, and browser automation used for development and verification. My laptop is the interface and control terminal; the project work executes on the server.

A worktree gives a task its own checkout and branch. Changes from separate tasks can be tested before they reach the main branch. Keeping the backend and those files on the VPS lets me return to the same working environment from another session.

## Hermes and repository memory carry work forward

Hermes is the agent runtime I use for ongoing coordination and scheduled work on the VPS. T3 gives me the coding workspace; Hermes provides a separate route for work that needs to continue across sessions.

I keep project decisions, operating instructions, and reusable skills in repository files. Those files give the next session a place to recover the requirements and prior corrections. Agents still need to inspect the current source and application state before changing them.

The operating rules assign an owner and scope to the work, define what completion means, and require a way to check the result. For code, that includes tests and inspecting the rendered application. For an external update, it includes reading back what the application actually saved.

## Homebase connects the work to business operations

[Homebase](/work/homebase/) is my main product project. It brings business records, projects, content, and agent assignments into a workspace where an owner can see what needs attention and review the result. Its agent execution and external integrations are still being developed and verified.

T3, Hermes, and the VPS are tools I use to build and operate my projects. Homebase is where I am developing the business workflows those tools support.

## Cloudflare publishes this site

This website uses Astro to build readable pages, GitHub for source history, and Wrangler to deploy static assets to Cloudflare Workers. The coding environment runs on the VPS, while visitors receive the published site from Cloudflare.

I check the local build, deploy the committed revision, and follow the changed paths on the live site. The [Cloudflare build note](/notes/cloudflare-build-workflow/) covers that release process. I’ll keep sharing the operating choices and lessons in [build notes](/notes/).
