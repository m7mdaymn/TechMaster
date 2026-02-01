using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Admin;
using TechMaster.Application.DTOs.Auth;
using TechMaster.Application.DTOs.Course;
using TechMaster.Application.DTOs.Enrollment;

namespace TechMaster.Infrastructure.Services;

public interface IDashboardService
{
    // Admin Dashboard
    Task<Result<AdminDashboardDto>> GetAdminDashboardAsync();
    Task<Result<List<AuditLogDto>>> GetAuditLogsAsync(int pageNumber, int pageSize, string? action = null, Guid? userId = null);
    Task<Result<PaginatedList<UserDto>>> GetUsersAsync(int pageNumber, int pageSize, string? role = null, string? search = null);
    Task<Result<UserDto>> CreateUserAsync(CreateUserDto dto);
    Task<Result> UpdateUserRoleAsync(Guid userId, string role);
    Task<Result> ToggleUserStatusAsync(Guid userId, bool isActive);
    Task<Result> DeleteUserAsync(Guid userId);
    Task<Result<List<InstructorDto>>> GetInstructorsAsync();
    Task<Result<SystemSettingsDto>> GetSystemSettingsAsync();
    Task<Result> UpdateSystemSettingsAsync(SystemSettingsDto dto);
    Task<Result<List<ContactMessageDto>>> GetContactMessagesAsync(int pageNumber, int pageSize, bool? isRead = null);
    Task<Result> MarkContactMessageAsReadAsync(Guid messageId);
    Task<Result> DeleteContactMessageAsync(Guid messageId);
    Task<Result<ContactMessageDto>> CreateContactMessageAsync(CreateContactMessageDto dto);

    // Instructor Dashboard
    Task<Result<InstructorDashboardDto>> GetInstructorDashboardAsync(Guid instructorId);
    Task<Result<List<CourseDto>>> GetInstructorCoursesAsync(Guid instructorId);
    Task<Result<CourseAnalyticsDto>> GetCourseAnalyticsAsync(Guid courseId);
    Task<Result<PaginatedList<InstructorStudentDto>>> GetInstructorStudentsAsync(Guid instructorId, int pageNumber, int pageSize);
    Task<Result<InstructorStudentDetailDto>> GetInstructorStudentDetailAsync(Guid instructorId, Guid enrollmentId);
    Task<Result> RemoveStudentFromCourseAsync(Guid instructorId, Guid enrollmentId, string? reason = null);
    Task<Result<PaginatedList<InstructorReviewDto>>> GetInstructorReviewsAsync(Guid instructorId, int pageNumber, int pageSize, int? rating = null);
    Task<Result<InstructorEarningsDto>> GetInstructorEarningsAsync(Guid instructorId, int year = 0, int month = 0);
    Task<Result<List<LiveSessionDto>>> GetInstructorLiveSessionsAsync(Guid instructorId, string? status = null);
    Task<Result<LiveSessionDto>> CreateLiveSessionAsync(Guid instructorId, CreateLiveSessionDto dto);
    Task<Result<LiveSessionDto>> UpdateLiveSessionAsync(Guid instructorId, Guid sessionId, UpdateLiveSessionDto dto);
    Task<Result> DeleteLiveSessionAsync(Guid instructorId, Guid sessionId);
    Task<Result<InstructorAnalyticsDto>> GetInstructorOverallAnalyticsAsync(Guid instructorId);

    // Student Dashboard
    Task<Result<StudentDashboardDto>> GetStudentDashboardAsync(Guid studentId);
    Task<Result<List<EnrollmentDto>>> GetStudentEnrollmentsAsync(Guid studentId);
    Task<Result<StudentProgressDto>> GetStudentProgressAsync(Guid studentId, Guid courseId);

    // Testimonials
    Task<Result<List<TestimonialDto>>> GetTestimonialsAsync(bool? approved = null);
    Task<Result<TestimonialDto>> CreateTestimonialAsync(Guid userId, StudentCreateTestimonialDto dto);
    Task<Result> ApproveTestimonialAsync(Guid testimonialId, bool approved);
    Task<Result> DeleteTestimonialAsync(Guid testimonialId);
}

