const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsSetup {
  constructor() {
    this.credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || 
                          path.join(__dirname, 'google-credentials.json');
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }

  async createSpreadsheet() {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        throw new Error(`Google credentials file not found at: ${this.credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const drive = google.drive({ version: 'v3', auth });

      // Create a new spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        resource: {
          properties: {
            title: 'CultureAft Database'
          },
          sheets: [
            {
              properties: {
                title: 'Customers',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              }
            },
            {
              properties: {
                title: 'AdminUsers',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 25
                }
              }
            },
            {
              properties: {
                title: 'Products',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 40
                }
              }
            },
            {
              properties: {
                title: 'Orders',
                gridProperties: {
                  rowCount: 5000,
                  columnCount: 50
                }
              }
            }
          ]
        }
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;
      console.log(`Created spreadsheet with ID: ${spreadsheetId}`);
      console.log(`Spreadsheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

      // Make the spreadsheet accessible to anyone with the link (optional)
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          resource: {
            role: 'writer',
            type: 'anyone'
          }
        });
        console.log('Spreadsheet made accessible to anyone with the link');
      } catch (error) {
        console.log('Could not make spreadsheet public (this is optional):', error.message);
      }

      // Add headers to each sheet
      await this.addHeaders(sheets, spreadsheetId);

      return {
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      };

    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async addHeaders(sheets, spreadsheetId) {
    const requests = [];

    // Customer headers
    const customerHeaders = [
      'customerId', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'gender', 'registrationDate', 'addresses', 'totalOrders', 'totalSpent',
      'lastOrderDate', 'preferences.newsletter', 'preferences.orderUpdates',
      'preferences.promotions', 'status', 'createdAt', 'updatedAt'
    ];

    // Admin User headers
    const adminHeaders = [
      'id', 'email', 'passwordHash', 'role.name', 'role.level', 'role.permissions',
      'role.canCreateSubAdmins', 'role.description', 'profile.firstName',
      'profile.lastName', 'profile.avatar', 'profile.phone', 'security.lastLogin',
      'security.loginAttempts', 'security.lockedUntil', 'security.mfaEnabled',
      'security.passwordChangedAt', 'audit.createdBy', 'audit.createdAt',
      'audit.updatedAt', 'audit.lastActivity', 'isActive', 'metadata.ipAddresses',
      'metadata.userAgents'
    ];

    // Product headers
    const productHeaders = [
      'id', 'name', 'category', 'subcategory', 'price', 'originalPrice',
      'discountPercentage', 'sku', 'description', 'shortDescription', 'craftsman',
      'image', 'images', 'imagePublicIds', 'materials', 'dimensions', 'weight',
      'origin', 'rating', 'reviewCount', 'isNew', 'isFeatured', 'isActive',
      'stock', 'minQuantity', 'maxQuantity', 'tags', 'hsn', 'taxRate',
      'careInstructions', 'warranty', 'shippingWeight', 'shippingDimensions',
      'metaTitle', 'metaDescription', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'
    ];

    // Order headers
    const orderHeaders = [
      'id', 'orderNumber', 'orderId', 'customerId', 'customer.name', 'customer.email',
      'customer.phone', 'items', 'totalAmount', 'finalAmount', 'taxAmount',
      'pricing.subtotal', 'pricing.shippingCharges', 'pricing.codCharges',
      'pricing.taxes', 'pricing.discount', 'pricing.total', 'paymentMethod',
      'paymentStatus', 'razorpayOrderId', 'transactionId', 'paymentDate',
      'payment.method', 'payment.status', 'payment.razorpayPaymentId',
      'payment.paidAmount', 'payment.paidAt', 'shippingAddress', 'shipping.address',
      'shipping.method', 'shipping.estimatedDelivery', 'shipping.actualDelivery',
      'shipping.trackingNumber', 'shipping.carrier', 'status', 'orderDate',
      'timeline', 'delivery.assignedAgent', 'delivery.deliveryStatus',
      'delivery.estimatedDeliveryTime', 'delivery.actualDeliveryTime', 'notes',
      'tags', 'source', 'createdAt', 'updatedAt'
    ];

    // Add headers to each sheet
    const headerUpdates = [
      { range: 'Customers!A1:R1', values: [customerHeaders] },
      { range: 'AdminUsers!A1:X1', values: [adminHeaders] },
      { range: 'Products!A1:AM1', values: [productHeaders] },
      { range: 'Orders!A1:AT1', values: [orderHeaders] }
    ];

    for (const update of headerUpdates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: update.range,
        valueInputOption: 'RAW',
        resource: {
          values: update.values
        }
      });
    }

    // Format headers (make them bold)
    requests.push({
      repeatCell: {
        range: {
          sheetId: 0, // Customers sheet
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: customerHeaders.length
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat.textFormat.bold'
      }
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 1, // AdminUsers sheet
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: adminHeaders.length
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat.textFormat.bold'
      }
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 2, // Products sheet
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: productHeaders.length
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat.textFormat.bold'
      }
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 3, // Orders sheet
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: orderHeaders.length
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat.textFormat.bold'
      }
    });

    // Apply formatting
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests
        }
      });
    }

    console.log('Headers added and formatted successfully');
  }

  async validateSetup() {
    try {
      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable not set');
      }

      if (!fs.existsSync(this.credentialsPath)) {
        throw new Error(`Google credentials file not found at: ${this.credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Try to access the spreadsheet
      const response = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      console.log('Google Sheets setup validation successful');
      console.log(`Spreadsheet title: ${response.data.properties.title}`);
      console.log(`Number of sheets: ${response.data.sheets.length}`);
      
      response.data.sheets.forEach(sheet => {
        console.log(`- Sheet: ${sheet.properties.title}`);
      });

      return true;
    } catch (error) {
      console.error('Google Sheets setup validation failed:', error);
      return false;
    }
  }

  generateCredentialsTemplate() {
    const template = {
      "type": "service_account",
      "project_id": "your-project-id",
      "private_key_id": "your-private-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
      "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
      "client_id": "your-client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
    };

    const templatePath = path.join(__dirname, 'google-credentials-template.json');
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    console.log(`Credentials template created at: ${templatePath}`);
    console.log('Please fill in your actual Google Service Account credentials');
    
    return templatePath;
  }
}

module.exports = new GoogleSheetsSetup();