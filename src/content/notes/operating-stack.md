---
title: My operating stack with T3 and a VPS
description: How T3’s backend, hosted models, SQLite, Git worktrees, Hermes, and repository memory fit together, with a site release as a working example.
date: '2026-10-28'
project: ai-workflows
draft: false
---
I work with Codex and Claude through T3 Code, with the backend running on a Linux VPS at Netcup. The server holds the repositories and runs the development tools. Hermes coordinates ongoing agent work there, and Cloudflare Workers publishes this site. This is my setup as of October 28, 2026.

I keep each kind of state in a place I can inspect later. T3 keeps the coding session, Git keeps the source history, and repository files keep project decisions. A task also needs evidence from the application it changed. That gives the next session a way to check what shipped.

## T3’s workspace and backend

T3 gives me a workspace for projects and agent threads. I use it to set a task, inspect a diff, run commands, and work through the result with a coding agent. The backend connects the thread to its configured provider runtime and working directory.

Project and thread state lives in SQLite on the VPS. The stored records include the project’s workspace root, a thread’s branch and worktree path, model selection, and provider session state. The source files themselves live in the Git checkout. Returning to a thread gives me its session context and the associated working tree to inspect.

The T3 server runs under systemd, with a restart policy and service logs. That manages the application process. After an interruption, the next step is still to inspect the working tree and any external changes before continuing the task.

## Model routing and tool execution

My Codex and Claude entries use provider wrappers connected to a private proxy over Tailscale. The wrappers launch the corresponding coding clients and route their model requests through that configured connection. T3 tracks the provider session attached to the thread.

The VPS runs the clients and development tools; model inference happens through the hosted providers. When an agent runs a build, edits a file, or opens a test browser, those operations happen in the server environment. The model connection and the place where a command executes are separate parts of the setup.

I own product direction and acceptance criteria. The models contribute implementation, analysis, and review. A proposed fix still has to survive the project’s checks and an inspection of the result.

## What the VPS holds

The Linux VPS at Netcup holds the active repositories, isolated Git worktrees, command-line tools, and browser automation. It also runs T3’s backend and the Hermes runtime. My laptop is the interface and control terminal for this environment.

A worktree gives a task its own checkout and branch. Separate tasks can make changes without sharing one dirty checkout. Each change can be inspected and tested before it reaches the main branch. The assignment also needs a defined scope so two tasks do not independently change the same area.

This puts the files and execution environment in one place I can return to from another session. It also creates a dependency on the VPS and its services. A failed provider connection, stopped process, and failed test are different problems; service logs and application checks help identify which one occurred.

## Hermes handles ongoing coordination

Hermes is the agent runtime I use for ongoing coordination and scheduled work. It runs on the VPS alongside the development environment. T3 is where I work through coding tasks; Hermes gives recurring work and cross-session coordination their own runtime.

The operating rules assign an owner, scope, and completion condition to a task. A handoff should identify the source revision, what changed, which checks passed, and what remains unresolved. A later session can use that record to decide where to resume.

I keep coordination proportional to the work. A small site edit can stay with one coding agent through implementation, tests, deployment, and live verification. Splitting the same edit across several agents would add handoffs without necessarily improving the result.

## Memory, skills, and current state

Project decisions and operating instructions live in repository files. Reusable skills capture a procedure, such as the supported deployment route or how to verify a particular application. Keeping them in files makes them available to the next session and lets changes be reviewed in Git.

Memory is a starting point for finding the right source. Before editing, an agent still needs to inspect the current checkout or application. A note that says a release succeeded last week cannot establish which revision is live today.

That is also why I separate a proposal from an outcome. The proposal describes what should change and the result I expect. The completion record should point to what actually changed. My note on [carrying project context between sessions](/notes/project-context/) explains the information I want the next owner to recover.

## A working example: updating this site

This site uses Astro for the pages, Markdown for the build notes, GitHub for source history, and Cloudflare Workers for static asset hosting. Wrangler is the deployment interface.

A request to explain my stack starts in a T3 thread. The coding agent checks the existing content and the relevant setup, then edits the site in its Git worktree on the VPS. For this note, that meant checking the T3 service, provider configuration, and database schema.

The build generates the pages. Playwright opens them at desktop and phone sizes, follows the changed links, and checks the no-JavaScript reading experience. Axe checks accessibility rules. Notes and RSS read from the same Markdown collection, and the tests compare their article lists.

After the checks pass, the change is committed and pushed. A separate release checkout must be clean and match the main branch before Wrangler can deploy it. The release is then checked on the public domain: do the pages match the tested build, and do the links reach the intended content?

The VPS runs this development and release process. Cloudflare serves the resulting public website. The [Cloudflare build note](/notes/cloudflare-build-workflow/) covers the publishing choices in more detail.

## Recovery starts with what was saved

An agent can lose a response after an operation succeeds. Retrying immediately can duplicate a change. The useful next action is to inspect the destination: check the commit, deployed revision, or saved application record before deciding what to repeat.

I built an [interactive inventory example](/learn/verify-an-ai-update/) to make that failure visible. It shows an accepted update whose response is lost, followed by a readback of the saved state. The example uses fictional data and runs locally in the browser.

## How this connects to Homebase

[Homebase](/work/homebase/) is my main product project. It brings business records, projects, content, and agent assignments into a workspace where an owner can see what needs attention and review the result. Its agent execution and external integrations are still being developed and verified.

The operating stack supports the development work. In Homebase, I am building the business context around an assignment: what was promised, which inputs matter, who can decide, and what reached its destination. Those are the questions behind [building Homebase around a promise](/notes/homebase-promises/).

The next test for that product is a complete service cycle, with the commitment connected to review and delivery. I’m using the [Now page](/now/) to keep the current focus visible as I work through those integrations.
