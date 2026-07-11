import { ParserJobRepository, ReviewQueueRepository } from '@examforge/db';
import type { ParserJob } from '@examforge/db';

const DUMMY_EXAM_JSON = {
  title: "Mock Parsed Exam",
  examType: "JEE_MAIN",
  durationMinutes: 180,
  instructions: "Standard instructions apply.",
  markingScheme: { correct: 4, incorrect: -1, unanswered: 0 },
  sections: [
    {
      id: "sec-1", name: "Physics", order: 1,
      questions: [
        {
          id: "q-1", displayNumber: "1", statement: "What is the velocity of light?",
          imageUrls: [],
          options: [
            { id: "opt-a", label: "A", text: "3e8 m/s", isCorrect: true },
            { id: "opt-b", label: "B", text: "3e5 m/s", isCorrect: false },
            { id: "opt-c", label: "C", text: "3e4 m/s", isCorrect: false },
            { id: "opt-d", label: "D", text: "None", isCorrect: false }
          ],
          explanation: "Speed of light in vacuum.", marks: 4, negativeMarks: 1
        }
      ]
    }
  ]
};

export class MockParserAdapter {
  /**
   * Simulates parser progress based on time elapsed since job creation.
   * QUEUED: 0-2 seconds
   * PROCESSING: 2-8 seconds
   * COMPLETED: >8 seconds
   */
  static async simulateProgress(job: ParserJob): Promise<ParserJob> {
    const status = job.status as string;
    if (status === 'COMPLETED' || status === 'FAILED') {
      return job;
    }

    const elapsedMs = Date.now() - job.createdAt.getTime();
    
    if (elapsedMs > 8000 && status !== 'COMPLETED') {
      const updatedJob = await ParserJobRepository.updateStatus(job.id, 'COMPLETED', {
        overallConfidence: 0.95,
        resultJson: { mocked: true, message: "Parsed successfully" } as any
      });

      await ReviewQueueRepository.create({
        parserJobId: job.id,
        workingJson: DUMMY_EXAM_JSON as any,
        status: 'PENDING',
      });

      return updatedJob;
    }
    
    if (elapsedMs > 2000 && status === 'QUEUED') {
      return ParserJobRepository.updateStatus(job.id, 'PROCESSING');
    }

    return job;
  }
}
