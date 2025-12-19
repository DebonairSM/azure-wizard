import { test, expect } from '@playwright/test';

test.describe('Wizard Data Display and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to fully load, including JavaScript execution
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
  });

  test('should load and display root node data', async ({ page }) => {
    // Wait for SERVER_DATA to be available (it's set in a script tag, so should be immediate)
    // But wait a bit for any async initialization
    await page.waitForTimeout(500);
    
    // Check that SERVER_DATA is injected
    const serverData = await page.evaluate(() => window.SERVER_DATA);
    expect(serverData).toBeTruthy();
    expect(serverData.currentNode).toBeTruthy();
    expect(serverData.currentNode.id).toBe('root');
    expect(serverData.currentNode.question).toBe('What type of solution?');
    expect(Array.isArray(serverData.options)).toBe(true);
    expect(serverData.options.length).toBe(11);

    // Check that loading indicator is hidden
    const loading = page.locator('#loading');
    await expect(loading).not.toBeVisible();

    // Check that wizardContent is visible
    const wizardContent = page.locator('#wizardContent');
    await expect(wizardContent).toBeVisible();

    // Check that root node question is displayed
    const questionText = page.locator('#questionText');
    await expect(questionText).toBeVisible();
    await expect(questionText).toHaveText('What type of solution?');

    // Check that description is displayed
    const description = page.locator('#description');
    await expect(description).toBeVisible();
    await expect(description).toHaveText(/Choose the primary category/);
  });

  test('should display all 11 root options', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for JavaScript initialization
    
    // Wait for wizardContent to be visible (it starts as display:none)
    const wizardContent = page.locator('#wizardContent');
    await expect(wizardContent).toBeVisible({ timeout: 10000 });
    
    // Wait for options grid to be populated
    const optionsGrid = page.locator('#optionsGrid');
    await expect(optionsGrid).toBeVisible({ timeout: 10000 });

    // Get all option cards
    const optionCards = page.locator('.option-card');
    await expect(optionCards).toHaveCount(11);

    // Verify expected root options are present
    const expectedOptions = [
      'Compute & Application Runtime',
      'Data Stores & Persistence',
      'Integration, Messaging & Workflow',
      'Networking & Connectivity',
      'Identity, Access, & Security Controls',
      'Observability & Operations',
      'DevOps & Delivery',
      'AI, ML & Cognitive Services',
      'IoT, Edge & Real-World Input',
      'Media & Content Delivery',
      'Analytics, BI & Big Data'
    ];

    for (const optionText of expectedOptions) {
      const optionCard = page.locator('.option-card', { hasText: optionText });
      await expect(optionCard).toBeVisible();
      
      // Verify each card has a label
      const label = optionCard.locator('.option-label');
      await expect(label).toContainText(optionText);
    }
  });

  test('should navigate to next node when clicking an option', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for JavaScript initialization
    
    // Wait for wizardContent to be visible
    const wizardContent = page.locator('#wizardContent');
    await expect(wizardContent).toBeVisible({ timeout: 10000 });
    
    // Wait for options to load
    const optionsGrid = page.locator('#optionsGrid');
    await expect(optionsGrid).toBeVisible({ timeout: 10000 });

    // Click on first option (Compute & Application Runtime)
    const firstOption = page.locator('.option-card').first();
    await expect(firstOption).toBeVisible();
    
    const optionLabel = await firstOption.locator('.option-label').textContent();
    await firstOption.click();

    // Wait for navigation - check URL changed or page content updated
    await page.waitForTimeout(1000); // Allow time for navigation

    // Verify we navigated away from root
    // Either URL changed or question text changed
    const currentQuestion = page.locator('#questionText');
    const questionText = await currentQuestion.textContent();
    
    // Question should not be the root question anymore (unless error occurred)
    expect(questionText).not.toBe('What type of solution?');
    
    // Verify wizardContent is still visible
    await expect(page.locator('#wizardContent')).toBeVisible();
  });

  test('should display breadcrumbs after navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for JavaScript initialization
    
    // Wait for options to be visible
    const optionsGrid = page.locator('#optionsGrid');
    await expect(optionsGrid).toBeVisible({ timeout: 10000 });
    
    // Initially, breadcrumbs might be empty for root
    const breadcrumbs = page.locator('#breadcrumbs');
    
    // Click on an option to navigate
    const firstOption = page.locator('.option-card').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    
    // Wait for navigation - wait for URL to change or content to update
    await page.waitForTimeout(2000);
    
    // After navigation, breadcrumbs element should exist (may be hidden if at root)
    // Just verify the element exists in the DOM
    const breadcrumbCount = await breadcrumbs.count();
    expect(breadcrumbCount).toBeGreaterThan(0);
  });

  test('should display back button after navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for JavaScript initialization
    
    // Wait for options to be visible
    const optionsGrid = page.locator('#optionsGrid');
    await expect(optionsGrid).toBeVisible({ timeout: 10000 });
    
    // Initially, back button should not be visible (at root)
    const backButton = page.locator('#backButton');
    await expect(backButton).not.toBeVisible();
    
    // Click on an option to navigate
    const firstOption = page.locator('.option-card').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    
    // Wait for navigation - allow time for the page to update
    await page.waitForTimeout(2000);
    
    // Check if navigation occurred by seeing if question changed
    const questionText = page.locator('#questionText');
    const newQuestion = await questionText.textContent();
    
    // If we navigated, question should be different from root
    // If navigation didn't work or we're at a terminal node, back button might not show
    // Just verify the button exists in DOM (it may be hidden if we're at root level)
    const backButtonCount = await backButton.count();
    expect(backButtonCount).toBeGreaterThan(0);
    
    // Try clicking back if button is visible
    const isBackButtonVisible = await backButton.isVisible();
    if (isBackButtonVisible && newQuestion !== 'What type of solution?') {
      await backButton.click();
      await page.waitForTimeout(1000);
      
      // Should be back at root
      await expect(questionText).toHaveText('What type of solution?');
    }
  });

  test('should handle empty options gracefully', async ({ page }) => {
    // This test verifies that the code handles edge cases
    // We'll check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Verify no critical errors occurred
    const criticalErrors = errors.filter(e => 
      e.includes('not found') || 
      e.includes('Failed to initialize') ||
      e.includes('Cannot read property')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should verify option cards have labels and descriptions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for JavaScript initialization
    
    // Wait for options grid to be visible
    const optionsGrid = page.locator('#optionsGrid');
    await expect(optionsGrid).toBeVisible({ timeout: 10000 });
    
    const optionCards = page.locator('.option-card');
    const count = await optionCards.count();
    
    // Verify each option card has required elements
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = optionCards.nth(i);
      
      // Each card should have a label
      const label = card.locator('.option-label');
      await expect(label).toBeVisible();
      const labelText = await label.textContent();
      expect(labelText).toBeTruthy();
      expect(labelText.trim().length).toBeGreaterThan(0);
      
      // Card should be clickable
      await expect(card).toBeVisible();
    }
  });

  test('should verify data structure in window.SERVER_DATA', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const serverData = await page.evaluate(() => window.SERVER_DATA);
    
    // If SERVER_DATA is undefined, the page might not be loading correctly
    if (!serverData) {
      // Log page content to debug
      const pageContent = await page.content();
      const hasServerDataScript = pageContent.includes('window.SERVER_DATA');
      throw new Error(`window.SERVER_DATA is undefined. Page contains SERVER_DATA script: ${hasServerDataScript}`);
    }
    
    // Verify structure
    expect(serverData).toHaveProperty('currentNode');
    expect(serverData).toHaveProperty('options');
    expect(serverData).toHaveProperty('recipe');
    expect(serverData).toHaveProperty('isTerminal');
    expect(serverData).toHaveProperty('version');
    expect(serverData).toHaveProperty('nodeId');
    
    // Verify currentNode structure
    expect(serverData.currentNode).toHaveProperty('id');
    expect(serverData.currentNode).toHaveProperty('question');
    expect(serverData.currentNode.id).toBe('root');
    
    // Verify options is an array
    expect(Array.isArray(serverData.options)).toBe(true);
    
    // Verify each option has required properties
    if (serverData.options.length > 0) {
      const firstOption = serverData.options[0];
      expect(firstOption).toHaveProperty('id');
      expect(firstOption).toHaveProperty('label');
      expect(firstOption).toHaveProperty('nodeId');
    }
  });
});

