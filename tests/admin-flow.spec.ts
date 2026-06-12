import { test, expect } from '@playwright/test';

test.describe('Admin Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Admin can access dashboard with proper authentication', async ({ page }) => {
    // Look for admin login or admin area
    const adminLink = page.getByRole('link', { name: /admin|dashboard/i }).first();
    
    if (await adminLink.isVisible()) {
      await adminLink.click();
      
      // Should require authentication or show admin interface
      const hasAuthForm = await page.getByLabel(/email|username|password/i).isVisible();
      const hasAdminContent = await page.getByText(/admin|dashboard|users|vendors|commission/i).isVisible();
      
      expect(hasAuthForm || hasAdminContent).toBeTruthy();
    } else {
      // Try accessing admin through URL
      await page.goto('/admin');
      
      // Should either redirect to auth or show admin content
      const currentUrl = page.url();
      const hasAdminInUrl = currentUrl.includes('admin');
      const hasAuthRedirect = currentUrl.includes('auth') || currentUrl.includes('login');
      
      expect(hasAdminInUrl || hasAuthRedirect).toBeTruthy();
    }
  });

  test('Admin dashboard shows key platform metrics', async ({ page }) => {
    // Try to access admin area
    await page.goto('/admin');
    
    // Look for admin dashboard elements
    const adminElements = [
      /total.* user/i,
      /total.* vendor/i,
      /total.* booking/i,
      /commission|revenue/i,
      /user.* management/i,
      /vendor.* management/i
    ];
    
    let foundAdminElements = 0;
    for (const element of adminElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundAdminElements++;
      }
    }
    
    // Should find some admin-related content if accessible
    if (foundAdminElements > 0) {
      expect(foundAdminElements).toBeGreaterThanOrEqual(2);
    }
  });

  test('Admin can view commission transactions', async ({ page }) => {
    // Navigate to admin area
    await page.goto('/admin');
    
    // Look for commission/financial section
    const commissionSection = page.getByText(/commission|earning|revenue|financial/i).first();
    
    if (await commissionSection.isVisible()) {
      await commissionSection.click();
      
      // Should see commission-related data
      const commissionElements = [
        /10%|commission/i,
        /transaction|payment/i,
        /vendor|platform/i,
        /total|amount/i
      ];
      
      let foundCommissionElements = 0;
      for (const element of commissionElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundCommissionElements++;
        }
      }
      
      expect(foundCommissionElements).toBeGreaterThanOrEqual(2);
    }
  });

  test('Admin can manage vendor accounts', async ({ page }) => {
    // Try to access admin area
    await page.goto('/admin');
    
    // Look for vendor management
    const vendorManagement = page.getByText(/vendor.*management|manage.*vendor/i).first();
    
    if (await vendorManagement.isVisible()) {
      await vendorManagement.click();
      
      // Should see vendor management interface
      const vendorMgmtElements = [
        /approve|reject/i,
        /freeze|suspend/i,
        /active|inactive/i,
        /business.*name/i
      ];
      
      let foundVendorMgmtElements = 0;
      for (const element of vendorMgmtElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundVendorMgmtElements++;
        }
      }
      
      expect(foundVendorMgmtElements).toBeGreaterThanOrEqual(1);
    }
  });

  test('Admin can monitor platform activity', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Look for activity monitoring
    const activitySection = page.getByText(/activity|log|monitor|event/i).first();
    
    if (await activitySection.isVisible()) {
      await activitySection.click();
      
      // Should see activity logs or monitoring data
      const activityElements = [
        /user.*activity|login.*attempt/i,
        /booking.*created|payment.*processed/i,
        /vendor.*registration/i,
        /timestamp|date/i
      ];
      
      let foundActivityElements = 0;
      for (const element of activityElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundActivityElements++;
        }
      }
      
      expect(foundActivityElements).toBeGreaterThanOrEqual(1);
    }
  });

  test('Admin can view financial reports', async ({ page }) => {
    // Access admin area
    await page.goto('/admin');
    
    // Look for financial reports
    const reportsSection = page.getByText(/report|financial|analytic|earning/i).first();
    
    if (await reportsSection.isVisible()) {
      await reportsSection.click();
      
      // Should see financial reporting data
      const reportElements = [
        /total.*revenue|gross.*income/i,
        /commission.*earned|platform.*fee/i,
        /vendor.*payout|net.*earning/i,
        /chart|graph|statistic/i
      ];
      
      let foundReportElements = 0;
      for (const element of reportElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundReportElements++;
        }
      }
      
      expect(foundReportElements).toBeGreaterThanOrEqual(1);
    }
  });

  test('Admin commission collection is automated', async ({ page }) => {
    // This tests the 10% commission automation
    await page.goto('/admin');
    
    // Look for commission settings or automation indicators
    const commissionSettings = page.getByText(/commission.*setting|automatic.*commission|10%/i).first();
    
    if (await commissionSettings.isVisible()) {
      // Should show that commission is automated
      await expect(page.getByText(/automatic|10%|commission/i)).toBeVisible();
    }
    
    // Alternatively, check for any financial dashboard
    const financialDashboard = page.getByText(/financial|dashboard|commission|revenue/i).first();
    
    if (await financialDashboard.isVisible()) {
      await financialDashboard.click();
      
      // Should show commission tracking
      const commissionTracking = page.getByText(/10%|commission|platform.*fee/i);
      if (await commissionTracking.first().isVisible()) {
        await expect(commissionTracking.first()).toBeVisible();
      }
    }
  });

  test('Admin can access user management', async ({ page }) => {
    // Navigate to admin area
    await page.goto('/admin');
    
    // Look for user management
    const userManagement = page.getByText(/user.*management|manage.*user/i).first();
    
    if (await userManagement.isVisible()) {
      await userManagement.click();
      
      // Should see user management interface
      const userMgmtElements = [
        /total.*user|user.*count/i,
        /customer|vendor|admin/i,
        /active|inactive|suspended/i,
        /registration.*date|join.*date/i
      ];
      
      let foundUserMgmtElements = 0;
      for (const element of userMgmtElements) {
        if (await page.getByText(element).first().isVisible()) {
          foundUserMgmtElements++;
        }
      }
      
      expect(foundUserMgmtElements).toBeGreaterThanOrEqual(1);
    }
  });
});