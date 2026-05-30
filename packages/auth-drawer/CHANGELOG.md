# Changelog

All notable changes to `@remcostoeten/auth-drawer` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.1

### Fixed

- `custom-jwt` and `passport` adapters now refresh their session immediately
  after `signIn`/`signUp`/`signOut` instead of staying stale until a page
  reload. Both adapters previously read the session once on mount; they now
  re-fetch when notified and when the tab regains focus, matching the live
  behavior of the SDK-backed adapters (Better Auth, Supabase, Firebase, …).

### Internal

- Added a shared `createRevalidatingSession` helper that pairs a `useSession`
  hook with a `notifySession` trigger, used by the REST adapters above.

## 0.2.0

### Added

- Export `useOptionalAuth` from the package entry point, so consumers can read
  auth state from components that may render outside an `AuthProvider`.
- Unit tests for the `mock`, `better-auth`, `supabase`, and `custom-jwt`
  adapters covering happy paths, token persistence, and provider error mapping.

### Changed

- Hardened `AuthProvider`: provider errors are normalized through the adapter
  and unavailable actions (e.g. a missing `signOut`) fail with a clear error
  instead of throwing.
- `demoCredentials` is now part of the public `AuthAdapter` type.

### Notes

- The `0.1.0` tag on npm was published from a state preceding the provider
  hardening above. `0.2.0` is the first release to include it.

## 0.1.0

- Initial public release: configurable auth drawer/modal with OAuth, triggers,
  motion, and typed provider adapters (Better Auth, Supabase, Clerk, NextAuth,
  Firebase, custom JWT/REST, Passport, and a mock adapter).
