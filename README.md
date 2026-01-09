# Booky - EV Charging Appointment System

A modern, mobile-friendly web application for managing electric vehicle charging appointments in residential apartment buildings.

## Features

- **Simple Booking**: Residents can book 2-hour charging slots by providing apartment number and name
- **Real-time Availability**: See available time slots and avoid double-bookings
- **Booking Management**: View and cancel bookings using confirmation codes
- **Mobile-First Design**: Fully responsive UI optimized for mobile devices
- **No Authentication Required**: Easy access using 8-character confirmation codes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Validation**: Zod
- **Forms**: React Hook Form
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Firebase Firestore enabled

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   
   **Client SDK (for frontend)**:
   - Get credentials from: Firebase Console > Project Settings > General > Your apps > Web app
   - Add to `.env.local`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   ```

   **Admin SDK (for server-side API routes)**:
   - Go to: Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key" and download the JSON file
   - Add to `.env.local` (choose one option):

   **Option 1 - Full JSON (Development)**:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
   ```

   **Option 2 - Individual Fields (Production/Vercel)**:
   ```
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Set up Firestore**:
   - Go to Firebase Console > Firestore Database
   - Create a database (start in production mode or test mode)
   - The `bookings` collection will be created automatically when the first booking is made

4. **Configure Firestore Indexes**:
   Firestore will prompt you to create indexes when you make your first booking. Alternatively, create them manually:

   - Composite Index 1: `startTime` (Ascending) + `status` (Ascending)
   - Composite Index 2: `endTime` (Ascending) + `status` (Ascending)
   - Single Field Index: `confirmationCode` (Ascending)

5. **Set up Firestore Security Rules**:
   Since the app uses Firebase Admin SDK for all database operations (which bypasses security rules), you can use restrictive rules:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Deny all client-side access since we use Admin SDK on the server
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

   Note: All database operations go through Next.js API routes using the Admin SDK, which has full access regardless of these rules.

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Booking a Charging Slot

1. Go to the home page
2. Enter your apartment number and full name
3. Select a date (up to 30 days in advance)
4. Choose an available 2-hour time slot
5. Click "Book Charging Slot"
6. Save your confirmation code!

### Managing Your Booking

1. Go to the "Manage" page
2. Enter your 8-character confirmation code
3. View your booking details
4. Cancel if needed (only active bookings can be cancelled)

## Configuration

### Time Slots

Edit `/lib/constants.ts` to customize:

- **Slot Duration**: Default is 2 hours
- **Operating Hours**: Default is 6 AM - 10 PM
- **Max Advance Booking**: Default is 30 days
- **Min Advance Booking**: Default is 2 hours

### App Branding

Change the app name in `/lib/constants.ts`:
```typescript
export const APP_NAME = 'Booky';
```

## Project Structure

```
├── app/
│   ├── api/bookings/          # API routes
│   ├── confirmation/          # Confirmation page
│   ├── manage/                # Manage bookings page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── booking/               # Booking form components
│   ├── manage/                # Booking management components
│   ├── ui/                    # Reusable UI components
│   └── layout/                # Header & Footer
├── lib/
│   ├── firebase/              # Firebase config & helpers
│   ├── utils/                 # Utility functions
│   └── constants.ts           # App constants
└── types/
    └── booking.ts             # TypeScript types
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel automatically optimizes Next.js applications.

## License

MIT

## Support

For issues or questions, please contact your building management or IT support.
