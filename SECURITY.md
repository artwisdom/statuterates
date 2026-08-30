# Security Policy

## Supported code

Security fixes are applied to the current `main` branch. Old commits, local forks, and copied data
exports are not maintained as separate supported versions.

## Report a vulnerability privately

Please do not disclose an exploitable vulnerability, credential, token, or private user information
in a public issue.

The preferred private channel is a GitHub Security Advisory. Maintainers can create a draft advisory
here:

https://github.com/artwisdom/statuterates/security/advisories/new

Outside reporters should use the repository's **Security** tab and select **Report a vulnerability**
when GitHub shows that option.

Include the affected file or endpoint, impact, reproduction steps, and any safe proof of concept. Do
not include real credentials or personal data.

If GitHub does not show the private-reporting option, private vulnerability reporting is not enabled.
Open a minimal public issue asking the maintainer to enable a private reporting channel, without
including vulnerability details.

## What belongs here

- Vulnerabilities in the website, API, MCP server, pipeline, or GitHub Actions workflows
- Dependency vulnerabilities with a plausible impact on this repository
- A way to bypass validation and publish unvalidated or materially altered rate data
- Credential exposure or unsafe write access

Legal-rate corrections, source updates, general bugs, and feature requests are important, but they
are not security reports unless they also create a security or integrity vulnerability.

## Coordinated disclosure

The maintainer will triage reports in GitHub's private advisory, confirm the affected scope, and
coordinate a fix and disclosure there. Please allow time for investigation before public disclosure.
