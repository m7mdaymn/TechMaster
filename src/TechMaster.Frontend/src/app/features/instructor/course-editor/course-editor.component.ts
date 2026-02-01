import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '@core/services/course.service';

import { FileUploadService } from '@core/services/file-upload.service';
import { AdminSettingsService } from '@core/services/admin-settings.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

interface QuizQuestion {
  id?: string;
  questionEn: string;
  questionAr: string;
  type: 'single' | 'multiple' | 'true-false';
  options: { textEn: string; textAr: string; isCorrect: boolean }[];
  points: number;
}

interface SessionForm {
  id?: string;
  title: string;
  titleAr: string;
  type: 'Video' | 'Article' | 'Quiz' | 'Live' | 'PDF';
  contentType: 'upload' | 'link'; // For video: upload file or paste link
  videoUrl?: string;
  pdfUrl?: string;
  content?: string; // For article content
  externalLink?: string; // For external video links (YouTube, Vimeo)
  duration: number;
  isFree: boolean;
  sortOrder: number;
  quizQuestions?: QuizQuestion[];
  quizPassingScore?: number;
  quizTimeLimit?: number; // in minutes
}

interface ModuleForm {
  id?: string;
  title: string;
  titleAr: string;
  description: string;
  sessions: SessionForm[];
  sortOrder: number;
}

