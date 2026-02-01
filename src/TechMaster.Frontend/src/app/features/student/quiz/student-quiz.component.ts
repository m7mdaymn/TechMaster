import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { QuizService } from '../../../core/services/quiz.service';
import { ProgressService } from '../../../core/services/progress.service';

interface QuizQuestion {
  id: string;
  questionEn: string;
  questionAr?: string;
  type: 'single' | 'multiple' | 'true-false';
  points: number;
  options: QuizOption[];
  selectedOptionIds: string[];
}

interface QuizOption {
  id: string;
  textEn: string;
  textAr?: string;
  isSelected: boolean;
}

interface QuizData {
  id: string;
  name: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  questions: QuizQuestion[];
  sessionId: string;
  courseId?: string;
}

@Component({
  selector: 'app-student-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quiz-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading quiz...</p>
        </div>
      } @else if (!quizStarted()) {
        <div class="quiz-intro">
          <div class="intro-card">
            <div class="quiz-icon">📝</div>
            <h1>{{ quizData()?.name }}</h1>
            @if (quizData()?.description) {
              <p class="description">{{ quizData()?.description }}</p>
            }
            <div class="quiz-info">
              <div class="info-item">
                <span class="icon">❓</span>
                <span>{{ quizData()?.questions?.length || 0 }} Questions</span>
              </div>
              <div class="info-item">
                <span class="icon">⏱️</span>
                <span>{{ quizData()?.timeLimit || 30 }} Minutes</span>
              </div>
              <div class="info-item">
                <span class="icon">🎯</span>
                <span>Passing Score: {{ quizData()?.passingScore || 70 }}%</span>
              </div>
              <div class="info-item">
                <span class="icon">⭐</span>
                <span>{{ getTotalPoints() }} Points</span>
              </div>
            </div>
            <div class="quiz-rules">
              <h3>Quiz Rules</h3>
              <ul>
                <li>You must complete the quiz within the time limit</li>
                <li>Once started, you cannot pause the quiz</li>
                <li>Each question must be answered before submitting</li>
                <li>You need {{ quizData()?.passingScore || 70 }}% to pass</li>
              </ul>
            </div>
            <button class="start-btn" (click)="startQuiz()">
              Start Quiz
            </button>
            <button class="back-btn" (click)="goBack()">
              ← Back to Course
            </button>
          </div>
        </div>
      } @else if (quizCompleted()) {
        <div class="quiz-results">
          <div class="results-card" [class.passed]="isPassed()" [class.failed]="!isPassed()">
            <div class="result-icon">
              {{ isPassed() ? '🎉' : '😔' }}
            </div>
            <h1>{{ isPassed() ? 'Congratulations!' : 'Keep Learning!' }}</h1>
            <p class="result-message">
              {{ isPassed() 
                ? 'You have successfully passed the quiz!' 
                : 'You did not pass this time. Review the material and try again.' 
              }}
            </p>
            <div class="score-display">
              <div class="score-circle" [class.passed]="isPassed()">
                <span class="score">{{ quizResult()?.score || 0 }}%</span>
              </div>
              <div class="score-details">
                <p>Correct Answers: {{ quizResult()?.correctAnswers || 0 }} / {{ quizData()?.questions?.length || 0 }}</p>
                <p>Points Earned: {{ quizResult()?.pointsEarned || 0 }} / {{ getTotalPoints() }}</p>
                <p>Time Taken: {{ formatTime(quizResult()?.timeTaken || 0) }}</p>
              </div>
            </div>
            <div class="result-actions">
              @if (!isPassed()) {
                <button class="retry-btn" (click)="retryQuiz()">
                  🔄 Try Again
                </button>
              }
              <button class="back-btn" (click)="goBack()">
                ← Back to Course
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="quiz-taking">
          <div class="quiz-header">
            <div class="quiz-title">
              <h2>{{ quizData()?.name }}</h2>
            </div>
            <div class="quiz-progress">
              <span>Question {{ currentQuestionIndex() + 1 }} of {{ quizData()?.questions?.length }}</span>
            </div>
            <div class="quiz-timer" [class.warning]="timeRemaining() < 60">
              <span class="icon">⏱️</span>
              <span>{{ formatTime(timeRemaining()) }}</span>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
          </div>

          @if (getCurrentQuestion()) {
            <div class="question-card">
              <div class="question-header">
                <span class="question-number">Question {{ currentQuestionIndex() + 1 }}</span>
                <span class="question-points">{{ getCurrentQuestion()?.points || 1 }} points</span>
              </div>
              <p class="question-text">{{ getCurrentQuestion()?.questionEn }}</p>

              <div class="options-list">
                @for (option of getCurrentQuestion()?.options; track option.id) {
                  <div 
                    class="option-item" 
                    [class.selected]="isOptionSelected(option.id)"
                    (click)="selectOption(option)"
                  >
                    <div class="option-checkbox">
                      @if (getCurrentQuestion()?.type === 'multiple') {
                        <span>{{ isOptionSelected(option.id) ? '☑' : '☐' }}</span>
                      } @else {
                        <span>{{ isOptionSelected(option.id) ? '●' : '○' }}</span>
                      }
                    </div>
                    <span class="option-text">{{ option.textEn }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="navigation-buttons">
              <button 
                class="prev-btn" 
                (click)="previousQuestion()"
                [disabled]="currentQuestionIndex() === 0"
              >
                ← Previous
              </button>
              
              <div class="question-dots">
                @for (q of quizData()?.questions; track q.id; let i = $index) {
                  <span 
                    class="dot" 
                    [class.current]="i === currentQuestionIndex()"
                    [class.answered]="isQuestionAnswered(i)"
                    (click)="goToQuestion(i)"
                  ></span>
                }
              </div>

              @if (currentQuestionIndex() < (quizData()?.questions?.length || 0) - 1) {
                <button class="next-btn" (click)="nextQuestion()">
                  Next →
                </button>
              } @else {
                <button 
                  class="submit-btn" 
                  (click)="submitQuiz()"
                  [disabled]="!allQuestionsAnswered() || submitting()"
                >
                  {{ submitting() ? 'Submitting...' : 'Submit Quiz' }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .quiz-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      color: white;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .quiz-intro, .quiz-results {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }

    .intro-card, .results-card {
      background: white;
      border-radius: 20px;
      padding: 3rem;
      max-width: 600px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .quiz-icon, .result-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .intro-card h1, .results-card h1 {
      font-size: 2rem;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .description {
      color: #64748b;
      margin-bottom: 2rem;
    }

    .quiz-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 12px;
      justify-content: center;
    }

    .info-item .icon {
      font-size: 1.2rem;
    }

    .quiz-rules {
      text-align: left;
      background: #fef3c7;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .quiz-rules h3 {
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    .quiz-rules ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #92400e;
    }

    .quiz-rules li {
      margin-bottom: 0.25rem;
    }

    .start-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem 3rem;
      font-size: 1.2rem;
      border-radius: 50px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-bottom: 1rem;
      display: block;
      width: 100%;
    }

    .start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .back-btn {
      background: transparent;
      border: 2px solid #e2e8f0;
      color: #64748b;
      padding: 0.75rem 2rem;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      border-color: #667eea;
      color: #667eea;
    }

    /* Quiz Taking Styles */
    .quiz-taking {
      max-width: 800px;
      margin: 0 auto;
    }

    .quiz-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1rem 2rem;
      border-radius: 15px;
      margin-bottom: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .quiz-title h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1.2rem;
    }

    .quiz-progress {
      color: #64748b;
    }

    .quiz-timer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border-radius: 25px;
      font-weight: 600;
      color: #1e293b;
    }

    .quiz-timer.warning {
      background: #fee2e2;
      color: #dc2626;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
      margin-bottom: 2rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: white;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .question-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .question-number {
      color: #667eea;
      font-weight: 600;
    }

    .question-points {
      background: #f1f5f9;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.875rem;
      color: #64748b;
    }

    .question-text {
      font-size: 1.25rem;
      color: #1e293b;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .option-item:hover {
      background: #f1f5f9;
      border-color: #667eea;
    }

    .option-item.selected {
      background: #eef2ff;
      border-color: #667eea;
    }

    .option-checkbox {
      font-size: 1.5rem;
      color: #667eea;
    }

    .option-text {
      color: #1e293b;
      font-size: 1rem;
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .prev-btn, .next-btn {
      background: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      color: #1e293b;
      transition: all 0.2s;
    }

    .prev-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .prev-btn:hover:not(:disabled), .next-btn:hover {
      background: #f1f5f9;
    }

    .question-dots {
      display: flex;
      gap: 0.5rem;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      cursor: pointer;
      transition: all 0.2s;
    }

    .dot.current {
      background: white;
      transform: scale(1.2);
    }

    .dot.answered {
      background: #10b981;
    }

    .submit-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn:hover:not(:disabled) {
      background: #059669;
    }

    /* Results Styles */
    .results-card.passed {
      border: 3px solid #10b981;
    }

    .results-card.failed {
      border: 3px solid #ef4444;
    }

    .result-message {
      color: #64748b;
      margin-bottom: 2rem;
    }

    .score-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fee2e2;
      border: 4px solid #ef4444;
    }

    .score-circle.passed {
      background: #d1fae5;
      border-color: #10b981;
    }

    .score {
      font-size: 2rem;
      font-weight: bold;
      color: #1e293b;
    }

    .score-details {
      text-align: left;
    }

    .score-details p {
      margin: 0.5rem 0;
      color: #64748b;
    }

    .result-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .retry-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .retry-btn:hover {
      background: #5a67d8;
    }

    @media (max-width: 768px) {
      .quiz-container {
        padding: 1rem;
      }

      .intro-card, .results-card {
        padding: 2rem;
      }

      .quiz-info {
        grid-template-columns: 1fr;
      }

      .quiz-header {
        flex-direction: column;
        gap: 1rem;
      }

      .score-display {
        flex-direction: column;
      }

      .navigation-buttons {
        flex-wrap: wrap;
      }

      .question-dots {
        order: 3;
        width: 100%;
        justify-content: center;
        margin-top: 1rem;
      }
    }
  `]
})
export class StudentQuizComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private progressService = inject(ProgressService);
  private toastr = inject(ToastrService);

  loading = signal(true);
  quizData = signal<QuizData | null>(null);
  quizStarted = signal(false);
  quizCompleted = signal(false);
  currentQuestionIndex = signal(0);
  timeRemaining = signal(0);
  submitting = signal(false);
  quizResult = signal<{
    score: number;
    correctAnswers: number;
    pointsEarned: number;
    timeTaken: number;
    passed: boolean;
  } | null>(null);

  private timerInterval: any;
  private startTime: number = 0;

  ngOnInit() {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) {
      this.loadQuiz(sessionId);
    } else {
      this.toastr.error('Session ID not found');
      this.goBack();
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadQuiz(sessionId: string) {
    this.loading.set(true);
    
    this.quizService.getQuizBySession(sessionId).subscribe({
      next: (response: any) => {
        if (response.isSuccess && response.data) {
          const quiz = response.data;
          this.quizData.set({
            id: quiz.id,
            name: quiz.nameEn || quiz.name || 'Quiz',
            description: quiz.descriptionEn || quiz.description,
            timeLimit: quiz.timeLimit || 30,
            passingScore: quiz.passingScore || 70,
            sessionId: sessionId,
            courseId: quiz.courseId,
            questions: (quiz.questions || []).map((q: any) => ({
              id: q.id,
              questionEn: q.questionTextEn || q.questionEn || q.text,
              questionAr: q.questionTextAr || q.questionAr,
              type: this.getQuestionType(q),
              points: q.points || 1,
              selectedOptionIds: [],
              options: (q.options || []).map((o: any) => ({
                id: o.id,
                textEn: o.optionTextEn || o.textEn || o.text,
                textAr: o.optionTextAr || o.textAr,
                isSelected: false
              }))
            }))
          });
          this.timeRemaining.set((quiz.timeLimit || 30) * 60);
        } else {
          this.toastr.error(response.messageEn || 'Failed to load quiz');
          this.goBack();
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading quiz:', err);
        this.toastr.error('Failed to load quiz');
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  getQuestionType(question: any): 'single' | 'multiple' | 'true-false' {
    if (question.type) {
      const type = question.type.toString().toLowerCase();
      if (type.includes('multiple')) return 'multiple';
      if (type.includes('true') || type.includes('false')) return 'true-false';
    }
    const correctCount = (question.options || []).filter((o: any) => o.isCorrect).length;
    return correctCount > 1 ? 'multiple' : 'single';
  }

  getTotalPoints(): number {
    return this.quizData()?.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
  }

  startQuiz() {
    this.quizStarted.set(true);
    this.startTime = Date.now();
    this.startTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const remaining = this.timeRemaining();
      if (remaining <= 0) {
        this.submitQuiz();
      } else {
        this.timeRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getProgressPercentage(): number {
    const total = this.quizData()?.questions?.length || 1;
    return ((this.currentQuestionIndex() + 1) / total) * 100;
  }

  getCurrentQuestion(): QuizQuestion | null {
    const questions = this.quizData()?.questions;
    if (!questions) return null;
    return questions[this.currentQuestionIndex()] || null;
  }

  selectOption(option: QuizOption) {
    const question = this.getCurrentQuestion();
    if (!question) return;

    if (question.type === 'multiple') {
      // Toggle selection for multiple choice
      const idx = question.selectedOptionIds.indexOf(option.id);
      if (idx >= 0) {
        question.selectedOptionIds.splice(idx, 1);
      } else {
        question.selectedOptionIds.push(option.id);
      }
    } else {
      // Single selection
      question.selectedOptionIds = [option.id];
    }
  }

  isOptionSelected(optionId: string): boolean {
    const question = this.getCurrentQuestion();
    return question?.selectedOptionIds.includes(optionId) || false;
  }

  isQuestionAnswered(index: number): boolean {
    const questions = this.quizData()?.questions;
    if (!questions || !questions[index]) return false;
    return questions[index].selectedOptionIds.length > 0;
  }

  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  nextQuestion() {
    const total = this.quizData()?.questions?.length || 0;
    if (this.currentQuestionIndex() < total - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  goToQuestion(index: number) {
    this.currentQuestionIndex.set(index);
  }

  allQuestionsAnswered(): boolean {
    return this.quizData()?.questions?.every(q => q.selectedOptionIds.length > 0) || false;
  }

  submitQuiz() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.submitting.set(true);
    const quiz = this.quizData();
    if (!quiz) return;

    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

    // Prepare answers for submission
    const answers = quiz.questions.map(q => ({
      questionId: q.id,
      selectedOptionIds: q.selectedOptionIds
    }));

    this.quizService.submitQuizAttempt(quiz.id, { answers }).subscribe({
      next: (response: any) => {
        if (response.isSuccess && response.data) {
          const result = response.data;
          this.quizResult.set({
            score: result.score || result.percentage || 0,
            correctAnswers: result.correctAnswers || result.correctCount || 0,
            pointsEarned: result.pointsEarned || result.points || 0,
            timeTaken: timeTaken,
            passed: result.passed || (result.score >= (quiz.passingScore || 70))
          });
          
          // Mark session as complete if passed
          if (this.quizResult()?.passed && quiz.sessionId) {
            this.markSessionComplete(quiz.sessionId);
          }
        } else {
          // Calculate locally if API doesn't return results
          this.calculateResultsLocally(timeTaken);
        }
        this.quizCompleted.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Error submitting quiz:', err);
        // Calculate locally on error
        this.calculateResultsLocally(timeTaken);
        this.quizCompleted.set(true);
        this.submitting.set(false);
      }
    });
  }

  calculateResultsLocally(timeTaken: number) {
    const quiz = this.quizData();
    if (!quiz) return;

    // This is a fallback - in real scenario, server should calculate
    // For now, just show that quiz was completed
    this.quizResult.set({
      score: 0,
      correctAnswers: 0,
      pointsEarned: 0,
      timeTaken: timeTaken,
      passed: false
    });
    this.toastr.info('Quiz submitted. Results will be processed.');
  }

  markSessionComplete(sessionId: string) {
    this.progressService.completeSession(sessionId).subscribe({
      next: () => {
        this.toastr.success('Session marked as complete!');
      },
      error: () => {
        // Silently fail - not critical
      }
    });
  }

  isPassed(): boolean {
    return this.quizResult()?.passed || false;
  }

  retryQuiz() {
    const quiz = this.quizData();
    if (quiz) {
      // Reset quiz state
      quiz.questions.forEach(q => {
        q.selectedOptionIds = [];
      });
      this.quizData.set({ ...quiz });
      this.currentQuestionIndex.set(0);
      this.timeRemaining.set((quiz.timeLimit || 30) * 60);
      this.quizCompleted.set(false);
      this.quizResult.set(null);
      this.startQuiz();
    }
  }

  goBack() {
    // Navigate back to course learning page
    const courseId = this.route.snapshot.queryParamMap.get('courseId');
    if (courseId) {
      this.router.navigate(['/student/learn', courseId]);
    } else {
      this.router.navigate(['/student/my-courses']);
    }
  }
}
