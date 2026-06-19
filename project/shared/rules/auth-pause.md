# Pause on Human Authentication

Automation never impersonates a human through an identity or liveness challenge. Pause and return control to the user for manual completion, then resume.

## Pause points

- Never automate a human-authentication step — 2FA/OTP, captcha, login challenge, device approval, biometric verification, or liveness check.
- Pause, wait for manual completion, then continue only after the challenge is resolved by the user.
- Treat an unexpected re-authentication request or anti-bot challenge during execution as a stop condition.
- Never attempt to solve, bypass, guess, brute-force, or work around an authentication or anti-automation challenge.
- A session that expires, is revoked, or becomes invalid during execution pauses for manual re-authentication.
- Never silently retry with stale, fabricated, or assumed credentials.
- Never request, store, display, or log OTP codes, recovery codes, authenticator secrets, backup codes, or similar authentication factors beyond the immediate manual authentication step.
- After manual authentication completes, verify the expected account, tenant, workspace, or destination before resuming automation.

## Credential handling

- Credential material (tokens, cookie jars, `.env` files, API keys, session files, certificates, secrets) is never staged or committed.
- Secret-handling requirements are defined in the git rules → Never commit and enforced by the `file-protect` hook.
- Read credentials from environment variables, a secret manager, or an ignored local store.
- Never inline credentials in source code, configuration files, logs, command arguments, prompts, plans, documentation, screenshots, or generated artifacts.
- Never print, echo, or expose credential values in terminal output, reports, or error messages.
- Use the minimum credential scope and permissions required for the task.
- Remove temporary credential files and session artifacts when they are no longer required.
