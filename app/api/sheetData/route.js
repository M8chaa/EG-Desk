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

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId: sheetId,
      fields: 'mimeType,name'
    });

    let { mimeType, name } = fileMetadata.data;

    let spreadsheetId = sheetId;

    // If it's an Excel file, we need to use the export feature of Google Drive
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log("File is an Excel document. Using Google Drive export feature.");
      
      // Export the Excel file to Google Sheets format
      const exportResponse = await drive.files.export({
        fileId: sheetId,
        mimeType: 'application/vnd.google-apps.spreadsheet'
      }, { responseType: 'json' });

      // The exported data is now in Google Sheets format
      spreadsheetId = exportResponse.data.id;
    }

    // Now we can use the Sheets API, regardless of whether it was originally a Google Sheet or an Excel file
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'properties.title,sheets(properties,merges)'
    });

    const allSheetsData = {
      name,
      mimeType,
      spreadsheetTitle: sheetMetadata.data.properties.title,
      sheets: {}
    };

    // Fetch data for each sheet
    for (const sheet of sheetMetadata.data.sheets) {
      const sheetName = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      const gridProperties = sheet.properties.gridProperties;
      const lastColumn = gridProperties.columnCount;
      const lastRow = gridProperties.rowCount;
      const merges = sheet.merges || [];

      // Construct range using sheet dimensions
      const range = `'${sheetName}'!A1:${columnToLetter(lastColumn)}${lastRow}`;

      console.log(`Fetching data for sheet "${sheetName}" with range: ${range}`);

      try {
        // Fetch cell values
        const valuesResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: range,
        });

        // Fetch cell metadata (including formulas and styles)
        const metadataResponse = await sheets.spreadsheets.get({
          spreadsheetId: sheetId,
          ranges: [range],
          includeGridData: true,
        });

        const sheetData = valuesResponse.data.values || [];
        const sheetMetadata = metadataResponse.data.sheets[0].data[0].rowData;

        // Create a map of merged cells
        const mergedCellsMap = new Map();
        merges.forEach(merge => {
          const startCell = `${columnToLetter(merge.startColumnIndex + 1)}${merge.startRowIndex + 1}`;
          for (let row = merge.startRowIndex; row <= merge.endRowIndex; row++) {
            for (let col = merge.startColumnIndex; col <= merge.endColumnIndex; col++) {
              const cellA1 = `${columnToLetter(col + 1)}${row + 1}`;
              mergedCellsMap.set(cellA1, {
                startCell,
                rowSpan: merge.endRowIndex - merge.startRowIndex + 1,
                colSpan: merge.endColumnIndex - merge.startColumnIndex + 1
              });
            }
          }
        });

        // Combine cell values with metadata
        const combinedData = sheetData.map((row, rowIndex) => {
          return row.map((cellValue, colIndex) => {
            const cellMetadata = sheetMetadata[rowIndex]?.values[colIndex] || {};
            const cellA1 = `${columnToLetter(colIndex + 1)}${rowIndex + 1}`;
            const mergeInfo = mergedCellsMap.get(cellA1);
            return {
              value: cellValue,
              formula: cellMetadata.userEnteredValue?.formulaValue || null,
              format: cellMetadata.userEnteredFormat || null,
              note: cellMetadata.note || null,
              coordinates: {
                A1: cellA1,
                R1C1: `R${rowIndex + 1}C${colIndex + 1}`
              },
              mergeInfo: mergeInfo || null
            };
          });
        });

        allSheetsData.sheets[sheetName] = {
          data: combinedData,
          merges: merges
        };
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
