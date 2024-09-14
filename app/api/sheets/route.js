import { google } from 'googleapis';

export async function POST(req) {
  try {
    const { accessToken, orderBy } = await req.json(); // Retrieve the access token and orderBy from the request body
    console.log('Access Token:', accessToken);
    console.log('Order By:', orderBy);

    // Check if access token is present
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token is missing' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Create an OAuth2 client with Google credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set the user's credentials with the provided access token
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Create a Google Drive client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Fetch Google Sheets (Google Drive stores Sheets as files)
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and 'me' in owners",
      orderBy: orderBy === 'lastOpened' ? 'viewedByMeTime desc' : 'modifiedTime desc',
      fields: 'files(id, name, thumbnailLink)',
    });

    console.log("Google Drive API response:", response.data.files); // Log the fetched files

    // Return the fetched sheets
    return new Response(JSON.stringify(response.data.files), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching Google Sheets:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sheets' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
