using System.Text.RegularExpressions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Course;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CourseService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<CourseDto>>> GetCoursesAsync(int pageNumber, int pageSize, string? status = null, string? category = null, string? search = null, bool? featured = null)
    {
        var query = _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Category)
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
            .Include(c => c.Enrollments)
            .Where(c => !c.IsDeleted) // Always filter out deleted courses
            .AsQueryable();

        // If no specific status requested, default to Published for public view
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CourseStatus>(status, true, out var courseStatus))
        {
            query = query.Where(c => c.Status == courseStatus);
        }
        else
        {
            // Default to published courses only for public API
            query = query.Where(c => c.Status == CourseStatus.Published);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.Category != null && c.Category.Slug == category);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => c.NameEn.Contains(search) || c.NameAr.Contains(search));
        }

        if (featured == true)
        {
            query = query.Where(c => c.IsFeatured);
        }

        var totalCount = await query.CountAsync();
        var courses = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<CourseDto>>.Success(new PaginatedList<CourseDto>
        {
            Items = _mapper.Map<List<CourseDto>>(courses),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<CourseDetailDto>> GetCourseByIdAsync(Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Category)
            .Include(c => c.Modules.OrderBy(m => m.SortOrder))
                .ThenInclude(m => m.Sessions.OrderBy(s => s.SortOrder))
                    .ThenInclude(s => s.Materials.OrderBy(mat => mat.SortOrder))
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
                    .ThenInclude(s => s.Quizzes)
                        .ThenInclude(q => q.Questions)
                            .ThenInclude(q => q.Options)
            .Include(c => c.Enrollments)
            .Include(c => c.Prerequisites)
                .ThenInclude(p => p.PrerequisiteCourse)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null)
        {
            return Result<CourseDetailDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        return Result<CourseDetailDto>.Success(_mapper.Map<CourseDetailDto>(course));
    }

    public async Task<Result<CourseDetailDto>> GetCourseBySlugAsync(string slug)
    {
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Category)
            .Include(c => c.Modules.OrderBy(m => m.SortOrder))
                .ThenInclude(m => m.Sessions.OrderBy(s => s.SortOrder))
                    .ThenInclude(s => s.Materials.OrderBy(mat => mat.SortOrder))
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
                    .ThenInclude(s => s.Quizzes)
                        .ThenInclude(q => q.Questions)
                            .ThenInclude(q => q.Options)
            .Include(c => c.Enrollments)
            .Include(c => c.Prerequisites)
                .ThenInclude(p => p.PrerequisiteCourse)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (course == null)
        {
            return Result<CourseDetailDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        return Result<CourseDetailDto>.Success(_mapper.Map<CourseDetailDto>(course));
    }

    public async Task<Result<CourseDto>> CreateCourseAsync(CreateCourseDto dto, Guid instructorId)
    {
        var slug = GenerateSlug(dto.NameEn);
        var existingSlug = await _context.Courses.AnyAsync(c => c.Slug == slug);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..8]}";
        }

        var course = _mapper.Map<Course>(dto);
        course.Slug = slug;
        course.InstructorId = dto.InstructorId ?? instructorId;
        
        // Handle status from frontend
        if (!string.IsNullOrEmpty(dto.Status) && dto.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            course.Status = CourseStatus.Published;
            course.PublishedAt = DateTime.UtcNow;
        }
        else
        {
            course.Status = CourseStatus.Draft;
        }

        _context.Courses.Add(course);

        // Add prerequisites
        if (dto.PrerequisiteIds != null && dto.PrerequisiteIds.Any())
        {
            foreach (var prereqId in dto.PrerequisiteIds)
            {
                _context.CoursePrerequisites.Add(new CoursePrerequisite
                {
                    CourseId = course.Id,
                    PrerequisiteCourseId = prereqId
                });
            }
        }

        // Process nested modules and sessions
        if (dto.Modules != null && dto.Modules.Any())
        {
            foreach (var moduleDto in dto.Modules)
            {
                var module = new Module
                {
                    NameEn = moduleDto.NameEn,
                    NameAr = moduleDto.NameAr ?? moduleDto.NameEn,
                    DescriptionEn = moduleDto.DescriptionEn,
                    SortOrder = moduleDto.SortOrder,
                    CourseId = course.Id,
                    IsActive = true
                };
                _context.Modules.Add(module);

                if (moduleDto.Sessions != null && moduleDto.Sessions.Any())
                {
                    foreach (var sessionDto in moduleDto.Sessions)
                    {
                        // Map frontend session types to backend (only Live and Recorded exist)
                        var sessionType = sessionDto.Type?.ToLower() switch
                        {
                            "live" => SessionType.Live,
                            _ => SessionType.Recorded  // Video, Article, Quiz, PDF all map to Recorded
                        };

                        var session = new Session
                        {
                            NameEn = sessionDto.NameEn,
                            NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                            DescriptionEn = sessionDto.DescriptionEn ?? sessionDto.Content,
                            Type = sessionType,
                            VideoUrl = sessionDto.VideoUrl ?? sessionDto.ExternalLink,
                            DurationInMinutes = sessionDto.DurationMinutes,
                            SortOrder = sessionDto.SortOrder,
                            IsFree = sessionDto.IsFreePreview,
                            ModuleId = module.Id,
                            IsActive = true,
                            RequiredWatchPercentage = 80,
                            QuizPassingScore = sessionDto.QuizPassingScore ?? 70,
                            MaxQuizAttempts = 3
                        };
                        _context.Sessions.Add(session);

                        // Handle PDF materials
                        if (sessionDto.Type?.ToLower() == "pdf" && !string.IsNullOrEmpty(sessionDto.PdfUrl))
                        {
                            var material = new SessionMaterial
                            {
                                NameEn = sessionDto.NameEn,
                                NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                                Type = MaterialType.PDF,
                                FileUrl = sessionDto.PdfUrl,
                                SessionId = session.Id,
                                SortOrder = 0,
                                AllowDownload = true
                            };
                            _context.SessionMaterials.Add(material);
                        }

                        // Handle quiz questions
                        if (sessionDto.Type?.ToLower() == "quiz" && sessionDto.QuizQuestions != null && sessionDto.QuizQuestions.Any())
                        {
                            var quiz = new Quiz
                            {
                                NameEn = sessionDto.NameEn,
                                NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                                DescriptionEn = "Session Quiz",
                                TimeLimit = sessionDto.QuizTimeLimit ?? 30,
                                PassingScore = sessionDto.QuizPassingScore ?? 70,
                                SessionId = session.Id,
                                IsActive = true,
                                MaxAttempts = 3,
                                ShuffleQuestions = true,
                                ShowCorrectAnswers = true
                            };
                            _context.Quizzes.Add(quiz);

                            var questionOrder = 0;
                            foreach (var questionDto in sessionDto.QuizQuestions)
                            {
                                var question = new Question
                                {
                                    QuestionTextEn = questionDto.QuestionEn,
                                    QuestionTextAr = questionDto.QuestionAr ?? questionDto.QuestionEn,
                                    Points = questionDto.Points,
                                    SortOrder = questionOrder++,
                                    QuizId = quiz.Id,
                                    IsActive = true
                                };
                                _context.Questions.Add(question);

                                if (questionDto.Options != null && questionDto.Options.Any())
                                {
                                    var optionOrder = 0;
                                    foreach (var optionDto in questionDto.Options)
                                    {
                                        var option = new QuestionOption
                                        {
                                            OptionTextEn = optionDto.TextEn,
                                            OptionTextAr = optionDto.TextAr ?? optionDto.TextEn,
                                            IsCorrect = optionDto.IsCorrect,
                                            SortOrder = optionOrder++,
                                            QuestionId = question.Id
                                        };
                                        _context.QuestionOptions.Add(option);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Create default chat room
        var chatRoom = new ChatRoom
        {
            Name = $"{dto.NameEn} Discussion",
            NameAr = $"مناقشة {dto.NameAr}",
            CourseId = course.Id
        };
        _context.ChatRooms.Add(chatRoom);

        await _context.SaveChangesAsync();

        return Result<CourseDto>.Success(_mapper.Map<CourseDto>(course), "Course created successfully", "تم إنشاء الدورة بنجاح");
    }

    public async Task<Result<CourseDto>> UpdateCourseAsync(Guid courseId, UpdateCourseDto dto)
    {
        var course = await _context.Courses
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
                    .ThenInclude(s => s.Materials)
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
                    .ThenInclude(s => s.Quizzes)
                        .ThenInclude(q => q.Questions)
                            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(c => c.Id == courseId);
            
        if (course == null)
        {
            return Result<CourseDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        // Update basic course fields
        course.NameEn = dto.NameEn;
        course.NameAr = dto.NameAr;
        course.DescriptionEn = dto.DescriptionEn;
        course.DescriptionAr = dto.DescriptionAr;
        course.ThumbnailUrl = dto.ThumbnailUrl;
        course.TrailerVideoUrl = dto.TrailerVideoUrl;
        course.Type = dto.Type;
        course.Price = dto.Price;
        course.DiscountPrice = dto.DiscountPrice;
        course.Currency = dto.Currency;
        course.DurationInHours = dto.DurationInHours;
        course.Level = dto.Level;
        course.LevelAr = dto.LevelAr;
        course.WhatYouWillLearnEn = dto.WhatYouWillLearnEn;
        course.WhatYouWillLearnAr = dto.WhatYouWillLearnAr;
        course.RequirementsEn = dto.RequirementsEn;
        course.RequirementsAr = dto.RequirementsAr;
        course.TargetAudienceEn = dto.TargetAudienceEn;
        course.TargetAudienceAr = dto.TargetAudienceAr;
        course.CategoryId = dto.CategoryId;
        course.RequireSequentialProgress = dto.RequireSequentialProgress;
        course.RequireFinalAssessment = dto.RequireFinalAssessment;
        course.FinalAssessmentPassingScore = dto.FinalAssessmentPassingScore;
        
        // Handle status
        if (!string.IsNullOrEmpty(dto.Status))
        {
            if (dto.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
            {
                course.Status = CourseStatus.Published;
                if (course.PublishedAt == null)
                {
                    course.PublishedAt = DateTime.UtcNow;
                }
            }
            else if (dto.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase))
            {
                course.Status = CourseStatus.Draft;
            }
            else if (dto.Status.Equals("Archived", StringComparison.OrdinalIgnoreCase))
            {
                course.Status = CourseStatus.Archived;
            }
        }

        if (dto.IsFeatured.HasValue)
        {
            course.IsFeatured = dto.IsFeatured.Value;
        }

        // Process modules and sessions if provided
        if (dto.Modules != null && dto.Modules.Any())
        {
            // Get existing module and session IDs
            var existingModuleIds = course.Modules.Select(m => m.Id).ToHashSet();
            var incomingModuleIds = dto.Modules.Where(m => m.Id.HasValue).Select(m => m.Id!.Value).ToHashSet();
            
            // Delete modules that are not in the incoming data
            var modulesToDelete = course.Modules.Where(m => !incomingModuleIds.Contains(m.Id)).ToList();
            foreach (var module in modulesToDelete)
            {
                _context.Modules.Remove(module);
            }

            foreach (var moduleDto in dto.Modules)
            {
                Module module;
                
                if (moduleDto.Id.HasValue && existingModuleIds.Contains(moduleDto.Id.Value))
                {
                    // Update existing module
                    module = course.Modules.First(m => m.Id == moduleDto.Id.Value);
                    module.NameEn = moduleDto.NameEn;
                    module.NameAr = moduleDto.NameAr ?? moduleDto.NameEn;
                    module.DescriptionEn = moduleDto.DescriptionEn;
                    module.SortOrder = moduleDto.SortOrder;
                }
                else
                {
                    // Create new module
                    module = new Module
                    {
                        NameEn = moduleDto.NameEn,
                        NameAr = moduleDto.NameAr ?? moduleDto.NameEn,
                        DescriptionEn = moduleDto.DescriptionEn,
                        SortOrder = moduleDto.SortOrder,
                        CourseId = course.Id,
                        IsActive = true
                    };
                    _context.Modules.Add(module);
                }

                if (moduleDto.Sessions != null && moduleDto.Sessions.Any())
                {
                    var existingSessionIds = module.Sessions?.Select(s => s.Id).ToHashSet() ?? new HashSet<Guid>();
                    var incomingSessionIds = moduleDto.Sessions.Where(s => s.Id.HasValue).Select(s => s.Id!.Value).ToHashSet();
                    
                    // Delete sessions not in incoming data
                    if (module.Sessions != null)
                    {
                        var sessionsToDelete = module.Sessions.Where(s => !incomingSessionIds.Contains(s.Id)).ToList();
                        foreach (var session in sessionsToDelete)
                        {
                            _context.Sessions.Remove(session);
                        }
                    }

                    foreach (var sessionDto in moduleDto.Sessions)
                    {
                        // Map frontend session types to backend (only Live and Recorded exist)
                        var sessionType = sessionDto.Type?.ToLower() switch
                        {
                            "live" => SessionType.Live,
                            _ => SessionType.Recorded  // Video, Article, Quiz, PDF all map to Recorded
                        };

                        Session session;
                        
                        if (sessionDto.Id.HasValue && existingSessionIds.Contains(sessionDto.Id.Value))
                        {
                            // Update existing session
                            session = module.Sessions!.First(s => s.Id == sessionDto.Id.Value);
                            session.NameEn = sessionDto.NameEn;
                            session.NameAr = sessionDto.NameAr ?? sessionDto.NameEn;
                            session.DescriptionEn = sessionDto.DescriptionEn ?? sessionDto.Content;
                            session.Type = sessionType;
                            session.VideoUrl = sessionDto.VideoUrl ?? sessionDto.ExternalLink;
                            session.DurationInMinutes = sessionDto.DurationMinutes;
                            session.SortOrder = sessionDto.SortOrder;
                            session.IsFree = sessionDto.IsFreePreview;
                        }
                        else
                        {
                            // Create new session
                            session = new Session
                            {
                                NameEn = sessionDto.NameEn,
                                NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                                DescriptionEn = sessionDto.DescriptionEn ?? sessionDto.Content,
                                Type = sessionType,
                                VideoUrl = sessionDto.VideoUrl ?? sessionDto.ExternalLink,
                                DurationInMinutes = sessionDto.DurationMinutes,
                                SortOrder = sessionDto.SortOrder,
                                IsFree = sessionDto.IsFreePreview,
                                ModuleId = module.Id,
                                IsActive = true,
                                RequiredWatchPercentage = 80,
                                QuizPassingScore = sessionDto.QuizPassingScore ?? 70,
                                MaxQuizAttempts = 3
                            };
                            _context.Sessions.Add(session);
                        }

                        // Handle PDF materials
                        if (sessionDto.Type?.ToLower() == "pdf" && !string.IsNullOrEmpty(sessionDto.PdfUrl))
                        {
                            // Remove existing PDF materials for this session
                            var existingPdfMaterials = await _context.SessionMaterials
                                .Where(m => m.SessionId == session.Id && m.Type == MaterialType.PDF)
                                .ToListAsync();
                            _context.SessionMaterials.RemoveRange(existingPdfMaterials);

                            var material = new SessionMaterial
                            {
                                NameEn = sessionDto.NameEn,
                                NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                                Type = MaterialType.PDF,
                                FileUrl = sessionDto.PdfUrl,
                                SessionId = session.Id,
                                SortOrder = 0,
                                AllowDownload = true
                            };
                            _context.SessionMaterials.Add(material);
                        }

                        // Handle quiz questions for quiz type
                        if (sessionDto.Type?.ToLower() == "quiz" && sessionDto.QuizQuestions != null && sessionDto.QuizQuestions.Any())
                        {
                            // Remove existing quizzes for this session
                            var existingQuizzes = await _context.Quizzes.Where(q => q.SessionId == session.Id).ToListAsync();
                            _context.Quizzes.RemoveRange(existingQuizzes);

                            var quiz = new Quiz
                            {
                                NameEn = sessionDto.NameEn,
                                NameAr = sessionDto.NameAr ?? sessionDto.NameEn,
                                DescriptionEn = "Session Quiz",
                                TimeLimit = sessionDto.QuizTimeLimit ?? 30,
                                PassingScore = sessionDto.QuizPassingScore ?? 70,
                                SessionId = session.Id,
                                IsActive = true,
                                MaxAttempts = 3,
                                ShuffleQuestions = true,
                                ShowCorrectAnswers = true
                            };
                            _context.Quizzes.Add(quiz);

                            var questionOrder = 0;
                            foreach (var questionDto in sessionDto.QuizQuestions)
                            {
                                var question = new Question
                                {
                                    QuestionTextEn = questionDto.QuestionEn,
                                    QuestionTextAr = questionDto.QuestionAr ?? questionDto.QuestionEn,
                                    Points = questionDto.Points,
                                    SortOrder = questionOrder++,
                                    QuizId = quiz.Id,
                                    IsActive = true
                                };
                                _context.Questions.Add(question);

                                if (questionDto.Options != null && questionDto.Options.Any())
                                {
                                    var optionOrder = 0;
                                    foreach (var optionDto in questionDto.Options)
                                    {
                                        var option = new QuestionOption
                                        {
                                            OptionTextEn = optionDto.TextEn,
                                            OptionTextAr = optionDto.TextAr ?? optionDto.TextEn,
                                            IsCorrect = optionDto.IsCorrect,
                                            SortOrder = optionOrder++,
                                            QuestionId = question.Id
                                        };
                                        _context.QuestionOptions.Add(option);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        course.Version++;
        await _context.SaveChangesAsync();

        return Result<CourseDto>.Success(_mapper.Map<CourseDto>(course), "Course updated successfully", "تم تحديث الدورة بنجاح");
    }

    public async Task<Result> DeleteCourseAsync(Guid courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result.Failure("Course not found", "الدورة غير موجودة");
        }

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();

        return Result.Success("Course deleted successfully", "تم حذف الدورة بنجاح");
    }

    public async Task<Result> PublishCourseAsync(Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null)
        {
            return Result.Failure("Course not found", "الدورة غير موجودة");
        }

        if (!course.Modules.Any() || !course.Modules.Any(m => m.Sessions.Any()))
        {
            return Result.Failure("Course must have at least one module with sessions", "يجب أن تحتوي الدورة على وحدة واحدة على الأقل مع جلسات");
        }

        course.Status = CourseStatus.Published;
        course.PublishedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Result.Success("Course published successfully", "تم نشر الدورة بنجاح");
    }

    public async Task<Result> ArchiveCourseAsync(Guid courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result.Failure("Course not found", "الدورة غير موجودة");
        }

        course.Status = CourseStatus.Archived;
        await _context.SaveChangesAsync();

        return Result.Success("Course archived successfully", "تم أرشفة الدورة بنجاح");
    }

    public async Task<Result> RejectCourseAsync(Guid courseId, string? reason = null)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result.Failure("Course not found", "الدورة غير موجودة");
        }

        course.Status = CourseStatus.Rejected;
        // Store rejection reason if needed - could add a RejectionReason field to Course entity
        await _context.SaveChangesAsync();

        return Result.Success("Course rejected", "تم رفض الدورة");
    }

    public async Task<Result<List<CourseDto>>> GetInstructorCoursesAsync(Guid instructorId)
    {
        var courses = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Category)
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
            .Include(c => c.Enrollments)
            .Where(c => c.InstructorId == instructorId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Result<List<CourseDto>>.Success(_mapper.Map<List<CourseDto>>(courses));
    }

    public async Task<Result<List<CourseDto>>> GetFeaturedCoursesAsync(int count = 6)
    {
        var courses = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Category)
            .Include(c => c.Modules)
                .ThenInclude(m => m.Sessions)
            .Include(c => c.Enrollments)
            .Where(c => c.IsFeatured && c.Status == CourseStatus.Published)
            .OrderBy(c => c.SortOrder)
            .Take(count)
            .ToListAsync();

        return Result<List<CourseDto>>.Success(_mapper.Map<List<CourseDto>>(courses));
    }

    public async Task<Result<List<CategoryDto>>> GetCategoriesAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Courses)
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return Result<List<CategoryDto>>.Success(_mapper.Map<List<CategoryDto>>(categories));
    }

    public async Task<Result<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var slug = GenerateSlug(dto.NameEn);
        var existingSlug = await _context.Categories.AnyAsync(c => c.Slug == slug);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..8]}";
        }

        var category = _mapper.Map<Category>(dto);
        category.Slug = slug;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Result<CategoryDto>.Success(_mapper.Map<CategoryDto>(category), "Category created successfully", "تم إنشاء الفئة بنجاح");
    }

    public async Task<Result<CategoryDto>> UpdateCategoryAsync(Guid categoryId, CreateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
        {
            return Result<CategoryDto>.Failure("Category not found", "الفئة غير موجودة");
        }

        category.NameEn = dto.NameEn;
        category.NameAr = dto.NameAr;
        category.DescriptionEn = dto.DescriptionEn;
        category.DescriptionAr = dto.DescriptionAr;
        category.IconUrl = dto.IconUrl;
        category.ImageUrl = dto.ImageUrl;
        category.ParentCategoryId = dto.ParentCategoryId;

        await _context.SaveChangesAsync();

        return Result<CategoryDto>.Success(_mapper.Map<CategoryDto>(category), "Category updated successfully", "تم تحديث الفئة بنجاح");
    }

    public async Task<Result> DeleteCategoryAsync(Guid categoryId)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
        {
            return Result.Failure("Category not found", "الفئة غير موجودة");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Result.Success("Category deleted successfully", "تم حذف الفئة بنجاح");
    }

    public async Task<Result<List<ModuleDto>>> GetCourseModulesAsync(Guid courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return Result<List<ModuleDto>>.Failure("Course not found", "الدورة غير موجودة");
        }

        var modules = await _context.Modules
            .Where(m => m.CourseId == courseId)
            .Include(m => m.Sessions)
                .ThenInclude(s => s.Materials)
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        var moduleDtos = _mapper.Map<List<ModuleDto>>(modules);
        return Result<List<ModuleDto>>.Success(moduleDtos);
    }

    public async Task<Result<ModuleDto>> CreateModuleAsync(CreateModuleDto dto)
    {
        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null)
        {
            return Result<ModuleDto>.Failure("Course not found", "الدورة غير موجودة");
        }

        var module = _mapper.Map<Module>(dto);
        _context.Modules.Add(module);
        await _context.SaveChangesAsync();

        return Result<ModuleDto>.Success(_mapper.Map<ModuleDto>(module), "Module created successfully", "تم إنشاء الوحدة بنجاح");
    }

    public async Task<Result<ModuleDto>> UpdateModuleAsync(Guid moduleId, UpdateModuleDto dto)
    {
        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null)
        {
            return Result<ModuleDto>.Failure("Module not found", "الوحدة غير موجودة");
        }

        if (!string.IsNullOrEmpty(dto.NameEn)) module.NameEn = dto.NameEn;
        if (!string.IsNullOrEmpty(dto.NameAr)) module.NameAr = dto.NameAr;
        if (dto.DescriptionEn != null) module.DescriptionEn = dto.DescriptionEn;
        if (dto.DescriptionAr != null) module.DescriptionAr = dto.DescriptionAr;
        if (dto.SortOrder.HasValue) module.SortOrder = dto.SortOrder.Value;
        if (dto.IsActive.HasValue) module.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        return Result<ModuleDto>.Success(_mapper.Map<ModuleDto>(module), "Module updated successfully", "تم تحديث الوحدة بنجاح");
    }

    public async Task<Result> DeleteModuleAsync(Guid moduleId)
    {
        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null)
        {
            return Result.Failure("Module not found", "الوحدة غير موجودة");
        }

        _context.Modules.Remove(module);
        await _context.SaveChangesAsync();

        return Result.Success("Module deleted successfully", "تم حذف الوحدة بنجاح");
    }

    public async Task<Result> ReorderModulesAsync(Guid courseId, List<Guid> moduleIds)
    {
        var modules = await _context.Modules
            .Where(m => m.CourseId == courseId && moduleIds.Contains(m.Id))
            .ToListAsync();

        for (int i = 0; i < moduleIds.Count; i++)
        {
            var module = modules.FirstOrDefault(m => m.Id == moduleIds[i]);
            if (module != null)
            {
                module.SortOrder = i;
            }
        }

        await _context.SaveChangesAsync();
        return Result.Success("Modules reordered successfully", "تم إعادة ترتيب الوحدات بنجاح");
    }

    public async Task<Result<SessionDto>> CreateSessionAsync(CreateSessionDto dto)
    {
        var module = await _context.Modules.FindAsync(dto.ModuleId);
        if (module == null)
        {
            return Result<SessionDto>.Failure("Module not found", "الوحدة غير موجودة");
        }

        var session = _mapper.Map<Session>(dto);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        return Result<SessionDto>.Success(_mapper.Map<SessionDto>(session), "Session created successfully", "تم إنشاء الجلسة بنجاح");
    }

    public async Task<Result<SessionDto>> UpdateSessionAsync(Guid sessionId, UpdateSessionDto dto)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null)
        {
            return Result<SessionDto>.Failure("Session not found", "الجلسة غير موجودة");
        }

        _mapper.Map(dto, session);
        if (dto.IsActive.HasValue) session.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        return Result<SessionDto>.Success(_mapper.Map<SessionDto>(session), "Session updated successfully", "تم تحديث الجلسة بنجاح");
    }

    public async Task<Result> DeleteSessionAsync(Guid sessionId)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null)
        {
            return Result.Failure("Session not found", "الجلسة غير موجودة");
        }

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        return Result.Success("Session deleted successfully", "تم حذف الجلسة بنجاح");
    }

    public async Task<Result> ReorderSessionsAsync(Guid moduleId, List<Guid> sessionIds)
    {
        var sessions = await _context.Sessions
            .Where(s => s.ModuleId == moduleId && sessionIds.Contains(s.Id))
            .ToListAsync();

        for (int i = 0; i < sessionIds.Count; i++)
        {
            var session = sessions.FirstOrDefault(s => s.Id == sessionIds[i]);
            if (session != null)
            {
                session.SortOrder = i;
            }
        }

        await _context.SaveChangesAsync();
        return Result.Success("Sessions reordered successfully", "تم إعادة ترتيب الجلسات بنجاح");
    }

    public async Task<Result<SessionMaterialDto>> CreateSessionMaterialAsync(CreateSessionMaterialDto dto)
    {
        var session = await _context.Sessions.FindAsync(dto.SessionId);
        if (session == null)
        {
            return Result<SessionMaterialDto>.Failure("Session not found", "الجلسة غير موجودة");
        }

        var material = _mapper.Map<SessionMaterial>(dto);
        _context.SessionMaterials.Add(material);
        await _context.SaveChangesAsync();

        return Result<SessionMaterialDto>.Success(_mapper.Map<SessionMaterialDto>(material), "Material added successfully", "تم إضافة المادة بنجاح");
    }

    public async Task<Result> DeleteSessionMaterialAsync(Guid materialId)
    {
        var material = await _context.SessionMaterials.FindAsync(materialId);
        if (material == null)
        {
            return Result.Failure("Material not found", "المادة غير موجودة");
        }

        _context.SessionMaterials.Remove(material);
        await _context.SaveChangesAsync();

        return Result.Success("Material deleted successfully", "تم حذف المادة بنجاح");
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }

    // Course Rating Methods
    public async Task<Result> SubmitCourseRatingAsync(Guid courseId, Guid userId, int rating, string? comment)
    {
        // Validate rating
        if (rating < 1 || rating > 5)
        {
            return Result.Failure("Rating must be between 1 and 5", "يجب أن يكون التقييم بين 1 و 5");
        }

        // Check if course exists
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null || course.IsDeleted)
        {
            return Result.Failure("Course not found", "الكورس غير موجود");
        }

        // Check if user is enrolled in the course
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.CourseId == courseId && e.UserId == userId && !e.IsDeleted);
        
        if (enrollment == null)
        {
            return Result.Failure("You must be enrolled in this course to rate it", "يجب أن تكون مسجلاً في هذا الكورس لتقييمه");
        }

        // Check if user already rated this course
        var existingRating = await _context.CourseRatings
            .FirstOrDefaultAsync(r => r.CourseId == courseId && r.UserId == userId && !r.IsDeleted);

        if (existingRating != null)
        {
            return Result.Failure("You have already rated this course", "لقد قمت بتقييم هذا الكورس من قبل");
        }

        // Create the rating
        var courseRating = new CourseRating
        {
            CourseId = courseId,
            UserId = userId,
            Rating = rating,
            Comment = comment,
            IsApproved = true
        };

        _context.CourseRatings.Add(courseRating);
        await _context.SaveChangesAsync();

        return Result.Success("Rating submitted successfully", "تم إرسال التقييم بنجاح");
    }

    public async Task<Result<PaginatedList<CourseRatingDto>>> GetCourseRatingsAsync(Guid courseId, int pageNumber, int pageSize)
    {
        var query = _context.CourseRatings
            .Include(r => r.User)
            .Where(r => r.CourseId == courseId && r.IsApproved && !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new CourseRatingDto
            {
                Id = r.Id,
                CourseId = r.CourseId,
                UserId = r.UserId,
                UserName = r.User.FullName ?? r.User.Email,
                UserPhotoUrl = r.User.ProfileImageUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                IsApproved = r.IsApproved
            })
            .ToListAsync();

        var result = new PaginatedList<CourseRatingDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        return Result<PaginatedList<CourseRatingDto>>.Success(result);
    }

    public async Task<Result<CourseRatingDto?>> GetUserCourseRatingAsync(Guid courseId, Guid userId)
    {
        var rating = await _context.CourseRatings
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.CourseId == courseId && r.UserId == userId && !r.IsDeleted);

        if (rating == null)
        {
            return Result<CourseRatingDto?>.Success(null);
        }

        var dto = new CourseRatingDto
        {
            Id = rating.Id,
            CourseId = rating.CourseId,
            UserId = rating.UserId,
            UserName = rating.User.FullName ?? rating.User.Email,
            UserPhotoUrl = rating.User.ProfileImageUrl,
            Rating = rating.Rating,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt,
            IsApproved = rating.IsApproved
        };

        return Result<CourseRatingDto?>.Success(dto);
    }
}
