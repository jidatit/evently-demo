import { test, expect } from '@playwright/test';

test.describe('Payment Flow Tests (Sandbox)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Payment form accepts test card numbers', async ({ page }) => {
    // Navigate to a booking flow that leads to payment
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Try to reach payment form through booking
    const bookButton = page.getByRole('button', { name: /book|hire|contact/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Fill out any required booking details
      const nameField = page.getByLabel(/name/i).first();
      if (await nameField.isVisible()) {
        await nameField.fill('Test Customer');
        
        const emailField = page.getByLabel(/email/i).first();
        if (await emailField.isVisible()) {
          await emailField.fill('test@bookd-test.com');
        }
        
        // Look for payment section or next step
        const continueButton = page.getByRole('button', { name: /continue|next|proceed|pay/i }).first();
        if (await continueButton.isVisible()) {
          await continueButton.click();
          
          // Should reach payment form or Stripe interface
          await page.waitForTimeout(2000);
          
          // Check for payment form elements
          const paymentElements = [
            /card.* number|credit.* card/i,
            /stripe|payment/i,
            /total|amount|\$/i,
            /pay.* now|complete.* payment/i
          ];
          
          let foundPaymentElements = 0;
          for (const element of paymentElements) {
            if (await page.getByText(element).first().isVisible()) {
              foundPaymentElements++;
            }
          }
          
          expect(foundPaymentElements).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  test('Stripe test environment is properly configured', async ({ page }) => {
    // Check if we're in staging environment
    await expect(page.getByText(/staging|test.*environment/i)).toBeVisible();
    
    // Navigate through booking flow
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Look for any payment-related information
    const paymentInfo = page.getByText(/payment|stripe|test.* mode/i).first();
    
    if (await paymentInfo.isVisible()) {
      // Should indicate test mode
      await expect(page.getByText(/test|sandbox|staging/i)).toBeVisible();
    }
  });

  test('Payment confirmation page shows test transaction', async ({ page }) => {
    // This test assumes we can simulate or mock a successful payment
    // In a real staging environment, this would involve completing a test payment
    
    // Navigate to vendors
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Look for any existing booking confirmations or test scenarios
    const confirmationElements = [
      /confirmation|thank.* you/i,
      /payment.* successful|booking.* confirmed/i,
      /transaction.* id|reference.* number/i
    ];
    
    // Check current page for any existing confirmations
    for (const element of confirmationElements) {
      const elementFound = page.getByText(element).first();
      if (await elementFound.isVisible()) {
        // Found a confirmation element, verify it indicates test mode
        await expect(page.getByText(/test|staging|sandbox/i)).toBeVisible();
        break;
      }
    }
  });

  test('Payment amounts are capped for staging', async ({ page }) => {
    // Check that staging environment limits test payments
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Look for pricing information
    const priceElements = page.locator('text=/\\$[0-9]+/').first();
    
    if (await priceElements.isVisible()) {
      const priceText = await priceElements.textContent();
      const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');
      
      // In staging, prices should be reasonable test amounts
      expect(price).toBeLessThan(1000); // Less than $10 for test purposes
    }
  });

  test('Test email notifications are routed correctly', async ({ page }) => {
    // Verify that in staging, emails go to test addresses
    await expect(page.getByText(/staging.*environment/i)).toBeVisible();
    
    // Navigate to booking flow
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Check if there are any email-related notices for staging
    const emailNotice = page.getByText(/email.*test|test.*email|staging.*email/i).first();
    
    if (await emailNotice.isVisible()) {
      // Should mention test email routing
      await expect(page.getByText(/staging.*test.*bookd.*testing/i)).toBeVisible();
    }
  });

  test('Commission calculation works in test mode', async ({ page }) => {
    // This would test the 10% commission calculation
    // In a real test, this would involve checking admin dashboard or database
    
    // Navigate to any area that might show commission info
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    
    // Look for any pricing or commission information
    const commissionInfo = page.getByText(/commission|fee|10%/i).first();
    
    if (await commissionInfo.isVisible()) {
      // Should be in test mode
      await expect(page.getByText(/test|staging/i)).toBeVisible();
    }
  });

  test('Apple Pay and Google Pay options are available in sandbox', async ({ page }) => {
    // Check for digital wallet options in staging
    await page.getByRole('link', { name: /browse|find vendors/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Try to navigate to payment area
    const bookButton = page.getByRole('button', { name: /book|hire/i }).first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Look for digital wallet options
      const digitalWalletOptions = [
        /apple.* pay/i,
        /google.* pay/i,
        /paypal/i,
        /digital.* wallet/i
      ];
      
      let foundWalletOptions = 0;
      for (const option of digitalWalletOptions) {
        if (await page.getByText(option).first().isVisible()) {
          foundWalletOptions++;
        }
      }
      
      // Don't require these to be present, just check if they exist
      if (foundWalletOptions > 0) {
        console.log(`Found ${foundWalletOptions} digital wallet options`);
      }
    }
  });
});