# Tralla - Proximity-Based Social App

Tralla is a proximity-based social application that allows users to identify, chat with, and form groups with people nearby, including features for expense splitting, group activities, and birthday gift shopping for frequent contacts.

## Overview

Tralla is designed to connect people in close physical proximity through passive technology (like NFC) on various devices, including Google Glass, watches, and smartphones. The app focuses on creating seamless social interactions in the physical world, enhanced by digital capabilities.

## Website

Visit [GetTralla.com](https://gettralla.com) for more information and to download the app.

## Features

- **Proximity Detection**: Find and connect with people nearby without explicit permissions, using passive technology
- **Real-time Chat**: Text and voice chat with people in your vicinity
- **Group Functionality**: Create and join groups for shared interests and activities
- **Expense Splitting**: Easily split bills and track expenses with friends and groups
- **Group Activities**: Plan and organize events with people nearby
- **Gift Suggestions**: Get birthday gift recommendations for your frequent contacts
- **UPI Transactions**: Make secure payments with integrated UPI functionality
- **Facial Recognition**: Identify people from images

## Technical Architecture

Tralla is built as a monorepo containing both web and mobile applications:

- **Web Application**:
  - Next.js framework
  - Shadcn UI components
  - TanStack Query for data fetching
  
- **Mobile Application**:
  - React Native
  - Expo framework
  - NFC and location capabilities
  
- **Backend**:
  - Express server
  - Node.js
  - In-memory data storage (development)
  - PostgreSQL database (production)

## Installation

### Prerequisites

- Node.js 18+ and npm
- Expo CLI for mobile development

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Mobile Development

```
cd mobile
npm install
npm start
```

## Target Audience

Tralla primarily targets Gen Z and Gen Alpha users who want to enhance their real-world social interactions with digital capabilities.

## License

[MIT License](LICENSE)

## Contact

For more information, visit [GetTralla.com](https://gettralla.com)