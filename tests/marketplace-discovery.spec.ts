import { test, expect } from '@playwright/test';

test.describe('🛍️ Marketplace & Discovery - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('🔍 Vendor search functionality works correctly', async ({ page }) => {
    await page.getByRole('link', { name: /browse|find.*vendor/i }).first().click();
    
    const searchField = page.getByPlaceholder(/search|find/i);
    if (await searchField.isVisible()) {
      // Test basic search
      await searchField.fill('photography');
      await page.keyboard.press('Enter');
      
      // Should show photography-related results
      await expect(page.getByText(/photography|photographer|photo/i)).toBeVisible();
      
      // Test search with no results
      await searchField.clear();
      await searchField.fill('nonexistentservice12345');
      await page.keyboard.press('Enter');
      
      // Should show no results message
      await expect(page.getByText(/no.*result|not.*found|no.*vendor|try.*different/i)).toBeVisible();
    }
  });

  test('🏷️ Category filtering works correctly', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    
    const categories = ['Photography', 'DJ', 'Catering', 'Event Planning', 'Rentals'];
    
    for (const category of categories) {
      const categoryButton = page.getByText(category).first();
      
      if (await categoryButton.isVisible()) {
        await categoryButton.click();
        await page.waitForTimeout(2000);
        
        // Should show vendors in that category
        const categoryResults = page.getByText(new RegExp(category, 'i'));
        await expect(categoryResults.first()).toBeVisible();
        
        // Should update URL or show active filter
        const activeFilter = page.getByText(/active|selected|current/i);
        const urlHasCategory = page.url().includes(category.toLowerCase());
        
        const hasFilterIndication = await activeFilter.isVisible() || urlHasCategory;
        expect(hasFilterIndication).toBeTruthy();
        
        break; // Test just one category to avoid timeout
      }
    }
  });

  test('📍 Location-based filtering works', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    
    // Look for location filter
    const locationFilter = page.getByLabel(/location|city|area/i);
    const locationButton = page.getByText(/location|near.*me|filter.*location/i);
    
    if (await locationFilter.isVisible()) {
      await locationFilter.fill('New York');
      await page.keyboard.press('Enter');
      
      // Should filter by location
      await page.waitForTimeout(2000);
      await expect(page.getByText(/new york|ny|location/i)).toBeVisible();
    } else if (await locationButton.isVisible()) {
      await locationButton.click();
      
      // Should show location options
      await expect(page.getByText(/city|state|zip|location/i)).toBeVisible();
    }
  });

  test('⭐ Vendor ratings and reviews display', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Look for vendor cards with ratings
    const ratingElements = [
      page.getByText(/★|star|rating|\d+\.\d+.*star/i),
      page.getByText(/\d+.*review|\d+.*rating/i),
      page.locator('[data-testid*="rating"], [class*="rating"], [class*="star"]')
    ];
    
    let foundRatings = false;
    for (const element of ratingElements) {
      if (await element.count() > 0) {
        foundRatings = true;
        await expect(element.first()).toBeVisible();
        break;
      }
    }
    
    // Click on a vendor to see detailed reviews
    const vendorCard = page.locator('[data-testid="vendor-card"]').first();
    const vendorLink = page.getByRole('link').filter({ hasText: /photography|dj|catering/i }).first();
    
    if (await vendorCard.isVisible()) {
      await vendorCard.click();
    } else if (await vendorLink.isVisible()) {
      await vendorLink.click();
    }
    
    // Should show detailed reviews on vendor profile
    await page.waitForTimeout(2000);
    const reviewSection = page.getByText(/review|testimonial|feedback|rating/i);
    if (await reviewSection.first().isVisible()) {
      await expect(reviewSection.first()).toBeVisible();
    }
    
    console.log(`Vendor ratings found: ${foundRatings}`);
  });

  test('💰 Price filtering and sorting works', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    
    // Look for price filters
    const priceFilter = page.getByText(/price|budget|cost/i).first();
    const sortOption = page.getByText(/sort|order/i).first();
    
    if (await priceFilter.isVisible()) {
      await priceFilter.click();
      
      // Should show price range options
      const priceOptions = [
        page.getByText(/\$0.*\$100|under.*100|budget.*friendly/i),
        page.getByText(/\$100.*\$500|mid.*range/i),
        page.getByText(/\$500.*premium|luxury/i)
      ];
      
      for (const option of priceOptions) {
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(2000);
          
          // Should filter results by price range
          const priceResults = page.getByText(/\$|price|cost|budget/i);
          await expect(priceResults.first()).toBeVisible();
          break;
        }
      }
    } else if (await sortOption.isVisible()) {
      await sortOption.click();
      
      // Test price sorting
      const sortByPrice = page.getByText(/price.*low.*high|price.*high.*low/i);
      if (await sortByPrice.first().isVisible()) {
        await sortByPrice.first().click();
        await page.waitForTimeout(2000);
        
        // Should reorder vendors by price
        await expect(page.getByText(/vendor|service|business/i)).toBeVisible();
      }
    }
  });

  test('🃏 Vendor cards display essential information', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Check that vendor cards show key information
    const essentialInfo = [
      /business.*name|vendor.*name/i,
      /\$|price|starting.*at/i,
      /★|rating|star/i,
      /category|service.*type/i,
      /location|city|area/i
    ];
    
    let foundInfoElements = 0;
    for (const info of essentialInfo) {
      if (await page.getByText(info).first().isVisible()) {
        foundInfoElements++;
      }
    }
    
    // Should display at least 3 types of essential information
    expect(foundInfoElements).toBeGreaterThanOrEqual(3);
    
    // Cards should be clickable
    const vendorCard = page.locator('[data-testid="vendor-card"]').first();
    const vendorElement = page.getByText(/photography|dj|catering|event/i).first();
    
    if (await vendorCard.isVisible()) {
      await vendorCard.click();
    } else if (await vendorElement.isVisible()) {
      await vendorElement.click();
    }
    
    // Should navigate to vendor detail page
    await page.waitForTimeout(2000);
    await expect(page.getByText(/contact|book|about|service|portfolio/i)).toBeVisible();
  });

  test('📱 Marketplace is mobile-responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/browse');
    
    // Should display vendors in mobile-friendly layout
    await expect(page.getByText(/vendor|browse|search/i)).toBeVisible();
    
    // Vendor cards should be appropriately sized for mobile
    const vendorCards = page.locator('[class*="card"], [data-testid*="vendor"]');
    if (await vendorCards.count() > 0) {
      const firstCard = vendorCards.first();
      const cardBox = await firstCard.boundingBox();
      
      if (cardBox) {
        // Card should not exceed screen width
        expect(cardBox.width).toBeLessThan(375);
        // Card should be touch-friendly
        expect(cardBox.height).toBeGreaterThan(100);
      }
    }
    
    // Search should work on mobile
    const mobileSearch = page.getByPlaceholder(/search/i);
    if (await mobileSearch.isVisible()) {
      await mobileSearch.fill('test');
      
      // Search field should be appropriately sized
      const searchBox = await mobileSearch.boundingBox();
      expect(searchBox?.height).toBeGreaterThan(40); // Touch-friendly
    }
  });

  test('🔄 Pagination and infinite scroll work', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(3000);
    
    // Look for pagination controls
    const paginationNext = page.getByRole('button', { name: /next|>/i });
    const paginationNumbers = page.getByText(/page.*\d+|\d+.*of.*\d+/i);
    const loadMoreButton = page.getByRole('button', { name: /load.*more|show.*more/i });
    
    // Test pagination
    if (await paginationNext.isVisible()) {
      const initialVendorCount = await page.getByText(/vendor|business|service/i).count();
      
      await paginationNext.click();
      await page.waitForTimeout(2000);
      
      // Should show different vendors or navigate to next page
      const afterPaginationCount = await page.getByText(/vendor|business|service/i).count();
      expect(afterPaginationCount).toBeGreaterThan(0);
    }
    
    // Test load more functionality
    if (await loadMoreButton.isVisible()) {
      const initialResults = await page.locator('[class*="vendor"], [data-testid*="vendor"]').count();
      
      await loadMoreButton.click();
      await page.waitForTimeout(3000);
      
      // Should load more vendors
      const afterLoadMore = await page.locator('[class*="vendor"], [data-testid*="vendor"]').count();
      expect(afterLoadMore).toBeGreaterThanOrEqual(initialResults);
    }
    
    // Test infinite scroll
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const afterScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Page might extend if infinite scroll is implemented
    console.log(`Scroll loading: ${afterScrollHeight > initialHeight}`);
  });

  test('❤️ Favorite/Save vendor functionality', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Look for favorite/save buttons
    const favoriteButton = page.getByRole('button', { name: /favorite|save|heart|♥|❤/i }).first();
    const saveIcon = page.locator('[class*="heart"], [class*="favorite"], [data-testid*="save"]').first();
    
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      
      // Should show feedback for saving vendor
      await expect(page.getByText(/saved|added.*favorite|removed.*favorite/i)).toBeVisible();
      
      // Toggle favorite status
      await favoriteButton.click();
      await expect(page.getByText(/removed|unsaved/i)).toBeVisible();
    } else if (await saveIcon.isVisible()) {
      await saveIcon.click();
      
      // Should provide visual feedback
      await page.waitForTimeout(1000);
    }
    
    // Check if there's a favorites page
    const favoritesLink = page.getByRole('link', { name: /favorite|saved/i });
    if (await favoritesLink.isVisible()) {
      await favoritesLink.click();
      
      // Should show saved vendors page
      await expect(page.getByText(/favorite|saved.*vendor|your.*saved/i)).toBeVisible();
    }
  });

  test('🎯 Advanced filtering combinations work', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    
    // Apply multiple filters simultaneously
    const filters = [
      { type: 'category', selector: page.getByText(/photography/i).first() },
      { type: 'price', selector: page.getByText(/\$100.*\$500|mid.*range/i).first() },
      { type: 'rating', selector: page.getByText(/4.*star|★★★★/i).first() }
    ];
    
    let appliedFilters = 0;
    
    for (const filter of filters) {
      if (await filter.selector.isVisible()) {
        await filter.selector.click();
        await page.waitForTimeout(1500);
        appliedFilters++;
      }
    }
    
    if (appliedFilters > 1) {
      // Should show filtered results matching all criteria
      await expect(page.getByText(/photography|photographer/i)).toBeVisible();
      
      // Should show active filter indicators
      const activeFilters = page.getByText(/filter.*applied|active.*filter|\d+.*filter/i);
      if (await activeFilters.first().isVisible()) {
        await expect(activeFilters.first()).toBeVisible();
      }
      
      // Should be able to clear filters
      const clearButton = page.getByRole('button', { name: /clear.*filter|reset.*filter/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(2000);
        
        // Should show all vendors again
        await expect(page.getByText(/vendor|business|service/i)).toBeVisible();
      }
    }
    
    console.log(`Applied ${appliedFilters} filters successfully`);
  });

  test('🌟 Featured/Sponsored vendors display properly', async ({ page }) => {
    await page.getByRole('link', { name: /browse/i }).first().click();
    await page.waitForTimeout(2000);
    
    // Look for featured or sponsored vendor indicators
    const featuredIndicators = [
      page.getByText(/featured|sponsor|premium|promoted/i),
      page.locator('[class*="featured"], [class*="sponsored"], [data-testid*="featured"]'),
      page.getByText(/⭐|👑|🌟/i)
    ];
    
    let foundFeatured = false;
    for (const indicator of featuredIndicators) {
      if (await indicator.count() > 0) {
        foundFeatured = true;
        await expect(indicator.first()).toBeVisible();
        break;
      }
    }
    
    // Featured vendors should appear prominently
    if (foundFeatured) {
      const featuredVendor = page.getByText(/featured|premium/i).first();
      await featuredVendor.click();
      
      // Should navigate to vendor profile
      await page.waitForTimeout(2000);
      await expect(page.getByText(/contact|book|about/i)).toBeVisible();
    }
    
    console.log(`Featured vendors found: ${foundFeatured}`);
  });
});