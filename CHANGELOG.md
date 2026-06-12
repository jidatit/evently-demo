# Changelog

## Recent Changes

- **Color Scheme Updates:**  
  - All purple text and buttons changed to lime green and black for a modern, consistent look.
  - "View Profile," "Book Now," and other action buttons now use lime green with black text, inverting on hover.
  - Vendor price and vendor name hover color updated to lime green.
  - "Showing X vendors" text is now lime green.

- **UI/UX Improvements:**  
  - "Sign Up" button and icon buttons in the navigation bar now match the new color scheme.
  - "Message Vendor" button inverts to lime green with black text on hover.
  - All dropdowns and input focus rings use lime green highlights.

- **Internationalization (i18n) Rollback:**  
  - Removed all multi-language support and reverted to hardcoded English text for stability.

- **Vendor Commission Structure:**  
  - Added a section to the README describing the vendor commission structure.
  - (Temporarily displayed in the app UI, but now removed per your request.)

- **General Cleanup:**  
  - Fixed npm/react issues, ensured only one version of React is installed, and resolved "Invalid hook call" errors. 

Your Android build finished successfully!  
The warning about `flatDir` is common and not critical—it just means a certain way of including dependencies isn’t ideal, but it won’t stop your app from running.

**However, if your emulator still shows “Not found,”** it means the app launched, but the web assets (your React build) are missing or not being served correctly.

---

## What to do next:

1. **Rebuild and Re-copy the Web Assets**
   - Open a terminal in your project root (not Android Studio) and run:
     ```sh
     npm run build
     npx cap copy android
     ```
   - This ensures your latest web build is copied into the Android app.

2. **Re-run the App in Android Studio**
   - Click the green “Run” ▶️ button again.

---

### If you still see “Not found” after this:
- Let me know if there are any errors in the “Logcat” tab in Android Studio.
- Double-check that your `dist` folder (or build output) is not empty after running `npm run build`.

---

**Summary:**  
- The build is successful.
- The warning is safe to ignore.
- If the app UI is still missing, re-copy your web build and re-run the app.

Let me know what you see after trying these steps! 

If your Android emulator still says “Not found,” it means the app is running, but it can’t find or load your web assets. This is a common Capacitor/Vite issue and is usually easy to fix.

Let’s troubleshoot step by step:

---

## 1. **Check Your Build Output**
- After running `npm run build`, you should have a `dist` folder in your project root.
- **Is the `dist` folder present and does it contain `index.html` and other files?**

---

## 2. **Re-copy the Build to Android**
- In your project root (not the android folder), run:
  ```sh
  npx cap copy android
  ```

---

## 3. **Sync Capacitor (Optional but Safe)**
- Also run:
  ```sh
  npx cap sync android
  ```

---

## 4. **Re-run the App in Android Studio**
- Go back to Android Studio and click the green “Run” ▶️ button again.

---

## 5. **Check for Errors in Logcat**
- In Android Studio, open the **Logcat** tab (bottom panel).
- Look for any errors (red text) related to file loading, assets, or permissions.

---

## 6. **Check `capacitor.config.ts`**
- Make sure your `webDir` is set to `"dist"` (not `"build"` or anything else):
  ```ts
  export default {
    webDir: "dist",
    // ...other config
  }
  ```
- If you change this, re-run the build and copy steps.

---

## 7. **Restart the Emulator**
- Sometimes the emulator caches old assets. Try closing and reopening it.

---

### If you try all of the above and it still says “Not found”:
- Please copy any error messages from Logcat here.
- Let me know if your `dist` folder is present and what’s inside.
- Let me know if your `capacitor.config.ts` has the correct `webDir`.

---

**Let’s get this working! Please try these steps and let me know what you find.** 

The errors you’re seeing in Logcat (`Seed missing signature` and `Failed to open file for reading`) are related to the Android system’s WebView and are **not the cause** of your “Not found” issue. These warnings/errors are common and can be safely ignored—they do not prevent your app from loading its web content.

---

### The “Not found” screen is almost always caused by one of these:
1. **The web build (`dist` folder) is missing or empty.**
2. **The `webDir` in `capacitor.config.ts` is incorrect.**
3. **The build was not copied to the Android project (`npx cap copy android`).**
4. **The emulator is caching an old build.**

---

## Please check the following:

