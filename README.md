# Tralla - Proximity-based Social Networking App

A dynamic proximity-based social networking platform that enables spontaneous, intelligent connections through innovative mobile technologies.

## Overview

Tralla helps users connect with people in their immediate vicinity using a combination of technologies:
- Passive NFC detection
- Location-based proximity
- Facial recognition
- Real-time messaging

## Features

- **Proximity Detection**: Find nearby users through multiple technologies
- **Real-time Chat**: Text and voice messaging with translation support
- **Group Management**: Create and manage groups for activities and trips
- **Trip Planning**: Comprehensive planning tools with expense tracking
- **Payment Integration**: Secure payments via Stripe and UPI
- **Multi-language Support**: Translation between Indian languages via Bhashini
- **Vendor Portal**: Service providers can manage offerings

## Technology Stack

- **Frontend**: React with Shadcn UI components
- **Mobile**: React Native with Expo
- **Backend**: Express.js with WebSocket support
- **Authentication**: Multiple methods including OTP and OAuth
- **Payments**: Stripe integration for global payments
- **AI**: TensorFlow for facial recognition
- **Real-time Communication**: WebSockets for instant messaging

## Getting Started

### Web Application

```bash
# Navigate to project root
npm install
npm run dev
```

### Mobile Application

```bash
# Navigate to mobile directory
cd mobile
npm install
npm run tunnel
```

Then scan the QR code with the Expo Go app on your device.

## Environment Requirements

To fully utilize all features, the following services need to be configured:
- Stripe for payments
- Bhashini API for language translation

## License

[MIT License](LICENSE)