import { google } from 'googleapis';

export async function POST(req) {
  try {
    const { accessToken, sheetId } = await req.json();

    if (!accessToken || !sheetId) {
      return new Response(JSON.stringify({ error: 'Access token or sheet ID is missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("Attempting to fetch data for sheet ID:", sheetId);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Fetch sheet metadata to get all sheet names and the spreadsheet title
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'properties.title,sheets.properties'
    });

    console.log("Sheet metadata:", JSON.stringify(sheetMetadata.data, null, 2));

    const allSheets = sheetMetadata.data.sheets;
    const allSheetsData = {
      spreadsheetTitle: sheetMetadata.data.properties.title,
      sheets: {}
    };

    // Fetch data for each sheet
    for (const sheet of allSheets) {
      const sheetName = sheet.properties.title;
      const gridProperties = sheet.properties.gridProperties;
      const lastColumn = gridProperties.columnCount;
      const lastRow = gridProperties.rowCount;

      // Construct range using sheet dimensions
      const lastColumnLetter = columnToLetter(lastColumn);
      const range = `'${sheetName}'!A1:${lastColumnLetter}${lastRow}`;

      console.log(`Fetching data for sheet "${sheetName}" with range: ${range}`);

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: range,
        });

        allSheetsData.sheets[sheetName] = response.data;
      } catch (sheetError) {
        console.error(`Error fetching data for sheet "${sheetName}":`, sheetError);
        allSheetsData.sheets[sheetName] = { error: `Failed to fetch data: ${sheetError.message}` };
      }
    }

    console.log("All sheets data fetched successfully");

    return new Response(JSON.stringify(allSheetsData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sheet data', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper function to convert column number to letter
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}