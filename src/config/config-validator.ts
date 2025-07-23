import { Config } from '../types';
import { validateConfig } from '../utils';

export interface IConfigValidator {
  validate(config: Config): ValidationResult;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export class ConfigValidator implements IConfigValidator {
  validate(config: Config): ValidationResult {
    try {
      const result = validateConfig(config);

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

  validateAndReport(config: Config, reportCallback: (result: ValidationResult) => void): ValidationResult {
    const result = this.validate(config);
    reportCallback(result);
    return result;
  }
}
