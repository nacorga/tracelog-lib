import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface FailedTest {
  title: string;
  file: string;
  line: number;
  column: number;
  message: string;
  snippet: string;
}

class FailedOnlyReporter implements Reporter {
  private readonly failed: FailedTest[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'failed') {
      this.failed.push({
        title: test.title,
        file: test.location.file,
        line: test.location.line,
        column: test.location.column,
        message: this.stripAnsi(result.error?.message),
        snippet: this.stripAnsi(result.error?.snippet),
      });
    }
  }

  onEnd(): void {
    const outputPath = 'test-results/failed-tests.json';

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(this.failed, null, 2));
  }

  private stripAnsi(s?: string): string {
    // eslint-disable-next-line no-control-regex
    return s ? s.replace(/\u001b\[[0-9;]*m/g, '') : (s ?? '');
  }
}

export = FailedOnlyReporter;
