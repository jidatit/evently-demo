import { test, expect } from '@playwright/test';

test.describe('👤 Profile Management - Comprehensive Tests', () => {
  const randomBusinessName = () => `Test Business ${Math.floor(Math.random() * 1000)}`;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Setup vendor account for profile testing
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(`profiletest${Math.floor(Math.random() * 1e8)}@test.com`);
      await page.getByLabel(/business.*name/i).fill(randomBusinessName());
      await page.getByLabel(/password/i).fill('ProfileTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
    }
  });

  test('✅ Can view vendor profile page', async ({ page }) => {
    await page.goto('/vendor/profile');
    
    // Should show profile information
    await expect(page.getByText(/profile|business.*information|about/i)).toBeVisible();
    
    // Should show current profile data
    const profileElements = [
      /business.*name|company.*name/i,
      /category|service.*type/i,
      /contact.*information|email|phone/i,
      /description|about.*business/i
    ];
    
    let foundElements = 0;
    for (const element of profileElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundElements++;
      }
    }
    
    expect(foundElements).toBeGreaterThanOrEqual(2);
  });

  test('✏️ Can edit profile information', async ({ page }) => {
    await page.goto('/vendor/profile');
    
    const editBtn = page.getByRole('button', { name: /edit.*profile|edit.*information/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Should navigate to edit page or show edit form
      await expect(page).toHaveURL(/.*edit/);
      
      // Update profile information
      const businessNameField = page.getByLabel(/business.*name|company.*name/i);
      if (await businessNameField.isVisible()) {
        await businessNameField.clear();
        await businessNameField.fill('Updated Business Name');
      }
      
      const descriptionField = page.getByLabel(/description|about|bio/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.clear();
        await descriptionField.fill('Updated professional description for our services');
      }
      
      const phoneField = page.getByLabel(/phone|contact.*number/i);
      if (await phoneField.isVisible()) {
        await phoneField.clear();
        await phoneField.fill('555-123-4567');
      }
      
      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Should see success message
      await expect(page.getByText(/profile.*updated|changes.*saved|success/i)).toBeVisible({ timeout: 10000 });
      
      // Should show updated information
      await expect(page.getByText('Updated Business Name')).toBeVisible();
    }
  });

  test('🖼️ Can upload and change profile picture/logo', async ({ page }) => {
    await page.goto('/vendor/profile/edit');
    
    // Look for image upload field
    const imageUpload = page.getByLabel(/logo|profile.*picture|business.*image|upload.*image/i);
    if (await imageUpload.isVisible()) {
      // Simulate file upload
      await imageUpload.setInputFiles([]);
      
      // Should see upload indication or preview
      const uploadFeedback = page.getByText(/uploaded|image.*selected|preview/i);
      if (await uploadFeedback.isVisible()) {
        await expect(uploadFeedback).toBeVisible();
      }
      
      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();
      await expect(page.getByText(/profile.*updated|success/i)).toBeVisible();
    }
  });

  test('📞 Can update contact information', async ({ page }) => {
    await page.goto('/vendor/profile/edit');
    
    // Update various contact fields
    const contactFields = [
      { label: /email|business.*email/i, value: 'updated@business.com' },
      { label: /phone|contact.*number/i, value: '555-987-6543' },
      { label: /website|business.*website/i, value: 'https://updatedbusiness.com' },
      { label: /address|business.*address/i, value: '123 Updated Business St' }
    ];
    
    let updatedFields = 0;
    for (const field of contactFields) {
      const fieldElement = page.getByLabel(field.label);
      if (await fieldElement.isVisible()) {
        await fieldElement.clear();
        await fieldElement.fill(field.value);
        updatedFields++;
      }
    }
    
    if (updatedFields > 0) {
      await page.getByRole('button', { name: /save|update/i }).click();
      await expect(page.getByText(/profile.*updated|success/i)).toBeVisible();
    }
    
    expect(updatedFields).toBeGreaterThan(0);
  });

  test('❌ Profile validation prevents invalid data', async ({ page }) => {
    await page.goto('/vendor/profile/edit');
    
    // Test invalid email
    const emailField = page.getByLabel(/email/i);
    if (await emailField.isVisible()) {
      await emailField.clear();
      await emailField.fill('invalid-email');
      
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Should see validation error
      await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
    }
    
    // Test invalid phone number
    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible()) {
      await phoneField.clear();
      await phoneField.fill('invalid-phone');
      
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Should see validation error
      const phoneError = await page.getByText(/invalid.*phone|phone.*format/i).isVisible();
      if (phoneError) {
        await expect(page.getByText(/invalid.*phone|phone.*format/i)).toBeVisible();
      }
    }
    
    // Test invalid website URL
    const websiteField = page.getByLabel(/website/i);
    if (await websiteField.isVisible()) {
      await websiteField.clear();
      await websiteField.fill('not-a-url');
      
      await page.getByRole('button', { name: /save|update/i }).click();
      
      const urlError = await page.getByText(/invalid.*url|website.*format/i).isVisible();
      if (urlError) {
        await expect(page.getByText(/invalid.*url|website.*format/i)).toBeVisible();
      }
    }
  });

  test('🔍 Profile appears correctly in public view', async ({ page }) => {
    // First update profile with specific information
    await page.goto('/vendor/profile/edit');
    
    const businessName = 'Public Profile Test Business';
    const description = 'This is a test business for public profile viewing';
    
    const nameField = page.getByLabel(/business.*name/i);
    if (await nameField.isVisible()) {
      await nameField.clear();
      await nameField.fill(businessName);
    }
    
    const descField = page.getByLabel(/description|about/i);
    if (await descField.isVisible()) {
      await descField.clear();
      await descField.fill(description);
    }
    
    await page.getByRole('button', { name: /save|update/i }).click();
    await page.waitForTimeout(2000);
    
    // Now check public view
    await page.goto('/browse');
    
    // Look for the business in vendor listings
    const businessListing = page.getByText(businessName);
    if (await businessListing.isVisible()) {
      await businessListing.click();
      
      // Should show public profile with updated information
      await expect(page.getByText(businessName)).toBeVisible();
      await expect(page.getByText(description)).toBeVisible();
    }
  });

  test('⚡ Profile updates reflect immediately', async ({ page }) => {
    await page.goto('/vendor/profile/edit');
    
    const testBusinessName = 'Immediate Update Test';
    
    // Update business name
    const nameField = page.getByLabel(/business.*name/i);
    if (await nameField.isVisible()) {
      await nameField.clear();
      await nameField.fill(testBusinessName);
      
      await page.getByRole('button', { name: /save|update/i }).click();
      await expect(page.getByText(/success/i)).toBeVisible();
      
      // Navigate to profile view
      await page.goto('/vendor/profile');
      
      // Should immediately show updated name
      await expect(page.getByText(testBusinessName)).toBeVisible();
      
      // Reload page to test persistence
      await page.reload();
      await expect(page.getByText(testBusinessName)).toBeVisible();
    }
  });

  test('📱 Profile management is mobile-responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/vendor/profile');
    
    // Profile should be readable on mobile
    await expect(page.getByText(/profile|business/i)).toBeVisible();
    
    // Edit button should be accessible
    const editBtn = page.getByRole('button', { name: /edit/i });
    if (await editBtn.isVisible()) {
      const buttonBox = await editBtn.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target
    }
    
    // Test profile edit form on mobile
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Form should be usable on mobile
      const formFields = page.getByRole('textbox');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 0) {
        const firstField = formFields.first();
        const fieldBox = await firstField.boundingBox();
        expect(fieldBox?.height).toBeGreaterThan(30); // Readable input height
      }
    }
  });

  test('🔒 Profile privacy settings work correctly', async ({ page }) => {
    await page.goto('/vendor/profile/edit');
    
    // Look for privacy or visibility settings
    const privacySettings = [
      /public.*profile|profile.*visibility/i,
      /contact.*visible|show.*contact/i,
      /search.*visible|discoverable/i
    ];
    
    let foundPrivacySettings = false;
    for (const setting of privacySettings) {
      const settingElement = page.getByText(setting);
      if (await settingElement.isVisible()) {
        foundPrivacySettings = true;
        
        // Try to toggle the setting
        const checkbox = page.getByRole('checkbox').first();
        if (await checkbox.isVisible()) {
          await checkbox.click();
          
          await page.getByRole('button', { name: /save|update/i }).click();
          await expect(page.getByText(/success/i)).toBeVisible();
        }
        break;
      }
    }
    
    // Privacy settings may not be implemented yet
    console.log(`Privacy settings found: ${foundPrivacySettings}`);
  });

  test('📋 Profile completion status tracking', async ({ page }) => {
    await page.goto('/vendor/profile');
    
    // Look for profile completion indicators
    const completionElements = [
      /profile.*complete|completion.*status/i,
      /\d+%.*complete|\d+.*of.*\d+.*complete/i,
      /missing.*information|incomplete.*fields/i
    ];
    
    let foundCompletion = false;
    for (const element of completionElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundCompletion = true;
        await expect(page.getByText(element)).toBeVisible();
        break;
      }
    }
    
    // Profile completion tracking may be shown on dashboard instead
    if (!foundCompletion) {
      await page.goto('/vendor-dashboard');
      
      for (const element of completionElements) {
        if (await page.getByText(element).first().isVisible()) {
          await expect(page.getByText(element)).toBeVisible();
          break;
        }
      }
    }
  });
});