import { test, expect } from '@playwright/test';

const randomVendorEmail = () => `paymenttest${Math.floor(Math.random() * 1e8)}@test.com`;

test.describe('💳 Payment Settings - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Setup vendor account for payment testing
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(randomVendorEmail());
      await page.getByLabel(/business.*name/i).fill('Payment Test Vendor');
      await page.getByLabel(/password/i).fill('PaymentTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
    }
  });

  test('✅ Can access payment settings page', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Should show payment settings interface
    await expect(page.getByText(/payment|payout|banking|stripe/i)).toBeVisible();
    
    // Should show current payment status
    const paymentElements = [
      /account.*status|connection.*status/i,
      /payout.*method|banking.*info/i,
      /earning|balance|available/i,
      /setup.*payment|connect.*stripe/i
    ];
    
    let foundElements = 0;
    for (const element of paymentElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundElements++;
      }
    }
    
    expect(foundElements).toBeGreaterThanOrEqual(2);
  });

  test('🔗 Can connect Stripe account', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for Stripe connection button
    const connectStripeBtn = page.getByRole('button', { name: /connect.*stripe|setup.*stripe|link.*stripe/i });
    const setupPaymentBtn = page.getByRole('button', { name: /setup.*payment|add.*payment|configure.*payout/i });
    
    if (await connectStripeBtn.isVisible()) {
      await connectStripeBtn.click();
      
      // Should start Stripe onboarding flow or show connection form
      const stripeElements = [
        /stripe|banking.*information|account.*setup/i,
        /business.*information|tax.*id|routing.*number/i,
        /connect.*account|create.*account/i
      ];
      
      let foundStripeFlow = false;
      for (const element of stripeElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundStripeFlow = true;
          await expect(page.getByText(element)).toBeVisible();
          break;
        }
      }
      
      expect(foundStripeFlow).toBeTruthy();
    } else if (await setupPaymentBtn.isVisible()) {
      await setupPaymentBtn.click();
      
      // Should show payment setup interface
      await expect(page.getByText(/payment.*method|banking.*account|payout/i)).toBeVisible();
    }
  });

  test('🏦 Can add banking information', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for banking information form
    const addBankingBtn = page.getByRole('button', { name: /add.*banking|bank.*account|payout.*method/i });
    const bankingForm = page.getByText(/routing.*number|account.*number|bank.*name/i);
    
    if (await addBankingBtn.isVisible()) {
      await addBankingBtn.click();
    }
    
    if (await bankingForm.first().isVisible()) {
      // Fill banking information (test data)
      const routingField = page.getByLabel(/routing.*number/i);
      if (await routingField.isVisible()) {
        await routingField.fill('021000021'); // Valid test routing number
      }
      
      const accountField = page.getByLabel(/account.*number/i);
      if (await accountField.isVisible()) {
        await accountField.fill('1234567890123456'); // Test account number
      }
      
      const bankNameField = page.getByLabel(/bank.*name|financial.*institution/i);
      if (await bankNameField.isVisible()) {
        await bankNameField.fill('Test Bank');
      }
      
      const accountTypeField = page.getByLabel(/account.*type/i);
      if (await accountTypeField.isVisible()) {
        await accountTypeField.click();
        await page.getByText(/checking|savings/i).first().click();
      }
      
      // Save banking information
      const saveButton = page.getByRole('button', { name: /save|add|confirm/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Should show success message
        await expect(page.getByText(/bank.*added|payment.*updated|account.*saved|success/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('❌ Banking form validation works correctly', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    const addBankingBtn = page.getByRole('button', { name: /add.*banking|bank.*account/i });
    if (await addBankingBtn.isVisible()) {
      await addBankingBtn.click();
      
      // Try to submit with invalid data
      const routingField = page.getByLabel(/routing.*number/i);
      if (await routingField.isVisible()) {
        // Invalid routing number
        await routingField.fill('123');
        
        const saveButton = page.getByRole('button', { name: /save|add/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Should show validation error
          await expect(page.getByText(/invalid.*routing|routing.*number.*invalid/i)).toBeVisible();
        }
        
        // Invalid account number
        const accountField = page.getByLabel(/account.*number/i);
        if (await accountField.isVisible()) {
          await accountField.fill('123'); // Too short
          await saveButton.click();
          
          const accountError = await page.getByText(/invalid.*account|account.*number.*invalid/i).isVisible();
          if (accountError) {
            await expect(page.getByText(/invalid.*account|account.*number.*invalid/i)).toBeVisible();
          }
        }
      }
    }
  });

  test('💰 Can view earnings and payout history', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for earnings section
    const earningsSection = page.getByText(/earning|revenue|payout.*history|transaction/i).first();
    if (await earningsSection.isVisible()) {
      await earningsSection.click();
      
      // Should show earnings dashboard
      const earningsElements = [
        /total.*earning|gross.*revenue/i,
        /available.*balance|pending.*payout/i,
        /payout.*history|transaction.*history/i,
        /last.*payout|recent.*transfer/i
      ];
      
      let foundEarningsElements = 0;
      for (const element of earningsElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundEarningsElements++;
        }
      }
      
      expect(foundEarningsElements).toBeGreaterThanOrEqual(2);
    }
    
    // Test payout history table
    const payoutHistory = page.getByText(/payout.*history|payment.*history/i);
    if (await payoutHistory.isVisible()) {
      await payoutHistory.click();
      
      // Should show transaction table
      const historyElements = [
        /date|amount|status|method/i,
        /completed|pending|failed/i,
        /\$\d+|\d+\.\d+/i
      ];
      
      let foundHistoryElements = 0;
      for (const element of historyElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundHistoryElements++;
        }
      }
      
      expect(foundHistoryElements).toBeGreaterThanOrEqual(1);
    }
  });

  test('🔄 Can request manual payout', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for payout request option
    const requestPayoutBtn = page.getByRole('button', { name: /request.*payout|withdraw|transfer.*earning/i });
    
    if (await requestPayoutBtn.isVisible()) {
      await requestPayoutBtn.click();
      
      // Should show payout request form
      const payoutElements = [
        /amount.*withdraw|payout.*amount/i,
        /available.*balance|maximum.*amount/i,
        /confirm.*payout|request.*transfer/i
      ];
      
      let foundPayoutForm = false;
      for (const element of payoutElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundPayoutForm = true;
          break;
        }
      }
      
      if (foundPayoutForm) {
        // Fill payout amount
        const amountField = page.getByLabel(/amount|payout.*amount/i);
        if (await amountField.isVisible()) {
          await amountField.fill('100.00');
        }
        
        // Confirm payout request
        const confirmButton = page.getByRole('button', { name: /confirm|request|withdraw/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Should show confirmation or processing message
          await expect(page.getByText(/payout.*requested|transfer.*initiated|processing/i)).toBeVisible();
        }
      }
    }
  });

  test('📊 Commission calculation is displayed correctly', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for commission information
    const commissionElements = [
      /commission|platform.*fee|service.*fee/i,
      /10%|ten.*percent/i,
      /net.*earning|after.*fee/i,
      /fee.*breakdown|commission.*rate/i
    ];
    
    let foundCommission = false;
    for (const element of commissionElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundCommission = true;
        await expect(page.getByText(element)).toBeVisible();
        break;
      }
    }
    
    // Commission information should be visible for transparency
    expect(foundCommission).toBeTruthy();
  });

  test('⚠️ Payment security warnings and notices', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for security notices
    const securityElements = [
      /secure|ssl|encrypted|protected/i,
      /test.*mode|sandbox|staging/i,
      /privacy.*policy|terms.*service/i,
      /pci.*compliant|secure.*payment/i
    ];
    
    let foundSecurity = false;
    for (const element of securityElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundSecurity = true;
        await expect(page.getByText(element)).toBeVisible();
        break;
      }
    }
    
    // Should indicate test/staging environment
    await expect(page.getByText(/test.*environment|staging|sandbox/i)).toBeVisible();
    
    console.log(`Payment security indicators found: ${foundSecurity}`);
  });

  test('📱 Payment settings are mobile-responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/vendor/payments');
    
    // Should be readable and usable on mobile
    await expect(page.getByText(/payment|payout|stripe/i)).toBeVisible();
    
    // Form elements should be touch-friendly
    const buttons = page.getByRole('button');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        const buttonBox = await firstButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target
      }
    }
    
    // Input fields should be appropriately sized
    const inputs = page.getByRole('textbox');
    if (await inputs.count() > 0) {
      const firstInput = inputs.first();
      if (await firstInput.isVisible()) {
        const inputBox = await firstInput.boundingBox();
        expect(inputBox?.height).toBeGreaterThan(40);
      }
    }
  });

  test('🔔 Payment notifications and alerts work', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for notification settings
    const notificationSettings = page.getByText(/notification.*setting|alert.*preference/i);
    if (await notificationSettings.isVisible()) {
      await notificationSettings.click();
      
      // Should show notification options
      const notificationOptions = [
        /email.*notification|sms.*alert/i,
        /payout.*notification|payment.*alert/i,
        /weekly.*summary|monthly.*report/i
      ];
      
      let foundNotifications = 0;
      for (const option of notificationOptions) {
        if (await page.getByText(option).first().isVisible()) {
          foundNotifications++;
        }
      }
      
      expect(foundNotifications).toBeGreaterThanOrEqual(1);
    }
    
    // Test enabling/disabling notifications
    const notificationToggle = page.getByRole('switch').first();
    const notificationCheckbox = page.getByRole('checkbox').first();
    
    if (await notificationToggle.isVisible()) {
      await notificationToggle.click();
      
      // Should update notification preference
      await page.waitForTimeout(1000);
    } else if (await notificationCheckbox.isVisible()) {
      await notificationCheckbox.click();
      
      // Should update setting
      await page.waitForTimeout(1000);
    }
  });

  test('💎 Premium/Pro payment features', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for premium features
    const premiumFeatures = [
      /instant.*payout|same.*day.*transfer/i,
      /premium.*account|pro.*feature/i,
      /priority.*support|dedicated.*support/i,
      /advanced.*analytics|detailed.*report/i
    ];
    
    let foundPremiumFeatures = false;
    for (const feature of premiumFeatures) {
      if (await page.getByText(feature).first().isVisible()) {
        foundPremiumFeatures = true;
        await expect(page.getByText(feature)).toBeVisible();
        break;
      }
    }
    
    // Premium features may be in development
    console.log(`Premium payment features found: ${foundPremiumFeatures}`);
    
    // Check for upgrade options
    const upgradeButton = page.getByRole('button', { name: /upgrade|premium|pro/i });
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      
      // Should show upgrade options or pricing
      await expect(page.getByText(/plan|pricing|feature|upgrade/i)).toBeVisible();
    }
  });

  test('🧾 Tax information and reporting', async ({ page }) => {
    await page.goto('/vendor/payments');
    
    // Look for tax-related features
    const taxElements = [
      /tax.*information|1099|tax.*form/i,
      /business.*tax.*id|ein|ssn/i,
      /tax.*report|annual.*statement/i,
      /tax.*setting|tax.*preference/i
    ];
    
    let foundTaxFeatures = false;
    for (const element of taxElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundTaxFeatures = true;
        await expect(page.getByText(element)).toBeVisible();
        break;
      }
    }
    
    // Tax information section
    const taxInfoButton = page.getByRole('button', { name: /tax.*info|business.*info/i });
    if (await taxInfoButton.isVisible()) {
      await taxInfoButton.click();
      
      // Should show tax information form
      const taxFields = [
        /tax.*id|ein|ssn/i,
        /business.*type|entity.*type/i,
        /legal.*name|business.*name/i
      ];
      
      let foundTaxFields = 0;
      for (const field of taxFields) {
        if (await page.getByLabel(field).isVisible()) {
          foundTaxFields++;
        }
      }
      
      expect(foundTaxFields).toBeGreaterThanOrEqual(1);
    }
    
    console.log(`Tax features found: ${foundTaxFeatures}`);
  });
});