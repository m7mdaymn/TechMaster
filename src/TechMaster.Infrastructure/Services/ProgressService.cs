using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Domain.Entities;
using TechMaster.Domain.Enums;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class ProgressService : IProgressService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProgressService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result> InitializeProgressAsync(Guid enrollmentId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        var sessions = enrollment.Course.Modules
            .OrderBy(m => m.SortOrder)
            .SelectMany(m => m.Sessions.OrderBy(s => s.SortOrder))
            .ToList();

        var isFirst = true;
        foreach (var session in sessions)
        {
            var existingProgress = await _context.SessionProgresses
                .FirstOrDefaultAsync(sp => sp.UserId == enrollment.UserId && sp.SessionId == session.Id);

            if (existingProgress == null)
            {
                var progress = new SessionProgress
                {
                    UserId = enrollment.UserId,
                    SessionId = session.Id,
                    EnrollmentId = enrollment.Id,
                    IsUnlocked = isFirst || !enrollment.Course.RequireSequentialProgress
                };
                _context.SessionProgresses.Add(progress);
            }
            isFirst = false;
        }

        await _context.SaveChangesAsync();
        return Result.Success("Progress initialized", "تم تهيئة التقدم");
    }

    public async Task<Result> UpdateProgressAsync(Guid userId, UpdateProgressDto dto)
    {
        var progress = await _context.SessionProgresses
            .Include(sp => sp.Session)
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.SessionId == dto.SessionId);

        if (progress == null)
        {
            return Result.Failure("Progress not found", "التقدم غير موجود");
        }

        if (!progress.IsUnlocked)
        {
            return Result.Failure("Session is locked", "الجلسة مقفلة");
        }

        if (dto.WatchPercentage.HasValue)
        {
            progress.WatchPercentage = Math.Max(progress.WatchPercentage, dto.WatchPercentage.Value);
            if (progress.WatchPercentage >= progress.Session.RequiredWatchPercentage)
            {
                progress.VideoCompleted = true;
            }
        }

        if (dto.WatchTimeSeconds.HasValue)
        {
            progress.WatchTimeSeconds += dto.WatchTimeSeconds.Value;
        }

        if (dto.ResourcesAccessed == true)
        {
            progress.ResourcesAccessed = true;
        }

        progress.LastAccessedAt = DateTime.UtcNow;

        // Check if session is completed based on rules
        await CheckAndCompleteSessionAsync(progress);

        await _context.SaveChangesAsync();

        // Recalculate course progress
        await RecalculateCourseProgressAsync(progress.EnrollmentId);

        return Result.Success("Progress updated", "تم تحديث التقدم");
    }

    public async Task<Result> CompleteSessionAsync(Guid userId, Guid sessionId)
    {
        var progress = await _context.SessionProgresses
            .Include(sp => sp.Session)
            .Include(sp => sp.Enrollment)
                .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.SessionId == sessionId);

        if (progress == null)
        {
            return Result.Failure("Progress not found", "التقدم غير موجود");
        }

        // NO CONDITIONS - Student can always mark as complete when they press the button
        // This is per user requirement: "mark as complete should work whatever the condition"
        progress.IsCompleted = true;
        progress.CompletedAt = DateTime.UtcNow;
        progress.WatchPercentage = 100; // Also set watch percentage to 100% when manually completed

        // Unlock next session if sequential progress is required
        if (progress.Enrollment.Course.RequireSequentialProgress)
        {
            await UnlockNextSessionAsync(progress);
        }

        await _context.SaveChangesAsync();
        await RecalculateCourseProgressAsync(progress.EnrollmentId);

        return Result.Success("Session completed", "تم إكمال الجلسة");
    }

    public async Task<Result> RecalculateCourseProgressAsync(Guid enrollmentId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.SessionProgresses)
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null)
        {
            return Result.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        var totalSessions = enrollment.Course.Modules.Sum(m => m.Sessions.Count);
        var completedSessions = enrollment.SessionProgresses.Count(sp => sp.IsCompleted);

        if (totalSessions > 0)
        {
            enrollment.ProgressPercentage = (int)((completedSessions * 100.0) / totalSessions);
        }

        enrollment.LastAccessedAt = DateTime.UtcNow;

        // Check for course completion
        if (enrollment.ProgressPercentage >= 100)
        {
            enrollment.Status = EnrollmentStatus.Completed;
            enrollment.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Result.Success("Progress recalculated", "تم إعادة حساب التقدم");
    }

    public async Task<Result<SessionProgressDto>> GetSessionProgressAsync(Guid userId, Guid sessionId)
    {
        var progress = await _context.SessionProgresses
            .Include(sp => sp.Session)
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.SessionId == sessionId);

        if (progress == null)
        {
            return Result<SessionProgressDto>.Failure("Progress not found", "التقدم غير موجود");
        }

        return Result<SessionProgressDto>.Success(_mapper.Map<SessionProgressDto>(progress));
    }

    public async Task<bool> IsSessionUnlockedAsync(Guid userId, Guid sessionId)
    {
        var progress = await _context.SessionProgresses
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.SessionId == sessionId);

        return progress?.IsUnlocked ?? false;
    }

    public async Task<Result> MarkQuizPassedAsync(Guid userId, Guid sessionId, int score)
    {
        var progress = await _context.SessionProgresses
            .Include(sp => sp.Session)
            .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.SessionId == sessionId);

        if (progress == null)
        {
            return Result.Failure("Progress not found", "التقدم غير موجود");
        }

        progress.QuizAttempts++;
        progress.QuizScore = score;

        if (score >= progress.Session.QuizPassingScore)
        {
            progress.QuizPassed = true;
        }

        await CheckAndCompleteSessionAsync(progress);
        await _context.SaveChangesAsync();

        return Result.Success("Quiz result recorded", "تم تسجيل نتيجة الاختبار");
    }

    private Task<bool> CanCompleteSessionAsync(SessionProgress progress)
    {
        var session = progress.Session;

        // Check video watch requirement
        if (progress.WatchPercentage < session.RequiredWatchPercentage)
        {
            return Task.FromResult(false);
        }

        // Check resource access requirement
        if (session.RequireResourceAccess && !progress.ResourcesAccessed)
        {
            return Task.FromResult(false);
        }

        // Check quiz requirement
        if (session.RequireQuizCompletion && !progress.QuizPassed)
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

    private async Task CheckAndCompleteSessionAsync(SessionProgress progress)
    {
        if (await CanCompleteSessionAsync(progress))
        {
            progress.IsCompleted = true;
            progress.CompletedAt = DateTime.UtcNow;

            // Try to unlock next session
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.Id == progress.EnrollmentId);

            if (enrollment?.Course.RequireSequentialProgress == true)
            {
                await UnlockNextSessionAsync(progress);
            }
        }
    }

    private async Task UnlockNextSessionAsync(SessionProgress currentProgress)
    {
        var session = await _context.Sessions
            .Include(s => s.Module)
                .ThenInclude(m => m.Course)
                    .ThenInclude(c => c.Modules)
                        .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(s => s.Id == currentProgress.SessionId);

        if (session == null) return;

        var allSessions = session.Module.Course.Modules
            .OrderBy(m => m.SortOrder)
            .SelectMany(m => m.Sessions.OrderBy(s => s.SortOrder))
            .ToList();

        var currentIndex = allSessions.FindIndex(s => s.Id == session.Id);
        if (currentIndex >= 0 && currentIndex < allSessions.Count - 1)
        {
            var nextSession = allSessions[currentIndex + 1];
            var nextProgress = await _context.SessionProgresses
                .FirstOrDefaultAsync(sp => sp.UserId == currentProgress.UserId && sp.SessionId == nextSession.Id);

            if (nextProgress != null && !nextProgress.IsUnlocked)
            {
                nextProgress.IsUnlocked = true;
            }
        }
    }

    public async Task<Result<CourseProgressDto>> GetCourseProgressAsync(Guid userId, Guid courseId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .Include(e => e.SessionProgresses)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment == null)
        {
            return Result<CourseProgressDto>.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        var totalSessions = enrollment.Course.Modules.Sum(m => m.Sessions.Count);
        var completedSessions = enrollment.SessionProgresses.Count(sp => sp.IsCompleted);

        // Find current session (first unlocked but not completed)
        var allSessions = enrollment.Course.Modules
            .OrderBy(m => m.SortOrder)
            .SelectMany(m => m.Sessions.OrderBy(s => s.SortOrder))
            .ToList();

        var currentSession = allSessions.FirstOrDefault(s =>
        {
            var progress = enrollment.SessionProgresses.FirstOrDefault(sp => sp.SessionId == s.Id);
            return progress != null && progress.IsUnlocked && !progress.IsCompleted;
        });

        var dto = new CourseProgressDto
        {
            CourseId = courseId,
            CourseName = enrollment.Course.NameEn,
            ProgressPercentage = enrollment.ProgressPercentage,
            CompletedSessions = completedSessions,
            TotalSessions = totalSessions,
            CurrentSessionId = currentSession?.Id,
            CurrentSessionName = currentSession?.NameEn
        };

        return Result<CourseProgressDto>.Success(dto);
    }

    public async Task<Result> UpdateWatchProgressAsync(Guid userId, Guid sessionId, int percentage)
    {
        var dto = new UpdateProgressDto
        {
            SessionId = sessionId,
            WatchPercentage = percentage
        };
        return await UpdateProgressAsync(userId, dto);
    }

    public async Task<Result> MarkResourcesAccessedAsync(Guid userId, Guid sessionId)
    {
        var dto = new UpdateProgressDto
        {
            SessionId = sessionId,
            ResourcesAccessed = true
        };
        return await UpdateProgressAsync(userId, dto);
    }

    public async Task<Result<NextSessionDto>> GetNextSessionToLearnAsync(Guid userId, Guid courseId)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Modules)
                    .ThenInclude(m => m.Sessions)
            .Include(e => e.SessionProgresses)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment == null)
        {
            return Result<NextSessionDto>.Failure("Enrollment not found", "التسجيل غير موجود");
        }

        var allSessions = enrollment.Course.Modules
            .OrderBy(m => m.SortOrder)
            .SelectMany(m => m.Sessions.OrderBy(s => s.SortOrder))
            .ToList();

        // Find first unlocked but not completed session
        foreach (var session in allSessions)
        {
            var progress = enrollment.SessionProgresses.FirstOrDefault(sp => sp.SessionId == session.Id);
            if (progress != null && progress.IsUnlocked && !progress.IsCompleted)
            {
                return Result<NextSessionDto>.Success(new NextSessionDto
                {
                    SessionId = session.Id,
                    SessionName = session.NameEn,
                    ModuleId = session.ModuleId,
                    ModuleName = session.Module.NameEn,
                    IsUnlocked = true
                });
            }
        }

        // All sessions completed or find first locked session
        var firstLocked = allSessions.FirstOrDefault(s =>
        {
            var progress = enrollment.SessionProgresses.FirstOrDefault(sp => sp.SessionId == s.Id);
            return progress == null || !progress.IsUnlocked;
        });

        if (firstLocked != null)
        {
            return Result<NextSessionDto>.Success(new NextSessionDto
            {
                SessionId = firstLocked.Id,
                SessionName = firstLocked.NameEn,
                ModuleId = firstLocked.ModuleId,
                ModuleName = firstLocked.Module.NameEn,
                IsUnlocked = false
            });
        }

        // All sessions completed
        return Result<NextSessionDto>.Success(new NextSessionDto
        {
            SessionId = null,
            SessionName = null,
            IsUnlocked = false
        });
    }
}
