# Razorpay Setup Instructions

## 🚨 IMPORTANT: You need to set up your Razorpay credentials to fix the payment errors

### Step 1: Get Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account or login to existing account
3. Navigate to **Settings** → **API Keys**
4. Click **Generate Test Key** (for development)
5. Copy the **Key ID** and **Key Secret**

### Step 2: Update Environment Variables

#### Server Environment (.env in server folder)
```env
# Replace these with your actual credentials
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_ACTUAL_WEBHOOK_SECRET
```

#### Client Environment (.env in root folder)
```env
# Replace with your actual Key ID
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
```

### Step 3: Restart Your Servers

After updating the credentials:

1. Stop your backend server (Ctrl+C)
2. Stop your frontend server (Ctrl+C)
3. Restart backend: `cd server && npm start`
4. Restart frontend: `npm run dev`

### Step 4: Test Configuration

Visit: `http://localhost:5000/api/payments/config`

You should see:
```json
{
  "success": true,
  "config": {
    "key_id": "rzp_test_YOUR_ACTUAL_KEY_ID",
    "currency": "INR",
    "company_name": "Handicraft Store",
    "theme_color": "#3399cc"
  }
}
```

### Common Issues

1. **401 Authentication Failed**: Your API credentials are invalid
2. **503 Service Unavailable**: Credentials not set or contain placeholder values
3. **CORS Error**: Make sure both servers are running

### Test Mode vs Live Mode

- **Test Mode**: Use `rzp_test_` prefixed keys for development
- **Live Mode**: Use `rzp_live_` prefixed keys for production

### Security Notes

- Never commit actual credentials to version control
- Use environment variables for all sensitive data
- Test thoroughly in test mode before going live

---

## Current Status

❌ **Payment system is currently NOT working** because:
- Razorpay credentials contain placeholder values
- Server returns 401 Authentication Failed error

✅ **After setting up credentials**, you'll be able to:
- Create payment orders
- Process payments through Razorpay
- Verify payment signatures
- Handle webhooks