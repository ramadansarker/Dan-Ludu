# Ramadan Dev Security Specification

## Data Invariants
1. `users/{userId}` can only be read or written by the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`). No list queries allowed.
2. `users/{userId}` fields `uid` and `createdAt` are immutable after creation; `updatedAt` must equal `request.time`.
3. `friendProfiles/{userId}` contains zero PII (no email, phone, or IP) and list queries are restricted to `resource.data.isPublic == true`.
4. `transferCodes/{code}` disables `list` completely and requires exact document ID lookup (`6 <= code.size() <= 16`).

## Dirty Dozen Adversarial Payloads
1. Shadow field injection (`isAdmin: true` in `users/{uid}`) -> Rejected by `keys().hasOnly(...)`.
2. Unverified email spoof -> Rejected by `request.auth.token.email_verified == true`.
3. Cross-user read on `users/{otherUid}` -> Rejected by `request.auth.uid == userId`.
4. Cross-user `list` scrape on `users` -> Rejected by `allow list: if false`.
5. Oversized `displayName` (500 chars) -> Rejected by `displayName.size() <= 40`.
6. Negative coins (`coins: -100`) -> Rejected by `coins >= 0`.
7. Modifying immutable `createdAt` on update -> Rejected by `incoming().createdAt == existing().createdAt`.
8. Client-spoofed `updatedAt` timestamp -> Rejected by `incoming().updatedAt == request.time`.
9. Unbounded array injection (`unlockedThemes` length 100) -> Rejected by `size() <= 30`.
10. Document ID poisoning (`userId` with `$` or 200 chars) -> Rejected by `isValidId(userId)`.
11. Listing `transferCodes` collection -> Rejected by `allow list: if false`.
12. Deleting another user's `transferCodes` document -> Rejected by `existing().ownerUid == request.auth.uid`.
