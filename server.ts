import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const getOAuthClient = (redirectUri?: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
  );
};

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Auth Routes
app.get('/api/auth/url', (req, res) => {
  const origin = req.query.origin as string || process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/auth/callback`;
  const oauth2Client = getOAuthClient(redirectUri);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: origin // Pass the origin back in the state parameter
  });
  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code, state: origin } = req.query;
  const redirectUri = `${origin as string || process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
  const oauth2Client = getOAuthClient(redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userinfo = await oauth2.userinfo.get();

    // In a real app, you'd store this in a secure session or database
    // For this demo, we'll set it in a cookie (not secure for production, but works for demo)
    res.cookie('yt_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.cookie('yt_user_profile', JSON.stringify({
      name: userinfo.data.name,
      picture: userinfo.data.picture,
      email: userinfo.data.email
    }), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', (req, res) => {
  const tokens = req.cookies.yt_tokens;
  const profile = req.cookies.yt_user_profile;
  res.json({ 
    isAuthenticated: !!tokens,
    user: profile ? JSON.parse(profile) : null
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('yt_tokens');
  res.clearCookie('yt_user_profile');
  res.json({ success: true });
});

// YouTube Data API Routes
app.get('/api/youtube/playlists', async (req, res) => {
  const tokensStr = req.cookies.yt_tokens;
  if (!tokensStr) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tokens = JSON.parse(tokensStr);
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.playlists.list({
      mine: true,
      part: ['snippet', 'contentDetails'],
      maxResults: 50
    });

    res.json(response.data.items);
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    const message = error.response?.data?.error?.message || 'Failed to fetch playlists';
    res.status(error.response?.status || 500).json({ error: message });
  }
});

app.get('/api/youtube/playlist-items/:playlistId', async (req, res) => {
  const tokensStr = req.cookies.yt_tokens;
  if (!tokensStr) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tokens = JSON.parse(tokensStr);
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.playlistItems.list({
      playlistId: req.params.playlistId,
      part: ['snippet', 'contentDetails'],
      maxResults: 50
    });

    res.json(response.data.items);
  } catch (error: any) {
    console.error('Error fetching playlist items:', error);
    const message = error.response?.data?.error?.message || 'Failed to fetch playlist items';
    res.status(error.response?.status || 500).json({ error: message });
  }
});

async function startServer() {
  console.log("Starting server...");
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL ? "SET" : "NOT SET",
    PORT: PORT
  });

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("Serving static files from dist...");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server successfully started and listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL: Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
