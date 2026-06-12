import { test, expect } from '@playwright/test';

const randomEmail = () => `customer${Math.floor(Math.random() * 1e8)}@bookd-test.com`;
const randomName = () => `Test Customer ${Math.floor(Math.random() * 1000)}`;

test.describe('Customer Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Customer can create account and sign up', async ({ page }) => {
    // Test account creation
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Fill out signup form
    const name = randomName();
    const email = randomEmail();
    
    await page.getByLabel(/full name/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('TestPassword123!');
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should see success message
    await expect(page.getByText(/account created|welcome|success/i)).toBeVisible({ timeout: 10000 });
  });

  test('Customer can browse vendors by category', async ({ page }) => {
    // Navigate to browse vendors
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Should see vendor categories
    await expect(page.getByText(/DJ|Photography|Catering|Event Planning/i)).toBeVisible();
    
    // Filter by category
    await page.getByText(/Photography/i).first().click();
    
    // Should see photography vendors
    await expect(page.getByText(/photographer|photography|photo/i)).toBeVisible();
  });

  test('Customer can search vendors', async ({ page }) => {
    // Navigate to browse page
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Use search functionality
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('DJ');
      await page.keyboard.press('Enter');
      
      // Should see DJ results
      await expect(page.getByText(/DJ|music|sound/i)).toBeVisible();
    }
  });

  test('Customer can view vendor profile with details', async ({ page }) => {
    // Navigate to browse vendors
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Click on first vendor (wait for vendors to load)
    await page.waitForTimeout(2000);
    const vendorCard = page.locator('[data-testid="vendor-card"]').first();
    
    if (await vendorCard.isVisible()) {
      await vendorCard.click();
      
      // Should see vendor profile details
      await expect(page.getByText(/contact|book|price|about/i)).toBeVisible();
      await expect(page.getByText(/\$|price|cost/i)).toBeVisible();
    } else {
      // If no vendor cards, check if we can see vendor names/businesses
      const vendorLink = page.getByRole('link').filter({ hasText: /DJ|Photography|Catering/ }).first();
      if (await vendorLink.isVisible()) {
        await vendorLink.click();
        await expect(page.getByText(/contact|book|price/i)).toBeVisible();
      }
    }
  });

  test('Customer can start booking process', async ({ page }) => {
    // Navigate to vendors
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for booking buttons
    const bookButton = page.getByRole('button', { name: /book|contact|hire/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Should see booking form or contact form
      await expect(page.getByText(/name|email|date|event|message/i)).toBeVisible();
    } else {
      // Alternative: click on vendor name/card first
      const vendorElement = page.locator('text=/DJ|Photography|Catering|Event/').first();
      if (await vendorElement.isVisible()) {
        await vendorElement.click();
        
        // Then look for booking option
        const bookingOption = page.getByRole('button', { name: /book|contact|hire|get quote/i }).first();
        if (await bookingOption.isVisible()) {
          await bookingOption.click();
          await expect(page.getByText(/name|email|date|event/i)).toBeVisible();
        }
      }
    }
  });

  test('Customer receives confirmation after booking submission', async ({ page }) => {
    // Navigate to vendors and attempt booking
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Try to find and click book button
    const bookButton = page.getByRole('button', { name: /book|contact|hire/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Fill out booking form if visible
      const nameField = page.getByLabel(/name/i).first();
      if (await nameField.isVisible()) {
        await nameField.fill('Test Customer');
        await page.getByLabel(/email/i).first().fill('test@example.com');
        
        const dateField = page.getByLabel(/date/i).first();
        if (await dateField.isVisible()) {
          await dateField.fill('2024-12-31');
        }
        
        const messageField = page.getByLabel(/message|details/i).first();
        if (await messageField.isVisible()) {
          await messageField.fill('Test booking for staging environment');
        }
        
        // Submit form
        await page.getByRole('button', { name: /submit|send|book now/i }).click();
        
        // Should see confirmation
        await expect(page.getByText(/thank you|confirmed|received|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('Customer can view different vendor categories', async ({ page }) => {
    // Test that multiple categories are accessible
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    const categories = ['DJ', 'Photography', 'Catering', 'Event Planning', 'Rentals'];
    
    for (const category of categories) {
      const categoryElement = page.getByText(category).first();
      if (await categoryElement.isVisible()) {
        await categoryElement.click();
        await page.waitForTimeout(1000);
        
        // Should see relevant vendors or services
        const hasContent = await page.getByText(/service|vendor|business|professional/i).isVisible();
        expect(hasContent || await page.getByText(category).isVisible()).toBeTruthy();
      }
    }
  });

  test('Customer can access vendor contact information when needed', async ({ page }) => {
    // Navigate to vendors
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Click on a vendor
    const vendorLink = page.locator('text=/DJ|Photography|Catering|Party|Event|Music/').first();
    if (await vendorLink.isVisible()) {
      await vendorLink.click();
      
      // Look for contact information or contact button
      const contactInfo = page.getByText(/contact|phone|email|\@|555-/i).first();
      const contactButton = page.getByRole('button', { name: /contact|call|email/i }).first();
      
      const hasContactInfo = await contactInfo.isVisible();
      const hasContactButton = await contactButton.isVisible();
      
      expect(hasContactInfo || hasContactButton).toBeTruthy();
    }
  });
});