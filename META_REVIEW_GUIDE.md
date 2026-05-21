# DMOrbit Meta App Review - Reviewer Guide

## 🎯 App Purpose
DMOrbit is an engagement automation platform designed for Creators and Small Businesses. It helps creators manage their community by automatically responding to comments with helpful links or information via Instagram Direct Message.

## 🚀 Demo Workflow (Screencast Steps)

### 1. Connection
- Log in to the DMOrbit Dashboard.
- Navigate to the **Instagram Account** tab.
- Connect your Instagram Business Account using the official Meta OAuth flow.

### 2. Creating an Automation
- Click **+ Create Automation**.
- **Goal**: Select "Send a Link".
- **Trigger**: Enter a keyword like `GUIDE`.
- **Message**: Enter "Hey! Here is the creator guide you requested: [Link]".
- **Publish**: Save the automation.

### 3. User Interaction
- Use a separate Instagram account to comment `GUIDE` on any of the Creator's posts.

### 4. Automated Response
- The Creator's account will automatically reply to the comment with "Check your DM 👋".
- The user will receive a Private DM with the configured message.

### 5. Verification
- Return to the DMOrbit Dashboard.
- Check the **Activity Log** to see the successful trigger and delivery status.

## 🔑 Permissions Justification

### instagram_basic
Used to fetch the Creator's profile information and media (posts/reels) to allow specific post targeting.

### instagram_manage_messages
Required to send private replies to users who comment on the Creator's posts, ensuring a seamless engagement experience.

### instagram_manage_comments
Required to listen for comment events via Webhooks and to send public replies (e.g., "Check DM") to notify users of the sent message.

### pages_show_list & pages_manage_metadata
Required to list and manage the Facebook Pages linked to the Instagram Business Account for webhook subscription management.

## 🔒 Compliance & Safety
- **24-Hour Window**: DMOrbit strictly follows Meta's policy by only sending DMs in response to a user's comment or message within 24 hours.
- **Idempotency**: We use unique event IDs to ensure no duplicate messages are sent.
- **Rate Limiting**: Intelligent delays between messages to prevent platform abuse.
