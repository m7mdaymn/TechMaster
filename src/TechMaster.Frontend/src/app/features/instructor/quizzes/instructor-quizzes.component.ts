import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, CourseDto } from '@core/services/instructor.service';
import { ToastrService } from 'ngx-toastr';

interface QuizDto {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  moduleId?: string;
  moduleName?: string;
  passingScore: number;
  timeLimit?: number;
  questionsCount: number;
  attemptsCount: number;
  averageScore: number;
  isPublished: boolean;
  createdAt: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: 'single' | 'multiple' | 'truefalse' | 'text';
  options: QuizOption[];
  points: number;
  order: number;
}

interface QuizOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-instructor-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quizzes-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Quizzes</h1>
          <p class="subtitle">Create and manage course assessments</p>
        </div>
        <button class="create-btn" (click)="showCreateModal()">
          <span class="material-icons">add</span>
          Create Quiz
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="material-icons stat-icon">quiz</span>
          <div class="stat-info">
            <span class="stat-value">{{ quizzes().length }}</span>
            <span class="stat-label">Total Quizzes</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons stat-icon">help_outline</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalQuestions() }}</span>
            <span class="stat-label">Total Questions</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons stat-icon">people</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalAttempts() }}</span>
            <span class="stat-label">Total Attempts</span>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <select [(ngModel)]="filterCourse" (change)="applyFilter()">
          <option value="">All Courses</option>
          @for (course of courses(); track course.id) {
            <option [value]="course.id">{{ course.nameEn }}</option>
          }
        </select>
        <select [(ngModel)]="filterStatus" (change)="applyFilter()">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (filteredQuizzes().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <h3>No Quizzes Found</h3>
          <p>Create your first quiz to assess student knowledge</p>
          <button class="create-btn-small" (click)="showCreateModal()">Create Quiz</button>
        </div>
      } @else {
        <div class="quizzes-grid">
          @for (quiz of filteredQuizzes(); track quiz.id) {
            <div class="quiz-card" [class.draft]="!quiz.isPublished">
              <div class="quiz-header">
                <span class="status-badge" [class.published]="quiz.isPublished">
                  {{ quiz.isPublished ? 'Published' : 'Draft' }}
                </span>
                <div class="quiz-actions-menu">
                  <button class="menu-btn" (click)="toggleMenu(quiz.id)">
                    <span class="material-icons">more_vert</span>
                  </button>
                  @if (openMenuId() === quiz.id) {
                    <div class="dropdown-menu">
                      <button (click)="editQuiz(quiz)">
                        <span class="material-icons">edit</span> Edit
                      </button>
                      <button (click)="manageQuestions(quiz)">
                        <span class="material-icons">help_outline</span> Questions
                      </button>
                      <button (click)="togglePublish(quiz)">
                        <span class="material-icons">{{ quiz.isPublished ? 'unpublished' : 'publish' }}</span>
                        {{ quiz.isPublished ? 'Unpublish' : 'Publish' }}
                      </button>
                      <button class="danger" (click)="deleteQuiz(quiz)">
                        <span class="material-icons">delete</span> Delete
                      </button>
                    </div>
                  }
                </div>
              </div>

              <h3 class="quiz-title">{{ quiz.title }}</h3>
              <p class="quiz-course">{{ quiz.courseName }}</p>
              @if (quiz.moduleName) {
                <p class="quiz-module">Module: {{ quiz.moduleName }}</p>
              }

              <div class="quiz-stats">
                <div class="quiz-stat">
                  <span class="stat-number">{{ quiz.questionsCount }}</span>
                  <span class="stat-text">Questions</span>
                </div>
                <div class="quiz-stat">
                  <span class="stat-number">{{ quiz.attemptsCount }}</span>
                  <span class="stat-text">Attempts</span>
                </div>
                <div class="quiz-stat">
                  <span class="stat-number">{{ quiz.averageScore | number:'1.0-0' }}%</span>
                  <span class="stat-text">Avg Score</span>
                </div>
              </div>

              <div class="quiz-meta">
                @if (quiz.timeLimit) {
                  <span><span class="material-icons">timer</span> {{ quiz.timeLimit }} min</span>
                }
                <span><span class="material-icons">check_circle</span> Pass: {{ quiz.passingScore }}%</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Quiz Modal -->
      @if (showQuizModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingQuiz() ? 'Edit Quiz' : 'Create New Quiz' }}</h2>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form class="quiz-form" (ngSubmit)="saveQuiz()">
              <div class="form-group">
                <label>Quiz Title *</label>
                <input type="text" [(ngModel)]="quizForm.title" name="title" required
                  placeholder="e.g., JavaScript Fundamentals Assessment">
              </div>

              <div class="form-group">
                <label>Course *</label>
                <select [(ngModel)]="quizForm.courseId" name="courseId" required (change)="loadModules()">
                  <option value="">Select a course</option>
                  @for (course of courses(); track course.id) {
                    <option [value]="course.id">{{ course.nameEn }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Module (Optional)</label>
                <select [(ngModel)]="quizForm.moduleId" name="moduleId">
                  <option value="">Course-level quiz</option>
                  @for (module of modules(); track module.id) {
                    <option [value]="module.id">{{ module.nameEn || module.title }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="quizForm.description" name="description" rows="3"
                  placeholder="Brief description of what this quiz covers..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Passing Score (%) *</label>
                  <input type="number" [(ngModel)]="quizForm.passingScore" name="passingScore"
                    required min="0" max="100">
                </div>
                <div class="form-group">
                  <label>Time Limit (minutes)</label>
                  <input type="number" [(ngModel)]="quizForm.timeLimit" name="timeLimit" min="1"
                    placeholder="Optional">
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
                <button type="submit" class="submit-btn" [disabled]="saving()">
                  {{ saving() ? 'Saving...' : (editingQuiz() ? 'Update Quiz' : 'Create Quiz') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Questions Management Modal -->
      @if (showQuestionsModal()) {
        <div class="modal-overlay" (click)="closeQuestionsModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Manage Questions - {{ selectedQuiz()?.title }}</h2>
              <button class="close-btn" (click)="closeQuestionsModal()">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="questions-content">
              <div class="questions-toolbar">
                <button class="add-question-btn" (click)="addQuestion()">
                  <span class="material-icons">add</span>
                  Add Question
                </button>
              </div>

              <div class="questions-list">
                @for (question of questions(); track question.id; let i = $index) {
                  <div class="question-item">
                    <div class="question-header">
                      <span class="question-number">Q{{ i + 1 }}</span>
                      <select [(ngModel)]="question.questionType" class="type-select">
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                        <option value="truefalse">True/False</option>
                        <option value="text">Text Answer</option>
                      </select>
                      <input type="number" [(ngModel)]="question.points" class="points-input" min="1" placeholder="Points">
                      <button class="delete-question" (click)="removeQuestion(i)">
                        <span class="material-icons">delete</span>
                      </button>
                    </div>
                    <textarea [(ngModel)]="question.questionText" placeholder="Enter your question..."
                      class="question-text"></textarea>

                    @if (question.questionType !== 'text') {
                      <div class="options-list">
                        @for (option of question.options; track $index; let j = $index) {
                          <div class="option-item">
                            <input type="checkbox" [(ngModel)]="option.isCorrect" class="correct-check">
                            <input type="text" [(ngModel)]="option.optionText" placeholder="Option {{ j + 1 }}"
                              class="option-input">
                            <button class="remove-option" (click)="removeOption(question, j)">
                              <span class="material-icons">close</span>
                            </button>
                          </div>
                        }
                        <button class="add-option-btn" (click)="addOption(question)">
                          <span class="material-icons">add</span> Add Option
                        </button>
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="no-questions">
                    <p>No questions yet. Click "Add Question" to start.</p>
                  </div>
                }
              </div>

              <div class="questions-actions">
                <button class="cancel-btn" (click)="closeQuestionsModal()">Cancel</button>
                <button class="submit-btn" (click)="saveQuestions()" [disabled]="savingQuestions()">
                  {{ savingQuestions() ? 'Saving...' : 'Save Questions' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quizzes-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #64748b;
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
    }

    .stat-icon {
      font-size: 32px;
      color: #10b981;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 1.5rem;
    }

    .filter-bar select {
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      font-size: 0.95rem;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem;
      background: white;
      border-radius: 12px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .create-btn-small {
      margin-top: 1rem;
      padding: 10px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .quizzes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .quiz-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      position: relative;
    }

    .quiz-card.draft {
      border: 2px dashed #e2e8f0;
    }

    .quiz-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .status-badge {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 12px;
      background: #fef3c7;
      color: #d97706;
      font-weight: 600;
    }

    .status-badge.published {
      background: #dcfce7;
      color: #16a34a;
    }

    .quiz-actions-menu {
      position: relative;
    }

    .menu-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 4px;
    }

    .dropdown-menu {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10;
      min-width: 150px;
      overflow: hidden;
    }

    .dropdown-menu button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.9rem;
      color: #374151;
    }

    .dropdown-menu button:hover {
      background: #f8fafc;
    }

    .dropdown-menu button.danger {
      color: #dc2626;
    }

    .quiz-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .quiz-course {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 4px;
    }

    .quiz-module {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 16px;
    }

    .quiz-stats {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 12px;
    }

    .quiz-stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-text {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .quiz-meta {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: #64748b;
    }

    .quiz-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .quiz-meta .material-icons {
      font-size: 16px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.large {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
    }

    .quiz-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
    }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .cancel-btn, .submit-btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .cancel-btn {
      background: #f1f5f9;
      color: #64748b;
    }

    .submit-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Questions Modal */
    .questions-content {
      padding: 24px;
    }

    .questions-toolbar {
      margin-bottom: 20px;
    }

    .add-question-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .questions-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .question-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .question-number {
      background: #10b981;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .type-select, .points-input {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .points-input {
      width: 80px;
    }

    .delete-question {
      margin-left: auto;
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
    }

    .question-text {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
      min-height: 60px;
    }

    .options-list {
      margin-top: 12px;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .correct-check {
      width: 18px;
      height: 18px;
    }

    .option-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .remove-option {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .add-option-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: none;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .no-questions {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .questions-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class InstructorQuizzesComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private toastr = inject(ToastrService);

  quizzes = signal<QuizDto[]>([]);
  filteredQuizzes = signal<QuizDto[]>([]);
  courses = signal<CourseDto[]>([]);
  modules = signal<any[]>([]);
  questions = signal<QuizQuestion[]>([]);

  loading = signal(true);
  showQuizModal = signal(false);
  showQuestionsModal = signal(false);
  editingQuiz = signal<QuizDto | null>(null);
  selectedQuiz = signal<QuizDto | null>(null);
  saving = signal(false);
  savingQuestions = signal(false);
  openMenuId = signal<string | null>(null);

  filterCourse = '';
  filterStatus = '';

  quizForm = {
    title: '',
    description: '',
    courseId: '',
    moduleId: '',
    passingScore: 70,
    timeLimit: null as number | null
  };

  ngOnInit() {
    this.loadQuizzes();
    this.loadCourses();
    document.addEventListener('click', () => this.openMenuId.set(null));
  }

  loadQuizzes() {
    this.loading.set(true);
    this.instructorService.getMyQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes as QuizDto[]);
        this.filteredQuizzes.set(quizzes as QuizDto[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadCourses() {
    this.instructorService.getMyCourses().subscribe(courses => {
      this.courses.set(courses);
    });
  }

  loadModules() {
    if (this.quizForm.courseId) {
      this.instructorService.getCourseModules(this.quizForm.courseId).subscribe(modules => {
        this.modules.set(modules);
      });
    }
  }

  totalQuestions(): number {
    return this.quizzes().reduce((sum, q) => sum + q.questionsCount, 0);
  }

  totalAttempts(): number {
    return this.quizzes().reduce((sum, q) => sum + q.attemptsCount, 0);
  }

  applyFilter() {
    let filtered = this.quizzes();

    if (this.filterCourse) {
      filtered = filtered.filter(q => q.courseId === this.filterCourse);
    }

    if (this.filterStatus === 'published') {
      filtered = filtered.filter(q => q.isPublished);
    } else if (this.filterStatus === 'draft') {
      filtered = filtered.filter(q => !q.isPublished);
    }

    this.filteredQuizzes.set(filtered);
  }

  toggleMenu(quizId: string) {
    event?.stopPropagation();
    this.openMenuId.set(this.openMenuId() === quizId ? null : quizId);
  }

  showCreateModal() {
    this.editingQuiz.set(null);
    this.quizForm = {
      title: '',
      description: '',
      courseId: '',
      moduleId: '',
      passingScore: 70,
      timeLimit: null
    };
    this.showQuizModal.set(true);
  }

  editQuiz(quiz: QuizDto) {
    this.editingQuiz.set(quiz);
    this.quizForm = {
      title: quiz.title,
      description: quiz.description || '',
      courseId: quiz.courseId,
      moduleId: quiz.moduleId || '',
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit || null
    };
    if (quiz.courseId) {
      this.loadModules();
    }
    this.showQuizModal.set(true);
    this.openMenuId.set(null);
  }

  closeModal() {
    this.showQuizModal.set(false);
  }

  saveQuiz() {
    this.saving.set(true);
    const payload = {
      ...this.quizForm,
      moduleId: this.quizForm.moduleId || undefined,
      timeLimit: this.quizForm.timeLimit || undefined
    };

    const request = this.editingQuiz()
      ? this.instructorService.updateQuiz(this.editingQuiz()!.id, payload)
      : this.instructorService.createQuiz(this.quizForm.courseId, payload);

    request.subscribe({
      next: (quiz) => {
        this.toastr.success(`Quiz ${this.editingQuiz() ? 'updated' : 'created'} successfully`);
        this.loadQuizzes();
        this.closeModal();
        this.saving.set(false);
      },
      error: () => {
        this.toastr.error('Failed to save quiz');
        this.saving.set(false);
      }
    });
  }

  manageQuestions(quiz: QuizDto) {
    this.selectedQuiz.set(quiz);
    this.openMenuId.set(null);
    // Load questions for this quiz
    this.instructorService.getQuizQuestions(quiz.id).subscribe({
      next: (questions) => {
        this.questions.set(questions as QuizQuestion[]);
        this.showQuestionsModal.set(true);
      },
      error: () => {
        this.questions.set([]);
        this.showQuestionsModal.set(true);
      }
    });
  }

  closeQuestionsModal() {
    this.showQuestionsModal.set(false);
    this.selectedQuiz.set(null);
    this.questions.set([]);
  }

  addQuestion() {
    const newQuestion: QuizQuestion = {
      id: 'temp-' + Date.now(),
      questionText: '',
      questionType: 'single',
      options: [
        { id: 'opt-1', optionText: '', isCorrect: false },
        { id: 'opt-2', optionText: '', isCorrect: false }
      ],
      points: 1,
      order: this.questions().length + 1
    };
    this.questions.update(list => [...list, newQuestion]);
  }

  removeQuestion(index: number) {
    this.questions.update(list => list.filter((_, i) => i !== index));
  }

  addOption(question: QuizQuestion) {
    question.options.push({
      id: 'opt-' + Date.now(),
      optionText: '',
      isCorrect: false
    });
    this.questions.update(list => [...list]);
  }

  removeOption(question: QuizQuestion, index: number) {
    question.options.splice(index, 1);
    this.questions.update(list => [...list]);
  }

  saveQuestions() {
    if (!this.selectedQuiz()) return;
    
    this.savingQuestions.set(true);
    this.instructorService.saveQuizQuestions(this.selectedQuiz()!.id, this.questions()).subscribe({
      next: () => {
        this.toastr.success('Questions saved successfully');
        this.closeQuestionsModal();
        this.loadQuizzes();
        this.savingQuestions.set(false);
      },
      error: () => {
        this.toastr.error('Failed to save questions');
        this.savingQuestions.set(false);
      }
    });
  }

  togglePublish(quiz: QuizDto) {
    this.instructorService.toggleQuizPublish(quiz.id, !quiz.isPublished).subscribe({
      next: () => {
        this.quizzes.update(list =>
          list.map(q => q.id === quiz.id ? { ...q, isPublished: !quiz.isPublished } : q)
        );
        this.applyFilter();
        this.toastr.success(`Quiz ${quiz.isPublished ? 'unpublished' : 'published'}`);
        this.openMenuId.set(null);
      }
    });
  }

  deleteQuiz(quiz: QuizDto) {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.instructorService.deleteQuiz(quiz.id).subscribe({
        next: (success) => {
          if (success) {
            this.quizzes.update(list => list.filter(q => q.id !== quiz.id));
            this.applyFilter();
            this.toastr.success('Quiz deleted');
          }
        }
      });
    }
    this.openMenuId.set(null);
  }
}
