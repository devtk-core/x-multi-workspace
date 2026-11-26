# Security review for Issue #1

Status: review branch; not a public release. This review covers the source and build configuration in this branch. It does not establish that the application is free of vulnerabilities.

| Severity | Area | Condition and impact | Change or disposition | Verification |
| --- | --- | --- | --- | --- |
| High potential (unconfirmed) | Navigation and IPC, `src/main/main.ts:77`, `src/main/main.ts:239` | If the management window ever displayed another page, its preload API could be exposed to that page. | Restrict the main frame to the exact local UI URL; require that URL as well as the existing WebContents/mainFrame checks for IPC. | URL tests and typecheck; packaged UI acceptance test remains pending. |
| Medium | X view navigation, `src/main/main.ts:110` | A redirect was outside the original `will-navigate` check. | Check main-frame navigations and redirects; open selected external HTTPS links in the default browser, but block external redirects. | Navigation decision tests. |
| Medium | URL boundaries, `src/shared/model.ts:45` | Non-default ports or URL user information were previously accepted on an otherwise allowed X host. | Require HTTPS, an allowed hostname, the default port, and no URL user information. | Adversarial URL tests. |
| Low | Permissions and packaging, `src/main/main.ts:104`, `package.json:39` | Permission checks and optional Electron runtime features were not explicitly restricted. | Deny permission checks; disable unused Node runtime/inspector fuses and require the packaged ASAR with integrity validation. Cookie encryption is deferred pending a migration and rollback test with dummy sessions. | Typecheck, tests, Windows build, and fuse-wire inspection. |
| Medium (build tooling) | Development dependencies | `npm audit` reports six moderate transitive advisories in electron-builder's dependency graph. | Keep the current builder version; npm's proposed fix is a major downgrade. Dependabot and a scheduled audit will surface updates. | Full audit: 0 Critical, 0 High, 6 Moderate. Production-only audit: 0 findings. |
| Low | Manual update check, `src/main/main.ts:24`, `src/shared/updates.ts:1` | Release metadata is remote input, and a check necessarily contacts GitHub. | Contact a fixed GitHub API endpoint only on user request, omit credentials, limit response size, compare validated stable version tags, and open only a fixed Releases URL in the system browser. | Version and malformed-response tests; private-repository and network behavior need app acceptance testing. |

## Checks and limits

- Typecheck and 15 unit tests passed locally. The Windows installer and portable targets built successfully with the new fuses before the update-check UI was added; the final UI and main code passed a production build. The final Windows packaging reached NSIS but this sandbox could not start its helper executable. The Windows CI job will provide the release-target build result. An interactive UI check also remains pending. The earlier packaged app process started with an empty isolated profile. SHA-256 checksums are generated in CI.
- A dummy-cookie Electron test was added for partition separation, restart persistence, and deletion. Its local run was blocked by the restricted GUI-process environment and could not be retried outside the sandbox after automatic approval review reached a usage limit. The Windows CI build job now runs it; the first result is pending.
- The production management UI CSP no longer permits connections to the development server. Development mode adds its local Vite endpoints only while serving.
- Dependabot, recurring dependency checks, and a full-history Gitleaks workflow are configured. Their first GitHub Actions run must be checked before calling them verified.
- CodeQL upload is not configured while this is a private personal repository: GitHub's current code scanning eligibility lists public repositories and qualifying organization repositories. Reassess if repository visibility or plan changes.
- X subframes remain under Chromium web security and sandboxing, because the official X page may embed third-party content. Main-frame navigation is restricted.
- The existing WebRTC settings were retained. They avoided the firewall prompt in one user's v1.1.3 trial, but privacy and X Spaces behavior have not been validated across clean Windows systems.
- Actual X login, posting, attachments, clipboard, session migration, session deletion on disk, and clean-machine behavior require manual acceptance checks using dummy accounts. No production credentials were used for this review.
- The unsigned v1.1.3 release was not replaced. A new release requires its own version, CI run, and acceptance test.
- The experimental binaries built on this branch were moved to the ignored `work/issue-1-unreleased/` directory so they are not mistaken for the existing v1.1.3 release. The executables are unsigned; code signing remains a public-distribution decision.

References: [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security), [Electron navigation events](https://www.electronjs.org/docs/latest/api/web-contents), [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), [GitHub CodeQL eligibility](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning).
