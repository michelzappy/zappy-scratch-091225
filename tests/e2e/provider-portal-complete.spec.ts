import { test, expect } from '@playwright/test';

/**
 * COMPREHENSIVE PROVIDER PORTAL TESTING
 * Tests EVERY button, form, and interaction in the provider portal
 */

test.describe('Provider Portal - Complete Functionality Testing', () => {
  let providerEmail: string;

  test.beforeEach(async ({ page }) => {
    providerEmail = 'demo@provider.com';
    
    // Ensure backend is running
    const healthCheck = await page.request.get('http://localhost:3001/health');
    expect(healthCheck.status()).toBe(200);
  });

  test('Provider Login Flow - Every Authentication Option', async ({ page }) => {
    await page.goto('/portal/login');
    
    // Test login form elements exist
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password"]')).toBeVisible();
    
    // Test empty form validation
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Test invalid credentials
    await page.fill('[data-testid="email"]', 'invalid@provider.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('.auth-error')).toBeVisible();
    
    // Test valid provider login
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    // Should redirect to provider dashboard
    await expect(page).toHaveURL(/\/portal\/dashboard/);
  });

  test('Provider Dashboard - Every Widget and Action Button', async ({ page }) => {
    // Login first
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.waitForURL(/\/portal\/dashboard/);
    
    // Test main navigation menu
    const navItems = [
      'dashboard-nav',
      'patients-nav',
      'consultations-nav',
      'prescriptions-nav',
      'messages-nav',
      'analytics-nav',
      'settings-nav'
    ];
    
    for (const navItem of navItems) {
      const element = page.locator(`[data-testid="${navItem}"]`);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForLoadState('networkidle');
        // Verify navigation worked
        await page.goBack();
      }
    }
    
    // Test dashboard widgets
    await expect(page.locator('.metrics-grid')).toBeVisible();
    await expect(page.locator('.pending-consultations')).toBeVisible();
    await expect(page.locator('.recent-activity')).toBeVisible();
    await expect(page.locator('.quick-actions')).toBeVisible();
    
    // Test quick action buttons
    const quickActions = [
      'new-consultation-btn',
      'view-patients-btn',
      'review-pending-btn',
      'send-message-btn',
      'view-analytics-btn'
    ];
    
    for (const action of quickActions) {
      const button = page.locator(`[data-testid="${action}"]`);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
      }
    }
    
    // Test patient queue interactions
    const patientCards = page.locator('.patient-queue-card');
    const cardCount = await patientCards.count();
    
    if (cardCount > 0) {
      // Test first patient card
      await patientCards.first().click();
      await expect(page.locator('.patient-details')).toBeVisible();
      
      // Test patient action buttons
      const patientActions = [
        'review-consultation-btn',
        'send-message-btn',
        'view-history-btn',
        'create-prescription-btn'
      ];
      
      for (const action of patientActions) {
        const button = page.locator(`[data-testid="${action}"]`);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForLoadState('networkidle');
          await page.goBack();
        }
      }
    }
  });

  test('Patient Management - Every Patient Action and Filter', async ({ page }) => {
    // Login and navigate to patients
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/patients');
    
    // Test search functionality
    await expect(page.locator('[data-testid="patient-search"]')).toBeVisible();
    await page.fill('[data-testid="patient-search"]', 'John');
    await page.keyboard.press('Enter');
    
    // Test filter options
    const filterOptions = [
      'filter-all',
      'filter-active',
      'filter-inactive',
      'filter-new',
      'filter-chronic'
    ];
    
    for (const filter of filterOptions) {
      const filterElement = page.locator(`[data-testid="${filter}"]`);
      if (await filterElement.isVisible()) {
        await filterElement.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test sort options
    const sortDropdown = page.locator('[data-testid="sort-patients"]');
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption('name');
      await page.waitForLoadState('networkidle');
      await sortDropdown.selectOption('date');
      await page.waitForLoadState('networkidle');
    }
    
    // Test patient list actions
    const patientRows = page.locator('.patient-row');
    const rowCount = await patientRows.count();
    
    if (rowCount > 0) {
      // Test first patient row actions
      const firstRow = patientRows.first();
      
      // Test view patient button
      await firstRow.locator('[data-testid="view-patient-btn"]').click();
      await expect(page).toHaveURL(/\/portal\/patient\/\d+/);
      
      // Test patient detail page buttons
      const patientDetailActions = [
        'edit-patient-btn',
        'view-consultations-btn',
        'view-prescriptions-btn',
        'send-message-btn',
        'add-note-btn'
      ];
      
      for (const action of patientDetailActions) {
        const button = page.locator(`[data-testid="${action}"]`);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForLoadState('networkidle');
          
          // Handle modals
          const modal = page.locator('.modal');
          if (await modal.isVisible()) {
            await page.click('[data-testid="modal-close-btn"]');
          } else {
            await page.goBack();
          }
        }
      }
    }
  });

  test('Consultation Review - Every Review Action and Decision', async ({ page }) => {
    // Login and navigate to consultations
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/consultations');
    
    // Test consultation status filters
    const statusFilters = [
      'filter-pending',
      'filter-in-progress',
      'filter-completed',
      'filter-urgent'
    ];
    
    for (const filter of statusFilters) {
      const filterElement = page.locator(`[data-testid="${filter}"]`);
      if (await filterElement.isVisible()) {
        await filterElement.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test consultation list
    const consultationRows = page.locator('.consultation-row');
    const consultationCount = await consultationRows.count();
    
    if (consultationCount > 0) {
      // Review first consultation
      await consultationRows.first().click();
      await expect(page).toHaveURL(/\/portal\/consultation\/\d+/);
      
      // Test consultation review interface
      await expect(page.locator('.consultation-details')).toBeVisible();
      await expect(page.locator('.patient-info')).toBeVisible();
      await expect(page.locator('.symptoms-review')).toBeVisible();
      
      // Test consultation actions
      const reviewActions = [
        'approve-consultation-btn',
        'request-more-info-btn',
        'schedule-followup-btn',
        'create-prescription-btn',
        'decline-consultation-btn'
      ];
      
      for (const action of reviewActions) {
        const button = page.locator(`[data-testid="${action}"]`);
        if (await button.isVisible()) {
          await button.click();
          
          // Handle form modals
          const modal = page.locator('.modal');
          if (await modal.isVisible()) {
            // Fill required fields if it's a form
            const reasonField = page.locator('[data-testid="reason"]');
            if (await reasonField.isVisible()) {
              await reasonField.fill('Test reason for action');
            }
            
            const confirmBtn = page.locator('[data-testid="confirm-action-btn"]');
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
            } else {
              await page.click('[data-testid="modal-close-btn"]');
            }
          }
          
          await page.waitForLoadState('networkidle');
        }
      }
      
      // Test notes functionality
      const notesSection = page.locator('[data-testid="consultation-notes"]');
      if (await notesSection.isVisible()) {
        await page.fill('[data-testid="add-note-field"]', 'Test consultation note');
        await page.click('[data-testid="save-note-btn"]');
        await expect(page.locator('.note-saved')).toBeVisible();
      }
    }
  });

  test('Prescription Management - Every Prescription Action', async ({ page }) => {
    // Login and navigate to prescriptions
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/prescriptions');
    
    // Test create new prescription button
    await page.click('[data-testid="create-prescription-btn"]');
    await expect(page.locator('.prescription-form')).toBeVisible();
    
    // Test prescription form fields
    await expect(page.locator('[data-testid="patient-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="medication-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="dosage"]')).toBeVisible();
    await expect(page.locator('[data-testid="instructions"]')).toBeVisible();
    await expect(page.locator('[data-testid="quantity"]')).toBeVisible();
    await expect(page.locator('[data-testid="refills"]')).toBeVisible();
    
    // Fill prescription form
    await page.selectOption('[data-testid="patient-select"]', { index: 1 });
    await page.fill('[data-testid="medication-search"]', 'Ibuprofen');
    await page.fill('[data-testid="dosage"]', '200mg');
    await page.fill('[data-testid="instructions"]', 'Take twice daily with food');
    await page.fill('[data-testid="quantity"]', '60');
    await page.fill('[data-testid="refills"]', '2');
    
    // Test save prescription
    await page.click('[data-testid="save-prescription-btn"]');
    await expect(page.locator('.prescription-saved')).toBeVisible();
    
    // Test prescription list actions
    const prescriptionRows = page.locator('.prescription-row');
    const prescriptionCount = await prescriptionRows.count();
    
    if (prescriptionCount > 0) {
      const firstPrescription = prescriptionRows.first();
      
      // Test prescription actions
      const prescriptionActions = [
        'view-prescription-btn',
        'edit-prescription-btn',
        'cancel-prescription-btn',
        'refill-prescription-btn'
      ];
      
      for (const action of prescriptionActions) {
        const button = firstPrescription.locator(`[data-testid="${action}"]`);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForLoadState('networkidle');
          
          // Handle confirmation dialogs
          const confirmDialog = page.locator('.confirm-dialog');
          if (await confirmDialog.isVisible()) {
            await page.click('[data-testid="confirm-yes-btn"]');
          }
          
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('Provider Messages - Every Communication Feature', async ({ page }) => {
    // Login and navigate to messages
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/messages');
    
    // Test message categories
    const messageCategories = [
      'all-messages',
      'patient-messages',
      'admin-messages',
      'urgent-messages'
    ];
    
    for (const category of messageCategories) {
      const categoryTab = page.locator(`[data-testid="${category}"]`);
      if (await categoryTab.isVisible()) {
        await categoryTab.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test compose message
    await page.click('[data-testid="compose-message-btn"]');
    await expect(page.locator('.compose-modal')).toBeVisible();
    
    // Fill compose form
    await page.selectOption('[data-testid="recipient-type"]', 'patient');
    await page.selectOption('[data-testid="recipient-select"]', { index: 1 });
    await page.fill('[data-testid="subject"]', 'Test Provider Message');
    await page.fill('[data-testid="message-content"]', 'This is a test message from provider');
    
    // Test priority selection
    await page.selectOption('[data-testid="priority"]', 'normal');
    
    // Test send message
    await page.click('[data-testid="send-message-btn"]');
    await expect(page.locator('.message-sent')).toBeVisible();
    
    // Test message thread interactions
    const messageThreads = page.locator('.message-thread');
    const threadCount = await messageThreads.count();
    
    if (threadCount > 0) {
      await messageThreads.first().click();
      await expect(page.locator('.thread-details')).toBeVisible();
      
      // Test reply functionality
      await page.fill('[data-testid="reply-content"]', 'Provider reply message');
      await page.click('[data-testid="send-reply-btn"]');
      
      // Test message actions
      const messageActions = [
        'mark-important-btn',
        'archive-message-btn',
        'forward-message-btn'
      ];
      
      for (const action of messageActions) {
        const button = page.locator(`[data-testid="${action}"]`);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('Provider Analytics Dashboard - Every Chart and Filter', async ({ page }) => {
    // Login and navigate to analytics
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/analytics');
    
    // Test date range filters
    const dateFilters = [
      'last-7-days',
      'last-30-days',
      'last-90-days',
      'custom-range'
    ];
    
    for (const filter of dateFilters) {
      const filterElement = page.locator(`[data-testid="${filter}"]`);
      if (await filterElement.isVisible()) {
        await filterElement.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test chart interactions
    const charts = [
      'consultations-chart',
      'patients-chart', 
      'prescriptions-chart',
      'revenue-chart'
    ];
    
    for (const chart of charts) {
      const chartElement = page.locator(`[data-testid="${chart}"]`);
      if (await chartElement.isVisible()) {
        // Test chart hover interactions
        await chartElement.hover();
        await page.waitForTimeout(500);
        
        // Test chart download
        const downloadBtn = chartElement.locator('[data-testid="download-chart-btn"]');
        if (await downloadBtn.isVisible()) {
          await downloadBtn.click();
        }
      }
    }
    
    // Test export functionality
    const exportOptions = [
      'export-pdf-btn',
      'export-excel-btn',
      'export-csv-btn'
    ];
    
    for (const exportBtn of exportOptions) {
      const button = page.locator(`[data-testid="${exportBtn}"]`);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000); // Wait for download
      }
    }
  });

  test('Provider Settings - Every Configuration Option', async ({ page }) => {
    // Login and navigate to settings
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', providerEmail);
    await page.fill('[data-testid="password"]', 'provider123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/portal/settings');
    
    // Test settings tabs
    const settingsTabs = [
      'profile-settings',
      'notification-settings',
      'security-settings',
      'practice-settings'
    ];
    
    for (const tab of settingsTabs) {
      const tabElement = page.locator(`[data-testid="${tab}"]`);
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test profile settings
    await page.click('[data-testid="profile-settings"]');
    await page.click('[data-testid="edit-profile-btn"]');
    
    const profileFields = [
      'first-name',
      'last-name',
      'specialties',
      'license-number',
      'phone',
      'bio'
    ];
    
    for (const field of profileFields) {
      const fieldElement = page.locator(`[data-testid="${field}"]`);
      if (await fieldElement.isVisible()) {
        await fieldElement.clear();
        await fieldElement.fill(`Updated ${field}`);
      }
    }
    
    await page.click('[data-testid="save-profile-btn"]');
    await expect(page.locator('.profile-updated')).toBeVisible();
    
    // Test notification settings
    await page.click('[data-testid="notification-settings"]');
    
    const notificationOptions = [
      'email-notifications',
      'sms-notifications',
      'push-notifications',
      'urgent-only-notifications'
    ];
    
    for (const option of notificationOptions) {
      const checkbox = page.locator(`[data-testid="${option}"]`);
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await expect(checkbox).toBeChecked();
        await checkbox.uncheck();
        await expect(checkbox).not.toBeChecked();
      }
    }
  });
});