import { test, expect } from '@playwright/test';

const randomEmail = () => `user${Math.floor(Math.random() * 1e8)}@test.com`;

// This test assumes the app is running at http://localhost:5173
// and that email verification is NOT required for signup.
test('User can sign up and log in without email verification', async ({ page }) => {
  await page.goto('/');

  // Open the signup modal
  await page.getByRole('button', { name: /sign up/i }).click();

  // Fill out the signup form
  await page.getByLabel(/full name/i).fill('Test User');
  const email = randomEmail();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('testpassword123');
  await page.getByRole('button', { name: /create account/i }).click();

  // Should see a success message and be able to log in immediately
  await expect(page.getByText(/account created/i)).toBeVisible();

  // Log out if automatically logged in, or open login modal
  // (This step may need to be adjusted based on your app's behavior)
  if (await page.getByText(/welcome, test user/i).isVisible({ timeout: 2000 }).catch(() => false)) {
    // Already logged in
    await page.getByRole('button', { name: /log out/i }).click();
  } else {
    // Open login modal
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();
  }

  // After login, should see welcome message
  await expect(page.getByText(/welcome, test user/i)).toBeVisible();
}); 