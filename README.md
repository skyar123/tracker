# CF Assessment Tracker

Child First Assessment Tracker for RHA Child First • Child AA & Pregnant AA

A comprehensive React application for tracking assessment protocols, deadlines, and caseload management for Child First services.

## Features

- **Caseload Management**: Track multiple families with assessment protocols
- **Phase Tracking**: Baseline, Quarterly, 6-Month, and Discharge phases
- **Role-Based Filtering**: Separate views for Clinician, FRP, and Shared responsibilities
- **Deadline Timeline**: Visual timeline of upcoming assessment deadlines
- **Age-Specific Tools**: Automatic tool selection based on child's age
- **Backup & Restore**: Export and import caseload data
- **Print Support**: Generate printable assessment records

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

This project is configured for Netlify deployment. The build command is `npm run build` and the publish directory is `dist`.

## Data Storage

### Current: Local Storage
Data is stored locally in the browser using localStorage. All caseload data persists in your browser and can be exported/imported using the Backup feature in the app.

### Cloud Sync Option (Firebase)
For cloud sync across devices with Gmail login, see:
- `FIREBASE_CLOUD_SYNC_GUIDE.md` - Complete implementation guide
- `QUICK_START_FIREBASE.md` - 5-minute setup guide
- `CLOUD_SYNC_COMPARISON.md` - Options comparison

Firebase offers a **completely free tier** perfect for caseload tracking with:
- Gmail/Google authentication
- Real-time sync across devices
- 1 GB storage (enough for ~10,000 clients)
- No credit card required
