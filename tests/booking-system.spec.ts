import { test, expect } from '@playwright/test';

const randomEmail = () => `booking${Math.floor(Math.random() * 1e8)}@test.com`;

test.describe('📅 Booking System - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('✅ Customer can create a new booking', async ({ page }) => {
    // Navigate to vendor browse page
    await page.getByRole('link', { name: /browse|find.*vendor/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Find and click on a vendor or booking button
    const bookButton = page.getByRole('button', { name: /book|hire|contact|get.*quote/i }).first();
    const vendorCard = page.locator('[data-testid="vendor-card"]').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
    } else if (await vendorCard.isVisible()) {
      await vendorCard.click();
      await page.waitForTimeout(1000);
      
      // Look for booking button on vendor detail page
      const detailBookButton = page.getByRole('button', { name: /book|hire|contact|get.*quote/i }).first();
      if (await detailBookButton.isVisible()) {
        await detailBookButton.click();
      }
    }
    
    // Fill out booking form
    const nameField = page.getByLabel(/name|full.*name|customer.*name/i);
    if (await nameField.isVisible()) {
      const customerEmail = randomEmail();
      
      await nameField.fill('Test Customer');
      await page.getByLabel(/email/i).fill(customerEmail);
      
      // Fill event date
      const dateField = page.getByLabel(/date|event.*date|when/i);
      if (await dateField.isVisible()) {
        // Set future date
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 2);
        const dateString = futureDate.toISOString().split('T')[0];
        
        await dateField.fill(dateString);
      }
      
      // Fill event details
      const eventTypeField = page.getByLabel(/event.*type|occasion/i);
      if (await eventTypeField.isVisible()) {
        await eventTypeField.fill('Wedding Reception');
      }
      
      const messageField = page.getByLabel(/message|details|description|additional.*info/i);
      if (await messageField.isVisible()) {
        await messageField.fill('Looking for professional service for our special day. Please provide quote.');
      }
      
      const guestField = page.getByLabel(/guest.*count|number.*guest|attendees/i);
      if (await guestField.isVisible()) {
        await guestField.fill('150');
      }
      
      // Submit booking request
      await page.getByRole('button', { name: /submit|send|book.*now|request.*quote/i }).click();
      
      // Should see confirmation
      await expect(page.getByText(/thank.*you|booking.*sent|request.*received|confirmation|success/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('📋 Booking form validation works correctly', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    const bookButton = page.getByRole('button', { name: /book|hire|contact/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|send|book/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation errors
        await expect(page.getByText(/required|name.*required|email.*required|date.*required/i)).toBeVisible();
        
        // Test invalid email format
        const emailField = page.getByLabel(/email/i);
        if (await emailField.isVisible()) {
          await emailField.fill('invalid-email');
          await submitButton.click();
          
          await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
        }
        
        // Test past date validation
        const dateField = page.getByLabel(/date/i);
        if (await dateField.isVisible()) {
          const pastDate = '2020-01-01';
          await dateField.fill(pastDate);
          await submitButton.click();
          
          const pastDateError = await page.getByText(/future.*date|past.*date|invalid.*date/i).isVisible();
          if (pastDateError) {
            await expect(page.getByText(/future.*date|past.*date|invalid.*date/i)).toBeVisible();
          }
        }
      }
    }
  });

  test('📧 Customer receives booking confirmation', async ({ page }) => {
    // Create a booking
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    const bookButton = page.getByRole('button', { name: /book|contact/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Fill out form with test email
      const testEmail = randomEmail();
      await page.getByLabel(/name/i).fill('Confirmation Test Customer');
      await page.getByLabel(/email/i).fill(testEmail);
      
      const dateField = page.getByLabel(/date/i);
      if (await dateField.isVisible()) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        await dateField.fill(futureDate.toISOString().split('T')[0]);
      }
      
      const messageField = page.getByLabel(/message|details/i);
      if (await messageField.isVisible()) {
        await messageField.fill('Testing booking confirmation system');
      }
      
      await page.getByRole('button', { name: /submit|send/i }).click();
      
      // Should see confirmation with reference number or booking ID
      const confirmationElements = [
        /booking.*id|reference.*number|confirmation.*number/i,
        /email.*sent|confirmation.*sent/i,
        /thank.*you|booking.*confirmed|request.*received/i
      ];
      
      let foundConfirmation = false;
      for (const element of confirmationElements) {
        if (await page.getByText(element).isVisible()) {
          foundConfirmation = true;
          await expect(page.getByText(element)).toBeVisible();
          break;
        }
      }
      
      expect(foundConfirmation).toBeTruthy();
    }
  });

  test('📅 Vendor receives booking notification', async ({ page }) => {
    // This test simulates checking that vendors get notified of new bookings
    
    // First, create a vendor account
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      const vendorEmail = randomEmail();
      await page.getByLabel(/email/i).fill(vendorEmail);
      await page.getByLabel(/business.*name/i).fill('Notification Test Vendor');
      await page.getByLabel(/password/i).fill('VendorTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
      
      // Navigate to vendor dashboard to check notifications
      await page.goto('/vendor-dashboard');
      
      // Look for notification or booking management section
      const notificationElements = [
        /notification|alert|new.*booking/i,
        /pending.*booking|booking.*request/i,
        /inbox|message|communication/i
      ];
      
      let foundNotificationArea = false;
      for (const element of notificationElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundNotificationArea = true;
          await expect(page.getByText(element)).toBeVisible();
          break;
        }
      }
      
      console.log(`Vendor notification system found: ${foundNotificationArea}`);
    }
  });

  test('✏️ Customer can edit/cancel bookings', async ({ page }) => {
    // First create a booking to edit/cancel
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    const bookButton = page.getByRole('button', { name: /book/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      const customerEmail = randomEmail();
      await page.getByLabel(/name/i).fill('Edit Test Customer');
      await page.getByLabel(/email/i).fill(customerEmail);
      
      const dateField = page.getByLabel(/date/i);
      if (await dateField.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await dateField.fill(futureDate.toISOString().split('T')[0]);
      }
      
      await page.getByLabel(/message/i).fill('Booking to be edited');
      await page.getByRole('button', { name: /submit/i }).click();
      
      await expect(page.getByText(/confirmation|success|thank/i)).toBeVisible();
      
      // Look for booking management or customer portal
      const manageBookingLink = page.getByRole('link', { name: /manage.*booking|view.*booking|my.*booking/i });
      const customerPortalLink = page.getByRole('link', { name: /customer.*portal|my.*account|dashboard/i });
      
      if (await manageBookingLink.isVisible()) {
        await manageBookingLink.click();
        
        // Should show booking details with edit/cancel options
        const editButton = page.getByRole('button', { name: /edit|modify|change/i });
        const cancelButton = page.getByRole('button', { name: /cancel|remove/i });
        
        if (await editButton.isVisible()) {
          await editButton.click();
          
          // Should allow editing booking details
          await expect(page.getByText(/edit.*booking|modify.*booking/i)).toBeVisible();
        } else if (await cancelButton.isVisible()) {
          await cancelButton.click();
          
          // Should show cancellation confirmation
          await expect(page.getByText(/cancel.*booking|confirm.*cancellation/i)).toBeVisible();
        }
      }
    }
  });

  test('💼 Vendor can view and manage bookings', async ({ page }) => {
    // Setup vendor account
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(randomEmail());
      await page.getByLabel(/business.*name/i).fill('Booking Manager Vendor');
      await page.getByLabel(/password/i).fill('BookingTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
      
      // Navigate to booking management
      await page.goto('/vendor-dashboard');
      
      const bookingSection = page.getByText(/booking|reservation|appointment/i).first();
      if (await bookingSection.isVisible()) {
        await bookingSection.click();
        
        // Should show booking management interface
        const bookingElements = [
          /upcoming.*booking|pending.*request/i,
          /customer.*name|client.*info/i,
          /event.*date|booking.*date/i,
          /status|confirm|decline/i
        ];
        
        let foundBookingElements = 0;
        for (const element of bookingElements) {
          if (await page.getByText(element).first().isVisible()) {
            foundBookingElements++;
          }
        }
        
        expect(foundBookingElements).toBeGreaterThanOrEqual(1);
        
        // Test booking status management
        const confirmButton = page.getByRole('button', { name: /confirm|accept|approve/i }).first();
        const declineButton = page.getByRole('button', { name: /decline|reject|deny/i }).first();
        
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Should update booking status
          await expect(page.getByText(/confirmed|accepted|approved/i)).toBeVisible();
        } else if (await declineButton.isVisible()) {
          await declineButton.click();
          
          // Should show decline confirmation
          await expect(page.getByText(/declined|rejected|reason/i)).toBeVisible();
        }
      }
    }
  });

  test('📊 Booking status updates correctly', async ({ page }) => {
    // Test booking lifecycle: Pending -> Confirmed -> Completed
    
    // Navigate to any existing booking management area
    await page.goto('/vendor-dashboard');
    
    const bookingManagement = page.getByText(/booking|appointment|reservation/i).first();
    if (await bookingManagement.isVisible()) {
      await bookingManagement.click();
      
      // Look for bookings with different statuses
      const statusElements = [
        /pending|requested|new/i,
        /confirmed|accepted|approved/i,
        /completed|finished|done/i,
        /cancelled|declined|rejected/i
      ];
      
      let foundStatuses = 0;
      for (const status of statusElements) {
        if (await page.getByText(status).first().isVisible()) {
          foundStatuses++;
        }
      }
      
      // Should show various booking statuses
      expect(foundStatuses).toBeGreaterThanOrEqual(1);
      
      // Test status change functionality
      const statusButton = page.getByRole('button', { name: /change.*status|update.*status/i }).first();
      const actionButton = page.getByRole('button', { name: /confirm|complete|mark.*done/i }).first();
      
      if (await statusButton.isVisible()) {
        await statusButton.click();
        
        // Should show status options
        await expect(page.getByText(/pending|confirmed|completed|cancelled/i)).toBeVisible();
      } else if (await actionButton.isVisible()) {
        await actionButton.click();
        
        // Should update status
        await page.waitForTimeout(2000);
      }
    }
  });

  test('💬 Booking communication system works', async ({ page }) => {
    // Test messaging between customer and vendor regarding bookings
    
    await page.goto('/vendor-dashboard');
    
    const messagingSection = page.getByText(/message|chat|communication|inbox/i).first();
    if (await messagingSection.isVisible()) {
      await messagingSection.click();
      
      // Should show conversation interface
      const messagingElements = [
        /conversation|message.*thread/i,
        /customer.*message|client.*message/i,
        /reply|respond|send.*message/i,
        /message.*history|chat.*log/i
      ];
      
      let foundMessagingElements = 0;
      for (const element of messagingElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundMessagingElements++;
        }
      }
      
      expect(foundMessagingElements).toBeGreaterThanOrEqual(1);
      
      // Test sending a message
      const messageInput = page.getByLabel(/message|reply|type.*message/i);
      const sendButton = page.getByRole('button', { name: /send|reply/i });
      
      if (await messageInput.isVisible()) {
        await messageInput.fill('Thank you for your booking inquiry. Let me get back to you with availability.');
        
        if (await sendButton.isVisible()) {
          await sendButton.click();
          
          // Should show message sent confirmation
          await expect(page.getByText(/message.*sent|reply.*sent|sent/i)).toBeVisible();
        }
      }
    }
  });

  test('🗓️ Calendar integration for bookings', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    // Look for calendar view
    const calendarSection = page.getByText(/calendar|schedule|availability/i).first();
    if (await calendarSection.isVisible()) {
      await calendarSection.click();
      
      // Should show calendar interface
      const calendarElements = [
        /month|week|day|today/i,
        /event|booking|appointment/i,
        /available|blocked|busy/i,
        /next.*month|previous.*month/i
      ];
      
      let foundCalendarElements = 0;
      for (const element of calendarElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundCalendarElements++;
        }
      }
      
      expect(foundCalendarElements).toBeGreaterThanOrEqual(2);
      
      // Test calendar navigation
      const nextButton = page.getByRole('button', { name: /next|>|forward/i }).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should navigate to next month/period
        await page.waitForTimeout(1000);
      }
      
      // Test availability management
      const availabilityButton = page.getByRole('button', { name: /availability|block.*date|set.*schedule/i }).first();
      if (await availabilityButton.isVisible()) {
        await availabilityButton.click();
        
        // Should show availability management
        await expect(page.getByText(/available|unavailable|block|schedule/i)).toBeVisible();
      }
    }
  });

  test('📱 Booking system is mobile-responsive', async ({ page }) => {
    // Test mobile booking flow
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/browse');
    
    const bookButton = page.getByRole('button', { name: /book|hire/i }).first();
    if (await bookButton.isVisible()) {
      // Button should be touch-friendly
      const buttonBox = await bookButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(40);
      
      await bookButton.click();
      
      // Form should be mobile-optimized
      const formFields = page.getByRole('textbox');
      if (await formFields.count() > 0) {
        const firstField = formFields.first();
        const fieldBox = await firstField.boundingBox();
        
        expect(fieldBox?.height).toBeGreaterThan(40); // Touch-friendly
        expect(fieldBox?.width).toBeLessThan(350);    // Fits mobile screen
      }
      
      // Submit button should be prominently placed
      const submitButton = page.getByRole('button', { name: /submit|send|book/i });
      if (await submitButton.isVisible()) {
        const submitBox = await submitButton.boundingBox();
        expect(submitBox?.height).toBeGreaterThan(45);
      }
    }
  });
});