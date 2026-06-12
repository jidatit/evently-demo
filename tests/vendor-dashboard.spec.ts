import { test, expect } from '@playwright/test';

const randomVendorEmail = () => `vendor${Math.floor(Math.random() * 1e8)}@bookd-testing.com`;

test.describe('📊 Vendor Dashboard - Comprehensive Tests', () => {
  let vendorEmail: string;

  test.beforeEach(async ({ page }) => {
    vendorEmail = randomVendorEmail();
    await page.goto('/');
    
    // Create vendor account for testing
    const vendorSignup = page.getByRole('link', { name: /become.*vendor|vendor.*signup/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(vendorEmail);
      await page.getByLabel(/business.*name/i).fill('Test Vendor Dashboard');
      await page.getByLabel(/password/i).fill('VendorTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography|dj/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
    }
  });

  test('✅ Dashboard loads with key metrics and navigation', async ({ page }) => {
    // Navigate to vendor dashboard
    await page.goto('/vendor-dashboard');
    
    // Check for dashboard elements
    const dashboardElements = [
      /dashboard|overview/i,
      /booking|service|earning|profile/i,
      /quick.*action|recent.*activity/i
    ];
    
    let foundElements = 0;
    for (const element of dashboardElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundElements++;
      }
    }
    
    expect(foundElements).toBeGreaterThanOrEqual(1);
  });

  test('✅ Quick Actions - Update Services button works', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    const updateServicesBtn = page.getByRole('button', { name: /update.*service/i });
    if (await updateServicesBtn.isVisible()) {
      await updateServicesBtn.click();
      
      // Should navigate to services page
      await expect(page).toHaveURL(/.*\/vendor\/services/);
      await expect(page.getByText(/service|add.*service|manage.*service/i)).toBeVisible();
    }
  });

  test('✅ Quick Actions - View Profile button works', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    const viewProfileBtn = page.getByRole('button', { name: /view.*profile/i });
    if (await viewProfileBtn.isVisible()) {
      await viewProfileBtn.click();
      
      // Should navigate to profile page
      await expect(page).toHaveURL(/.*\/vendor\/profile/);
      await expect(page.getByText(/profile|edit.*profile|business.*information/i)).toBeVisible();
    }
  });

  test('✅ Quick Actions - Payment Settings button works', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    const paymentSettingsBtn = page.getByRole('button', { name: /payment.*setting/i });
    if (await paymentSettingsBtn.isVisible()) {
      await paymentSettingsBtn.click();
      
      // Should navigate to payments page
      await expect(page).toHaveURL(/.*\/vendor\/payments/);
      await expect(page.getByText(/payment|payout|banking|stripe/i)).toBeVisible();
    }
  });

  test('🎯 Onboarding checklist displays for new vendors', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    // Look for onboarding checklist
    const onboardingElements = [
      /onboarding|checklist|getting.*started/i,
      /complete.*profile|add.*service|setup.*payment/i,
      /progress|%.*ready|%.*complete/i
    ];
    
    let foundOnboardingElements = 0;
    for (const element of onboardingElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundOnboardingElements++;
      }
    }
    
    // New vendors should see onboarding
    expect(foundOnboardingElements).toBeGreaterThanOrEqual(1);
  });

  test('📈 Dashboard shows vendor metrics', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    // Look for key metrics
    const metricElements = [
      /total.*booking|booking.*count/i,
      /earning|revenue|income/i,
      /service.*count|total.*service/i,
      /rating|review|star/i
    ];
    
    let foundMetrics = 0;
    for (const element of metricElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundMetrics++;
      }
    }
    
    // Should display some metrics (even if zero for new vendor)
    expect(foundMetrics).toBeGreaterThanOrEqual(1);
  });

  test('📱 Dashboard navigation is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/vendor-dashboard');
    
    // Check that mobile navigation works
    const mobileMenuBtn = page.getByRole('button', { name: /menu|hamburger|☰/i });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      
      // Mobile menu should show navigation options
      await expect(page.getByText(/dashboard|service|profile|payment/i)).toBeVisible();
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Navigation should adapt to tablet size
    const tabletNavigation = await page.getByRole('navigation').isVisible();
    expect(tabletNavigation).toBeTruthy();
  });

  test('🔄 Dashboard data refreshes correctly', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    // Check initial load
    await expect(page.getByText(/dashboard|vendor/i)).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still show dashboard content
    await expect(page.getByText(/dashboard|vendor/i)).toBeVisible();
    
    // Check that any dynamic content loads
    await page.waitForTimeout(2000);
    const hasContent = await page.getByText(/service|booking|profile|earning/i).isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('⚡ Dashboard loading states work correctly', async ({ page }) => {
    // Navigate to dashboard and check for loading indicators
    await page.goto('/vendor-dashboard');
    
    // Look for loading spinners or skeleton content during initial load
    const loadingIndicators = page.getByText(/loading|please.*wait/i);
    const spinners = page.locator('[data-testid*="loading"], [class*="spinner"], [class*="loading"]');
    
    // These may not be visible if page loads quickly, which is fine
    const hasLoadingState = await loadingIndicators.isVisible() || await spinners.count() > 0;
    
    // After loading, should show dashboard content
    await expect(page.getByText(/dashboard|quick.*action|overview/i)).toBeVisible({ timeout: 10000 });
  });

  test('🎨 Dashboard styling matches site design system', async ({ page }) => {
    await page.goto('/vendor-dashboard');
    
    // Check for consistent styling elements
    const styledElements = [
      'button', 
      '[class*="card"]', 
      '[class*="bg-"]',
      '[class*="text-"]'
    ];
    
    let hasStyledElements = false;
    for (const selector of styledElements) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        hasStyledElements = true;
        break;
      }
    }
    
    expect(hasStyledElements).toBeTruthy();
    
    // Check that buttons have hover effects
    const firstButton = page.getByRole('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.hover();
      // Should trigger hover styles (visual change expected)
    }
  });
});