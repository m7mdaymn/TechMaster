using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;

namespace TechMaster.Infrastructure.Services;

public interface IProgressService
{
    Task<Result> InitializeProgressAsync(Guid enrollmentId);
    Task<Result> UpdateProgressAsync(Guid userId, UpdateProgressDto dto);
    Task<Result> CompleteSessionAsync(Guid userId, Guid sessionId);
    Task<Result> RecalculateCourseProgressAsync(Guid enrollmentId);
    Task<Result<SessionProgressDto>> GetSessionProgressAsync(Guid userId, Guid sessionId);
    Task<bool> IsSessionUnlockedAsync(Guid userId, Guid sessionId);
    Task<Result> MarkQuizPassedAsync(Guid userId, Guid sessionId, int score);
    
    // Additional methods for progress tracking
    Task<Result<CourseProgressDto>> GetCourseProgressAsync(Guid userId, Guid courseId);
    Task<Result> UpdateWatchProgressAsync(Guid userId, Guid sessionId, int percentage);
    Task<Result> MarkResourcesAccessedAsync(Guid userId, Guid sessionId);
    Task<Result<NextSessionDto>> GetNextSessionToLearnAsync(Guid userId, Guid courseId);
}

public class CourseProgressDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public int CompletedSessions { get; set; }
    public int TotalSessions { get; set; }
    public Guid? CurrentSessionId { get; set; }
    public string? CurrentSessionName { get; set; }
}

public class NextSessionDto
{
    public Guid? SessionId { get; set; }
    public string? SessionName { get; set; }
    public Guid? ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public bool IsUnlocked { get; set; }
}
