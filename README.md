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

Data is stored in Firebase Firestore for real-time syncing across devices. Configure Firebase with the values in `.env.example` or the Netlify environment variables.
