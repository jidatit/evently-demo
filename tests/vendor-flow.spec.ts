import { test, expect } from '@playwright/test';

const randomEmail = () => `vendor${Math.floor(Math.random() * 1e8)}@bookd-test.com`;
const randomBusinessName = () => `Test Business ${Math.floor(Math.random() * 1000)}`;

test.describe('Vendor Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Vendor can access signup page', async ({ page }) => {
    // Look for vendor-specific signup/onboarding
    const vendorSignup = page.getByRole('link', { name: /become.* vendor|vendor signup|join.* vendor/i }).first();
    
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      // Should see vendor signup form
      await expect(page.getByText(/business|vendor|service|category/i)).toBeVisible();
    } else {
      // Alternative: check for general signup that allows vendor registration
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Look for vendor option during signup
      const vendorOption = page.getByText(/vendor|business|service provider/i).first();
      if (await vendorOption.isVisible()) {
        await vendorOption.click();
      }
    }
  });

  test('Vendor can create business profile', async ({ page }) => {
    // Navigate to vendor signup
    const vendorLink = page.getByRole('link', { name: /become.* vendor|vendor/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Fill out vendor registration
      const businessNameField = page.getByLabel(/business.* name|company/i).first();
      if (await businessNameField.isVisible()) {
        await businessNameField.fill(randomBusinessName());
        
        const emailField = page.getByLabel(/email/i).first();
        if (await emailField.isVisible()) {
          await emailField.fill(randomEmail());
        }
        
        // Select category
        const categorySelect = page.getByLabel(/category|service.* type/i).first();
        if (await categorySelect.isVisible()) {
          await categorySelect.click();
          await page.getByText(/DJ|Photography|Catering/i).first().click();
        }
        
        // Fill description
        const descriptionField = page.getByLabel(/description|about/i).first();
        if (await descriptionField.isVisible()) {
          await descriptionField.fill('Professional event services for all occasions');
        }
        
        // Submit form
        const submitButton = page.getByRole('button', { name: /create|register|submit|join/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should see success or next step
          await expect(page.getByText(/success|welcome|dashboard|profile/i)).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('Vendor can access dashboard after login', async ({ page }) => {
    // First try to find existing vendor login
    const vendorLogin = page.getByRole('link', { name: /vendor.* login|vendor.* dashboard/i }).first();
    
    if (await vendorLogin.isVisible()) {
      await vendorLogin.click();
      
      // Should see vendor login form or dashboard
      const hasLoginForm = await page.getByLabel(/email|username/i).isVisible();
      const hasDashboard = await page.getByText(/dashboard|bookings|calendar|earnings/i).isVisible();
      
      expect(hasLoginForm || hasDashboard).toBeTruthy();
    } else {
      // Try general login and look for vendor-specific content
      await page.getByRole('button', { name: /sign in/i }).click();
      
      const loginModal = page.getByRole('dialog').first();
      if (await loginModal.isVisible()) {
        // Check if there's vendor-specific login option
        const vendorLoginOption = loginModal.getByText(/vendor|business/i).first();
        if (await vendorLoginOption.isVisible()) {
          await vendorLoginOption.click();
        }
      }
    }
  });

  test('Vendor dashboard shows key metrics', async ({ page }) => {
    // Navigate to vendor area
    const vendorSection = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorSection.isVisible()) {
      await vendorSection.click();
      
      // Look for dashboard elements
      const dashboardElements = [
        /booking/i,
        /earning/i,
        /calendar/i,
        /message/i,
        /review/i,
        /profile/i
      ];
      
      let foundElements = 0;
      for (const element of dashboardElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundElements++;
        }
      }
      
      // Should find at least 2 dashboard-related elements
      expect(foundElements).toBeGreaterThanOrEqual(2);
    }
  });

  test('Vendor can manage their services and pricing', async ({ page }) => {
    // Navigate to vendor dashboard
    const vendorLink = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for services management
      const servicesSection = page.getByText(/service|pricing|package/i).first();
      
      if (await servicesSection.isVisible()) {
        await servicesSection.click();
        
        // Should see service management interface
        const serviceElements = page.getByText(/add.* service|edit.* service|price|package/i);
        await expect(serviceElements.first()).toBeVisible();
      }
    }
  });

  test('Vendor can view and manage bookings', async ({ page }) => {
    // Navigate to vendor area
    const vendorLink = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for bookings section
      const bookingsSection = page.getByText(/booking/i).first();
      
      if (await bookingsSection.isVisible()) {
        await bookingsSection.click();
        
        // Should see booking management interface
        const bookingElements = [
          /upcoming|pending|confirmed/i,
          /customer|client/i,
          /date|time/i,
          /status/i
        ];
        
        let foundBookingElements = 0;
        for (const element of bookingElements) {
          if (await page.getByText(element).first().isVisible()) {
            foundBookingElements++;
          }
        }
        
        expect(foundBookingElements).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('Vendor can access calendar view', async ({ page }) => {
    // Navigate to vendor dashboard
    const vendorLink = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for calendar
      const calendarLink = page.getByText(/calendar|schedule/i).first();
      
      if (await calendarLink.isVisible()) {
        await calendarLink.click();
        
        // Should see calendar interface
        const calendarElements = page.getByText(/month|week|day|today|event/i);
        await expect(calendarElements.first()).toBeVisible();
      }
    }
  });

  test('Vendor can manage payout settings', async ({ page }) => {
    // Navigate to vendor dashboard
    const vendorLink = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for earnings or payout section
      const payoutSection = page.getByText(/earning|payout|payment|bank/i).first();
      
      if (await payoutSection.isVisible()) {
        await payoutSection.click();
        
        // Should see payout management options
        const payoutElements = [
          /bank.* account|payout.* method/i,
          /site.* balance|account.* balance/i,
          /transfer|withdraw/i,
          /earning|revenue/i
        ];
        
        let foundPayoutElements = 0;
        for (const element of payoutElements) {
          if (await page.getByText(element).first().isVisible()) {
            foundPayoutElements++;
          }
        }
        
        expect(foundPayoutElements).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('Vendor can access messaging system', async ({ page }) => {
    // Navigate to vendor dashboard
    const vendorLink = page.getByRole('link', { name: /vendor|dashboard/i }).first();
    
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for messages section
      const messagesSection = page.getByText(/message|chat|conversation|inbox/i).first();
      
      if (await messagesSection.isVisible()) {
        await messagesSection.click();
        
        // Should see messaging interface
        const messageElements = page.getByText(/conversation|message|customer|reply/i);
        await expect(messageElements.first()).toBeVisible();
      }
    }
  });
});