import { google } from 'googleapis';
import admin from 'firebase-admin'; // Import the entire firebase-admin package

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Use application default credentials
  });
}

export async function GET(req) {
  console.log('Request Headers:', req.headers); // Log headers to check for Authorization
  try {
    // Get the ID token from the request headers
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    // Check if ID token is present
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'ID token is missing' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid; // Get the user ID

    // Create an OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Retrieve the user's access token from your database or session
    const userAccessToken = localStorage.getItem('userAccessToken');

    // Set the user's credentials
    oauth2Client.setCredentials({
      access_token: userAccessToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      orderBy: 'modifiedTime desc',
      fields: 'files(id, name)',
    });

    return new Response(JSON.stringify(response.data.files), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sheets' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Function to retrieve the user's access token from your database or session
async function getUserAccessToken(uid) {
  // Implement your logic to retrieve the access token for the user
  // This could be from a database or in-memory store
  // Example:
  // const user = await db.collection('users').doc(uid).get();
  // return user.data().googleAccessToken;
}