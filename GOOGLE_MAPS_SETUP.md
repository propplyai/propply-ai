# Google Maps API Setup Guide

This guide will help you set up the Google Maps API key for the Google Places Autocomplete integration.

## Quick Setup

### 1. Create Environment File
Create a `.env` file in your project root:

```bash
# Copy this to your .env file
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

### 2. Get Google Maps API Key

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: Choose an existing project or create a new one
3. **Enable APIs**: Go to "APIs & Services" > "Library" and enable:
   - **Maps JavaScript API**
   - **Places API**
4. **Create API Key**: Go to "APIs & Services" > "Credentials" > "Create Credentials" > "API Key"
5. **Copy the API Key**: Copy the generated API key

### 3. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. **Go to Credentials**: In Google Cloud Console, click on your API key
2. **Application Restrictions**: 
   - Choose "HTTP referrers (web sites)"
   - Add your domain(s): `localhost:3000/*`, `yourdomain.com/*`
3. **API Restrictions**:
   - Choose "Restrict key"
   - Select: "Maps JavaScript API" and "Places API"

### 4. Update Environment File

Replace `your_actual_google_maps_api_key_here` with your real API key:

```bash
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBvOkBwJc_TK7Yqg8eQ3R2dF9mN1pL4sT6U
```

### 5. Restart Development Server

```bash
npm start
```

## Testing the Integration

1. **Open the app**: Navigate to the "Add Property" form
2. **Type an address**: Start typing in the address field
3. **Verify suggestions**: You should see Google Places suggestions appear
4. **Select an address**: Click on a suggestion to populate the form

## Troubleshooting

### "REACT_APP_GOOGLE_MAPS_API_KEY environment variable is not set"
- Make sure you have a `.env` file in your project root
- Check that the variable name is exactly `REACT_APP_GOOGLE_MAPS_API_KEY`
- Restart your development server after adding the environment variable

### "Please replace YOUR_API_KEY_HERE with your actual Google Maps API key"
- Update your `.env` file with a real API key from Google Cloud Console
- Make sure the API key is valid and has the required APIs enabled

### "Google Maps API key appears to be invalid"
- Verify your API key is correct in Google Cloud Console
- Check that Places API is enabled for your project
- Ensure billing is set up for your Google Cloud project

### No suggestions appearing
- Check browser console for errors
- Verify your API key has Places API enabled
- Make sure domain restrictions allow your current domain
- Check that you have an active billing account

## Production Deployment

### Environment Variables
For production deployment, set the environment variable in your hosting platform:

**Vercel:**
```bash
vercel env add REACT_APP_GOOGLE_MAPS_API_KEY
```

**Netlify:**
- Go to Site Settings > Environment Variables
- Add `REACT_APP_GOOGLE_MAPS_API_KEY` with your API key

**Railway:**
```bash
railway variables set REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Domain Restrictions
Update your API key restrictions in Google Cloud Console to include your production domain:

1. Go to your API key settings
2. Add your production domain to HTTP referrers
3. Remove `localhost:3000/*` for production

## Security Best Practices

1. **Use Domain Restrictions**: Restrict your API key to specific domains
2. **Use API Restrictions**: Limit to only required APIs (Maps JavaScript API, Places API)
3. **Monitor Usage**: Check your Google Cloud Console for unusual usage patterns
4. **Rotate Keys**: Regularly rotate your API keys for security
5. **Never Commit Keys**: Never commit API keys to version control

## Cost Considerations

- **Free Tier**: Google Maps API provides free usage up to certain limits
- **Places API**: $0.017 per request after free tier
- **Maps JavaScript API**: Free for most usage
- **Monitor Usage**: Check your Google Cloud Console billing dashboard

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key configuration in Google Cloud Console
3. Ensure all required APIs are enabled
4. Check that billing is set up correctly
5. Review the troubleshooting section above

