# SMS Forwarding Setup Guide

## 🎯 **What This Does**
Your Android phone becomes a bridge between bank SMS notifications and your server - enabling **automatic payment detection** without any payment gateway!

## 📱 **STEP 1 — Get a Dedicated Android Phone**

### You Need:
- ✅ 1 Android phone (always ON)
- ✅ SIM card linked to your bank account  
- ✅ Internet (WiFi or mobile data)
- ✅ Charger plugged 24/7

### 👉 This phone becomes your "SMS Server"

## 🔧 **STEP 2 — Install SMS Forwarding App**

### **Option A: AutoForward SMS** (Recommended)
1. Download from Google Play Store
2. Simple setup, reliable forwarding

### **Option B: Tasker** (Advanced)
1. Download from Google Play Store
2. More customization options
3. Steeper learning curve

### **Option C: SMS Forwarder** (Free)
1. Download from Google Play Store
2. Basic forwarding functionality
3. Good for testing

## ⚙️ **STEP 3 — Give Permissions**

When installing, allow:
- ✅ **SMS access** 📩
- ✅ **Background running** 🔋  
- ✅ **Internet access** 🌐
- ✅ **Auto-start** (if available)

## 🎯 **STEP 4 — Create Forwarding Rule**

This is the most important part!

### **Trigger:**
- "New SMS received"

### **Filter:**  
- Contains "CBE" OR "ETB" OR "credited" OR "received"
- Add your bank names: "Awash", "Dashen", "TeleBirr"

### **Action:**
- Send HTTP request to your server

## 🌐 **STEP 5 — Set Your Server URL**

Enter this URL in the app:
```
https://yourdomain.com/api/sms-forwarding/receive-sms
```

### **For Development:**
```
http://localhost:5000/api/sms-forwarding/receive-sms
```

## 📤 **STEP 6 — Configure What Gets Sent**

The app will send JSON like this:
```json
{
  "message": "CBE: credited ETB 503 from ABEBE Ref: 84729",
  "sender": "+251911xxxxxx", 
  "time": "12:45"
}
```

### **HTTP Settings:**
- **Method:** POST
- **Content-Type:** application/json
- **Headers:** None required (or add auth if you want)

## 🧪 **STEP 7 — Test It**

### **Send Test SMS:**
1. Send yourself a test SMS with: "CBE: credited ETB 299 from Test"
2. Check if it reaches your server
3. Check server logs for received SMS

### **Expected Response:**
```json
{
  "success": true,
  "message": "Payment processed and user upgraded"
}
```

## 🔄 **HOW THE FULL FLOW WORKS**

```
Bank sends SMS
    ↓
Phone receives SMS  
    ↓
Forwarding app detects it
    ↓
App sends it to your API
    ↓
Your backend receives it
    ↓
System processes payment
    ↓
User gets instant access ✅
```

## 🏦 **SUPPORTED BANK SMS FORMATS**

### **Commercial Bank of Ethiopia (CBE):**
- `CBE: credited ETB 299 from JOHN DOE`
- `CBE: account credited with ETB 599`
- `CBE: 299 ETB credited to account`

### **Awash Bank:**
- `Awash: credited ETB 299`
- `Awash: deposit ETB 599 received`

### **Dashen Bank:**
- `Dashen: credited ETB 299`
- `Dashen: payment received ETB 599`

### **TeleBirr:**
- `TeleBirr: received ETB 299`
- `TeleBirr: payment received ETB 599`

## 🛠️ **APP SPECIFIC SETUP**

### **AutoForward SMS Setup:**
1. Open app → "Rules" → "Add Rule"
2. **Rule Name:** "Bank Payments"
3. **Trigger:** "SMS Received"
4. **Filter:** 
   - Text contains: `CBE|Awash|Dashen|TeleBirr|ETB|credited|received`
5. **Action:** "HTTP Request"
6. **URL:** Your server endpoint
7. **Method:** POST
8. **Body:** 
   ```json
   {
     "message": "${message}",
     "sender": "${sender}", 
     "time": "${time}"
   }
   ```

### **Tasker Setup:**
1. Create Profile: "Event" → "Phone" → "Received Text"
2. Set filter for bank keywords
3. Create Task: "Net" → "HTTP Post"
4. Configure URL and JSON body
5. Test with "Play" button

## 🔍 **TROUBLESHOOTING**

### **SMS Not Forwarding:**
- Check app permissions
- Verify filter keywords match exactly
- Test with different SMS content
- Check phone's internet connection

### **Server Not Receiving:**
- Verify URL is correct
- Check firewall settings
- Test with curl/Postman first
- Check server logs

### **Payment Not Detected:**
- Check SMS format matches patterns
- Verify amount matches expected (299/599 ETB)
- Check pending payments exist
- Review server error logs

## 🚀 **PRODUCTION TIPS**

### **Security:**
- Add API key to SMS endpoint
- Use HTTPS in production
- Rate limit SMS processing
- Log all SMS for audit

### **Reliability:**
- Use dedicated phone (no personal use)
- Set up backup phone
- Monitor battery/power
- Check internet connectivity

### **Monitoring:**
- Log all received SMS
- Alert on failed processing
- Monitor phone battery
- Track success rates

## 📋 **CHECKLIST**

### **Before Going Live:**
- [ ] Dedicated Android phone ready
- [ ] SMS forwarding app installed
- [ ] All permissions granted
- [ ] Forwarding rule configured
- [ ] Server endpoint tested
- [ ] Bank SMS formats tested
- [ ] Error handling in place
- [ ] Monitoring set up

### **Testing Scenarios:**
- [ ] Valid CBE SMS → Success
- [ ] Valid Awash SMS → Success  
- [ ] Valid TeleBirr SMS → Success
- [ ] Invalid SMS → Ignored
- [ ] No matching payment → Stored for review
- [ ] Server down → App retries

## 🎉 **SUCCESS INDICATORS**

When it's working, you'll see:
1. ✅ SMS received on phone
2. ✅ App forwards to server  
3. ✅ Server processes payment
4. ✅ User gets upgraded
5. ✅ Logs show successful processing

## 🆘 **COMMON ISSUES & SOLUTIONS**

### **Issue:** "SMS not being forwarded"
**Solution:** Check app permissions and filter keywords

### **Issue:** "Server receives but no payment detected"  
**Solution:** Verify SMS format matches bank patterns

### **Issue:** "Payment detected but user not found"
**Solution:** Check pending payments exist and match amount

### **Issue:** "Phone battery dies"
**Solution:** Use reliable power source and monitor battery

---

## 📞 **SUPPORT**

If you need help:
1. Check server logs first
2. Test SMS forwarding manually
3. Verify bank SMS formats
4. Check app configuration
5. Review this guide step by step

**Your SMS forwarding payment system is now ready!** 🚀
