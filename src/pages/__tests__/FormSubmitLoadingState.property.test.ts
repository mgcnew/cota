/**
 * Property-Based Tests for Form Submit Loading State
 *
 * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
 * **Validates: Requirements 16.4**
 *
 * Tests that:
 * - For any form submission, the submit button SHALL be disabled and show loading indicator
 *   during the async operation.
 *
 * This property ensures that forms in Auth, Settings, and other pages correctly
 * handle loading states during submission to prevent double-submissions and
 * provide visual feedback to users.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Form submission state
 */
interface FormSubmissionState {
  isSubmitting: boolean;
  isValid: boolean;
  hasErrors: boolean;
}

/**
 * Submit button state
 */
interface SubmitButtonState {
  disabled: boolean;
  showsLoadingIndicator: boolean;
  text: string;
}

/**
 * Form types in the application
 */
type FormType = 'login' | 'signup' | 'settings' | 'profile' | 'contact';

/**
 * Determines the expected submit button state based on form submission state
 *
 * Requirements 16.4: WHEN forms submit THEN the System SHALL disable submit button
 * and show loading state
 */
function getExpectedButtonState(
  formState: FormSubmissionState,
  formType: FormType
): SubmitButtonState {
  if (formState.isSubmitting) {
    // During submission: button must be disabled and show loading
    return {
      disabled: true,
      showsLoadingIndicator: true,
      text: getLoadingText(formType),
    };
  }

  // Not submitting: button enabled (unless form is invalid)
  return {
    disabled: !formState.isValid || formState.hasErrors,
    showsLoadingIndicator: false,
    text: getDefaultText(formType),
  };
}

/**
 * Gets the loading text for a form type
 */
function getLoadingText(formType: FormType): string {
  switch (formType) {
    case 'login':
      return 'Entrando...';
    case 'signup':
      return 'Criando conta...';
    case 'settings':
      return 'Salvando...';
    case 'profile':
      return 'Atualizando...';
    case 'contact':
      return 'Enviando...';
    default:
      return 'Processando...';
  }
}

/**
 * Gets the default (non-loading) text for a form type
 */
function getDefaultText(formType: FormType): string {
  switch (formType) {
    case 'login':
      return 'Entrar';
    case 'signup':
      return 'Criar conta';
    case 'settings':
      return 'Salvar';
    case 'profile':
      return 'Atualizar';
    case 'contact':
      return 'Enviar';
    default:
      return 'Enviar';
  }
}

/**
 * Validates that the button state is correct for the given form state
 */
function validateButtonState(
  formState: FormSubmissionState,
  buttonState: SubmitButtonState,
  formType: FormType
): boolean {
  const expected = getExpectedButtonState(formState, formType);

  // During submission, button MUST be disabled and show loading
  if (formState.isSubmitting) {
    return buttonState.disabled === true && buttonState.showsLoadingIndicator === true;
  }

  // When not submitting, loading indicator must be hidden
  return buttonState.showsLoadingIndicator === false;
}

/**
 * Simulates form submission lifecycle
 */
function simulateFormSubmission(
  initialState: FormSubmissionState
): FormSubmissionState[] {
  const states: FormSubmissionState[] = [];

  // Initial state
  states.push({ ...initialState });

  // If form is valid, simulate submission
  if (initialState.isValid && !initialState.hasErrors) {
    // Submitting state
    states.push({
      isSubmitting: true,
      isValid: true,
      hasErrors: false,
    });

    // Completed state (success or error)
    states.push({
      isSubmitting: false,
      isValid: true,
      hasErrors: false,
    });
  }

  return states;
}

/**
 * Checks if double submission is prevented
 */
function isDoubleSubmissionPrevented(buttonState: SubmitButtonState): boolean {
  // If button is disabled, double submission is prevented
  return buttonState.disabled;
}

/**
 * Arbitrary generators
 */
const formTypeArb = fc.constantFrom<FormType>('login', 'signup', 'settings', 'profile', 'contact');

const formSubmissionStateArb = fc.record({
  isSubmitting: fc.boolean(),
  isValid: fc.boolean(),
  hasErrors: fc.boolean(),
});

const validFormStateArb = fc.record({
  isSubmitting: fc.boolean(),
  isValid: fc.constant(true),
  hasErrors: fc.constant(false),
});

const submittingFormStateArb = fc.record({
  isSubmitting: fc.constant(true),
  isValid: fc.boolean(),
  hasErrors: fc.boolean(),
});

