const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Get spreadsheet ID from environment
      this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable not set');
      }

      // Initialize Google Auth
      const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH ||
        path.join(__dirname, '../config/google-credentials.json');

      if (!fs.existsSync(credentialsPath)) {
        throw new Error('Google Sheets credentials file not found');
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;

      console.log('Google Sheets service initialized successfully');
      console.log(`Using spreadsheet ID: ${this.spreadsheetId}`);
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Generic method to read data from a sheet
  async readSheet(sheetName, range = 'A:Z') {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error reading sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Generic method to write data to a sheet
  async writeSheet(sheetName, range, values) {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error writing to sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Append data to a sheet
  async appendToSheet(sheetName, values) {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error appending to sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Clear a range in a sheet
  async clearSheet(sheetName, range = 'A:Z') {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      return response.data;
    } catch (error) {
      console.error(`Error clearing sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Create a new sheet
  async createSheet(sheetName) {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Get sheet metadata
  async getSheetMetadata() {
    await this.ensureInitialized();

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting sheet metadata:', error);
      throw error;
    }
  }

  // Convert array of objects to 2D array for sheets
  objectsToSheetData(objects, headers) {
    if (!objects || objects.length === 0) return [headers];

    const data = [headers];
    objects.forEach(obj => {
      const row = headers.map(header => {
        const value = this.getNestedValue(obj, header);
        return value !== undefined && value !== null ? String(value) : '';
      });
      data.push(row);
    });

    return data;
  }

  // Convert 2D array from sheets to array of objects
  sheetDataToObjects(data, headerRow = 0) {
    if (!data || data.length <= headerRow) return [];

    const headers = data[headerRow];
    const objects = [];

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};

      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          this.setNestedValue(obj, header, row[index]);
        }
      });

      objects.push(obj);
    }

    return objects;
  }

  // Helper method to get nested object values
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  // Helper method to set nested object values
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }
}

module.exports = new GoogleSheetsService();