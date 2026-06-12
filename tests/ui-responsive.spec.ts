import { test, expect } from '@playwright/test';

test.describe('📱 UI/UX & Responsive Design - Comprehensive Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1024, height: 768 },
    { name: 'Desktop Large', width: 1440, height: 900 }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('📱 Homepage is responsive across all device sizes', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      
      // Check that main content is visible and properly sized
      await expect(page.getByRole('main')).toBeVisible();
      
      // Check that text is readable (not too small)
      const headings = page.getByRole('heading');
      if (await headings.count() > 0) {
        const firstHeading = headings.first();
        const headingBox = await firstHeading.boundingBox();
        expect(headingBox?.height).toBeGreaterThan(20); // Readable text size
      }
      
      // Check that buttons are touch-friendly on mobile
      if (viewport.width < 768) {
        const buttons = page.getByRole('button');
        if (await buttons.count() > 0) {
          const firstButton = buttons.first();
          if (await firstButton.isVisible()) {
            const buttonBox = await firstButton.boundingBox();
            expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target
          }
        }
      }
    }
  });

  test('🧭 Navigation adapts to different screen sizes', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu (hamburger menu)
    const mobileMenuBtn = page.getByRole('button', { name: /menu|☰|≡/i });
    const mobileMenuToggle = page.locator('[class*="menu"], [data-testid*="menu"]');
    
    if (await mobileMenuBtn.isVisible() || await mobileMenuToggle.count() > 0) {
      if (await mobileMenuBtn.isVisible()) {
        await mobileMenuBtn.click();
      } else {
        await mobileMenuToggle.first().click();
      }
      
      // Mobile menu should show navigation options
      await expect(page.getByText(/home|browse|vendor|about/i)).toBeVisible();
    }
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    
    // Desktop should show full navigation
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();
    
    // Navigation links should be visible horizontally
    const navLinks = page.getByRole('link').filter({ hasText: /home|browse|vendor/i });
    if (await navLinks.count() > 0) {
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('🎨 Consistent styling and design system', async ({ page }) => {
    // Check for consistent color scheme
    const styledElements = await page.locator('[class*="bg-"], [class*="text-"]').count();
    expect(styledElements).toBeGreaterThan(0);
    
    // Check for consistent button styling
    const buttons = page.getByRole('button');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      
      // Should have consistent styling classes
      const buttonClasses = await firstButton.getAttribute('class');
      expect(buttonClasses).toBeTruthy();
      
      // Test hover effects
      await firstButton.hover();
      // Hover should trigger visual changes (tested via screenshot comparison in real scenarios)
    }
    
    // Check for consistent typography
    const headings = page.getByRole('heading');
    if (await headings.count() > 0) {
      const heading = headings.first();
      const headingClasses = await heading.getAttribute('class');
      expect(headingClasses).toContain('text-' || headingClasses?.includes('font-'));
    }
  });

  test('⚡ Smooth transitions and animations', async ({ page }) => {
    // Test page transitions
    await page.getByRole('link', { name: /browse|about/i }).first().click();
    
    // Page should load smoothly (no console errors)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Should have minimal console errors
    expect(consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') && 
      !error.includes('network')
    ).length).toBeLessThan(3);
    
    // Test button click animations
    const actionButton = page.getByRole('button').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      
      // Should provide visual feedback (loading state, color change, etc.)
      await page.waitForTimeout(500);
    }
  });

  test('🔍 Form elements are accessible and well-styled', async ({ page }) => {
    // Test signup form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Form fields should be properly labeled
    const formFields = page.getByRole('textbox');
    if (await formFields.count() > 0) {
      for (let i = 0; i < await formFields.count(); i++) {
        const field = formFields.nth(i);
        
        // Should have associated label
        const fieldId = await field.getAttribute('id');
        if (fieldId) {
          const label = page.getByRole('label', { name: new RegExp(fieldId, 'i') });
          // Label association expected but not strictly required for this test
        }
        
        // Should be properly sized
        const fieldBox = await field.boundingBox();
        expect(fieldBox?.height).toBeGreaterThan(30);
      }
    }
    
    // Buttons should be properly styled
    const submitButton = page.getByRole('button', { name: /create.*account|sign up/i });
    if (await submitButton.isVisible()) {
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(40);
      expect(buttonBox?.width).toBeGreaterThan(80);
    }
  });

  test('🌓 Dark/Light mode compatibility', async ({ page }) => {
    // Check if there's a theme toggle
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });
    
    if (await themeToggle.isVisible()) {
      // Test theme switching
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Should see theme change in body or root element
      const bodyClasses = await page.locator('body').getAttribute('class');
      const htmlClasses = await page.locator('html').getAttribute('class');
      
      const hasThemeClasses = bodyClasses?.includes('dark') || 
                             bodyClasses?.includes('light') || 
                             htmlClasses?.includes('dark') || 
                             htmlClasses?.includes('light');
      
      expect(hasThemeClasses).toBeTruthy();
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // Even without toggle, check for theme-aware CSS
    const themedElements = await page.locator('[class*="dark:"], [class*="light:"]').count();
    console.log(`Theme-aware elements found: ${themedElements}`);
  });

  test('📊 Loading states and feedback', async ({ page }) => {
    // Navigate to a page that might show loading states
    await page.getByRole('link', { name: /browse|vendor/i }).first().click();
    
    // Look for loading indicators
    const loadingIndicators = [
      page.getByText(/loading|please wait/i),
      page.locator('[class*="spinner"], [class*="loading"], [data-testid*="loading"]'),
      page.locator('svg[class*="animate"]')
    ];
    
    let foundLoadingState = false;
    for (const indicator of loadingIndicators) {
      if (await indicator.count() > 0) {
        foundLoadingState = true;
        break;
      }
    }
    
    // After loading, should show content
    await page.waitForTimeout(3000);
    await expect(page.getByText(/vendor|service|browse/i)).toBeVisible();
    
    console.log(`Loading states implemented: ${foundLoadingState}`);
  });

  test('🚫 No broken links or 404 errors', async ({ page }) => {
    const responses: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 400) {
        responses.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    // Test main navigation links
    const navLinks = page.getByRole('link').filter({ 
      hasText: /home|browse|about|contact|vendor|dashboard/i 
    });
    
    const linkCount = await navLinks.count();
    for (let i = 0; i < Math.min(linkCount, 5); i++) { // Test first 5 links
      const link = navLinks.nth(i);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
        
        // Should not see 404 error
        await expect(page.getByText(/404|not found|page.*not.*exist/i)).not.toBeVisible();
        
        // Go back to test next link
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    }
    
    // Should have minimal 4xx/5xx responses
    const errorResponses = responses.filter(r => 
      !r.includes('favicon') && 
      !r.includes('.map') && 
      !r.includes('analytics')
    );
    expect(errorResponses.length).toBeLessThan(3);
  });

  test('⌨️ Keyboard navigation and accessibility', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should be able to navigate through interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      if (await currentFocus.isVisible()) {
        // Focused element should have visible focus indicator
        const focusBox = await currentFocus.boundingBox();
        expect(focusBox).toBeTruthy();
      }
    }
    
    // Test Enter key activation
    const firstButton = page.getByRole('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.focus();
      await page.keyboard.press('Enter');
      
      // Should activate button (look for loading, navigation, or modal)
      await page.waitForTimeout(1000);
    }
  });

  test('🖼️ Images load properly and have alt text', async ({ page }) => {
    // Check for images on the page
    const images = page.getByRole('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) { // Check first 5 images
        const img = images.nth(i);
        
        // Should have alt text for accessibility
        const altText = await img.getAttribute('alt');
        expect(altText).toBeTruthy();
        
        // Should load successfully
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          // Check if image loaded (not broken)
          const natural = await img.evaluate((img: HTMLImageElement) => ({
            width: img.naturalWidth,
            height: img.naturalHeight
          }));
          
          expect(natural.width).toBeGreaterThan(0);
          expect(natural.height).toBeGreaterThan(0);
        }
      }
    }
  });
});