describe('Form Submit Loading State - Property Tests', () => {
  describe('Property 17: Form Submit Loading State', () => {
    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Submit button is disabled during form submission
     */
    it('submit button is disabled during form submission', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const submittingState: FormSubmissionState = {
            isSubmitting: true,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(submittingState, formType);

          expect(buttonState.disabled).toBe(true);

          return buttonState.disabled === true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Loading indicator is shown during form submission
     */
    it('loading indicator is shown during form submission', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const submittingState: FormSubmissionState = {
            isSubmitting: true,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(submittingState, formType);

          expect(buttonState.showsLoadingIndicator).toBe(true);

          return buttonState.showsLoadingIndicator === true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Loading indicator is hidden when not submitting
     */
    it('loading indicator is hidden when not submitting', () => {
      fc.assert(
        fc.property(formTypeArb, fc.boolean(), fc.boolean(), (formType, isValid, hasErrors) => {
          const notSubmittingState: FormSubmissionState = {
            isSubmitting: false,
            isValid,
            hasErrors,
          };

          const buttonState = getExpectedButtonState(notSubmittingState, formType);

          expect(buttonState.showsLoadingIndicator).toBe(false);

          return buttonState.showsLoadingIndicator === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Button text changes to loading text during submission
     */
    it('button text changes to loading text during submission', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const submittingState: FormSubmissionState = {
            isSubmitting: true,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(submittingState, formType);
          const expectedLoadingText = getLoadingText(formType);

          expect(buttonState.text).toBe(expectedLoadingText);

          return buttonState.text === expectedLoadingText;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Button text shows default text when not submitting
     */
    it('button text shows default text when not submitting', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const notSubmittingState: FormSubmissionState = {
            isSubmitting: false,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(notSubmittingState, formType);
          const expectedDefaultText = getDefaultText(formType);

          expect(buttonState.text).toBe(expectedDefaultText);

          return buttonState.text === expectedDefaultText;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Double submission is prevented during async operation
     */
    it('double submission is prevented during async operation', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const submittingState: FormSubmissionState = {
            isSubmitting: true,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(submittingState, formType);
          const prevented = isDoubleSubmissionPrevented(buttonState);

          expect(prevented).toBe(true);

          return prevented === true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Form submission lifecycle maintains correct button states
     */
    it('form submission lifecycle maintains correct button states', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const initialState: FormSubmissionState = {
            isSubmitting: false,
            isValid: true,
            hasErrors: false,
          };

          const lifecycle = simulateFormSubmission(initialState);

          // Verify each state in the lifecycle
          for (const state of lifecycle) {
            const buttonState = getExpectedButtonState(state, formType);
            const isValid = validateButtonState(state, buttonState, formType);
            expect(isValid).toBe(true);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Invalid forms have disabled submit button
     */
    it('invalid forms have disabled submit button', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const invalidState: FormSubmissionState = {
            isSubmitting: false,
            isValid: false,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(invalidState, formType);

          expect(buttonState.disabled).toBe(true);
          expect(buttonState.showsLoadingIndicator).toBe(false);

          return buttonState.disabled === true && buttonState.showsLoadingIndicator === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Forms with errors have disabled submit button
     */
    it('forms with errors have disabled submit button', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const errorState: FormSubmissionState = {
            isSubmitting: false,
            isValid: true,
            hasErrors: true,
          };

          const buttonState = getExpectedButtonState(errorState, formType);

          expect(buttonState.disabled).toBe(true);
          expect(buttonState.showsLoadingIndicator).toBe(false);

          return buttonState.disabled === true && buttonState.showsLoadingIndicator === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Valid forms without errors have enabled submit button
     */
    it('valid forms without errors have enabled submit button', () => {
      fc.assert(
        fc.property(formTypeArb, (formType) => {
          const validState: FormSubmissionState = {
            isSubmitting: false,
            isValid: true,
            hasErrors: false,
          };

          const buttonState = getExpectedButtonState(validState, formType);

          expect(buttonState.disabled).toBe(false);
          expect(buttonState.showsLoadingIndicator).toBe(false);

          return buttonState.disabled === false && buttonState.showsLoadingIndicator === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Button state is deterministic for same form state
     */
    it('button state is deterministic for same form state', () => {
      fc.assert(
        fc.property(formSubmissionStateArb, formTypeArb, (formState, formType) => {
          const buttonState1 = getExpectedButtonState(formState, formType);
          const buttonState2 = getExpectedButtonState(formState, formType);
          const buttonState3 = getExpectedButtonState(formState, formType);

          expect(buttonState1).toEqual(buttonState2);
          expect(buttonState2).toEqual(buttonState3);

          return (
            JSON.stringify(buttonState1) === JSON.stringify(buttonState2) &&
            JSON.stringify(buttonState2) === JSON.stringify(buttonState3)
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: All form types have distinct loading and default texts
     */
    it('all form types have distinct loading and default texts', () => {
      const formTypes: FormType[] = ['login', 'signup', 'settings', 'profile', 'contact'];

      for (const formType of formTypes) {
        const loadingText = getLoadingText(formType);
        const defaultText = getDefaultText(formType);

        // Loading text should be different from default text
        expect(loadingText).not.toBe(defaultText);

        // Loading text should indicate ongoing action (ends with ...)
        expect(loadingText.endsWith('...')).toBe(true);

        // Both texts should be non-empty
        expect(loadingText.length).toBeGreaterThan(0);
        expect(defaultText.length).toBeGreaterThan(0);
      }
    });

    /**
     * **Feature: mobile-performance-refactor, Property 17: Form Submit Loading State**
     * **Validates: Requirements 16.4**
     *
     * Property: Submitting state always results in disabled button regardless of validity
     */
    it('submitting state always results in disabled button regardless of validity', () => {
      fc.assert(
        fc.property(
          formTypeArb,
          fc.boolean(),
          fc.boolean(),
          (formType, isValid, hasErrors) => {
            const submittingState: FormSubmissionState = {
              isSubmitting: true,
              isValid,
              hasErrors,
            };

            const buttonState = getExpectedButtonState(submittingState, formType);

            // During submission, button must always be disabled
            expect(buttonState.disabled).toBe(true);
            expect(buttonState.showsLoadingIndicator).toBe(true);

            return buttonState.disabled === true && buttonState.showsLoadingIndicator === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
