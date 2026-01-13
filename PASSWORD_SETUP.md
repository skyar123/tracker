# Password Protection Setup

## ✅ What's Been Added

Your CF Assessment Tracker now has **password protection**!

- 🔒 Login screen with numeric PIN
- 🔐 All API endpoints require authentication
- 🚪 Logout button in header
- 🔄 Auto-logout if token expires

## 🎯 How to Set Your Password

### In Netlify:

1. Go to **Site settings** → **Environment variables**
2. Add new variable:
   - **Key**: `APP_PASSWORD`
   - **Value**: Your desired PIN (e.g., `1234`, `5678`, etc.)
3. Click **"Save"**
4. **Redeploy** your site (or wait for auto-deploy)

### Default Password:

If you don't set `APP_PASSWORD`, the default is: **`1234`**

## 📱 How It Works

### First Time:
1. Open your Netlify site
2. See login screen
3. Enter your PIN
4. Click "Login"
5. Access your caseload!

### After Login:
- Token saved in browser
- Stays logged in until you logout
- All API calls include authentication
- Data syncs securely

### Logout:
- Click **"Logout"** button in header
- Clears token
- Returns to login screen

## 🔧 Troubleshooting

### "Invalid password" error?
- Check `APP_PASSWORD` in Netlify environment variables
- Make sure you redeployed after setting it
- Default is `1234` if not set

### Can't login?
- Check Netlify function logs
- Verify `login.js` function deployed
- Try default password: `1234`

### Data not syncing?
- Make sure you're logged in
- Check browser console for errors
- Verify database is set up

## 🔐 Security Notes

- Password is simple numeric PIN (for ease of use)
- Token stored in localStorage
- All API calls require valid token
- Logout clears token immediately

For production, consider:
- Stronger passwords
- Session expiration
- HTTPS only (Netlify handles this)

## ✅ Next Steps

1. **Set your password** in Netlify environment variables
2. **Redeploy** your site
3. **Test login** on your phone and computer
4. **Verify data syncs** across devices!

Your app is now secure! 🔒