public record InstructorDashboardDto
{
    public int TotalCourses { get; init; }
    public int PublishedCourses { get; init; }
    public int DraftCourses { get; init; }
    public int TotalEnrollments { get; init; }
    public int ActiveEnrollments { get; init; }
    public int CompletedEnrollments { get; init; }
    public decimal TotalRevenue { get; init; }
    public decimal ThisMonthRevenue { get; init; }
    public double AverageRating { get; init; }
    public int TotalReviews { get; init; }
    public List<CourseDto> RecentCourses { get; init; } = new();
    public List<EnrollmentDto> RecentEnrollments { get; init; } = new();
}

public record StudentDashboardDto
{
    public int TotalEnrollments { get; init; }
    public int InProgressCourses { get; init; }
    public int ActiveCourses { get; init; }
    public int CompletedCourses { get; init; }
    [System.Text.Json.Serialization.JsonPropertyName("totalXp")]
    public int TotalXp { get; init; }
    public int TotalBadges { get; init; }
    public int BadgesEarned { get; init; }
    public int TotalCertificates { get; init; }
    public int CertificatesEarned { get; init; }
    public int CurrentLevel { get; init; }
    public int XPToNextLevel { get; init; }
    public double OverallProgress { get; init; }
    public List<EnrollmentDto> Enrollments { get; init; } = new();
    public List<EnrollmentDto> RecentEnrollments { get; init; } = new();
    public List<CertificateItemDto> Certificates { get; init; } = new();
    public List<BadgeDto> Badges { get; init; } = new();
    public List<BadgeDto> RecentBadges { get; init; } = new();
}

