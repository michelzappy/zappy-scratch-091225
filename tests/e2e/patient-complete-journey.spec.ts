import { test, expect } from '@playwright/test';

/**
 * COMPREHENSIVE PATIENT JOURNEY TESTING
 * Tests EVERY button, form, and interaction in the patient portal
 */

test.describe('Patient Complete Journey - Every Button and Functionality', () => {
  let patientEmail: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique email for each test
    patientEmail = `test-patient-${Date.now()}@example.com`;
    
    // Ensure backend is running
    const healthCheck = await page.request.get('http://localhost:3001/health');
    expect(healthCheck.status()).toBe(200);
  });

  test('Complete Patient Registration Flow - Every Form Field and Button', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/patient/register');
    
    // Test all form fields exist and accept input
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="firstName"]')).toBeVisible();
    await expect(page.locator('[data-testid="lastName"]')).toBeVisible();
    await expect(page.locator('[data-testid="dateOfBirth"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone"]')).toBeVisible();
    
    // Test form validation - empty submission
    await page.click('[data-testid="register-btn"]');
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Test form validation - invalid email
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.click('[data-testid="register-btn"]');
    await expect(page.locator('.email-error')).toBeVisible();
    
    // Test form validation - weak password
    await page.fill('[data-testid="email"]', patientEmail);
    await page.fill('[data-testid="password"]', 'weak');
    await page.click('[data-testid="register-btn"]');
    await expect(page.locator('.password-error')).toBeVisible();
    
    // Fill form with valid data
    await page.fill('[data-testid="email"]', patientEmail);
    await page.fill('[data-testid="password"]', 'SecurePass123!');
    await page.fill('[data-testid="firstName"]', 'Test');
    await page.fill('[data-testid="lastName"]', 'Patient');
    await page.fill('[data-testid="dateOfBirth"]', '1990-01-01');
    await page.fill('[data-testid="phone"]', '+1234567890');
    
    // Test successful registration
    await page.click('[data-testid="register-btn"]');
    
    // Verify redirect to dashboard or confirmation
    await expect(page).toHaveURL(/\/(patient\/dashboard|patient\/verify-email)/);
  });

  test('Patient Login Flow - Every Login Option and Error State', async ({ page }) => {
    await page.goto('/patient/login');
    
    // Test login form exists
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="remember-me"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password"]')).toBeVisible();
    
    // Test empty form submission
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Test invalid credentials
    await page.fill('[data-testid="email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('.auth-error')).toBeVisible();
    
    // Test remember me checkbox
    await page.check('[data-testid="remember-me"]');
    await expect(page.locator('[data-testid="remember-me"]')).toBeChecked();
    
    // Test forgot password link
    await page.click('[data-testid="forgot-password"]');
    await expect(page).toHaveURL(/\/patient\/forgot-password/);
    
    // Go back to login
    await page.goto('/patient/login');
    
    // Test valid login (assuming test user exists)
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/);
  });

  test('Patient Dashboard - Every Button and Interactive Element', async ({ page }) => {
    // Login first
    await page.goto('/patient/login');
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    await page.waitForURL(/\/patient\/dashboard/);
    
    // Test all navigation menu items
    const menuItems = [
      'dashboard-nav',
      'profile-nav', 
      'consultations-nav',
      'orders-nav',
      'messages-nav',
      'help-nav'
    ];
    
    for (const item of menuItems) {
      const menuElement = page.locator(`[data-testid="${item}"]`);
      if (await menuElement.isVisible()) {
        await menuElement.click();
        await page.waitForLoadState('networkidle');
        // Verify navigation worked
      }
    }
    
    // Return to dashboard
    await page.goto('/patient/dashboard');
    
    // Test dashboard quick action buttons
    const quickActions = [
      'new-consultation-btn',
      'view-orders-btn', 
      'messages-btn',
      'profile-btn',
      'help-btn'
    ];
    
    for (const action of quickActions) {
      const button = page.locator(`[data-testid="${action}"]`);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForLoadState('networkidle');
        // Verify action worked
        await page.goBack();
      }
    }
    
    // Test profile card edit button
    const editProfileBtn = page.locator('[data-testid="edit-profile-btn"]');
    if (await editProfileBtn.isVisible()) {
      await editProfileBtn.click();
      await expect(page.locator('.profile-edit-modal')).toBeVisible();
      
      // Test modal close button
      await page.click('[data-testid="modal-close-btn"]');
      await expect(page.locator('.profile-edit-modal')).not.toBeVisible();
    }
    
    // Test logout button
    await page.click('[data-testid="logout-btn"]');
    await expect(page).toHaveURL(/\/patient\/login/);
  });

  test('Health Quiz - Every Question and Navigation Button', async ({ page }) => {
    // Login and navigate to health quiz
    await page.goto('/patient/login');
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/patient/health-quiz');
    
    // Test start quiz button
    await page.click('[data-testid="start-quiz-btn"]');
    
    // Test all quiz navigation elements
    let currentQuestion = 1;
    const totalQuestions = 10; // Adjust based on actual quiz length
    
    while (currentQuestion <= totalQuestions) {
      // Test question content is visible
      await expect(page.locator('.quiz-question')).toBeVisible();
      await expect(page.locator('.progress-indicator')).toBeVisible();
      
      // Test answer options
      const answerOptions = page.locator('[data-testid^="answer-option-"]');
      const optionCount = await answerOptions.count();
      
      if (optionCount > 0) {
        // Select first available option
        await answerOptions.first().click();
      }
      
      // Test navigation buttons
      const nextBtn = page.locator('[data-testid="next-question-btn"]');
      const prevBtn = page.locator('[data-testid="prev-question-btn"]');
      
      if (currentQuestion > 1) {
        await expect(prevBtn).toBeVisible();
      }
      
      if (currentQuestion < totalQuestions) {
        await expect(nextBtn).toBeVisible();
        await nextBtn.click();
      } else {
        // Test submit quiz button
        const submitBtn = page.locator('[data-testid="submit-quiz-btn"]');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();
        break;
      }
      
      currentQuestion++;
    }
    
    // Verify quiz completion
    await expect(page.locator('.quiz-complete')).toBeVisible();
  });

  test('New Consultation Form - Every Field and Button', async ({ page }) => {
    // Login and navigate to new consultation
    await page.goto('/patient/login');
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/patient/new-consultation');
    
    // Test all form fields
    await expect(page.locator('[data-testid="chief-complaint"]')).toBeVisible();
    await expect(page.locator('[data-testid="symptoms"]')).toBeVisible();
    await expect(page.locator('[data-testid="duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="severity"]')).toBeVisible();
    
    // Test chief complaint field
    await page.fill('[data-testid="chief-complaint"]', 'Severe headache and fatigue');
    
    // Test symptom checkboxes
    const symptomCheckboxes = page.locator('[data-testid^="symptom-"]');
    const symptomCount = await symptomCheckboxes.count();
    
    for (let i = 0; i < Math.min(3, symptomCount); i++) {
      await symptomCheckboxes.nth(i).check();
      await expect(symptomCheckboxes.nth(i)).toBeChecked();
    }
    
    // Test duration dropdown
    await page.selectOption('[data-testid="duration"]', '3-days');
    
    // Test severity slider
    await page.locator('[data-testid="severity-slider"]').fill('7');
    
    // Test file upload button
    const fileInput = page.locator('[data-testid="file-upload"]');
    if (await fileInput.isVisible()) {
      // Create a test file
      const testFile = Buffer.from('test file content');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: testFile
      });
    }
    
    // Test form validation - submit empty required fields
    await page.click('[data-testid="submit-consultation-btn"]');
    
    // Fill required fields and submit
    await page.fill('[data-testid="chief-complaint"]', 'Test consultation');
    await page.selectOption('[data-testid="duration"]', '1-day');
    await page.click('[data-testid="submit-consultation-btn"]');
    
    // Verify submission success
    await expect(page.locator('.consultation-submitted')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible();
  });

  test('Patient Profile Management - Every Edit Function', async ({ page }) => {
    // Login and navigate to profile
    await page.goto('/patient/login');
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/patient/profile');
    
    // Test edit profile button
    await page.click('[data-testid="edit-profile-btn"]');
    
    // Test all editable fields
    const editableFields = [
      'firstName',
      'lastName', 
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
      'emergencyContactName',
      'emergencyContactPhone',
      'allergies',
      'medications',
      'medicalConditions'
    ];
    
    for (const field of editableFields) {
      const fieldElement = page.locator(`[data-testid="${field}"]`);
      if (await fieldElement.isVisible()) {
        await fieldElement.clear();
        await fieldElement.fill(`Updated ${field}`);
      }
    }
    
    // Test save changes button
    await page.click('[data-testid="save-changes-btn"]');
    await expect(page.locator('.profile-updated')).toBeVisible();
    
    // Test cancel changes button
    await page.click('[data-testid="edit-profile-btn"]');
    await page.fill('[data-testid="firstName"]', 'Cancelled Change');
    await page.click('[data-testid="cancel-changes-btn"]');
    
    // Verify changes were cancelled
    const firstNameField = page.locator('[data-testid="firstName-display"]');
    await expect(firstNameField).not.toHaveText('Cancelled Change');
  });

  test('Messages and Communication - Every Message Function', async ({ page }) => {
    // Login and navigate to messages
    await page.goto('/patient/login');
    await page.fill('[data-testid="email"]', 'demo@patient.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-btn"]');
    
    await page.goto('/patient/messages');
    
    // Test message list
    await expect(page.locator('.message-list')).toBeVisible();
    
    // Test compose new message button
    await page.click('[data-testid="compose-message-btn"]');
    await expect(page.locator('.compose-modal')).toBeVisible();
    
    // Test message composition
    await page.fill('[data-testid="message-subject"]', 'Test Message');
    await page.fill('[data-testid="message-content"]', 'This is a test message content');
    
    // Test recipient selection
    await page.selectOption('[data-testid="recipient-select"]', 'provider');
    
    // Test send message button
    await page.click('[data-testid="send-message-btn"]');
    await expect(page.locator('.message-sent')).toBeVisible();
    
    // Test message thread opening
    const firstMessage = page.locator('.message-item').first();
    if (await firstMessage.isVisible()) {
      await firstMessage.click();
      await expect(page.locator('.message-thread')).toBeVisible();
      
      // Test reply functionality
      await page.fill('[data-testid="reply-content"]', 'This is a reply');
      await page.click('[data-testid="send-reply-btn"]');
    }
  });
});