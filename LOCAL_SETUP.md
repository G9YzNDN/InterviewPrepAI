# Running Interview Prep AI Locally with Manus API

This guide explains how to run the AI Interview Coach application on your local computer using Manus API credentials.

## Prerequisites

- **Node.js** 18+ and **pnpm** installed on your computer
- **Manus Account** with API credentials
- **Git** (optional, for cloning)

## Step 1: Get Your Project Code

### Option A: Download from Manus Dashboard
1. Go to your Manus project dashboard
2. Click the **Code** panel in the Management UI
3. Click **Download all files** to get the project as a ZIP
4. Extract the ZIP on your computer

### Option B: Clone via GitHub (if exported)
```bash
git clone <your-github-repo-url>
cd interview-prep-ai
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the project root with your Manus API credentials:

```bash
# Database Connection
DATABASE_URL=mysql://<username>:<password>@<host>:<port>/<database>

# Manus OAuth Configuration
VITE_APP_ID=<your-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
JWT_SECRET=<your-jwt-secret>

# Manus Built-in APIs (for LLM, Storage, Transcription)
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=<your-forge-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-api-key>

# Owner Information
OWNER_OPEN_ID=<your-open-id>
OWNER_NAME=<your-name>

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=<your-website-id>

# Application Settings
VITE_APP_TITLE=AI Interview Coach
VITE_APP_LOGO=https://your-logo-url.png
```

### Where to Find These Values:

1. **VITE_APP_ID, JWT_SECRET, OWNER_OPEN_ID**: Check your Manus project settings
2. **DATABASE_URL**: From your Manus database connection info (enable SSL in database settings)
3. **BUILT_IN_FORGE_API_KEY**: Your Manus API key for backend services
4. **VITE_FRONTEND_FORGE_API_KEY**: Your Manus API key for frontend services

You can find all these in your Manus project's **Settings → Secrets** panel.

## Step 3: Install Dependencies

```bash
# Install Node dependencies
pnpm install

# Push database schema
pnpm db:push
```

## Step 4: Start the Development Server

```bash
# Start the dev server (runs on http://localhost:5173 by default)
pnpm dev
```

The application will start and display:
```
Server running on http://localhost:5173/
```

## Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the AI Interview Coach landing page.

## Features Available Locally

Once running, you can:

1. **Upload Resume** - PDF files in Thai/English with complex layouts
2. **Enter Job Description** - Customize interview questions for specific roles
3. **Select Job Role** - Choose between Programmer, Sales, or Data Analyst
4. **Practice Interview** - Answer 5 AI-generated questions via voice recording
5. **Get Instant Feedback** - Receive scores, strengths, weaknesses, and suggestions
6. **View History** - Track all your past interview sessions

## Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port. Check the terminal output for the actual URL.

```bash
# Or specify a custom port
pnpm dev -- --port 3000
```

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure SSL is enabled in your Manus database settings
- Check that your IP is whitelisted in database access controls

### API Key Issues
- Double-check `BUILT_IN_FORGE_API_KEY` and `VITE_FRONTEND_FORGE_API_KEY`
- Ensure keys haven't expired in your Manus account
- Verify OAuth configuration matches your Manus app settings

### OAuth Login Not Working
- Confirm `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check that your local URL is registered in Manus OAuth settings (usually `http://localhost:5173`)
- Clear browser cookies and try again

## Building for Production

When ready to deploy:

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Support

For issues with:
- **Manus API Keys**: Visit https://help.manus.im
- **Database Setup**: Check Manus dashboard Database panel
- **Application Features**: Review the project README.md

---

**Happy interviewing! 🎤**
