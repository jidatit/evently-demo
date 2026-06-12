import { test, expect } from '@playwright/test';

const randomEmail = () => `notification${Math.floor(Math.random() * 1e8)}@test.com`;

test.describe('📧 Notifications & Emails - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('📨 Email verification for vendor signup', async ({ page }) => {
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      const testEmail = randomEmail();
      await page.getByLabel(/email/i).fill(testEmail);
      await page.getByLabel(/business.*name/i).fill('Email Test Vendor');
      await page.getByLabel(/password/i).fill('EmailTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      
      // Should show email verification notice
      await expect(page.getByText(/verify.*email|check.*email|verification.*sent|confirm.*email/i)).toBeVisible({ timeout: 10000 });
      
      // Should show resend option
      const resendButton = page.getByRole('button', { name: /resend.*email|send.*again/i });
      if (await resendButton.isVisible()) {
        await resendButton.click();
        
        // Should show confirmation of resent email
        await expect(page.getByText(/email.*sent|verification.*resent/i)).toBeVisible();
      }
    }
  });

  test('🔄 Password reset email functionality', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Fill email for password reset
      const emailField = page.getByLabel(/email/i);
      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
        
        await page.getByRole('button', { name: /reset.*password|send.*reset/i }).click();
        
        // Should show confirmation
        await expect(page.getByText(/reset.*link.*sent|check.*email|password.*reset.*email/i)).toBeVisible();
        
        // Should indicate staging/test environment
        await expect(page.getByText(/test.*environment|staging/i)).toBeVisible();
      }
    }
  });

  test('📮 Booking confirmation emails', async ({ page }) => {
    // Navigate to booking flow
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    const bookButton = page.getByRole('button', { name: /book|hire|contact/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Fill booking form
      const testEmail = randomEmail();
      await page.getByLabel(/name/i).fill('Email Test Customer');
      await page.getByLabel(/email/i).fill(testEmail);
      
      const dateField = page.getByLabel(/date/i);
      if (await dateField.isVisible()) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        await dateField.fill(futureDate.toISOString().split('T')[0]);
      }
      
      const messageField = page.getByLabel(/message|details/i);
      if (await messageField.isVisible()) {
        await messageField.fill('Testing email notification system for bookings');
      }
      
      await page.getByRole('button', { name: /submit|send|book/i }).click();
      
      // Should show email confirmation notice
      const emailConfirmation = [
        /email.*sent|confirmation.*email/i,
        /check.*email|email.*confirmation/i,
        /notification.*sent|copy.*sent/i
      ];
      
      let foundEmailConfirmation = false;
      for (const confirmation of emailConfirmation) {
        if (await page.getByText(confirmation).isVisible()) {
          foundEmailConfirmation = true;
          await expect(page.getByText(confirmation)).toBeVisible();
          break;
        }
      }
      
      expect(foundEmailConfirmation).toBeTruthy();
    }
  });

  test('🔔 In-app notification system', async ({ page }) => {
    // Create vendor account to test notifications
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(randomEmail());
      await page.getByLabel(/business.*name/i).fill('Notification Test Vendor');
      await page.getByLabel(/password/i).fill('NotifyTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
      
      // Navigate to dashboard and check for notification area
      await page.goto('/vendor-dashboard');
      
      // Look for notification bell, badge, or section
      const notificationElements = [
        page.getByRole('button', { name: /notification|bell|alert/i }),
        page.locator('[class*="notification"], [data-testid*="notification"]'),
        page.getByText(/notification|alert|new.*message/i)
      ];
      
      let foundNotificationSystem = false;
      for (const element of notificationElements) {
        if (await element.count() > 0) {
          foundNotificationSystem = true;
          
          if (await element.first().isVisible()) {
            await element.first().click();
            
            // Should show notification dropdown or panel
            await expect(page.getByText(/notification|message|alert|no.*notification/i)).toBeVisible();
          }
          break;
        }
      }
      
      console.log(`In-app notification system found: ${foundNotificationSystem}`);
    }
  });

  test('⚙️ Notification preferences and settings', async ({ page }) => {
    // Setup user account
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const testEmail = randomEmail();
    await page.getByLabel(/name/i).fill('Notification Settings User');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('SettingsTest123!');
    
    await page.getByRole('button', { name: /create|sign up/i }).click();
    await page.waitForTimeout(3000);
    
    // Look for settings or profile area
    const settingsButton = page.getByRole('button', { name: /setting|preference|profile/i });
    const settingsLink = page.getByRole('link', { name: /setting|preference|account/i });
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
    } else if (await settingsLink.isVisible()) {
      await settingsLink.click();
    } else {
      // Try navigating directly to settings
      await page.goto('/settings');
    }
    
    // Look for notification settings
    const notificationSettings = page.getByText(/notification.*setting|email.*preference|alert.*setting/i);
    if (await notificationSettings.isVisible()) {
      await notificationSettings.click();
      
      // Should show notification preference options
      const preferenceOptions = [
        /email.*notification|email.*alert/i,
        /push.*notification|browser.*notification/i,
        /sms.*notification|text.*alert/i,
        /booking.*notification|payment.*notification/i
      ];
      
      let foundPreferences = 0;
      for (const option of preferenceOptions) {
        if (await page.getByText(option).first().isVisible()) {
          foundPreferences++;
        }
      }
      
      expect(foundPreferences).toBeGreaterThanOrEqual(2);
      
      // Test toggling notification preferences
      const toggles = page.getByRole('switch');
      const checkboxes = page.getByRole('checkbox');
      
      if (await toggles.count() > 0) {
        await toggles.first().click();
        
        // Should save preference change
        await page.waitForTimeout(1000);
      } else if (await checkboxes.count() > 0) {
        await checkboxes.first().click();
        
        // Should update preference
        await page.waitForTimeout(1000);
      }
    }
  });

  test('📊 Email delivery status and tracking', async ({ page }) => {
    // This test checks for email delivery tracking in admin/vendor area
    
    // Try admin area first
    await page.goto('/admin');
    
    // Look for email or notification management
    const emailManagement = page.getByText(/email.*management|notification.*log|email.*status/i);
    if (await emailManagement.isVisible()) {
      await emailManagement.click();
      
      // Should show email delivery statistics
      const emailStats = [
        /email.*sent|delivered|failed/i,
        /delivery.*rate|success.*rate/i,
        /bounce.*rate|unsubscribe/i,
        /email.*log|notification.*history/i
      ];
      
      let foundEmailStats = 0;
      for (const stat of emailStats) {
        if (await page.getByText(stat).first().isVisible()) {
          foundEmailStats++;
        }
      }
      
      expect(foundEmailStats).toBeGreaterThanOrEqual(1);
    } else {
      // Check vendor dashboard for email status
      await page.goto('/vendor-dashboard');
      
      const emailStatus = page.getByText(/email.*status|notification.*sent|message.*delivered/i);
      if (await emailStatus.first().isVisible()) {
        await expect(emailStatus.first()).toBeVisible();
      }
    }
  });

  test('🚨 Critical notification alerts work', async ({ page }) => {
    // Test critical system notifications (payment issues, account problems, etc.)
    
    // Create vendor account
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(randomEmail());
      await page.getByLabel(/business.*name/i).fill('Critical Alert Test Vendor');
      await page.getByLabel(/password/i).fill('CriticalTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
      
      // Check for critical alerts in dashboard
      await page.goto('/vendor-dashboard');
      
      // Look for alert banners or critical notifications
      const criticalAlerts = [
        /alert|warning|critical|urgent/i,
        /verification.*required|account.*incomplete/i,
        /payment.*issue|setup.*required/i,
        /action.*required|attention.*needed/i
      ];
      
      let foundCriticalAlerts = 0;
      for (const alert of criticalAlerts) {
        if (await page.getByText(alert).first().isVisible()) {
          foundCriticalAlerts++;
          
          // Should be prominently displayed
          const alertElement = page.getByText(alert).first();
          const alertClasses = await alertElement.getAttribute('class');
          
          // Should have alert styling (red, orange, or warning colors)
          const hasAlertStyling = alertClasses?.includes('bg-red') || 
                                  alertClasses?.includes('bg-orange') || 
                                  alertClasses?.includes('bg-yellow') ||
                                  alertClasses?.includes('alert') ||
                                  alertClasses?.includes('warning');
          
          if (hasAlertStyling) {
            await expect(alertElement).toBeVisible();
          }
        }
      }
      
      expect(foundCriticalAlerts).toBeGreaterThanOrEqual(1); // New vendors should have setup alerts
    }
  });

  test('📱 Push notification support', async ({ page }) => {
    // Test browser push notification functionality
    
    // Create user account
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await page.getByLabel(/name/i).fill('Push Notification User');
    await page.getByLabel(/email/i).fill(randomEmail());
    await page.getByLabel(/password/i).fill('PushTest123!');
    
    await page.getByRole('button', { name: /create|sign up/i }).click();
    await page.waitForTimeout(3000);
    
    // Look for push notification permission request or settings
    const pushElements = [
      /enable.*notification|allow.*notification/i,
      /push.*notification|browser.*notification/i,
      /notification.*permission|subscribe.*notification/i
    ];
    
    let foundPushOption = false;
    for (const element of pushElements) {
      const pushElement = page.getByText(element);
      if (await pushElement.first().isVisible()) {
        foundPushOption = true;
        
        await pushElement.first().click();
        
        // Browser may show permission dialog (can't be tested automatically)
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    // Check for push notification settings in user preferences
    const settingsArea = page.getByText(/setting|preference/i);
    if (await settingsArea.first().isVisible()) {
      await settingsArea.first().click();
      
      const pushSettings = page.getByText(/push.*notification|browser.*alert/i);
      if (await pushSettings.first().isVisible()) {
        foundPushOption = true;
        await expect(pushSettings.first()).toBeVisible();
      }
    }
    
    console.log(`Push notification support found: ${foundPushOption}`);
  });

  test('🔕 Unsubscribe functionality works', async ({ page }) => {
    // Test email unsubscribe process
    
    // Simulate unsubscribe link (typically would come from email)
    await page.goto('/unsubscribe?email=test@example.com&token=test-token');
    
    // Should show unsubscribe page or confirmation
    const unsubscribeElements = [
      /unsubscribe|opt.*out|stop.*email/i,
      /email.*preference|subscription.*setting/i,
      /successfully.*unsubscribed|removed.*from.*list/i
    ];
    
    let foundUnsubscribe = false;
    for (const element of unsubscribeElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundUnsubscribe = true;
        await expect(page.getByText(element)).toBeVisible();
        break;
      }
    }
    
    // If unsubscribe page doesn't exist, check for preference management
    if (!foundUnsubscribe) {
      await page.goto('/settings');
      
      const emailPrefs = page.getByText(/email.*preference|notification.*setting/i);
      if (await emailPrefs.first().isVisible()) {
        await emailPrefs.first().click();
        
        // Should allow disabling all email notifications
        const unsubscribeAll = page.getByText(/unsubscribe.*all|disable.*all.*email/i);
        if (await unsubscribeAll.first().isVisible()) {
          foundUnsubscribe = true;
          await expect(unsubscribeAll.first()).toBeVisible();
        }
      }
    }
    
    console.log(`Unsubscribe functionality found: ${foundUnsubscribe}`);
  });

  test('📧 Email template consistency and branding', async ({ page }) => {
    // This test checks that email notifications maintain consistent branding
    
    // Trigger multiple email types to verify consistency
    const emailTriggers = [
      {
        name: 'Signup Confirmation',
        action: async () => {
          await page.getByRole('button', { name: /sign up/i }).click();
          await page.getByLabel(/name/i).fill('Brand Test User');
          await page.getByLabel(/email/i).fill(randomEmail());
          await page.getByLabel(/password/i).fill('BrandTest123!');
          await page.getByRole('button', { name: /create|sign up/i }).click();
        }
      },
      {
        name: 'Password Reset',
        action: async () => {
          await page.getByRole('button', { name: /sign in/i }).click();
          const forgotLink = page.getByRole('link', { name: /forgot.*password/i });
          if (await forgotLink.isVisible()) {
            await forgotLink.click();
            await page.getByLabel(/email/i).fill('test@example.com');
            await page.getByRole('button', { name: /reset.*password/i }).click();
          }
        }
      }
    ];
    
    for (const trigger of emailTriggers) {
      await page.goto('/');
      await trigger.action();
      
      // Look for email sent confirmation with branding
      const brandingElements = [
        /book.*d|bookd/i, // Platform branding
        /staging.*test.*environment/i, // Environment indication
        /professional.*email|branded.*email/i
      ];
      
      let foundBranding = false;
      for (const element of brandingElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundBranding = true;
          break;
        }
      }
      
      // Should maintain consistent branding
      expect(foundBranding).toBeTruthy();
      
      await page.waitForTimeout(1000);
    }
  });

  test('⏰ Notification timing and scheduling', async ({ page }) => {
    // Test scheduled notifications (reminders, follow-ups, etc.)
    
    // Create booking to test reminder notifications
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    const bookButton = page.getByRole('button', { name: /book/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      const testEmail = randomEmail();
      await page.getByLabel(/name/i).fill('Reminder Test Customer');
      await page.getByLabel(/email/i).fill(testEmail);
      
      const dateField = page.getByLabel(/date/i);
      if (await dateField.isVisible()) {
        // Set event date 1 week from now (should trigger reminder)
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 7);
        await dateField.fill(reminderDate.toISOString().split('T')[0]);
      }
      
      await page.getByLabel(/message/i).fill('Testing reminder notification system');
      await page.getByRole('button', { name: /submit|send/i }).click();
      
      // Should mention reminder notifications in confirmation
      const reminderMention = page.getByText(/reminder|follow.*up|notification.*schedule/i);
      if (await reminderMention.first().isVisible()) {
        await expect(reminderMention.first()).toBeVisible();
      }
      
      // Check for notification scheduling settings
      const scheduleSettings = page.getByText(/notification.*schedule|reminder.*setting/i);
      if (await scheduleSettings.first().isVisible()) {
        await scheduleSettings.first().click();
        
        // Should show timing options
        const timingOptions = [
          /24.*hour.*before|day.*before/i,
          /week.*before|7.*day/i,
          /hour.*before|same.*day/i
        ];
        
        let foundTimingOptions = 0;
        for (const option of timingOptions) {
          if (await page.getByText(option).first().isVisible()) {
            foundTimingOptions++;
          }
        }
        
        expect(foundTimingOptions).toBeGreaterThanOrEqual(1);
      }
    }
  });
});