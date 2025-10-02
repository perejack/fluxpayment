# PesaFlux M-Pesa Payment Integration

A modern web application for M-Pesa payments using the PesaFlux API, built with React, TypeScript, and Netlify Functions.

## Features

- 💳 **M-Pesa STK Push Integration** - Seamless payment initiation
- 🔄 **Real-time Payment Status** - Automatic status polling
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🔒 **Secure Backend** - Payment processing via Netlify Functions
- 📱 **Mobile Optimized** - Works perfectly on all devices
- 🪝 **Webhook Support** - Receive payment confirmations

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Netlify Functions (Serverless)
- **Payment API:** PesaFlux M-Pesa Integration
- **Icons:** Lucide React
- **Deployment:** Netlify

## Prerequisites

- Node.js 18+ and npm
- PesaFlux Account with API Key
- Netlify Account (for deployment)
- Git

## Installation

1. **Clone the repository:**
```bash
git clone [your-repo-url]
cd PESAFLUX
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   
   For production deployment on Netlify:
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Add: `PESAFLUX_API_KEY` = `your_api_key_here`
   
   For local development (already hardcoded for testing):
   - The API key is temporarily hardcoded in the functions for testing
   - Remove the hardcoded key before deploying to production!

## Development

1. **Start the development server:**
```bash
npm run dev
```

2. **Test with Netlify Functions locally:**
```bash
npx netlify dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
PESAFLUX/
├── src/
│   ├── components/
│   │   ├── PaymentForm.tsx      # Payment input form
│   │   └── TransactionStatus.tsx # Transaction status display
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles with Tailwind
├── netlify/
│   └── functions/
│       ├── initiate-payment.ts   # STK Push initiation
│       ├── check-status.ts       # Payment status check
│       └── webhook.ts            # Payment webhook handler
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── netlify.toml                 # Netlify deployment config
└── README.md                    # Documentation
```

## How It Works

1. **User enters payment details:**
   - Phone number (Safaricom)
   - Amount (minimum KES 1)
   - Email address

2. **Payment initiation:**
   - Frontend sends request to `initiate-payment` function
   - Function calls PesaFlux API to trigger STK Push
   - User receives M-Pesa prompt on their phone

3. **Status tracking:**
   - App automatically polls `check-status` function
   - Updates UI when payment is completed or fails
   - Shows receipt number on success

4. **Webhook handling:**
   - PesaFlux sends webhook to `webhook` function
   - Function logs transaction details
   - Can trigger additional business logic

## API Endpoints

### Netlify Functions (Serverless)

- `POST /.netlify/functions/initiate-payment`
  - Initiates M-Pesa STK Push
  - Body: `{ msisdn, amount, email, reference }`

- `POST /.netlify/functions/check-status`
  - Checks transaction status
  - Body: `{ transaction_id }`

- `POST /.netlify/functions/webhook`
  - Receives payment notifications from PesaFlux
  - Automatically called by PesaFlux

## Deployment to Netlify

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Netlify:**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Functions directory: `netlify/functions`

3. **Set environment variables:**
   - Go to Site Settings > Environment Variables
   - Add `PESAFLUX_API_KEY` with your actual API key
   - Remove the hardcoded API key from the functions!

4. **Configure webhook URL in PesaFlux:**
   - Log in to your [PesaFlux account](https://pesaflux.co.ke/user)
   - Set webhook URL to: `https://your-site.netlify.app/.netlify/functions/webhook`

## Testing

1. **Test phone numbers:**
   - Use real Safaricom numbers for testing
   - Format: `0712345678` or `254712345678`

2. **Test amounts:**
   - Minimum: KES 1
   - Use small amounts for testing (e.g., KES 10)

3. **Payment flow:**
   - Enter details and click "Pay with M-Pesa"
   - Check your phone for M-Pesa prompt
   - Enter PIN to complete payment
   - Watch the status update in the app

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables for production
   - The hardcoded key is ONLY for testing

2. **CORS Configuration:**
   - Currently set to allow all origins (`*`)
   - Restrict to your domain in production

3. **Input Validation:**
   - Phone number format validation
   - Amount validation (minimum KES 1)
   - Email format validation

## Troubleshooting

### Payment not going through?
- Check phone number format (must be 254XXXXXXXXX)
- Ensure you have sufficient M-Pesa balance
- Verify API key is correct

### Status not updating?
- Transaction status polls every 5 seconds
- Maximum wait time is 2 minutes
- Check browser console for errors

### Webhook not working?
- Ensure webhook URL is correctly configured in PesaFlux
- Check Netlify Functions logs for errors
- Verify your site is deployed and accessible

## Support

- **PesaFlux Documentation:** [https://api.pesaflux.co.ke/documentation/](https://api.pesaflux.co.ke/documentation/)
- **PesaFlux Dashboard:** [https://pesaflux.co.ke/user](https://pesaflux.co.ke/user)

## License

This project is provided as-is for integration with PesaFlux API.

---

Built with ❤️ using PesaFlux API
