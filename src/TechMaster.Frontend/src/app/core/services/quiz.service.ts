import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  isActive: boolean;
  questionCount: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionTextAr?: string;
  questionType: 'SingleChoice' | 'MultipleChoice' | 'TrueFalse';
  options: QuizOption[];
  points: number;
  orderIndex: number;
}

export interface QuizOption {
  id: string;
  text: string;
  textAr?: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score: number;
  isPassed: boolean;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface CreateQuizDto {
  courseId: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
}

export interface CreateQuestionDto {
  questionText: string;
  questionTextAr?: string;
  questionType: 'SingleChoice' | 'MultipleChoice' | 'TrueFalse';
  options: { text: string; textAr?: string; isCorrect: boolean }[];
  points: number;
}

export interface SubmitQuizDto {
  answers: { questionId: string; selectedOptionIds: string[] }[];
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/quizzes`;

  // Get all quizzes for a course
  getCourseQuizzes(courseId: string): Observable<Quiz[]> {
    return this.http.get<any>(`${this.API_URL}/course/${courseId}`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Get quiz details with questions
  getQuiz(quizId: string): Observable<Quiz | null> {
    return this.http.get<any>(`${this.API_URL}/${quizId}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Create a new quiz
  createQuiz(data: CreateQuizDto): Observable<Quiz | null> {
    return this.http.post<any>(this.API_URL, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Update a quiz
  updateQuiz(quizId: string, data: Partial<CreateQuizDto>): Observable<boolean> {
    return this.http.put<any>(`${this.API_URL}/${quizId}`, data).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Delete a quiz
  deleteQuiz(quizId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/${quizId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Add question to quiz
  addQuestion(quizId: string, data: CreateQuestionDto): Observable<QuizQuestion | null> {
    return this.http.post<any>(`${this.API_URL}/${quizId}/questions`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Update a question
  updateQuestion(questionId: string, data: Partial<CreateQuestionDto>): Observable<boolean> {
    return this.http.put<any>(`${this.API_URL}/questions/${questionId}`, data).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Delete a question
  deleteQuestion(questionId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/questions/${questionId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Start a quiz attempt
  startAttempt(quizId: string): Observable<QuizAttempt | null> {
    return this.http.post<any>(`${this.API_URL}/${quizId}/start`, {}).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Submit quiz answers
  submitAttempt(attemptId: string, data: SubmitQuizDto): Observable<QuizAttempt | null> {
    return this.http.post<any>(`${this.API_URL}/attempts/${attemptId}/submit`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Get user's quiz attempts
  getMyAttempts(quizId: string): Observable<QuizAttempt[]> {
    return this.http.get<any>(`${this.API_URL}/${quizId}/my-attempts`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Get quiz by session ID
  getQuizBySession(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/session/${sessionId}`);
  }

  // Submit quiz attempt directly (combines start and submit)
  submitQuizAttempt(quizId: string, data: SubmitQuizDto): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${quizId}/submit`, data);
  }
}
