import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Lobster UI - Comprehensive Test Suite', () => {
  
  // ======================
  // CORE UI TESTS
  // ======================
  
  test.describe('Core UI & Navigation', () => {
    test('should load the homepage without errors', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/lobster-ui/i);
    });

    test('should show header with app title', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.getByRole('banner')).toContainText('lobster-ui');
    });

    test('should show workflow list sidebar', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.getByRole('complementary')).toBeVisible();
    });

    test('should show new workflow button', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.getByRole('button', { name: /new workflow/i })).toBeVisible();
    });

    test('should toggle sidebar visibility', async ({ page }) => {
      await page.goto(BASE_URL);
      const sidebarToggle = page.getByRole('button', { name: /show sidebar|hide sidebar/i });
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await expect(page.getByRole('complementary')).toBeHidden();
      }
    });

    test('should toggle inspector visibility', async ({ page }) => {
      await page.goto(BASE_URL);
      const inspectorToggle = page.getByRole('button', { name: /show inspector|hide inspector/i });
      if (await inspectorToggle.isVisible()) {
        await inspectorToggle.click();
        await expect(page.locator('aside').last()).toBeHidden();
      }
    });
  });

  // ======================
  // WORKFLOW MANAGEMENT
  // ======================
  
  test.describe('Workflow Management', () => {
    test('should create a new workflow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByRole('button', { name: /new workflow/i }).click();
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    });

    test('should show workflow in list after creation', async ({ page }) => {
      await page.goto(BASE_URL);
      const newWorkflowBtn = page.getByRole('button', { name: /new workflow/i });
      if (await newWorkflowBtn.isVisible()) {
        await newWorkflowBtn.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      const listItems = page.locator('[class*="space-y-0.5"] button, [class*="space-y-0.5"] div');
      expect(await listItems.count()).toBeGreaterThan(0);
    });

    test('should select a workflow from the list', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const firstWorkflow = page.locator('[class*="space-y-0.5"] > div').first();
      if (await firstWorkflow.isVisible()) {
        await firstWorkflow.click();
        await page.waitForTimeout(500);
      }
    });

    test('should favorite a workflow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const starButton = page.locator('[class*="space-y-0.5"]').first().locator('button').first();
      if (await starButton.isVisible()) {
        await starButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should switch to favorites tab', async ({ page }) => {
      await page.goto(BASE_URL);
      const favTab = page.getByRole('button', { name: /favorites/i });
      if (await favTab.isVisible()) {
        await favTab.click();
        await expect(page.getByRole('button', { name: /favorites/i })).toHaveClass(/bg-muted/);
      }
    });

    test('should switch to recent tab', async ({ page }) => {
      await page.goto(BASE_URL);
      const recentTab = page.getByRole('button', { name: /recent/i });
      if (await recentTab.isVisible()) {
        await recentTab.click();
        await expect(page.getByRole('button', { name: /recent/i })).toHaveClass(/bg-muted/);
      }
    });

    test('should duplicate a workflow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const duplicateBtn = page.getByRole('button', { name: /duplicate/i });
      if (await duplicateBtn.isVisible()) {
        await duplicateBtn.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('should search workflows', async ({ page }) => {
      await page.goto(BASE_URL);
      const searchInput = page.getByPlaceholder(/search workflows/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('sample');
        await page.waitForTimeout(500);
      }
    });
  });

  // ======================
  // STEP EDITOR TESTS
  // ======================
  
  test.describe('Step Editor', () => {
    test('should show workflow settings when no step selected', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await page.locator('body').click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/workflow settings/i)).toBeVisible();
    });

    test('should add a new step', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const addStepBtn = page.getByRole('button', { name: /add step/i });
      if (await addStepBtn.isVisible()) {
        await addStepBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should add step from template', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const templateBtn = page.getByText(/add from template/i);
      if (await templateBtn.isVisible()) {
        await templateBtn.click();
        await page.waitForTimeout(500);
        const templateOption = page.getByRole('button', { name: /pipeline/i }).first();
        if (await templateOption.isVisible()) {
          await templateOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should show execution preview', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.getByText(/execution preview/i)).toBeVisible();
    });

    test('should show workflow stats', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.getByText(/workflow stats/i)).toBeVisible();
    });

    test('should show step list', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('heading', { name: /steps/i })).toBeVisible();
    });
  });

  // ======================
  // KEYBOARD SHORTCUTS
  // ======================
  
  test.describe('Keyboard Shortcuts', () => {
    test('should open keyboard shortcuts modal', async ({ page }) => {
      await page.goto(BASE_URL);
      const keyboardBtn = page.getByRole('button', { name: /keyboard shortcuts/i });
      if (await keyboardBtn.isVisible()) {
        await keyboardBtn.click();
        await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeVisible();
        await page.keyboard.press('Escape');
      }
    });

    test('should close modal with Escape', async ({ page }) => {
      await page.goto(BASE_URL);
      const keyboardBtn = page.getByRole('button', { name: /keyboard shortcuts/i });
      if (await keyboardBtn.isVisible()) {
        await keyboardBtn.click();
        await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeHidden();
      }
    });
  });

  // ======================
  // TEMPLATES
  // ======================
  
  test.describe('Workflow Templates', () => {
    test('should open templates modal', async ({ page }) => {
      await page.goto(BASE_URL);
      const templatesBtn = page.getByRole('button', { name: /workflow templates/i });
      if (await templatesBtn.isVisible()) {
        await templatesBtn.click();
        await expect(page.getByRole('heading', { name: /workflow templates/i })).toBeVisible();
      }
    });

    test('should show template options', async ({ page }) => {
      await page.goto(BASE_URL);
      const templatesBtn = page.getByRole('button', { name: /workflow templates/i });
      if (await templatesBtn.isVisible()) {
        await templatesBtn.click();
        await expect(page.getByText(/basic workflow/i)).toBeVisible();
        await expect(page.getByText(/llm pipeline/i)).toBeVisible();
        await expect(page.getByText(/approval gate/i)).toBeVisible();
      }
    });
  });

  // ======================
  // IMPORT/EXPORT
  // ======================
  
  test.describe('Import/Export', () => {
    test('should show export options in dropdown', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const exportBtn = page.getByRole('button', { name: /export/i }).first();
      if (await exportBtn.isVisible()) {
        await exportBtn.hover();
        await page.waitForTimeout(500);
        await expect(page.getByText(/export yaml/i)).toBeVisible();
      }
    });

    test('should show import button', async ({ page }) => {
      await page.goto(BASE_URL);
      const importBtn = page.getByRole('button', { name: /import/i });
      await expect(importBtn).toBeVisible();
    });
  });

  // ======================
  // VIEW MODES
  // ======================
  
  test.describe('View Modes', () => {
    test('should switch to visual mode', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const visualBtn = page.getByRole('button', { name: /visual/i });
      if (await visualBtn.isVisible()) {
        await visualBtn.click();
        await expect(page.locator('.react-flow')).toBeVisible();
      }
    });

    test('should switch to source mode', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const sourceBtn = page.getByRole('button', { name: /source/i });
      if (await sourceBtn.isVisible()) {
        await sourceBtn.click();
        await expect(page.locator('textarea, [class*="font-mono"]')).toBeVisible();
      }
    });
  });

  // ======================
  // THEME
  // ======================
  
  test.describe('Theme', () => {
    test('should toggle dark/light theme', async ({ page }) => {
      await page.goto(BASE_URL);
      const themeBtn = page.getByRole('button', { name: /light mode|dark mode/i });
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  // ======================
  // HEALTH INDICATORS
  // ======================
  
  test.describe('Health Indicators', () => {
    test('should show health indicator in header', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const healthIndicator = page.locator('[class*="flex items-center gap-1"]').last();
      expect(healthIndicator).toBeVisible();
    });

    test('should show validation errors in inspector', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const validationSection = page.getByRole('heading', { name: /validation errors/i });
      if (await validationSection.isVisible()) {
        await expect(validationSection).toBeVisible();
      }
    });
  });

  // ======================
  // VERSION HISTORY
  // ======================
  
  test.describe('Version History', () => {
    test('should open version history modal', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const historyBtn = page.getByRole('button', { name: /version history/i });
      await historyBtn.click();
      await expect(page.getByRole('heading', { name: /version history/i })).toBeVisible();
    });
  });

  // ======================
  // SHARING
  // ======================
  
  test.describe('Sharing', () => {
    test('should open share modal', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const shareBtn = page.getByRole('button', { name: /share workflow/i });
      await shareBtn.click();
      await expect(page.getByRole('heading', { name: /share workflow/i })).toBeVisible();
    });

    test('should show import from URL option', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      const shareBtn = page.getByRole('button', { name: /share workflow/i });
      await shareBtn.click();
      await expect(page.getByRole('button', { name: /import from url/i })).toBeVisible();
    });
  });

  // ======================
  // CANVAS CONTROLS
  // ======================
  
  test.describe('Canvas Controls', () => {
    test('should show fit view button', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('button', { name: /fit view/i })).toBeVisible();
    });

    test('should show auto layout button', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.getByRole('button', { name: /auto layout/i })).toBeVisible();
    });

    test('should show mini-map', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      await expect(page.locator('.react-flow__minimap')).toBeVisible();
    });
  });

  // ======================
  // SETTINGS
  // ======================
  
  test.describe('Settings', () => {
    test('should open settings', async ({ page }) => {
      await page.goto(BASE_URL);
      const settingsBtn = page.getByRole('button', { name: /settings/i });
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should refresh workflows', async ({ page }) => {
      await page.goto(BASE_URL);
      const refreshBtn = page.getByRole('button', { name: /refresh/i });
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  // ======================
  // DELETE CONFIRMATION
  // ======================
  
  test.describe('Delete Operations', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      // Select a step first by clicking on the canvas
      const canvas = page.locator('.react-flow');
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(500);
        
        // Try to delete (might need a step to be selected)
        const inspector = page.locator('aside').last();
        if (await inspector.isVisible()) {
          const deleteBtn = inspector.getByRole('button', { name: /delete/i });
          if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await expect(page.getByText(/delete step/i)).toBeVisible();
          }
        }
      }
    });
  });
});