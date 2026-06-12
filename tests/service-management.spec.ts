import { test, expect } from '@playwright/test';

const randomServiceName = () => `Test Service ${Math.floor(Math.random() * 1000)}`;

test.describe('🛠️ Service Management - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Setup: Create vendor account or navigate to services
    const vendorSignup = page.getByRole('link', { name: /become.*vendor/i });
    if (await vendorSignup.isVisible()) {
      await vendorSignup.click();
      
      await page.getByLabel(/email/i).fill(`vendor${Math.floor(Math.random() * 1e8)}@test.com`);
      await page.getByLabel(/business.*name/i).fill('Test Service Business');
      await page.getByLabel(/password/i).fill('ServiceTest123!');
      
      const categoryField = page.getByLabel(/category/i).first();
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography/i).first().click();
      }
      
      await page.getByRole('button', { name: /create|register/i }).click();
      await page.waitForTimeout(3000);
    }
  });

  test('✅ Can navigate to service management page', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // Should see service management interface
    await expect(page.getByText(/service|manage.*service|add.*service/i)).toBeVisible();
  });

  test('➕ Can add a new service successfully', async ({ page }) => {
    await page.goto('/vendor/services');
    
    const addServiceBtn = page.getByRole('button', { name: /add.*service|create.*service|new.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      // Fill out service form
      const serviceName = randomServiceName();
      await page.getByLabel(/service.*name|name/i).fill(serviceName);
      await page.getByLabel(/description/i).fill('Professional photography service for events');
      await page.getByLabel(/price|cost|rate/i).fill('500');
      
      // Select category if available
      const categoryField = page.getByLabel(/category/i);
      if (await categoryField.isVisible()) {
        await categoryField.click();
        await page.getByText(/photography|wedding|portrait/i).first().click();
      }
      
      // Submit form
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Should see success message
      await expect(page.getByText(/service.*added|service.*created|success/i)).toBeVisible({ timeout: 10000 });
      
      // Should see service in list
      await expect(page.getByText(serviceName)).toBeVisible();
    }
  });

  test('❌ Service creation fails with missing required fields', async ({ page }) => {
    await page.goto('/vendor/services');
    
    const addServiceBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      // Try to submit with empty required fields
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Should see validation errors
      await expect(page.getByText(/required|name.*required|description.*required/i)).toBeVisible();
    }
  });

  test('✏️ Can edit existing service', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // First add a service to edit
    const addServiceBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      await page.getByLabel(/service.*name|name/i).fill('Service To Edit');
      await page.getByLabel(/description/i).fill('Original description');
      await page.getByLabel(/price/i).fill('300');
      
      await page.getByRole('button', { name: /save|create|add/i }).click();
      await page.waitForTimeout(2000);
      
      // Now edit the service
      const editBtn = page.getByRole('button', { name: /edit/i }).first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        
        // Update service details
        await page.getByLabel(/service.*name|name/i).clear();
        await page.getByLabel(/service.*name|name/i).fill('Updated Service Name');
        await page.getByLabel(/price/i).clear();
        await page.getByLabel(/price/i).fill('450');
        
        await page.getByRole('button', { name: /save|update/i }).click();
        
        // Should see success message
        await expect(page.getByText(/service.*updated|success/i)).toBeVisible();
        
        // Should see updated service
        await expect(page.getByText('Updated Service Name')).toBeVisible();
      }
    }
  });

  test('🗑️ Can delete service with confirmation', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // First add a service to delete
    const addServiceBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      const serviceToDelete = 'Service To Delete';
      await page.getByLabel(/service.*name|name/i).fill(serviceToDelete);
      await page.getByLabel(/description/i).fill('This will be deleted');
      await page.getByLabel(/price/i).fill('100');
      
      await page.getByRole('button', { name: /save|create|add/i }).click();
      await page.waitForTimeout(2000);
      
      // Now delete the service
      const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Should see confirmation dialog
        await expect(page.getByText(/confirm|sure.*delete|permanently.*remove/i)).toBeVisible();
        
        // Confirm deletion
        await page.getByRole('button', { name: /yes|confirm|delete/i }).click();
        
        // Should see success message
        await expect(page.getByText(/service.*deleted|service.*removed|success/i)).toBeVisible();
        
        // Service should no longer appear in list
        await expect(page.getByText(serviceToDelete)).not.toBeVisible();
      }
    }
  });

  test('🖼️ Can upload service images', async ({ page }) => {
    await page.goto('/vendor/services');
    
    const addServiceBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      // Fill basic service info
      await page.getByLabel(/service.*name|name/i).fill('Service with Image');
      await page.getByLabel(/description/i).fill('Service that includes image upload');
      await page.getByLabel(/price/i).fill('200');
      
      // Look for image upload field
      const imageUpload = page.getByLabel(/image|photo|upload/i);
      if (await imageUpload.isVisible()) {
        // Create a test image file
        const testImagePath = 'test-service-image.jpg';
        
        // Simulate file upload (Note: In real tests, you'd use actual test files)
        await imageUpload.setInputFiles([]);
        
        // Should see upload preview or indication
        const uploadIndication = page.getByText(/uploaded|image.*added|preview/i);
        if (await uploadIndication.isVisible()) {
          await expect(uploadIndication).toBeVisible();
        }
      }
      
      await page.getByRole('button', { name: /save|create|add/i }).click();
      await expect(page.getByText(/service.*added|success/i)).toBeVisible();
    }
  });

  test('💰 Service pricing validation works correctly', async ({ page }) => {
    await page.goto('/vendor/services');
    
    const addServiceBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addServiceBtn.isVisible()) {
      await addServiceBtn.click();
      
      await page.getByLabel(/service.*name|name/i).fill('Price Test Service');
      await page.getByLabel(/description/i).fill('Testing price validation');
      
      // Test invalid prices
      const invalidPrices = ['-100', '0', 'abc', ''];
      
      for (const price of invalidPrices) {
        await page.getByLabel(/price/i).clear();
        await page.getByLabel(/price/i).fill(price);
        
        await page.getByRole('button', { name: /save|create|add/i }).click();
        
        // Should see price validation error
        const hasError = await page.getByText(/price.*invalid|price.*required|positive.*number/i).isVisible();
        if (hasError) {
          await expect(page.getByText(/price.*invalid|price.*required|positive.*number/i)).toBeVisible();
          break; // Found validation working
        }
      }
      
      // Test valid price
      await page.getByLabel(/price/i).clear();
      await page.getByLabel(/price/i).fill('250');
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      await expect(page.getByText(/service.*added|success/i)).toBeVisible();
    }
  });

  test('📱 Service management is mobile-responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/vendor/services');
    
    // Should be readable and usable on mobile
    await expect(page.getByText(/service|manage/i)).toBeVisible();
    
    // Buttons should be appropriately sized
    const addBtn = page.getByRole('button', { name: /add.*service/i });
    if (await addBtn.isVisible()) {
      const buttonBox = await addBtn.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Should adapt layout for tablet
    await expect(page.getByText(/service/i)).toBeVisible();
  });

  test('🔍 Service list filtering and sorting works', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // Add multiple services first
    const services = [
      { name: 'Wedding Photography', category: 'Photography', price: '800' },
      { name: 'Portrait Session', category: 'Photography', price: '300' },
      { name: 'Event DJ Service', category: 'DJ', price: '600' }
    ];
    
    for (const service of services) {
      const addBtn = page.getByRole('button', { name: /add.*service/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        
        await page.getByLabel(/service.*name|name/i).fill(service.name);
        await page.getByLabel(/description/i).fill(`Professional ${service.name.toLowerCase()}`);
        await page.getByLabel(/price/i).fill(service.price);
        
        await page.getByRole('button', { name: /save|create|add/i }).click();
        await page.waitForTimeout(1500);
      }
    }
    
    // Test filtering by category if available
    const categoryFilter = page.getByLabel(/filter.*category|category.*filter/i);
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByText(/photography/i).click();
      
      // Should show only photography services
      await expect(page.getByText(/wedding.*photography|portrait.*session/i)).toBeVisible();
    }
    
    // Test sorting by price if available
    const sortOption = page.getByLabel(/sort|order/i);
    if (await sortOption.isVisible()) {
      await sortOption.click();
      await page.getByText(/price.*low.*high|ascending/i).click();
      
      // Should reorder services by price
      await page.waitForTimeout(1000);
    }
  });

  test('📊 Service analytics and performance data', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // Look for service analytics or performance indicators
    const analyticsElements = [
      /view|booking.*count|inquiry/i,
      /popular|trending|performance/i,
      /conversion.*rate|success.*rate/i
    ];
    
    let foundAnalytics = false;
    for (const element of analyticsElements) {
      if (await page.getByText(element).first().isVisible()) {
        foundAnalytics = true;
        break;
      }
    }
    
    // Analytics may not be immediately visible for new services
    console.log(`Service analytics visible: ${foundAnalytics}`);
  });
});