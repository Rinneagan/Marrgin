# Marrgin

Marrgin is a modern, beautifully crafted platform for reading and publishing poetry. Built with a heavy emphasis on design aesthetics, fluid animations, and providing a distraction-free, immersive reading experience.

## Features

- **Immersive Reading:** A custom "Zen Mode" that strips away navigation and sidebars, letting the poetry take center stage.
- **Dynamic Particle Ring:** A mesmerizing, interactive HTML5 Canvas particle ring that flows organically around the text and reacts to user input.
- **Cinematic UI/UX:** Powered by Framer Motion and Tailwind CSS, featuring micro-interactions, glassmorphism, and smooth page transitions.
- **Poetry-Themed Usernames:** An automated, unique username generator that provides new users with beautiful, poetry-inspired identities (e.g., "Ethereal_Moon", "Silent_Echo").
- **Authentication:** Secure user authentication powered by Firebase Auth.
- **Database & Persistence:** Real-time data storage for poems, comments, and user profiles using Firebase Firestore.
- **Notification System:**
  - *User Notifications:* Alerts for new comments and interactions on their published works.
  - *Admin Dashboard:* Analytics and notifications for new platform visits and waitlist signups.
- **Waitlist System:** For early access management and audience building.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Backend/BaaS:** Firebase (Auth, Firestore)
- **Deployment:** Vercel (Recommended)

## Getting Started

First, ensure you have your Firebase configuration set up in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_EMAILS=your_admin_email@example.com
```

Then, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Design Philosophy

Marrgin believes that the container of the poem should be as beautiful as the words within it. We avoid generic, flat layouts in favor of curated typography (Cormorant Garamond), subtle micro-animations, and layouts that feel alive and responsive to the reader's presence.