public record StudentProgressDto
{
    public Guid CourseId { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public double OverallProgress { get; init; }
    public int CompletedSessions { get; init; }
    public int TotalSessions { get; init; }
    public int CompletedQuizzes { get; init; }
    public int TotalQuizzes { get; init; }
    public List<ModuleProgressDto> ModuleProgresses { get; init; } = new();
}

public record ModuleProgressDto
{
    public Guid ModuleId { get; init; }
    public string ModuleName { get; init; } = string.Empty;
    public double Progress { get; init; }
    public int CompletedSessions { get; init; }
    public int TotalSessions { get; init; }
    public List<SessionProgressDetailDto> SessionProgresses { get; init; } = new();
}

public record SessionProgressDetailDto
{
    public Guid SessionId { get; init; }
    public string SessionName { get; init; } = string.Empty;
    public bool IsUnlocked { get; init; }
    public bool IsCompleted { get; init; }
    public int WatchPercentage { get; init; }
    public bool ResourcesAccessed { get; init; }
    public bool QuizPassed { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record CourseAnalyticsDto
{
    public Guid CourseId { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public int TotalEnrollments { get; init; }
    public int ActiveEnrollments { get; init; }
    public int CompletedEnrollments { get; init; }
    public double AverageProgress { get; init; }
    public double CompletionRate { get; init; }
    public double AverageRating { get; init; }
    public decimal TotalRevenue { get; init; }
    public List<EnrollmentTrendDto> EnrollmentTrends { get; init; } = new();
    public List<SessionAnalyticsDto> SessionAnalytics { get; init; } = new();
}

public record EnrollmentTrendDto
{
    public DateTime Date { get; init; }
    public int Count { get; init; }
}

public record SessionAnalyticsDto
{
    public Guid SessionId { get; init; }
    public string SessionName { get; init; } = string.Empty;
    public int ViewCount { get; init; }
    public double CompletionRate { get; init; }
    public double AverageWatchPercentage { get; init; }
}

public record BadgeDto
{
    public Guid Id { get; init; }
    public string NameEn { get; init; } = string.Empty;
    public string NameAr { get; init; } = string.Empty;
    public string? DescriptionEn { get; init; }
    public string? DescriptionAr { get; init; }
    public string? IconUrl { get; init; }
    public DateTime EarnedAt { get; init; }
}

public record TestimonialDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? UserPhotoUrl { get; init; }
    public string Content { get; init; } = string.Empty;
    public int Rating { get; init; }
    public bool IsApproved { get; init; }
    public bool IsFeatured { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// DTO for students to create testimonials (simpler than admin version)
/// </summary>
public record StudentCreateTestimonialDto
{
    public string Content { get; init; } = string.Empty;
    public int Rating { get; init; }
}

// ContactMessageDto and CreateContactMessageDto are defined in TechMaster.Application.DTOs.Admin

public record InstructorStudentDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? ProfileImageUrl { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public Guid CourseId { get; init; }
    public Guid EnrollmentId { get; init; }
    public double Progress { get; init; }
    public DateTime EnrolledAt { get; init; }
    public DateTime? LastActiveAt { get; init; }
}

public record InstructorStudentDetailDto
{
    public Guid EnrollmentId { get; init; }
    public Guid StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string StudentEmail { get; init; } = string.Empty;
    public string? StudentPhone { get; init; }
    public string? StudentProfileImageUrl { get; init; }
    public Guid CourseId { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public double OverallProgress { get; init; }
    public DateTime EnrolledAt { get; init; }
    public DateTime? LastActiveAt { get; init; }
    public string EnrollmentStatus { get; init; } = string.Empty;
    public List<ChapterProgressDto> ChapterProgress { get; init; } = new();
}

public record ChapterProgressDto
{
    public Guid ChapterId { get; init; }
    public string ChapterTitle { get; init; } = string.Empty;
    public int Order { get; init; }
    public List<SessionProgressDto> Sessions { get; init; } = new();
    public double CompletionPercentage { get; init; }
}

public record SessionProgressDto
{
    public Guid SessionId { get; init; }
    public string SessionTitle { get; init; } = string.Empty;
    public int Order { get; init; }
    public bool IsCompleted { get; init; }
    public int WatchPercentage { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record InstructorReviewDto
{
    public Guid Id { get; init; }
    public Guid CourseId { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? UserAvatar { get; init; }
    public int Rating { get; init; }
    public string? Comment { get; init; }
    public string? InstructorReply { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record InstructorEarningsDto
{
    public decimal TotalEarnings { get; init; }
    public decimal ThisMonthEarnings { get; init; }
    public decimal PendingPayouts { get; init; }
    public int TotalTransactions { get; init; }
    public List<EarningItemDto> RecentTransactions { get; init; } = new();
    public List<MonthlyEarningDto> MonthlyBreakdown { get; init; } = new();
}

public record EarningItemDto
{
    public Guid Id { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public string StudentName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EGP";
    public DateTime Date { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record MonthlyEarningDto
{
    public int Year { get; init; }
    public int Month { get; init; }
    public decimal Amount { get; init; }
    public int TransactionCount { get; init; }
}

public record LiveSessionDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? CourseId { get; init; }
    public string? CourseName { get; init; }
    public DateTime ScheduledAt { get; init; }
    public int DurationMinutes { get; init; }
    public string? MeetingUrl { get; init; }
    public string Status { get; init; } = string.Empty;
    public int MaxParticipants { get; init; }
    public int CurrentParticipants { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateLiveSessionDto
{
    public string Title { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? CourseId { get; init; }
    public DateTime ScheduledAt { get; init; }
    public int DurationMinutes { get; init; }
    public string? MeetingUrl { get; init; }
    public int MaxParticipants { get; init; }
}

public record UpdateLiveSessionDto
{
    public string? Title { get; init; }
    public string? TitleAr { get; init; }
    public string? Description { get; init; }
    public DateTime? ScheduledAt { get; init; }
    public int? DurationMinutes { get; init; }
    public string? MeetingUrl { get; init; }
    public int? MaxParticipants { get; init; }
    public string? Status { get; init; }
}

public record InstructorAnalyticsDto
{
    public int TotalStudents { get; init; }
    public int NewStudentsThisMonth { get; init; }
    public double AverageRating { get; init; }
    public int TotalReviews { get; init; }
    public int TotalCourses { get; init; }
    public decimal TotalRevenue { get; init; }
    public double AverageCompletionRate { get; init; }
    public List<CoursePerformanceDto> TopCourses { get; init; } = new();
    public List<EnrollmentTrendDto> EnrollmentTrends { get; init; } = new();
    public List<RevenueTrendDto> RevenueTrends { get; init; } = new();
}

public record CoursePerformanceDto
{
    public Guid CourseId { get; init; }
    public string CourseName { get; init; } = string.Empty;
    public int Enrollments { get; init; }
    public double Rating { get; init; }
    public decimal Revenue { get; init; }
    public double CompletionRate { get; init; }
}

public record RevenueTrendDto
{
    public DateTime Date { get; init; }
    public decimal Amount { get; init; }
}
