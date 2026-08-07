# Database Structure

## Collections

### `users`
**Schemas/Key Fields:**
- `email`, `name`, `password` (hashed)
- `role` (enum: user, admin)
- `plan` (enum: free, pro)
- `stripeCustomerId`, `stripeSubscriptionId`
**Relationships:** 1:1 with `InstagramAccount`, 1:N with `Automation`, `Lead`.

### `instagramaccounts`
**Schemas/Key Fields:**
- `userId` (ObjectId referencing `users`)
- `instagramId`, `username`, `profilePictureUrl`
- `accessToken` (long-lived Meta token)
- `pageId` (connected Facebook Page ID)
**Relationships:** Crucial for verifying true Instagram connection status on the backend.

### `automations` (Campaigns)
**Schemas/Key Fields:**
- `userId` (ObjectId referencing `users`)
- `name`, `type` (comment, dm)
- `triggerKeywords` (Array of strings)
- `replyText` (String)
- `isActive` (Boolean)

### `leads`
**Schemas/Key Fields:**
- `userId` (ObjectId referencing `users`)
- `instagramId` (of the user who engaged)
- `username`
- `capturedAt`

### `messages`
**Schemas/Key Fields:**
- `userId`
- `to` (recipient username)
- `content`
- `sentAt`
- `status` (success, failed)
