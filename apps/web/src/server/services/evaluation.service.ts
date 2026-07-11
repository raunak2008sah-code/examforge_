export class EvaluationService {
  static calculateScore(attempt: any, examVersion: any) {
    const markingScheme = (examVersion.snapshotJson as any)?.markingScheme || { correct: 4, incorrect: -1, unanswered: 0 };
    
    let score = 0;
    
    const correctOptions = new Set<string>();
    for (const sec of examVersion.sections) {
      for (const q of sec.questions) {
        for (const opt of q.options) {
          if (opt.isCorrect) correctOptions.add(opt.id);
        }
      }
    }

    for (const response of attempt.responses) {
      if (!response.selectedOptionId) continue;
      
      if (correctOptions.has(response.selectedOptionId)) {
        score += markingScheme.correct;
      } else {
        score += markingScheme.incorrect;
      }
    }

    return score;
  }
}
