import { AppConfig } from '../../types';
import { validateAppConfig } from '../../utils';

export interface IConfigValidator {
  validate(config: AppConfig): ValidationResult;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export class ConfigValidator implements IConfigValidator {
  validate(config: AppConfig): ValidationResult {
    try {
      const result = validateAppConfig(config);

      return {
        errors: result.errors,
        warnings: result.warnings,
        isValid: result.errors.length === 0,
      };
    } catch (error) {
      return {
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        isValid: false,
      };
    }
  }

  validateAndReport(config: AppConfig, reportCallback: (result: ValidationResult) => void): ValidationResult {
    const result = this.validate(config);
    reportCallback(result);
    return result;
  }
}
