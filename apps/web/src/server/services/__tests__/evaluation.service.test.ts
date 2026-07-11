import { describe, it, expect } from 'vitest';
import { EvaluationService } from '../evaluation.service';

describe('EvaluationService', () => {
  const mockExamVersion = {
    snapshotJson: {
      markingScheme: { correct: 4, incorrect: -1, unanswered: 0 }
    },
    sections: [
      {
        questions: [
          {
            id: 'q1',
            options: [
              { id: 'opt1', isCorrect: true },
              { id: 'opt2', isCorrect: false }
            ]
          },
          {
            id: 'q2',
            options: [
              { id: 'opt3', isCorrect: false },
              { id: 'opt4', isCorrect: true }
            ]
          },
          {
            id: 'q3',
            options: [
              { id: 'opt5', isCorrect: true },
              { id: 'opt6', isCorrect: false }
            ]
          }
        ]
      }
    ]
  };

  it('calculates score correctly with positive, negative, and skipped marks', () => {
    const attempt = {
      responses: [
        { questionId: 'q1', selectedOptionId: 'opt1' }, // Correct (+4)
        { questionId: 'q2', selectedOptionId: 'opt3' }, // Incorrect (-1)
        { questionId: 'q3', selectedOptionId: null }    // Skipped (0)
      ]
    };

    const score = EvaluationService.calculateScore(attempt, mockExamVersion);
    expect(score).toBe(3); // 4 - 1 + 0 = 3
  });

  it('handles missing marking scheme by defaulting to +4/-1/0', () => {
    const versionWithoutScheme = { ...mockExamVersion, snapshotJson: {} };
    const attempt = {
      responses: [
        { questionId: 'q1', selectedOptionId: 'opt1' }, // Correct (+4)
      ]
    };

    const score = EvaluationService.calculateScore(attempt, versionWithoutScheme);
    expect(score).toBe(4);
  });
});
