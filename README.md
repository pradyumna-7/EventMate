# EventMate - Event Management & Payment Verification System

![EventMate Logo](./docs/assets/logo.png)

## 1. Overview

EventMate is a comprehensive event management solution designed to streamline registration, payment verification, and attendance tracking for events of any scale. The application bridges the gap between payment processing and event attendance management by automatically verifying UPI payments against participant records and providing QR code-based check-in functionality.

Currently, EventMate is optimized for managing a single event efficiently. Development is underway to support multiple events within a single dashboard, allowing organizers to manage concurrent events while maintaining the same streamlined verification and attendance tracking features.

Built with modern web technologies, EventMate offers an intuitive interface for event organizers to:
- Verify payments by matching PhonePe transaction statements with participant data
- Generate unique QR codes for verified participants
- Track attendance in real-time using QR code scanning
- Monitor event metrics through a comprehensive dashboard

### Key Features

- **Automated Payment Verification**: Match UTR IDs from PhonePe statements with participant records
- **QR Code Management**: Generate and distribute secure QR codes to verified participants
- **Attendance Tracking**: Scan QR codes to mark attendance with real-time updates
- **Dashboard Analytics**: Monitor verification status, attendance rates, and participant metrics
- **Activity Logging**: Track all system activities with detailed audit trails

## 2. Modules

### Frontend (`/frontend`)

The frontend is built with React, TypeScript, and Vite, providing a responsive and intuitive user interface.

- **Dashboard**: Central hub displaying event statistics and recent activities
- **Verification Page**: Upload and process payment records against participant data
- **QR Generator**: Create and manage QR codes for verified participants
- **QR Scanner**: Scan QR codes to verify participants and mark attendance
- **Unattended List**: View verified participants who haven't checked in yet
- **Activity Log**: Track all system actions for audit purposes

### Backend (`/backend`)

The backend is powered by Node.js with Express, providing RESTful APIs for the frontend and business logic.

- **Verification Service**: Process payment statements and match transactions
- **Participant Management**: Handle participant data and verification status
- **QR Code Service**: Generate secure, participant-specific QR codes
- **Attendance Tracking**: Record and manage participant check-ins
- **Activity Logging**: Track and store all system activities

### Documentation (`/docs`)

Contains API documentation and usage guides.

- **OpenAPI Specification**: Complete API documentation following OpenAPI 3.0 standard
- **API Documentation**: Available online at [https://pradyumna-7.github.io/EventMate/](https://pradyumna-7.github.io/EventMate/)

## 3. How to Run the Application

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd e:\EventMate\backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eventmate
   QR_SECRET=your-secure-random-string
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password-or-app-password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd e:\EventMate\frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at `http://localhost:5173`

### Production Deployment

1. Build the backend:
   ```bash
   cd e:\EventMate\backend
   npm run build
   ```

2. Build the frontend:
   ```bash
   cd e:\EventMate\frontend
   npm run build
   ```

3. The frontend build will be in `frontend/dist` directory which can be served using any static file server.

4. The backend can be started using:
   ```bash
   cd e:\EventMate\backend
   npm start
   ```

### QR Scanner Usage

The QR Scanner module allows event organizers to efficiently check in participants using a smartphone camera. Follow these steps to use the QR scanner functionality:

#### Using your webcam
Allow your browser to give access to the application and you can then use your machine's webcam directly to scan QR codes for participants upon on entry

#### Using your Phone's camera 
The application can easily connect to your phone and use its camera as the QR scanner. Follow the steps below to connect your phone to the application

**Step 1: Check System Requirements**
- PC: Windows 10 (October 2018 update or later) or Windows 11.
- Phone:
   1. Android: Android 7.0 or higher.
   2. iPhone: iOS 14 or higher.

**Step 2: Setup Windows Phone Link**
Follow the steps outlined in the link below <br/>
[How to Connect Smartphone to Windows PC using Phone Link](https://www.geeksforgeeks.org/connect-phone-to-win-with-phone-link/)

**Step 3: Follow the steps in the video below**
Ensure that your phone is connected to your PC through windows phone link Click the image below to watch the video tutorial on how to use your phone for QR scanning.
<video src="Using-Phone-for-QR-Scanning.mp4" controls width="720">
Your browser does not support the video tag.
</video>

   - Open settings on your PC
   - Go to Bluetooth & Devices > Mobile Devices > Manage Devices
   - You should your connected phone
   - Click on "Manage Devices" and turn on the option: "Use as a connected camera" 

## 4. Integration with Existing Systems

EventMate is designed to be modular and flexible, allowing for integration with existing management systems in several ways:

### API Integration

The backend provides comprehensive RESTful APIs that can be consumed by any external system:

1. **Participant Data Import/Export**: Use the API endpoints to programmatically import participant data from your existing systems or export verification results.

2. **Webhook Support**: Implement webhooks to notify your existing systems when payment verification or attendance status changes.

### Database Integration

1. **MongoDB Integration**: If your existing system uses MongoDB, you can either:
   - Share the same MongoDB instance with appropriate collection namespacing
   - Set up replication between MongoDB instances

2. **Data Synchronization**: Implement scheduled jobs to synchronize data between EventMate's MongoDB and your existing database.

### Frontend Integration

1. **Iframe Embedding**: Specific pages of EventMate can be embedded within your existing web application using iframes.

2. **White-labeling**: Customize the UI to match your organization's branding by modifying the frontend theme variables.

3. **Single Sign-On (SSO)**: Implement SSO to allow seamless authentication between your system and EventMate.

### Customization Options

1. **Custom Fields**: Extend the participant schema to include organization-specific fields.

2. **Additional Payment Providers**: Extend the verification module to support additional payment providers beyond PhonePe.

3. **Custom Reports**: Create custom reporting modules that aggregate data according to your organization's needs.

### Integration Example

For a college festival registration system:
1. Export registered student data as CSV
2. Import into EventMate for payment verification
3. Use the QR code system for event check-in
4. Export attendance data back to the college management system