### 1. **Is your `dist` folder present and does it contain files like `index.html`?**
- If not, run:  
  ```sh
  npm run build
  ```

### 2. **Is your `capacitor.config.ts` set to use `webDir: "dist"`?**
- It should look like:
  ```ts
  export default {
    webDir: "dist",
    // ...other config
  }
  ```

### 3. **Did you run `npx cap copy android` after building?**
- Run:
  ```sh
  npx cap copy android
  ```

### 4. **Did you re-run the app in Android Studio after copying?**
- Click the green “Run” ▶️ button again.

### 5. **Try restarting the emulator.**
- Sometimes the emulator caches old assets.

---

**If you’ve checked all of the above and it still says “Not found”:**
- Please let me know:
  - The contents of your `dist` folder.
  - The contents of your `capacitor.config.ts` (especially the `webDir` line).
  - Any other errors in Logcat (especially ones mentioning “file not found”, “404”, or “assets”).

Let’s get this working—just let me know what you find! 

The “Broken pipe” errors you’re seeing in Logcat are related to the emulator’s internal communication and are not the cause of your “Not found” issue. These errors are common and usually harmless, especially if the emulator is still running and responsive.

**The real issue is almost always with the web assets or Capacitor config.**

---

## Please do the following and report back:

1. **Show me your `dist` folder contents.**
   - Does it contain `index.html` and other files after running `npm run build`?

2. **Show me your `capacitor.config.ts` file.**
   - Especially the `webDir` line. It should be:
     ```ts
     export default {
       webDir: "dist",
       // ...other config
     }
     ```

3. **Confirm you ran these commands in your project root:**
   ```sh
   npm run build
   npx cap copy android
   ```

4. **After copying, re-run the app in Android Studio.**

---

**If you’ve done all of the above and it still says “Not found”:**
- Please copy the exact contents of your `dist` folder and your `capacitor.config.ts` here.
- Let me know if there are any errors in Logcat mentioning “file not found”, “404”, or “assets”.

Once you provide this info, I can help you pinpoint the issue and get your app running! 

The error `Seed missing signature` is a common warning from the Android system’s WebView and is **not related** to your app’s “Not found” issue. It can be safely ignored.

---

**To solve the “Not found” problem, I need:**
1. The contents of your `dist` folder (does it have `index.html` and other files?).
2. The contents of your `capacitor.config.ts` file (especially the `webDir` line).
3. Confirmation that you ran:
   ```sh
   npm run build
   npx cap copy android
   ```
   in your project root, and then re-ran the app in Android Studio.

---

**Please provide:**
- A screenshot or list of files in your `dist` folder.
- The code from your `capacitor.config.ts`.

This will help me pinpoint the issue and get your app running on Android! 

Thank you for sharing your `dist` folder contents.  
**This is the problem:**  
Your `dist` folder only contains TypeScript and JavaScript files (`index.d.mts`, `index.d.ts`, `index.js`, `index.mjs`).  
**It does NOT contain the files generated by a Vite/React production build** (such as `index.html`, `assets/`, etc.).

---

### **What’s Wrong?**
- The `dist` folder you’re showing is likely from a library build (not your React app’s production build).
- Capacitor expects the `dist` folder to contain your web app’s static files (like `index.html`, CSS, JS bundles, etc.).

---

## **How to Fix**

1. **Check your build script in `package.json`:**
   - It should run Vite’s build, not just TypeScript.
   - The script should look like:
     ```json
     "build": "vite build"
     ```
   - If it says something like `"tsc"` or is building a library, it’s not correct for a web app.

2. **Run the correct build command:**
   ```sh
   npm run build
   ```
   - After running, your `dist` folder should contain:
     - `index.html`
     - An `assets/` folder
     - Other static files

3. **If you still don’t see `index.html` in `dist`:**
   - Make sure you are in the root of your React app (not a subfolder or a library package).
   - Double-check your `vite.config.ts` to ensure the output directory is set to `dist` (the default).

4. **After you have the correct `dist` contents:**
   ```sh
   npx cap copy android
   ```
   - Then re-run the app in Android Studio.

---

**Summary:**  
Your current `dist` folder is not your web app’s build output.  
You need to run the correct build command for your React app so that `dist` contains `index.html` and your static assets.

---

If you need help fixing your build script or want to show me your `package.json` or `vite.config.ts`, please do! I’ll walk you through the exact fix. 