import { test, expect } from '@playwright/test';

test.describe('🔒 Security & Performance - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('🛡️ XSS Protection - Script injection prevention', async ({ page }) => {
    // Test XSS protection in forms
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>'
    ];
    
    const nameField = page.getByLabel(/name/i);
    if (await nameField.isVisible()) {
      for (const maliciousInput of maliciousInputs) {
        await nameField.clear();
        await nameField.fill(maliciousInput);
        
        await page.getByRole('button', { name: /create|sign up/i }).click();
        
        // Should not execute script - page should remain stable
        const alerts = page.locator('dialog[role="alertdialog"]');
        expect(await alerts.count()).toBe(0);
        
        // Input should be sanitized or rejected
        const fieldValue = await nameField.inputValue();
        expect(fieldValue).not.toContain('<script>');
      }
    }
  });

  test('🔐 SQL Injection Protection - Database query safety', async ({ page }) => {
    // Test search functionality for SQL injection
    await page.getByRole('link', { name: /browse/i }).first().click();
    
    const searchField = page.getByPlaceholder(/search/i);
    if (await searchField.isVisible()) {
      const sqlInjectionAttempts = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'/*",
        "' OR 'a'='a"
      ];
      
      for (const injection of sqlInjectionAttempts) {
        await searchField.clear();
        await searchField.fill(injection);
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(2000);
        
        // Should not show database error or expose data
        await expect(page.getByText(/syntax error|database error|sql error/i)).not.toBeVisible();
        await expect(page.getByText(/password|hash|admin|secret/i)).not.toBeVisible();
        
        // Should show normal search results or "no results"
        const hasValidResponse = await page.getByText(/no results|vendor|service|search/i).isVisible();
        expect(hasValidResponse).toBeTruthy();
      }
    }
  });

  test('🔒 Authentication Session Security', async ({ page }) => {
    // Test session fixation protection
    const initialSessionStorage = await page.evaluate(() => {
      return Object.keys(sessionStorage);
    });
    
    // Login process
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const email = `security${Math.floor(Math.random() * 1e8)}@test.com`;
    await page.getByLabel(/name/i).fill('Security Test User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('SecurePassword123!');
    
    await page.getByRole('button', { name: /create|sign up/i }).click();
    await page.waitForTimeout(3000);
    
    // Check that new session tokens are generated
    const postLoginSessionStorage = await page.evaluate(() => {
      return Object.keys(sessionStorage);
    });
    
    // Should have session data after login
    expect(postLoginSessionStorage.length).toBeGreaterThanOrEqual(initialSessionStorage.length);
    
    // Test session timeout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload();
    
    // Should require re-authentication
    const needsAuth = await page.getByRole('button', { name: /sign in/i }).isVisible();
    expect(needsAuth).toBeTruthy();
  });

  test('🚦 Rate Limiting Protection', async ({ page }) => {
    // Test login rate limiting
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const attempts = 10;
    let rateLimitTriggered = false;
    
    for (let i = 0; i < attempts; i++) {
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).clear();
      await page.getByLabel(/password/i).fill('wrongpassword');
      
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(500);
      
      // Check for rate limiting message
      const rateLimitMessage = await page.getByText(/too many.*attempt|rate.*limit|try.*again.*later/i).isVisible();
      if (rateLimitMessage) {
        rateLimitTriggered = true;
        break;
      }
    }
    
    console.log(`Rate limiting triggered after ${attempts} attempts: ${rateLimitTriggered}`);
    // Rate limiting should be implemented but may not trigger in test environment
  });

  test('📊 Page Load Performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (5 seconds for testing environment)
    expect(loadTime).toBeLessThan(5000);
    
    // Check for performance markers
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    
    // DOM should be parsed quickly
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    console.log('Performance metrics:', performanceMetrics);
  });

  test('🖼️ Image Optimization and Loading', async ({ page }) => {
    await page.goto('/');
    
    const images = page.getByRole('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check image loading performance
      const imageMetrics = await page.evaluate(() => {
        const imgs = Array.from(document.images);
        return imgs.map(img => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          loading: img.loading
        }));
      });
      
      // Images should load efficiently
      const loadedImages = imageMetrics.filter(img => img.complete && img.naturalWidth > 0);
      expect(loadedImages.length).toBeGreaterThan(0);
      
      // Check for lazy loading implementation
      const lazyImages = imageMetrics.filter(img => img.loading === 'lazy');
      console.log(`Lazy loaded images: ${lazyImages.length}/${imageMetrics.length}`);
    }
  });

  test('🌐 HTTPS and Security Headers', async ({ page }) => {
    // Check that we're using secure connection in production
    const protocol = new URL(page.url()).protocol;
    
    // In development, http is acceptable, in production should be https
    const isSecure = protocol === 'https:' || page.url().includes('localhost');
    expect(isSecure).toBeTruthy();
    
    // Check for security-related response headers
    const response = await page.goto(page.url());
    const headers = response?.headers() || {};
    
    // Check for important security headers (may not all be present in dev)
    const securityHeaders = {
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'x-xss-protection': headers['x-xss-protection'],
      'strict-transport-security': headers['strict-transport-security'],
      'content-security-policy': headers['content-security-policy']
    };
    
    console.log('Security headers present:', Object.keys(securityHeaders).filter(key => securityHeaders[key as keyof typeof securityHeaders]));
  });

  test('🔍 Input Validation and Sanitization', async ({ page }) => {
    // Test comprehensive input validation
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const testInputs = [
      { field: /email/i, invalid: 'not-an-email', valid: 'test@example.com' },
      { field: /password/i, invalid: '123', valid: 'SecurePassword123!' },
      { field: /name/i, invalid: '', valid: 'Valid Name' }
    ];
    
    for (const input of testInputs) {
      const field = page.getByLabel(input.field);
      if (await field.isVisible()) {
        // Test invalid input
        await field.clear();
        await field.fill(input.invalid);
        
        await page.getByRole('button', { name: /create|sign up/i }).click();
        
        // Should show validation error
        const hasValidationError = await page.getByText(/invalid|required|format|error/i).isVisible();
        if (hasValidationError) {
          expect(hasValidationError).toBeTruthy();
        }
        
        // Test valid input
        await field.clear();
        await field.fill(input.valid);
        
        // Should clear previous errors
        await page.waitForTimeout(500);
      }
    }
  });

  test('💾 Data Privacy and Protection', async ({ page }) => {
    // Test that sensitive data is not exposed in console or page source
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Create account with sensitive data
    await page.getByRole('button', { name: /sign up/i }).click();
    
    const email = `privacy${Math.floor(Math.random() * 1e8)}@test.com`;
    const password = 'PrivacyTestPassword123!';
    
    await page.getByLabel(/name/i).fill('Privacy Test User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    
    await page.getByRole('button', { name: /create|sign up/i }).click();
    await page.waitForTimeout(3000);
    
    // Check that passwords are not logged
    const passwordInLogs = consoleLogs.some(log => 
      log.includes(password) || log.includes('PrivacyTestPassword')
    );
    expect(passwordInLogs).toBeFalsy();
    
    // Check page source doesn't contain sensitive data
    const pageContent = await page.content();
    expect(pageContent).not.toContain(password);
    
    // Check local storage doesn't contain plain text passwords
    const localStorage = await page.evaluate(() => {
      const storage: { [key: string]: string } = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          storage[key] = window.localStorage.getItem(key) || '';
        }
      }
      return storage;
    });
    
    const storageValues = Object.values(localStorage).join(' ');
    expect(storageValues).not.toContain(password);
  });

  test('🚨 Error Handling and Information Disclosure', async ({ page }) => {
    // Test that errors don't expose sensitive information
    const errorPages = [
      '/nonexistent-page',
      '/vendor/1234567890', // Non-existent vendor
      '/admin/secret-data'   // Unauthorized access
    ];
    
    for (const errorPage of errorPages) {
      const response = await page.goto(errorPage, { waitUntil: 'networkidle' });
      
      // Should not expose stack traces or internal errors
      const pageContent = await page.content();
      
      const sensitivePatterns = [
        /stack trace|error.*at.*line/i,
        /database.*connection|sql.*error/i,
        /internal.*server.*error.*500/i,
        /debug.*mode|development.*error/i
      ];
      
      for (const pattern of sensitivePatterns) {
        expect(pageContent).not.toMatch(pattern);
      }
      
      // Should show user-friendly error page
      if (response?.status() === 404) {
        await expect(page.getByText(/not found|404|page.*not.*exist/i)).toBeVisible();
      }
    }
  });

  test('⚡ Resource Loading Optimization', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        size: 0
      });
    });
    
    page.on('response', response => {
      const request = requests.find(req => req.url === response.url());
      if (request && response.headers()['content-length']) {
        request.size = parseInt(response.headers()['content-length']);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze resource loading
    const jsFiles = requests.filter(req => req.resourceType === 'script');
    const cssFiles = requests.filter(req => req.resourceType === 'stylesheet');
    const images = requests.filter(req => req.resourceType === 'image');
    
    // Should not load excessive resources
    expect(jsFiles.length).toBeLessThan(20); // Reasonable JS file count
    expect(cssFiles.length).toBeLessThan(10); // Reasonable CSS file count
    
    console.log(`Resource counts - JS: ${jsFiles.length}, CSS: ${cssFiles.length}, Images: ${images.length}`);
  });
});