@Component({
  selector: 'app-instructor-course-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="course-editor-page">
      <div class="editor-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">←</button>
          <div class="header-info">
            <h1>{{ isEditMode() ? 'Edit Course' : 'Create New Course' }}</h1>
            <span class="subtitle">Instructor Course Editor</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="save-draft-btn" (click)="saveCourse('Draft')" [disabled]="saving()">
            Save Draft
          </button>
          <button class="publish-btn" (click)="saveCourse('Published')" [disabled]="saving() || !isValid()">
            @if (saving()) {
              <span class="spinner"></span>
            }
            {{ isEditMode() ? 'Update & Publish' : 'Create & Publish' }}
          </button>
        </div>
      </div>

      <div class="editor-content">
        <aside class="editor-sidebar">
          <nav class="step-nav">
            @for (step of steps; track step.id; let i = $index) {
              <button 
                class="step-item" 
                [class.active]="activeStep() === step.id"
                [class.completed]="isStepCompleted(step.id)"
                (click)="activeStep.set(step.id)"
              >
                <span class="step-number">{{ i + 1 }}</span>
                <span class="step-label">{{ step.label }}</span>
                @if (isStepCompleted(step.id)) {
                  <span class="check">✓</span>
                }
              </button>
            }
          </nav>
        </aside>

        <main class="editor-main">
          <!-- Basic Information -->
          @if (activeStep() === 'basic') {
            <div class="step-content">
              <h2>Basic Information</h2>
              <p class="step-desc">Enter the basic details about the course</p>

              <div class="form-row">
                <div class="form-group">
                  <label>Course Title (English) *</label>
                  <input type="text" [(ngModel)]="course.nameEn" placeholder="Enter course title">
                </div>
                <div class="form-group">
                  <label>Course Title (Arabic)</label>
                  <input type="text" [(ngModel)]="course.nameAr" dir="rtl" placeholder="أدخل عنوان الدورة">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Category *</label>
                  <select [(ngModel)]="course.categoryId">
                    <option [ngValue]="null">Select category...</option>
                    @for (cat of categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.nameEn }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Level *</label>
                  <select [(ngModel)]="course.level">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Duration (Hours)</label>
                  <input type="number" [(ngModel)]="course.durationInHours" min="1">
                </div>
                <div class="form-group">
                  <label>Language</label>
                  <select [(ngModel)]="course.language">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Short Description (English)</label>
                <textarea [(ngModel)]="course.descriptionEn" rows="3" 
                  placeholder="Brief description of the course..."></textarea>
              </div>

              <div class="form-group">
                <label>Short Description (Arabic)</label>
                <textarea [(ngModel)]="course.descriptionAr" rows="3" dir="rtl"
                  placeholder="وصف مختصر للدورة..."></textarea>
              </div>

              <div class="form-group">
                <label>What You'll Learn (English)</label>
                <textarea [(ngModel)]="course.whatYouWillLearnEn" rows="4"
                  placeholder="• Key learning outcomes&#10;• Skills students will gain"></textarea>
              </div>

              <div class="form-group">
                <label>Requirements (English)</label>
                <textarea [(ngModel)]="course.requirementsEn" rows="3"
                  placeholder="• Prerequisites&#10;• Required knowledge"></textarea>
              </div>
            </div>
          }

          <!-- Media -->
          @if (activeStep() === 'media') {
            <div class="step-content">
              <h2>Media</h2>
              <p class="step-desc">Upload course thumbnail and promo video</p>

              <div class="media-section">
                <div class="upload-area">
                  <label>Course Thumbnail *</label>
                  <div class="upload-box" (click)="thumbnailInput.click()">
                    @if (thumbnailPreview()) {
                      <img [src]="getMediaUrl(thumbnailPreview())" alt="Thumbnail Preview">
                      <button class="remove-btn" (click)="removeThumbnail($event)">×</button>
                    } @else {
                      <div class="upload-placeholder">
                        <span class="upload-icon">🖼️</span>
                        <h4>Upload Thumbnail</h4>
                        <p>Recommended: 1280x720 (16:9)</p>
                      </div>
                    }
                    @if (uploadingThumbnail()) {
                      <div class="upload-progress">
                        <div class="progress-bar" [style.width.%]="thumbnailProgress()"></div>
                        <span>{{ thumbnailProgress() }}%</span>
                      </div>
                    }
                  </div>
                  <input type="file" #thumbnailInput accept="image/*" (change)="onThumbnailSelected($event)" hidden>
                </div>

                <div class="upload-area">
                  <label>Promo/Trailer Video</label>
                  <div class="video-source-toggle">
                    <button [class.active]="promoVideoSource === 'upload'" (click)="promoVideoSource = 'upload'">
                      📤 Upload Video
                    </button>
                    <button [class.active]="promoVideoSource === 'link'" (click)="promoVideoSource = 'link'">
                      🔗 Video Link
                    </button>
                  </div>
                  
                  @if (promoVideoSource === 'upload') {
                    <div class="upload-box" (click)="videoInput.click()">
                      @if (videoPreview()) {
                        <div class="video-preview">
                          <video [src]="getMediaUrl(videoPreview())" controls style="max-width:100%;max-height:200px;"></video>
                          <button class="remove-btn" (click)="removeVideo($event)">×</button>
                        </div>
                      } @else {
                        <div class="upload-placeholder">
                          <span class="upload-icon">🎬</span>
                          <h4>Upload Promo Video</h4>
                          <p>Max 500MB, MP4/WebM format</p>
                        </div>
                      }
                      @if (uploadingVideo()) {
                        <div class="upload-progress">
                          <div class="progress-bar" [style.width.%]="videoProgress()"></div>
                          <span>{{ videoProgress() }}%</span>
                        </div>
                      }
                    </div>
                    <input type="file" #videoInput accept="video/*" (change)="onVideoSelected($event)" hidden>
                  } @else {
                    <div class="link-input-area">
                      <input 
                        type="url" 
                        [(ngModel)]="course.trailerVideoUrl" 
                        placeholder="Paste YouTube, Vimeo, or direct video URL"
                        class="link-input"
                      >
                      @if (course.trailerVideoUrl) {
                        <div class="link-preview">
                          <span>🔗 {{ course.trailerVideoUrl | slice:0:50 }}...</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Curriculum -->
          @if (activeStep() === 'curriculum') {
            <div class="step-content">
              <h2>Curriculum</h2>
              <p class="step-desc">Organize your course into modules and sessions</p>

              <div class="modules-container">
                @for (module of modules(); track $index; let i = $index) {
                  <div class="module-card">
                    <div class="module-header">
                      <div class="module-drag">⠿</div>
                      <div class="module-title-group">
                        <input type="text" class="module-title-input" [(ngModel)]="module.title" placeholder="Module title (English)">
                        <input type="text" class="module-title-input ar" [(ngModel)]="module.titleAr" dir="rtl" placeholder="عنوان الوحدة">
                      </div>
                      <div class="module-actions">
                        <button class="add-session-btn" (click)="addSession(i)">➕ Add Session</button>
                        <button class="delete-module-btn" (click)="deleteModule(i)">🗑️</button>
                      </div>
                    </div>

                    <div class="sessions-list">
                      @for (session of module.sessions; track $index; let j = $index) {
                        <div class="session-card">
                          <div class="session-header">
                            <span class="session-drag">⠿</span>
                            <select [(ngModel)]="session.type" class="session-type" (ngModelChange)="onSessionTypeChange(i, j)">
                              <option value="Video">🎬 Video</option>
                              <option value="PDF">📄 PDF Document</option>
                              <option value="Article">📝 Article</option>
                              <option value="Quiz">📝 Quiz</option>
                              <option value="Live">📡 Live Session</option>
                            </select>
                            <input type="text" [(ngModel)]="session.title" class="session-title-input" placeholder="Session title">
                            <input type="number" [(ngModel)]="session.duration" class="session-duration" placeholder="Min" min="0">
                            <label class="free-toggle">
                              <input type="checkbox" [(ngModel)]="session.isFree"> Free
                            </label>
                            <button class="session-delete-btn" (click)="deleteSession(i, j)">✕</button>
                          </div>

                          <!-- Session Content Based on Type -->
                          <div class="session-content-area">
                            @if (session.type === 'Video') {
                              <div class="content-type-toggle">
                                <button [class.active]="session.contentType === 'upload'" (click)="session.contentType = 'upload'">
                                  📤 Upload Video
                                </button>
                                <button [class.active]="session.contentType === 'link'" (click)="session.contentType = 'link'">
                                  🔗 Video Link
                                </button>
                              </div>
                              @if (session.contentType === 'upload') {
                                <div class="upload-row">
                                  <button class="upload-content-btn" (click)="uploadSessionContent(i, j, 'video')">
                                    📤 {{ session.videoUrl ? 'Change Video' : 'Upload Video' }}
                                  </button>
                                  @if (session.videoUrl) {
                                    <span class="content-uploaded">✓ Video uploaded</span>
                                    <video [src]="getMediaUrl(session.videoUrl)" controls class="preview-video"></video>
                                  }
                                </div>
                              } @else {
                                <input type="url" [(ngModel)]="session.externalLink" placeholder="Paste YouTube, Vimeo, or direct video URL" class="content-link-input">
                              }
                            }

                            @if (session.type === 'PDF') {
                              <div class="upload-row">
                                <button class="upload-content-btn" (click)="uploadSessionContent(i, j, 'pdf')">
                                  📄 {{ session.pdfUrl ? 'Change PDF' : 'Upload PDF' }}
                                </button>
                                @if (session.pdfUrl) {
                                  <span class="content-uploaded">✓ PDF uploaded</span>
                                  <a [href]="getMediaUrl(session.pdfUrl)" target="_blank" class="view-pdf-link">View PDF</a>
                                }
                              </div>
                            }

                            @if (session.type === 'Article') {
                              <textarea [(ngModel)]="session.content" rows="5" placeholder="Enter article content here..." class="article-content"></textarea>
                            }

                            @if (session.type === 'Quiz') {
                              <div class="quiz-settings">
                                <div class="quiz-config">
                                  <div class="form-group inline">
                                    <label>Passing Score (%)</label>
                                    <input type="number" [(ngModel)]="session.quizPassingScore" min="0" max="100" placeholder="70">
                                  </div>
                                  <div class="form-group inline">
                                    <label>Time Limit (min)</label>
                                    <input type="number" [(ngModel)]="session.quizTimeLimit" min="0" placeholder="30">
                                  </div>
                                </div>
                                <button class="add-question-btn" (click)="addQuizQuestion(i, j)">➕ Add Question</button>
                                
                                @for (question of session.quizQuestions || []; track $index; let q = $index) {
                                  <div class="question-card">
                                    <div class="question-header">
                                      <span class="q-number">Q{{ q + 1 }}</span>
                                      <select [(ngModel)]="question.type" class="q-type">
                                        <option value="single">Single Choice</option>
                                        <option value="multiple">Multiple Choice</option>
                                        <option value="true-false">True/False</option>
                                      </select>
                                      <input type="number" [(ngModel)]="question.points" class="q-points" placeholder="Points" min="1">
                                      <button class="q-delete" (click)="deleteQuizQuestion(i, j, q)">✕</button>
                                    </div>
                                    <input type="text" [(ngModel)]="question.questionEn" placeholder="Question text (English)" class="q-text">
                                    <input type="text" [(ngModel)]="question.questionAr" placeholder="نص السؤال (Arabic)" dir="rtl" class="q-text">
                                    
                                    @if (question.type === 'true-false') {
                                      <div class="tf-options">
                                        <label><input type="radio" [name]="'tf_'+i+'_'+j+'_'+q" [checked]="question.options[0].isCorrect" (change)="setTrueFalseAnswer(i,j,q,true)"> True</label>
                                        <label><input type="radio" [name]="'tf_'+i+'_'+j+'_'+q" [checked]="question.options[1].isCorrect" (change)="setTrueFalseAnswer(i,j,q,false)"> False</label>
                                      </div>
                                    } @else {
                                      <div class="options-list">
                                        @for (opt of question.options; track $index; let o = $index) {
                                          <div class="option-row">
                                            <input type="checkbox" [(ngModel)]="opt.isCorrect" title="Mark as correct">
                                            <input type="text" [(ngModel)]="opt.textEn" placeholder="Option text" class="opt-input">
                                            <button class="opt-delete" (click)="deleteQuizOption(i, j, q, o)">✕</button>
                                          </div>
                                        }
                                        <button class="add-option-btn" (click)="addQuizOption(i, j, q)">+ Add Option</button>
                                      </div>
                                    }
                                  </div>
                                }
                              </div>
                            }

                            @if (session.type === 'Live') {
                              <input type="url" [(ngModel)]="session.externalLink" placeholder="Enter meeting link (Zoom, Google Meet, etc.)" class="content-link-input">
                            }
                          </div>
                        </div>
                      } @empty {
                        <div class="empty-sessions">
                          <p>No sessions yet. Click "Add Session" to start.</p>
                        </div>
                      }
                    </div>
                  </div>
                }

                <button class="add-module-btn" (click)="addModule()">➕ Add Module</button>
              </div>

              <!-- Hidden file inputs -->
              <input type="file" #sessionVideoInput accept="video/*" (change)="onSessionContentSelected($event, 'video')" hidden>
              <input type="file" #sessionPdfInput accept=".pdf,application/pdf" (change)="onSessionContentSelected($event, 'pdf')" hidden>
            </div>
          }

          <!-- Pricing -->
          @if (activeStep() === 'pricing') {
            <div class="step-content">
              <h2>Pricing</h2>
              <p class="step-desc">Set the price for this course (Currency: {{ siteCurrency() }})</p>

              <div class="pricing-options">
                <label class="pricing-option" [class.active]="pricingType() === 'free'">
                  <input type="radio" name="pricingType" value="free" [checked]="pricingType() === 'free'" (change)="pricingType.set('free')">
                  <div class="option-content">
                    <span class="option-icon">🆓</span>
                    <h4>Free</h4>
                    <p>Make this course available for free</p>
                  </div>
                </label>

                <label class="pricing-option" [class.active]="pricingType() === 'paid'">
                  <input type="radio" name="pricingType" value="paid" [checked]="pricingType() === 'paid'" (change)="pricingType.set('paid')">
                  <div class="option-content">
                    <span class="option-icon">💰</span>
                    <h4>Paid</h4>
                    <p>Set a price for this course</p>
                  </div>
                </label>
              </div>

              @if (pricingType() === 'paid') {
                <div class="price-inputs">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Price ({{ siteCurrency() }}) *</label>
                      <div class="price-input-wrapper">
                        <span class="currency">{{ getCurrencySymbol() }}</span>
                        <input type="number" [(ngModel)]="course.price" min="0" step="0.01">
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Discount Price (Optional)</label>
                      <div class="price-input-wrapper">
                        <span class="currency">{{ getCurrencySymbol() }}</span>
                        <input type="number" [(ngModel)]="course.discountPrice" min="0" step="0.01">
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Settings -->
          @if (activeStep() === 'settings') {
            <div class="step-content">
              <h2>Course Settings</h2>
              <p class="step-desc">Configure additional course settings</p>

              <div class="settings-list">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Issue Certificate</h4>
                    <p>Award certificates upon course completion</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="course.certificateEnabled">
                    <span class="slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Sequential Learning</h4>
                    <p>Require students to complete sessions in order</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="course.requireSequentialProgress">
                    <span class="slider"></span>
                  </label>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Require Final Assessment</h4>
                    <p>Students must pass a final quiz to complete</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="course.requireFinalAssessment">
                    <span class="slider"></span>
                  </label>
                </div>

                @if (course.requireFinalAssessment) {
                  <div class="form-group inline">
                    <label>Passing Score (%)</label>
                    <input type="number" [(ngModel)]="course.finalAssessmentPassingScore" min="0" max="100" style="width: 100px;">
                  </div>
                }

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Enable Discussions</h4>
                    <p>Allow students to discuss in the course</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="course.discussionEnabled">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          }

          <div class="step-navigation">
            @if (activeStepIndex() > 0) {
              <button class="prev-btn" (click)="previousStep()"><span>←</span> Previous</button>
            }
            @if (activeStepIndex() < steps.length - 1) {
              <button class="next-btn" (click)="nextStep()">Next <span>→</span></button>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .course-editor-page { min-height: 100vh; background: #f8f9fa; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #fff; border-bottom: 1px solid #e0e0e0; position: sticky; top: 0; z-index: 100; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn { width: 40px; height: 40px; background: #f8f9fa; border: none; border-radius: 8px; cursor: pointer; font-size: 1.25rem; }
    .header-info h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.125rem; }
    .header-info .subtitle { font-size: 0.85rem; color: #666; }
    .header-actions { display: flex; gap: 0.75rem; }
    .save-draft-btn, .publish-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .save-draft-btn { background: #fff; border: 2px solid #247090; color: #247090; }
    .publish-btn { background: linear-gradient(135deg, #247090 0%, #1a5570 100%); border: none; color: #fff; }
    .publish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .editor-content { display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 70px); }
    .editor-sidebar { background: #fff; border-right: 1px solid #e0e0e0; padding: 1.5rem; }
    .step-nav { display: flex; flex-direction: column; gap: 0.5rem; }
    .step-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: none; border: none; border-radius: 10px; cursor: pointer; text-align: left; }
    .step-item:hover { background: #f8f9fa; }
    .step-item.active { background: #e8f4f8; }
    .step-number { width: 28px; height: 28px; background: #e0e0e0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 600; color: #666; }
    .step-item.active .step-number { background: #247090; color: #fff; }
    .step-item.completed .step-number { background: #28a745; color: #fff; }
    .step-label { flex: 1; font-weight: 500; color: #666; }
    .step-item.active .step-label { color: #247090; font-weight: 600; }
    .check { color: #28a745; font-weight: 700; }
    .editor-main { padding: 2rem; max-width: 900px; }
    .step-content h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    .step-desc { color: #666; margin-bottom: 2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #247090; }
    .form-group textarea { resize: vertical; font-family: inherit; }
    .media-section { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .upload-area label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
    .upload-box { aspect-ratio: 16/9; border: 2px dashed #e0e0e0; border-radius: 12px; cursor: pointer; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
    .upload-box:hover { border-color: #247090; background: #f8f9fa; }
    .upload-box img { width: 100%; height: 100%; object-fit: cover; }
    .upload-placeholder { text-align: center; padding: 2rem; }
    .upload-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    .upload-placeholder h4 { margin-bottom: 0.25rem; }
    .upload-placeholder p { color: #666; font-size: 0.85rem; }
    .remove-btn { position: absolute; top: 0.5rem; right: 0.5rem; width: 28px; height: 28px; background: rgba(220,53,69,0.9); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 1.25rem; line-height: 1; }
    .upload-progress { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 0.5rem; color: #fff; text-align: center; }
    .progress-bar { height: 4px; background: #28a745; border-radius: 2px; margin-bottom: 0.25rem; }
    .video-source-toggle, .content-type-toggle { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .video-source-toggle button, .content-type-toggle button { flex: 1; padding: 0.5rem; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .video-source-toggle button.active, .content-type-toggle button.active { background: #247090; color: #fff; border-color: #247090; }
    .link-input-area { padding: 1rem; background: #f8f9fa; border-radius: 8px; }
    .link-input { width: 100%; padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; }
    .link-preview { margin-top: 0.5rem; font-size: 0.85rem; color: #666; }
    .modules-container { display: flex; flex-direction: column; gap: 1rem; }
    .module-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
    .module-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }
    .module-drag { color: #999; cursor: grab; }
    .module-title-group { flex: 1; display: flex; gap: 0.5rem; }
    .module-title-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.95rem; font-weight: 500; }
    .module-title-input.ar { direction: rtl; }
    .module-actions { display: flex; gap: 0.5rem; }
    .add-session-btn { display: flex; align-items: center; gap: 0.25rem; padding: 0.5rem 0.75rem; background: #247090; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .delete-module-btn { padding: 0.5rem; background: none; border: none; cursor: pointer; font-size: 1rem; }
    .sessions-list { padding: 1rem; }
    .session-card { background: #f8f9fa; border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden; }
    .session-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-bottom: 1px solid #e8e8e8; }
    .session-drag { color: #999; cursor: grab; }
    .session-type { width: 140px; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 6px; }
    .session-title-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; }
    .session-duration { width: 70px; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 6px; text-align: center; }
    .free-toggle { display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; color: #666; cursor: pointer; }
    .session-delete-btn { padding: 0.375rem 0.5rem; background: none; border: none; cursor: pointer; font-size: 1rem; color: #dc3545; }
    .session-content-area { padding: 0.75rem; }
    .upload-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .upload-content-btn { padding: 0.5rem 1rem; background: #f0f0f0; border: 1px dashed #999; border-radius: 6px; cursor: pointer; }
    .upload-content-btn:hover { background: #e8e8e8; }
    .content-uploaded { color: #28a745; font-size: 0.85rem; }
    .preview-video { max-width: 200px; max-height: 120px; border-radius: 6px; margin-top: 0.5rem; }
    .view-pdf-link { color: #247090; text-decoration: none; font-size: 0.85rem; }
    .view-pdf-link:hover { text-decoration: underline; }
    .content-link-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; }
    .article-content { width: 100%; padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; font-family: inherit; resize: vertical; }
    .quiz-settings { padding: 0.5rem 0; }
    .quiz-config { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .quiz-config .form-group { margin-bottom: 0; display: flex; align-items: center; gap: 0.5rem; }
    .quiz-config .form-group label { margin-bottom: 0; font-size: 0.85rem; }
    .quiz-config .form-group input { width: 70px; padding: 0.4rem; }
    .add-question-btn { padding: 0.5rem 1rem; background: #247090; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-bottom: 1rem; }
    .question-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
    .question-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .q-number { background: #247090; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .q-type { padding: 0.4rem; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.85rem; }
    .q-points { width: 60px; padding: 0.4rem; border: 1px solid #e0e0e0; border-radius: 4px; text-align: center; }
    .q-delete { margin-left: auto; background: none; border: none; color: #dc3545; cursor: pointer; }
    .q-text { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 0.5rem; }
    .tf-options { display: flex; gap: 1rem; padding: 0.5rem 0; }
    .tf-options label { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
    .options-list { margin-top: 0.5rem; }
    .option-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .option-row input[type="checkbox"] { width: 18px; height: 18px; }
    .opt-input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #e0e0e0; border-radius: 4px; }
    .opt-delete { background: none; border: none; color: #dc3545; cursor: pointer; }
    .add-option-btn { padding: 0.4rem 0.8rem; background: #f0f0f0; border: 1px dashed #999; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .empty-sessions { text-align: center; padding: 2rem; color: #999; }
    .add-module-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; background: #fff; border: 2px dashed #e0e0e0; border-radius: 12px; cursor: pointer; font-weight: 600; color: #666; }
    .add-module-btn:hover { border-color: #247090; color: #247090; }
    .pricing-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .pricing-option { display: block; padding: 1.5rem; background: #fff; border: 2px solid #e0e0e0; border-radius: 12px; cursor: pointer; }
    .pricing-option:hover { border-color: #247090; }
    .pricing-option.active { border-color: #247090; background: #e8f4f8; }
    .pricing-option input { display: none; }
    .option-content { text-align: center; }
    .option-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .option-content h4 { margin-bottom: 0.25rem; }
    .option-content p { font-size: 0.85rem; color: #666; }
    .price-inputs { background: #fff; padding: 1.5rem; border-radius: 12px; border: 1px solid #e0e0e0; }
    .price-input-wrapper { display: flex; align-items: center; }
    .currency { padding: 0.75rem 1rem; background: #f8f9fa; border: 2px solid #e0e0e0; border-right: none; border-radius: 8px 0 0 8px; font-weight: 600; }
    .price-input-wrapper input { border-radius: 0 8px 8px 0; }
    .settings-list { display: flex; flex-direction: column; gap: 1rem; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; }
    .setting-info h4 { margin-bottom: 0.25rem; }
    .setting-info p { font-size: 0.85rem; color: #666; }
    .toggle { position: relative; width: 50px; height: 26px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 26px; transition: 0.3s; }
    .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .toggle input:checked + .slider { background: #247090; }
    .toggle input:checked + .slider:before { transform: translateX(24px); }
    .form-group.inline { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; }
    .form-group.inline label { margin-bottom: 0; }
    .step-navigation { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0; }
    .prev-btn, .next-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .prev-btn { background: #fff; border: 2px solid #e0e0e0; color: #333; }
    .next-btn { background: #247090; border: none; color: #fff; margin-left: auto; }
    @media (max-width: 768px) { .editor-content { grid-template-columns: 1fr; } .editor-sidebar { display: none; } .form-row { grid-template-columns: 1fr; } .media-section { grid-template-columns: 1fr; } .pricing-options { grid-template-columns: 1fr; } }
  `]
})
export class CourseEditorComponent implements OnInit {
  @ViewChild('thumbnailInput') thumbnailInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('sessionVideoInput') sessionVideoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('sessionPdfInput') sessionPdfInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private settingsService = inject(AdminSettingsService);
  private fileUploadService = inject(FileUploadService);
  private toastr = inject(ToastrService);
  private apiUrl = environment.apiUrl;

  isEditMode = signal(false);
  saving = signal(false);
  categories = signal<any[]>([]);
  activeStep = signal('basic');
  pricingType = signal<'free' | 'paid'>('free');
  siteCurrency = signal('EGP');

  uploadingThumbnail = signal(false);
  uploadingVideo = signal(false);
  thumbnailProgress = signal(0);
  videoProgress = signal(0);
  thumbnailPreview = signal<string | null>(null);
  videoPreview = signal<string | null>(null);
  videoFileName = signal<string>('');
  promoVideoSource: 'upload' | 'link' = 'upload';

  currentSessionUpload: { moduleIndex: number; sessionIndex: number; type: 'video' | 'pdf' } | null = null;

  steps = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'media', label: 'Media' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'settings', label: 'Settings' }
  ];

  course: any = {
    nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
    instructorId: null, categoryId: null, level: 'Beginner', language: 'en',
    price: 0, discountPrice: null, durationInHours: 10,
    thumbnailUrl: '', trailerVideoUrl: '',
    whatYouWillLearnEn: '', requirementsEn: '',
    certificateEnabled: true, requireSequentialProgress: true,
    requireFinalAssessment: false, finalAssessmentPassingScore: 70, discussionEnabled: true
  };

  modules = signal<ModuleForm[]>([
    { title: 'Getting Started', titleAr: 'البداية', description: '', sessions: [
      { title: 'Introduction', titleAr: 'مقدمة', type: 'Video', contentType: 'upload', duration: 10, isFree: true, sortOrder: 0 }
    ], sortOrder: 0 }
  ]);

  private courseId: string | null = null;

  ngOnInit() {
    this.loadCategories();
    this.loadSiteSettings();
    // Check route params for course ID (from /courses/:id/edit route)
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) { 
      this.isEditMode.set(true); 
      this.loadCourse(this.courseId); 
    }
  }

  loadCategories() {
    this.settingsService.getPublicCategories().subscribe({
      next: (categories) => this.categories.set(categories || []),
      error: () => this.toastr.error('Failed to load categories')
    });
  }

  loadSiteSettings() {
    this.settingsService.getPublicSettings().subscribe({
      next: (settings) => {
        const currencyValue = settings?.['site.currency']?.value || settings?.['currency']?.value;
        if (currencyValue) {
          this.siteCurrency.set(currencyValue || 'EGP');
        }
      }
    });
  }

  getCurrencySymbol(): string {
    const curr = this.siteCurrency();
    const symbols: Record<string, string> = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'EGP': 'ج.م' };
    return symbols[curr] || curr;
  }

  getMediaUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Prepend API URL for relative paths from wwwroot
    return `${this.apiUrl.replace('/api', '')}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  loadCourse(id: string) {
    // Use getCourseWithContent to get the course with its modules
    this.courseService.getCourseWithContent(id).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const c = response.data;
          this.course = {
            nameEn: c.nameEn, nameAr: c.nameAr, descriptionEn: c.descriptionEn, descriptionAr: c.descriptionAr,
            instructorId: c.instructor?.id, categoryId: c.category?.id, level: c.level, language: 'en',
            price: c.price, discountPrice: c.discountPrice, durationInHours: c.durationHours || c.durationInHours,
            thumbnailUrl: c.thumbnailUrl, trailerVideoUrl: c.previewVideoUrl || c.trailerVideoUrl,
            whatYouWillLearnEn: c.whatYouWillLearnEn, requirementsEn: c.requirementsEn,
            certificateEnabled: true, requireSequentialProgress: c.requireSequentialProgress,
            requireFinalAssessment: c.requireFinalAssessment, finalAssessmentPassingScore: c.finalAssessmentPassingScore || 70, discussionEnabled: true
          };
          if (c.thumbnailUrl) this.thumbnailPreview.set(c.thumbnailUrl);
          if (c.previewVideoUrl || c.trailerVideoUrl) {
            this.videoPreview.set((c.previewVideoUrl || c.trailerVideoUrl) ?? null);
            // Determine if it's a link or uploaded
            const videoUrl = c.previewVideoUrl || c.trailerVideoUrl || '';
            this.promoVideoSource = videoUrl.includes('youtube') || videoUrl.includes('vimeo') ? 'link' : 'upload';
          }
          this.pricingType.set(c.price > 0 ? 'paid' : 'free');
          if (c.modules && c.modules.length > 0) {
            this.modules.set(c.modules.map((m: any, mi: number) => ({
              id: m.id, title: m.nameEn || '', titleAr: m.nameAr || '', description: m.descriptionEn || '', sortOrder: mi,
              sessions: (m.sessions || []).map((s: any, si: number) => ({
                id: s.id, title: s.nameEn || '', titleAr: s.nameAr || '', 
                type: this.mapSessionType(s.type, s),
                contentType: s.videoUrl?.includes('http') && !s.videoUrl?.includes(this.apiUrl) ? 'link' : 'upload',
                videoUrl: s.videoUrl, pdfUrl: s.pdfUrl, content: s.content || s.descriptionEn, externalLink: s.externalLink,
                duration: s.durationInMinutes || s.durationMinutes || 0, isFree: s.isFreePreview || s.isFree || false, sortOrder: si,
                quizQuestions: s.quizQuestions || [], quizPassingScore: s.quizPassingScore, quizTimeLimit: s.quizTimeLimit
              }))
            })));
          }
        }
      },
      error: () => this.toastr.error('Failed to load course')
    });
  }

  private mapSessionType(type: any, session?: any): string {
    // First check if this is a PDF session based on pdfUrl presence
    if (session?.pdfUrl) return 'PDF';
    // Check for article based on content without video
    if (session?.content && !session?.videoUrl) return 'Article';
    // Check for quiz based on quizQuestions
    if (session?.quizQuestions && session?.quizQuestions.length > 0) return 'Quiz';
    
    // Map from backend enum/string
    const typeMap: { [key: number]: string } = { 0: 'Video', 1: 'Video', 2: 'Video', 3: 'Article', 4: 'Quiz', 5: 'Assignment' };
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      if (t === 'pdf') return 'PDF';
      if (t === 'article') return 'Article';
      if (t === 'quiz') return 'Quiz';
      if (t === 'live') return 'Live';
      return 'Video';
    }
    if (typeof type === 'number') return typeMap[type] || 'Video';
    return 'Video';
  }

  activeStepIndex(): number { return this.steps.findIndex(s => s.id === this.activeStep()); }
  isStepCompleted(stepId: string): boolean {
    if (stepId === 'basic') return !!(this.course.nameEn && this.course.categoryId);
    if (stepId === 'media') return !!this.thumbnailPreview();
    if (stepId === 'curriculum') return this.modules().length > 0;
    return true;
  }
  previousStep() { const idx = this.activeStepIndex(); if (idx > 0) this.activeStep.set(this.steps[idx - 1].id); }
  nextStep() { const idx = this.activeStepIndex(); if (idx < this.steps.length - 1) this.activeStep.set(this.steps[idx + 1].id); }
  isValid(): boolean { return !!(this.course.nameEn && this.course.categoryId); }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.thumbnailPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
      this.uploadingThumbnail.set(true); this.thumbnailProgress.set(0);
      this.fileUploadService.uploadImage(file).subscribe({
        next: (progress) => {
          if (progress.status === 'progress') { this.thumbnailProgress.set(progress.percentage || 0); }
          else if (progress.status === 'complete' && progress.response?.data?.url) {
            this.course.thumbnailUrl = progress.response.data.url;
            this.thumbnailPreview.set(progress.response.data.url);
            this.toastr.success('Thumbnail uploaded'); this.uploadingThumbnail.set(false);
          } else if (progress.status === 'error') { this.toastr.error(progress.error || 'Failed'); this.uploadingThumbnail.set(false); }
        },
        error: () => { this.toastr.error('Failed to upload thumbnail'); this.uploadingThumbnail.set(false); }
      });
    }
  }

  onVideoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.videoFileName.set(file.name); this.videoPreview.set('uploading');
      this.uploadingVideo.set(true); this.videoProgress.set(0);
      this.fileUploadService.uploadVideo(file).subscribe({
        next: (progress) => {
          if (progress.status === 'progress') { this.videoProgress.set(progress.percentage || 0); }
          else if (progress.status === 'complete' && progress.response?.data?.url) {
            this.course.trailerVideoUrl = progress.response.data.url;
            this.videoPreview.set(progress.response.data.url);
            this.toastr.success('Video uploaded'); this.uploadingVideo.set(false);
          } else if (progress.status === 'error') { this.toastr.error(progress.error || 'Failed'); this.videoPreview.set(null); this.uploadingVideo.set(false); }
        },
        error: () => { this.toastr.error('Failed to upload video'); this.videoPreview.set(null); this.uploadingVideo.set(false); }
      });
    }
  }

  removeThumbnail(event: Event) { event.stopPropagation(); this.thumbnailPreview.set(null); this.course.thumbnailUrl = ''; }
  removeVideo(event: Event) { event.stopPropagation(); this.videoPreview.set(null); this.videoFileName.set(''); this.course.trailerVideoUrl = ''; }

  addModule() {
    const modules = this.modules();
    this.modules.set([...modules, { title: '', titleAr: '', description: '', sessions: [], sortOrder: modules.length }]);
  }
  deleteModule(index: number) { if (confirm('Delete this module?')) this.modules.update(m => m.filter((_, i) => i !== index)); }
  
  addSession(moduleIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      updated[moduleIndex].sessions.push({ 
        title: '', titleAr: '', type: 'Video', contentType: 'upload', 
        duration: 0, isFree: false, sortOrder: updated[moduleIndex].sessions.length 
      });
      return updated;
    });
  }
  
  deleteSession(moduleIndex: number, sessionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      updated[moduleIndex].sessions = updated[moduleIndex].sessions.filter((_, i) => i !== sessionIndex);
      return updated;
    });
  }

  onSessionTypeChange(moduleIndex: number, sessionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      const session = updated[moduleIndex].sessions[sessionIndex];
      // Initialize quiz questions if Quiz type selected
      if (session.type === 'Quiz' && (!session.quizQuestions || session.quizQuestions.length === 0)) {
        session.quizQuestions = [];
        session.quizPassingScore = 70;
        session.quizTimeLimit = 30;
      }
      // Reset content type based on type
      if (session.type === 'PDF' || session.type === 'Article' || session.type === 'Quiz') {
        session.contentType = 'upload';
      }
      return updated;
    });
  }

  uploadSessionContent(moduleIndex: number, sessionIndex: number, type: 'video' | 'pdf') {
    this.currentSessionUpload = { moduleIndex, sessionIndex, type };
    if (type === 'video') {
      this.sessionVideoInput.nativeElement.click();
    } else {
      this.sessionPdfInput.nativeElement.click();
    }
  }

  onSessionContentSelected(event: Event, type: 'video' | 'pdf') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.currentSessionUpload) {
      const file = input.files[0];
      const { moduleIndex, sessionIndex } = this.currentSessionUpload;
      this.toastr.info(`Uploading ${type}...`);
      
      const upload$ = type === 'video' 
        ? this.fileUploadService.uploadVideo(file) 
        : this.fileUploadService.uploadDocument(file);
      
      upload$.subscribe({
        next: (progress) => {
          if (progress.status === 'complete' && progress.response?.data?.url) {
            this.modules.update(modules => {
              const updated = [...modules];
              if (type === 'video') {
                updated[moduleIndex].sessions[sessionIndex].videoUrl = progress.response!.data!.url;
              } else {
                updated[moduleIndex].sessions[sessionIndex].pdfUrl = progress.response!.data!.url;
              }
              return updated;
            });
            this.toastr.success(`${type === 'video' ? 'Video' : 'PDF'} uploaded`);
          } else if (progress.status === 'error') { 
            this.toastr.error(progress.error || 'Failed'); 
          }
        },
        error: () => this.toastr.error(`Failed to upload ${type}`)
      });
    }
    this.currentSessionUpload = null;
    input.value = ''; // Reset input
  }

  // Quiz management
  addQuizQuestion(moduleIndex: number, sessionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      const session = updated[moduleIndex].sessions[sessionIndex];
      if (!session.quizQuestions) session.quizQuestions = [];
      session.quizQuestions.push({
        questionEn: '', questionAr: '', type: 'single', points: 1,
        options: [
          { textEn: '', textAr: '', isCorrect: false },
          { textEn: '', textAr: '', isCorrect: false }
        ]
      });
      return updated;
    });
  }

  deleteQuizQuestion(moduleIndex: number, sessionIndex: number, questionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      updated[moduleIndex].sessions[sessionIndex].quizQuestions = 
        updated[moduleIndex].sessions[sessionIndex].quizQuestions?.filter((_, i) => i !== questionIndex);
      return updated;
    });
  }

  addQuizOption(moduleIndex: number, sessionIndex: number, questionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      updated[moduleIndex].sessions[sessionIndex].quizQuestions![questionIndex].options.push(
        { textEn: '', textAr: '', isCorrect: false }
      );
      return updated;
    });
  }

  deleteQuizOption(moduleIndex: number, sessionIndex: number, questionIndex: number, optionIndex: number) {
    this.modules.update(modules => {
      const updated = [...modules];
      updated[moduleIndex].sessions[sessionIndex].quizQuestions![questionIndex].options = 
        updated[moduleIndex].sessions[sessionIndex].quizQuestions![questionIndex].options.filter((_, i) => i !== optionIndex);
      return updated;
    });
  }

  setTrueFalseAnswer(moduleIndex: number, sessionIndex: number, questionIndex: number, isTrue: boolean) {
    this.modules.update(modules => {
      const updated = [...modules];
      const question = updated[moduleIndex].sessions[sessionIndex].quizQuestions![questionIndex];
      question.options = [
        { textEn: 'True', textAr: 'صحيح', isCorrect: isTrue },
        { textEn: 'False', textAr: 'خطأ', isCorrect: !isTrue }
      ];
      return updated;
    });
  }

  saveCourse(status: string) {
    if (!this.course.nameEn) { 
      this.toastr.error('Course title (English) is required'); 
      this.activeStep.set('basic');
      return; 
    }
    // Instructor ID is auto-assigned by backend for instructors
    if (!this.course.categoryId) { 
      this.toastr.error('Please select a category'); 
      this.activeStep.set('basic');
      return; 
    }
    
    this.saving.set(true);
    const courseData = {
      nameEn: this.course.nameEn,
      nameAr: this.course.nameAr || this.course.nameEn,
      descriptionEn: this.course.descriptionEn,
      descriptionAr: this.course.descriptionAr,
      // instructorId is auto-assigned by backend for instructors
      categoryId: this.course.categoryId,
      level: this.course.level,
      type: this.pricingType() === 'free' ? 1 : 2, // 1 = Free, 2 = Paid (backend enum)
      price: this.pricingType() === 'free' ? 0 : (this.course.price || 0),
      discountPrice: this.course.discountPrice,
      currency: this.siteCurrency(),
      durationInHours: this.course.durationInHours || 0,
      thumbnailUrl: this.course.thumbnailUrl,
      trailerVideoUrl: this.course.trailerVideoUrl,
      whatYouWillLearnEn: this.course.whatYouWillLearnEn,
      requirementsEn: this.course.requirementsEn,
      requireSequentialProgress: this.course.requireSequentialProgress,
      requireFinalAssessment: this.course.requireFinalAssessment,
      finalAssessmentPassingScore: this.course.finalAssessmentPassingScore || 70,
      status: status === 'Published' ? 'Published' : 'Draft',
      modules: this.modules().map((m, mi) => ({
        id: m.id || undefined, 
        nameEn: m.title || 'Module ' + (mi + 1), 
        nameAr: m.titleAr || m.title || 'الوحدة ' + (mi + 1), 
        descriptionEn: m.description, 
        order: mi,
        sortOrder: mi,
        sessions: m.sessions.map((s, si) => ({
          id: s.id || undefined, 
          nameEn: s.title || 'Session ' + (si + 1), 
          nameAr: s.titleAr || s.title || 'الجلسة ' + (si + 1), 
          type: s.type,
          durationMinutes: s.duration || 0, 
          videoUrl: s.type === 'Video' ? (s.contentType === 'link' ? s.externalLink : s.videoUrl) : undefined,
          pdfUrl: s.type === 'PDF' ? s.pdfUrl : undefined,
          content: s.type === 'Article' ? s.content : undefined,
          externalLink: s.type === 'Live' ? s.externalLink : undefined,
          isFree: s.isFree,
          isFreePreview: s.isFree, 
          order: si,
          sortOrder: si,
          quizQuestions: s.type === 'Quiz' ? s.quizQuestions : undefined,
          quizPassingScore: s.type === 'Quiz' ? s.quizPassingScore : undefined,
          quizTimeLimit: s.type === 'Quiz' ? s.quizTimeLimit : undefined
        }))
      }))
    };

    console.log('Saving course data:', JSON.stringify(courseData, null, 2)); // Debug log

    const request$ = this.courseId 
      ? this.courseService.updateCourse(this.courseId, courseData as any) 
      : this.courseService.createCourse(courseData as any);
    request$.subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) { 
          this.toastr.success(`Course ${status === 'Published' ? 'published' : 'saved as draft'}!`); 
          this.router.navigate(['/instructor/courses']); 
        }
        else { 
          this.toastr.error(response.messageEn || 'Failed to save course'); 
          console.error('Course save failed:', response);
        }
      },
      error: (err) => { 
        this.saving.set(false); 
        const errorMessage = err?.error?.messageEn || err?.error?.message || err?.message || 'Failed to save course';
        this.toastr.error(errorMessage); 
        console.error('Course save error:', err); 
      }
    });
  }

  goBack() { this.router.navigate(['/instructor/courses']); }
}
