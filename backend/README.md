# Uevent API

## Overview
**Uevent API** is a backend service designed to help users discover, subscribe to, and interact with events. It allows users to explore upcoming educational, entertaining, and networking events by categories such as format and theme. The platform provides an event subscription system, notifications, event pages with detailed information, and payment integration for ticket purchases.

The API is built using **Node.js** and **React** with a **MySQL** database. It provides JWT-based authentication, user profiles, event management, user interactions like comments, and supports integration with payment systems for purchasing event tickets.

---

## Features
- **User Authentication**: Secure JWT-based authentication with access, refresh, and email verification tokens.
- **Event Management**: Users can view, filter, and sort events by format (e.g., conferences, workshops) or theme (e.g., business, politics, psychology).
- **Event Subscription**: Users can subscribe to events and receive notifications from event organizers.
- **Payment System**: Integration with a mock payment system that allows users to pay for tickets (real or using fake responses for testing).
- **Interactive Event Pages**: Each event includes:
  - Description and price details.
  - List of users attending.
  - Comments from users or organizers.
  - Information about the event organizer and their other events.
  - Similar events to explore.
  - Event location on a map.

- **Access Levels**: Different access for registered and non-registered users, with additional features for subscribers and event organizers.
- **Notifications**: Email and in-app notifications to keep users updated on event-related news.

---

## Database Schema

The system uses **MySQL** for data storage, with tables to manage users, events, subscriptions, comments, and more:
- **User**: Stores user information, authentication data, and preferences.
- **Event**: Contains details about the events, including format, theme, and other metadata.
- **Subscription**: Tracks which users are subscribed to which events.
- **Comment**: Stores user comments related to events.
- **Organizer**: Holds information about event organizers and their events.
- **Payment**: Manages payment statuses for users purchasing tickets.
- **Location**: Stores event location details for mapping.

---

## Environment Variables

Set up the following in your `.env` file:

- `NODE_ENV` — development | production
- `PORT` — Server port
- `HOST` — Server host
- `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`, `JWT_EMAIL_TOKEN_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRES_IN`, `JWT_REFRESH_TOKEN_EXPIRES_IN`, `JWT_EMAIL_TOKEN_EXPIRES_IN`
- `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT` — MySQL credentials
- `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` — SMTP server for email notifications
- `PAYMENT_API_URL` — URL for payment gateway
- `MAP_API_KEY` — API key for mapping services (Google Maps, OpenStreetMap, etc.)

---

## Installation and Setup

### Manual Setup
1. Clone the repository: `git clone https://github.com/chronos-project/chronos-api.git`
2. Navigate to the project folder: `cd uevent-api`
3. Install dependencies: `npm install`
4. Configure your `.env` file with the necessary settings
5. Run database migrations: `npm run db:migrate`
6. Seed the database with sample data: `npm run seed`
7. Build the project: `npm run build`
8. Start the server: `npm run start`

### Docker Setup
1. Clone the repository
2. Create `.env` file and set `DB_HOST=mysqldb`
3. Start with Docker: `docker-compose up --build`

---

## Available Scripts

- `npm run build` — Compile TypeScript
- `npm run start` — Start the production server
- `npm run migration:generate` — Generate a database migration
- `npm run db:migrate` — Apply database migrations
- `npm run seed` — Seed the database with test data
- `npm run format` — Format code using Prettier
- `npm run db:drop` — Drop all tables
- `npm run db:sync` — Sync schema with the database

---

## API Documentation

API documentation is available at `/api-docs` (Swagger UI) once the server is running. It covers all available endpoints for managing events, subscriptions, comments, payments, and user interactions.

---

## Troubleshooting

- Ensure environment variables are correctly set
- Check that MySQL is running and accessible
- Verify JWT secrets and token expiration settings
- Review server logs for errors
- Check GitHub issues for known problems or fixes

---

## Event Page Features
Each event page provides detailed information, including:

- **Event Details**: A comprehensive description of the event.
- **Ticket Price**: Information about ticket pricing, including any promo codes.
- **Event Attendees**: A list of users subscribed to the event.
- **User Comments**: A section for users to leave comments about the event.
- **Organizer Info**: Details about the event organizer, along with their other events.
- **Similar Events**: A list of related events users might be interested in.
- **Event Location**: A map displaying the event location.

---

## Payment Integration
The API supports a mock payment system, where users can pay for tickets using a virtual gateway. This functionality is crucial for a realistic user experience while testing the service.

- **Mock Payments**: The API returns simulated payment responses, which can be replaced with a real payment provider during production deployment.
