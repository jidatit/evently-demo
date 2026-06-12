import { test, expect } from '@playwright/test';

const randomEmail = () => `test${Math.floor(Math.random() * 1e8)}@bookd-testing.com`;
const randomVendorEmail = () => `vendor${Math.floor(Math.random() * 1e8)}@bookd-testing.com`;

test.describe('🔐 Authentication & Access Control - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('✅ User can sign up with valid credentials', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const name = 'Test User ' + Math.floor(Math.random() * 1000);
    const email = randomEmail();
    
    await page.getByLabel(/full name/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('SecurePassword123!');
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/account created|welcome|success/i)).toBeVisible({ timeout: 15000 });
  });

  test('❌ Signup fails with invalid email format', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('Password123!');
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
  });

  test('❌ Signup fails with weak password', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(randomEmail());
    await page.getByLabel(/password/i).fill('123'); // Weak password
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/password.*weak|password.*short|password.*requirements/i)).toBeVisible();
  });

  test('✅ User can log in with valid credentials', async ({ page }) => {
    // First create account
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const email = randomEmail();
    const password = 'TestPassword123!';
    
    await page.getByLabel(/full name/i).fill('Test Login User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/account created|success/i)).toBeVisible({ timeout: 10000 });
    
    // Log out if auto-logged in
    const logoutBtn = page.getByRole('button', { name: /log out|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
    
    // Now test login
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('❌ Login fails with invalid credentials', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.getByLabel(/email/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page.getByText(/invalid.*credentials|login.*failed|incorrect/i)).toBeVisible();
  });

  test('🔐 Vendor signup requires additional verification', async ({ page }) => {
    const vendorSignupBtn = page.getByRole('link', { name: /become.*vendor|vendor.*signup/i });
    
    if (await vendorSignupBtn.isVisible()) {
      await vendorSignupBtn.click();
      
      // Fill vendor signup form
      const email = randomVendorEmail();
      await page.getByLabel(/email|business.*email/i).fill(email);
      await page.getByLabel(/business.*name|company/i).fill('Test Vendor Business');
      await page.getByLabel(/password/i).fill('VendorPass123!');
      
      // Select category if available
      const categoryField = page.getByLabel(/category|service.*type/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography|dj|catering/i).first().click();
      }
      
      await page.getByRole('button', { name: /create.*account|register|join/i }).click();
      
      // Should see verification requirement
      await expect(page.getByText(/verify.*email|check.*email|verification/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('🔄 Password reset functionality works', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /reset.*password|send.*reset/i }).click();
      
      await expect(page.getByText(/reset.*link.*sent|check.*email|password.*reset/i)).toBeVisible();
    }
  });

  test('🛡️ Protected routes require authentication', async ({ page }) => {
    // Try accessing protected vendor routes directly
    const protectedRoutes = [
      '/vendor-dashboard',
      '/vendor/services',
      '/vendor/profile',
      '/vendor/payments'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to auth or show login requirement
      const hasAuthRedirect = page.url().includes('auth') || page.url().includes('login');
      const hasLoginForm = await page.getByLabel(/email|username/i).isVisible();
      const hasAuthModal = await page.getByRole('dialog').isVisible();
      
      expect(hasAuthRedirect || hasLoginForm || hasAuthModal).toBeTruthy();
    }
  });

  test('⏰ Session timeout handling works correctly', async ({ page }) => {
    // Create and login user
    await page.getByRole('button', { name: /sign up/i }).click();
    const email = randomEmail();
    
    await page.getByLabel(/full name/i).fill('Session Test User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('SessionTest123!');
    await page.getByRole('button', { name: /create account/i }).click();
    
    await expect(page.getByText(/account created|welcome/i)).toBeVisible({ timeout: 10000 });
    
    // Simulate session expiry by clearing localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to access protected content
    await page.reload();
    
    // Should require re-authentication
    const needsAuth = await page.getByRole('button', { name: /sign in/i }).isVisible();
    expect(needsAuth).toBeTruthy();
  });

  test('🔒 Role-based access control works', async ({ page }) => {
    // Try accessing admin routes
    await page.goto('/admin');
    
    // Should require admin authentication
    const hasAuthProtection = 
      page.url().includes('auth') || 
      await page.getByText(/access.*denied|unauthorized|admin.*required/i).isVisible() ||
      await page.getByLabel(/email/i).isVisible();
    
    expect(hasAuthProtection).toBeTruthy();
  });
});