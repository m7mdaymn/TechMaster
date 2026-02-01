using System.Text.RegularExpressions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Internship;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class InternshipService : IInternshipService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public InternshipService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<InternshipDto>>> GetInternshipsAsync(int pageNumber, int pageSize, string? status = null, string? search = null)
    {
        var query = _context.Internships
            .Include(i => i.Applications)
            .Where(i => !i.IsDeleted) // Always filter out deleted internships
            .AsQueryable();

        // If status specified, filter by it; otherwise default to Open for public view
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InternshipStatus>(status, true, out var internshipStatus))
        {
            query = query.Where(i => i.Status == internshipStatus);
        }
        else
        {
            // Default to Open internships only (exclude Archived, Closed, etc.)
            query = query.Where(i => i.Status == InternshipStatus.Open);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i => i.NameEn.Contains(search) || i.NameAr.Contains(search) || 
                                     (i.CompanyName != null && i.CompanyName.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var internships = await query
            .OrderByDescending(i => i.IsFeatured)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<InternshipDto>>.Success(new PaginatedList<InternshipDto>
        {
            Items = _mapper.Map<List<InternshipDto>>(internships),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<InternshipDto>> GetInternshipByIdAsync(Guid internshipId)
    {
        var internship = await _context.Internships
            .Include(i => i.Applications)
            .FirstOrDefaultAsync(i => i.Id == internshipId);

        if (internship == null)
        {
            return Result<InternshipDto>.Failure("Internship not found", "التدريب غير موجود");
        }

        return Result<InternshipDto>.Success(_mapper.Map<InternshipDto>(internship));
    }

    public async Task<Result<InternshipDto>> GetInternshipBySlugAsync(string slug)
    {
        var internship = await _context.Internships
            .Include(i => i.Applications)
            .FirstOrDefaultAsync(i => i.Slug == slug);

        if (internship == null)
        {
            return Result<InternshipDto>.Failure("Internship not found", "التدريب غير موجود");
        }

        return Result<InternshipDto>.Success(_mapper.Map<InternshipDto>(internship));
    }

    public async Task<Result<InternshipDto>> CreateInternshipAsync(CreateInternshipDto dto)
    {
        var slug = GenerateSlug(dto.NameEn);
        var existingSlug = await _context.Internships.AnyAsync(i => i.Slug == slug);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..8]}";
        }

        var internship = _mapper.Map<Internship>(dto);
        internship.Slug = slug;
        internship.Status = InternshipStatus.Open;

        _context.Internships.Add(internship);
        await _context.SaveChangesAsync();

        return Result<InternshipDto>.Success(_mapper.Map<InternshipDto>(internship), "Internship created successfully", "تم إنشاء التدريب بنجاح");
    }

    public async Task<Result<InternshipDto>> UpdateInternshipAsync(Guid internshipId, CreateInternshipDto dto)
    {
        var internship = await _context.Internships.FindAsync(internshipId);
        if (internship == null)
        {
            return Result<InternshipDto>.Failure("Internship not found", "التدريب غير موجود");
        }

        // Map all fields except status (handle separately)
        internship.NameEn = dto.NameEn;
        internship.NameAr = dto.NameAr;
        internship.DescriptionEn = dto.DescriptionEn;
        internship.DescriptionAr = dto.DescriptionAr;
        internship.ThumbnailUrl = dto.ThumbnailUrl;
        internship.CompanyName = dto.CompanyName;
        internship.CompanyNameAr = dto.CompanyNameAr;
        internship.CompanyLogoUrl = dto.CompanyLogoUrl;
        internship.Location = dto.Location;
        internship.LocationAr = dto.LocationAr;
        internship.IsRemote = dto.IsRemote;
        internship.DurationInWeeks = dto.DurationInWeeks;
        internship.RequirementsEn = dto.RequirementsEn;
        internship.RequirementsAr = dto.RequirementsAr;
        internship.ResponsibilitiesEn = dto.ResponsibilitiesEn;
        internship.ResponsibilitiesAr = dto.ResponsibilitiesAr;
        internship.BenefitsEn = dto.BenefitsEn;
        internship.BenefitsAr = dto.BenefitsAr;
        internship.ApplicationDeadline = dto.ApplicationDeadline;
        internship.StartDate = dto.StartDate;
        internship.EndDate = dto.EndDate;
        internship.MaxApplicants = dto.MaxApplicants;
        internship.IsPaid = dto.IsPaid;
        internship.Stipend = dto.Stipend;
        internship.HasFee = dto.HasFee;
        internship.FeeAmount = dto.FeeAmount;
        internship.Currency = dto.Currency;
        
        // Handle status if provided
        if (dto.Status.HasValue)
        {
            internship.Status = dto.Status.Value;
        }
        
        await _context.SaveChangesAsync();

        return Result<InternshipDto>.Success(_mapper.Map<InternshipDto>(internship), "Internship updated successfully", "تم تحديث التدريب بنجاح");
    }

    public async Task<Result> DeleteInternshipAsync(Guid internshipId)
    {
        var internship = await _context.Internships.FindAsync(internshipId);
        if (internship == null)
        {
            return Result.Failure("Internship not found", "التدريب غير موجود");
        }

        _context.Internships.Remove(internship);
        await _context.SaveChangesAsync();

        return Result.Success("Internship deleted successfully", "تم حذف التدريب بنجاح");
    }

    public async Task<Result<InternshipApplicationDto>> ApplyAsync(Guid userId, CreateInternshipApplicationDto dto)
    {
        var existingApplication = await _context.InternshipApplications
            .FirstOrDefaultAsync(a => a.UserId == userId && a.InternshipId == dto.InternshipId);

        if (existingApplication != null)
        {
            return Result<InternshipApplicationDto>.Failure("Already applied to this internship", "لقد قدمت بالفعل على هذا التدريب");
        }

        var internship = await _context.Internships.FindAsync(dto.InternshipId);
        if (internship == null)
        {
            return Result<InternshipApplicationDto>.Failure("Internship not found", "التدريب غير موجود");
        }

        if (internship.Status != InternshipStatus.Open)
        {
            return Result<InternshipApplicationDto>.Failure("Internship is not open for applications", "التدريب غير مفتوح للتقديم");
        }

        if (internship.ApplicationDeadline.HasValue && internship.ApplicationDeadline.Value < DateTime.UtcNow)
        {
            return Result<InternshipApplicationDto>.Failure("Application deadline has passed", "انتهى موعد التقديم");
        }

        var application = _mapper.Map<InternshipApplication>(dto);
        application.UserId = userId;
        application.Status = InternshipApplicationStatus.Pending;

        _context.InternshipApplications.Add(application);
        await _context.SaveChangesAsync();

        var result = await _context.InternshipApplications
            .Include(a => a.User)
            .Include(a => a.Internship)
            .FirstAsync(a => a.Id == application.Id);

        return Result<InternshipApplicationDto>.Success(_mapper.Map<InternshipApplicationDto>(result), "Application submitted successfully", "تم تقديم الطلب بنجاح");
    }

    public async Task<Result<PaginatedList<InternshipApplicationDto>>> GetApplicationsAsync(int pageNumber, int pageSize, Guid? internshipId = null, Guid? userId = null, string? status = null)
    {
        var query = _context.InternshipApplications
            .Include(a => a.User)
            .Include(a => a.Internship)
            .AsQueryable();

        if (internshipId.HasValue)
        {
            query = query.Where(a => a.InternshipId == internshipId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InternshipApplicationStatus>(status, true, out var appStatus))
        {
            query = query.Where(a => a.Status == appStatus);
        }

        var totalCount = await query.CountAsync();
        var applications = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<InternshipApplicationDto>>.Success(new PaginatedList<InternshipApplicationDto>
        {
            Items = _mapper.Map<List<InternshipApplicationDto>>(applications),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result> ReviewApplicationAsync(Guid applicationId, ReviewApplicationDto dto, string reviewedBy)
    {
        var application = await _context.InternshipApplications.FindAsync(applicationId);
        if (application == null)
        {
            return Result.Failure("Application not found", "الطلب غير موجود");
        }

        application.Status = dto.Status;
        application.AdminNotes = dto.AdminNotes;
        application.ReviewedAt = DateTime.UtcNow;
        application.ReviewedBy = reviewedBy;

        await _context.SaveChangesAsync();

        return Result.Success("Application reviewed successfully", "تم مراجعة الطلب بنجاح");
    }

    public async Task<Result<List<InternshipApplicationDto>>> GetUserApplicationsAsync(Guid userId)
    {
        var applications = await _context.InternshipApplications
            .Include(a => a.User)
            .Include(a => a.Internship)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Result<List<InternshipApplicationDto>>.Success(_mapper.Map<List<InternshipApplicationDto>>(applications));
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }

    // Task management methods
    public async Task<Result<List<InternshipTaskDto>>> GetInternshipTasksAsync(Guid internshipId)
    {
        var tasks = await _context.CourseTasks
            .Include(t => t.Submissions)
            .Include(t => t.Attachments)
            .Where(t => t.InternshipId == internshipId && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.DueDate)
            .ToListAsync();

        var taskDtos = tasks.Select(t => new InternshipTaskDto
        {
            Id = t.Id,
            NameEn = t.NameEn,
            NameAr = t.NameAr,
            Instructions = t.Instructions,
            InstructionsAr = t.InstructionsAr,
            SortOrder = t.SortOrder,
            MaxPoints = t.MaxPoints,
            DueDate = t.DueDate,
            IsRequired = t.IsRequired,
            IsActive = t.IsActive,
            TaskType = t.TaskType.ToString(),
            InternshipId = internshipId,
            SubmissionCount = t.Submissions.Count,
            CreatedAt = t.CreatedAt,
            Attachments = t.Attachments.Select(a => new TaskAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        }).ToList();

        return Result<List<InternshipTaskDto>>.Success(taskDtos);
    }

    public async Task<Result<InternshipTaskDto>> GetTaskByIdAsync(Guid taskId)
    {
        var task = await _context.CourseTasks
            .Include(t => t.Submissions)
            .Include(t => t.Attachments)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return Result<InternshipTaskDto>.Failure("Task not found", "المهمة غير موجودة");
        }

        var dto = new InternshipTaskDto
        {
            Id = task.Id,
            NameEn = task.NameEn,
            NameAr = task.NameAr,
            Instructions = task.Instructions,
            InstructionsAr = task.InstructionsAr,
            SortOrder = task.SortOrder,
            MaxPoints = task.MaxPoints,
            DueDate = task.DueDate,
            IsRequired = task.IsRequired,
            IsActive = task.IsActive,
            TaskType = task.TaskType.ToString(),
            InternshipId = task.InternshipId ?? Guid.Empty,
            SubmissionCount = task.Submissions.Count,
            CreatedAt = task.CreatedAt,
            Attachments = task.Attachments.Select(a => new TaskAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        };

        return Result<InternshipTaskDto>.Success(dto);
    }

    public async Task<Result<InternshipTaskDto>> CreateTaskAsync(Guid internshipId, CreateInternshipTaskDto dto, Guid createdByUserId)
    {
        var internship = await _context.Internships.FindAsync(internshipId);
        if (internship == null)
        {
            return Result<InternshipTaskDto>.Failure("Internship not found", "التدريب غير موجود");
        }

        var task = new CourseTask
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr ?? string.Empty,
            Instructions = dto.Instructions,
            InstructionsAr = dto.InstructionsAr,
            SortOrder = dto.SortOrder,
            MaxPoints = dto.MaxPoints,
            DueDate = dto.DueDate,
            IsRequired = dto.IsRequired,
            TaskType = (TaskType)dto.TaskType,
            InternshipId = internshipId,
            CreatedByUserId = createdByUserId,
            IsActive = true
        };

        // Add attachments if any
        if (dto.Attachments != null && dto.Attachments.Any())
        {
            task.Attachments = dto.Attachments.Select(a => new TaskAttachment
            {
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList();
        }

        _context.CourseTasks.Add(task);
        await _context.SaveChangesAsync();

        var result = new InternshipTaskDto
        {
            Id = task.Id,
            NameEn = task.NameEn,
            NameAr = task.NameAr,
            Instructions = task.Instructions,
            InstructionsAr = task.InstructionsAr,
            SortOrder = task.SortOrder,
            MaxPoints = task.MaxPoints,
            DueDate = task.DueDate,
            IsRequired = task.IsRequired,
            IsActive = task.IsActive,
            TaskType = task.TaskType.ToString(),
            InternshipId = internshipId,
            SubmissionCount = 0,
            CreatedAt = task.CreatedAt,
            Attachments = task.Attachments.Select(a => new TaskAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        };

        return Result<InternshipTaskDto>.Success(result, "Task created successfully", "تم إنشاء المهمة بنجاح");
    }

    public async Task<Result<InternshipTaskDto>> UpdateTaskAsync(Guid taskId, UpdateInternshipTaskDto dto)
    {
        var task = await _context.CourseTasks
            .Include(t => t.Submissions)
            .Include(t => t.Attachments)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return Result<InternshipTaskDto>.Failure("Task not found", "المهمة غير موجودة");
        }

        task.NameEn = dto.NameEn;
        task.NameAr = dto.NameAr ?? string.Empty;
        task.Instructions = dto.Instructions;
        task.InstructionsAr = dto.InstructionsAr;
        task.SortOrder = dto.SortOrder;
        task.MaxPoints = dto.MaxPoints;
        task.DueDate = dto.DueDate;
        task.IsRequired = dto.IsRequired;
        task.IsActive = dto.IsActive;
        task.TaskType = (TaskType)dto.TaskType;

        // Update attachments if provided
        if (dto.Attachments != null)
        {
            // Remove old attachments
            var existingAttachments = await _context.TaskAttachments.Where(a => a.TaskId == taskId).ToListAsync();
            _context.TaskAttachments.RemoveRange(existingAttachments);

            // Add new attachments
            task.Attachments = dto.Attachments.Select(a => new TaskAttachment
            {
                TaskId = taskId,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList();
        }

        await _context.SaveChangesAsync();

        var result = new InternshipTaskDto
        {
            Id = task.Id,
            NameEn = task.NameEn,
            NameAr = task.NameAr,
            Instructions = task.Instructions,
            InstructionsAr = task.InstructionsAr,
            SortOrder = task.SortOrder,
            MaxPoints = task.MaxPoints,
            DueDate = task.DueDate,
            IsRequired = task.IsRequired,
            IsActive = task.IsActive,
            TaskType = task.TaskType.ToString(),
            InternshipId = task.InternshipId ?? Guid.Empty,
            SubmissionCount = task.Submissions.Count,
            CreatedAt = task.CreatedAt,
            Attachments = task.Attachments.Select(a => new TaskAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        };

        return Result<InternshipTaskDto>.Success(result, "Task updated successfully", "تم تحديث المهمة بنجاح");
    }

    public async Task<Result> DeleteTaskAsync(Guid taskId)
    {
        var task = await _context.CourseTasks.FindAsync(taskId);
        if (task == null)
        {
            return Result.Failure("Task not found", "المهمة غير موجودة");
        }

        _context.CourseTasks.Remove(task);
        await _context.SaveChangesAsync();

        return Result.Success("Task deleted successfully", "تم حذف المهمة بنجاح");
    }

    // Task submission methods
    public async Task<Result<TaskSubmissionDto>> SubmitTaskAsync(Guid taskId, Guid userId, CreateTaskSubmissionDto dto)
    {
        var task = await _context.CourseTasks
            .Include(t => t.Internship)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return Result<TaskSubmissionDto>.Failure("Task not found", "المهمة غير موجودة");
        }

        // Check if already submitted
        var existingSubmission = await _context.TaskSubmissions
            .FirstOrDefaultAsync(s => s.TaskId == taskId && s.UserId == userId);

        if (existingSubmission != null)
        {
            return Result<TaskSubmissionDto>.Failure("Already submitted this task", "لقد قمت بتسليم هذه المهمة بالفعل");
        }

        var submission = new TaskSubmission
        {
            TaskId = taskId,
            UserId = userId,
            SubmissionText = dto.SubmissionText,
            SubmissionUrl = dto.SubmissionUrl,
            SubmittedAt = DateTime.UtcNow,
            Status = SubmissionStatus.Submitted
        };

        // Add attachments if any
        if (dto.Attachments != null && dto.Attachments.Any())
        {
            submission.Attachments = dto.Attachments.Select(a => new SubmissionAttachment
            {
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList();
        }

        _context.TaskSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        var result = new TaskSubmissionDto
        {
            Id = submission.Id,
            TaskId = taskId,
            TaskName = task.NameEn,
            UserId = userId,
            UserName = user?.FullName ?? "Unknown",
            UserEmail = user?.Email ?? "",
            SubmissionText = submission.SubmissionText,
            SubmissionUrl = submission.SubmissionUrl,
            SubmittedAt = submission.SubmittedAt,
            Status = submission.Status.ToString(),
            MaxPoints = task.MaxPoints,
            IsLate = task.DueDate.HasValue && submission.SubmittedAt > task.DueDate.Value
        };

        return Result<TaskSubmissionDto>.Success(result, "Task submitted successfully", "تم تسليم المهمة بنجاح");
    }

    public async Task<Result<List<TaskSubmissionDto>>> GetTaskSubmissionsAsync(Guid taskId)
    {
        var task = await _context.CourseTasks.FindAsync(taskId);
        if (task == null)
        {
            return Result<List<TaskSubmissionDto>>.Failure("Task not found", "المهمة غير موجودة");
        }

        var submissions = await _context.TaskSubmissions
            .Include(s => s.User)
            .Include(s => s.Attachments)
            .Where(s => s.TaskId == taskId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        var dtos = submissions.Select(s => new TaskSubmissionDto
        {
            Id = s.Id,
            TaskId = taskId,
            TaskName = task.NameEn,
            UserId = s.UserId,
            UserName = s.User?.FullName ?? "Unknown",
            UserEmail = s.User?.Email ?? "",
            SubmissionText = s.SubmissionText,
            SubmissionUrl = s.SubmissionUrl,
            SubmittedAt = s.SubmittedAt,
            Status = s.Status.ToString(),
            Score = s.Score,
            MaxPoints = task.MaxPoints,
            Feedback = s.Feedback,
            GradedAt = s.GradedAt,
            IsLate = task.DueDate.HasValue && s.SubmittedAt > task.DueDate.Value,
            Attachments = s.Attachments.Select(a => new SubmissionAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        }).ToList();

        return Result<List<TaskSubmissionDto>>.Success(dtos);
    }

    public async Task<Result<List<TaskSubmissionDto>>> GetUserSubmissionsAsync(Guid userId, Guid? internshipId = null)
    {
        var query = _context.TaskSubmissions
            .Include(s => s.Task)
            .Include(s => s.Attachments)
            .Include(s => s.User)
            .Where(s => s.UserId == userId);

        if (internshipId.HasValue)
        {
            query = query.Where(s => s.Task.InternshipId == internshipId.Value);
        }

        var submissions = await query
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        var dtos = submissions.Select(s => new TaskSubmissionDto
        {
            Id = s.Id,
            TaskId = s.TaskId,
            TaskName = s.Task?.NameEn ?? "",
            UserId = s.UserId,
            UserName = s.User?.FullName ?? "Unknown",
            UserEmail = s.User?.Email ?? "",
            SubmissionText = s.SubmissionText,
            SubmissionUrl = s.SubmissionUrl,
            SubmittedAt = s.SubmittedAt,
            Status = s.Status.ToString(),
            Score = s.Score,
            MaxPoints = s.Task?.MaxPoints ?? 100,
            Feedback = s.Feedback,
            GradedAt = s.GradedAt,
            IsLate = s.Task?.DueDate.HasValue == true && s.SubmittedAt > s.Task.DueDate!.Value,
            Attachments = s.Attachments.Select(a => new SubmissionAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        }).ToList();

        return Result<List<TaskSubmissionDto>>.Success(dtos);
    }

    public async Task<Result<TaskSubmissionDto>> GradeSubmissionAsync(Guid submissionId, GradeSubmissionDto dto, Guid gradedByUserId)
    {
        var submission = await _context.TaskSubmissions
            .Include(s => s.Task)
            .Include(s => s.User)
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
        {
            return Result<TaskSubmissionDto>.Failure("Submission not found", "التسليم غير موجود");
        }

        submission.Score = dto.Score;
        submission.Feedback = dto.Feedback;
        submission.FeedbackAr = dto.FeedbackAr;
        submission.GradedAt = DateTime.UtcNow;
        submission.GradedByUserId = gradedByUserId;
        submission.Status = SubmissionStatus.Graded;

        await _context.SaveChangesAsync();

        var result = new TaskSubmissionDto
        {
            Id = submission.Id,
            TaskId = submission.TaskId,
            TaskName = submission.Task?.NameEn ?? "",
            UserId = submission.UserId,
            UserName = submission.User?.FullName ?? "Unknown",
            UserEmail = submission.User?.Email ?? "",
            SubmissionText = submission.SubmissionText,
            SubmissionUrl = submission.SubmissionUrl,
            SubmittedAt = submission.SubmittedAt,
            Status = submission.Status.ToString(),
            Score = submission.Score,
            MaxPoints = submission.Task?.MaxPoints ?? 100,
            Feedback = submission.Feedback,
            GradedAt = submission.GradedAt,
            IsLate = submission.Task?.DueDate.HasValue == true && submission.SubmittedAt > submission.Task.DueDate!.Value,
            Attachments = submission.Attachments.Select(a => new SubmissionAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize
            }).ToList()
        };

        return Result<TaskSubmissionDto>.Success(result, "Submission graded successfully", "تم تقييم التسليم بنجاح");
    }
}
