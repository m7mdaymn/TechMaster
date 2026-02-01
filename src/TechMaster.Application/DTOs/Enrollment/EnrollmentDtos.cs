using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Enrollment;

public class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? UserPhone { get; set; }
    public string? UserAvatar { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseNameAr { get; set; } = string.Empty;
    public string? CourseThumbnail { get; set; }
    public string? InstructorName { get; set; }
    public decimal CoursePrice { get; set; }
    public EnrollmentStatus Status { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? PaymentReference { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
    public string? PaymentNotes { get; set; }
    public decimal? AmountPaid { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ProgressPercentage { get; set; }
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EnrollmentDetailDto : EnrollmentDto
{
    public List<SessionProgressDto> SessionProgresses { get; set; } = new();
}

public class CreateEnrollmentDto
{
    public Guid CourseId { get; set; }
}

public class EnrollmentRequestDto
{
    public Guid CourseId { get; set; }
    public string? PaymentReference { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
    public string? Notes { get; set; }
}

public class ApproveEnrollmentDto
{
    public string? PaymentReference { get; set; }
    public string? PaymentNotes { get; set; }
    public decimal? AmountPaid { get; set; }
}

public class SessionProgressDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string SessionNameAr { get; set; } = string.Empty;
    public int WatchPercentage { get; set; }
    public int WatchTimeSeconds { get; set; }
    public bool VideoCompleted { get; set; }
    public bool ResourcesAccessed { get; set; }
    public bool QuizPassed { get; set; }
    public int QuizAttempts { get; set; }
    public int? QuizScore { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsUnlocked { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}

public class UpdateProgressDto
{
    public Guid SessionId { get; set; }
    public int? WatchPercentage { get; set; }
    public int? WatchTimeSeconds { get; set; }
    public bool? ResourcesAccessed { get; set; }
}

public class StudentDashboardDto
{
    public int TotalEnrollments { get; set; }
    public int InProgressCourses { get; set; }
    public int ActiveCourses { get; set; }
    public int CompletedCourses { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("totalXp")]
    public int TotalXp { get; set; }
    public int TotalBadges { get; set; }
    public int BadgesEarned { get; set; }
    public int TotalCertificates { get; set; }
    public int CertificatesEarned { get; set; }
    public int CurrentLevel { get; set; }
    public int XPToNextLevel { get; set; }
    public double OverallProgress { get; set; }
    public List<EnrollmentDto> Enrollments { get; set; } = new();
    public List<EnrollmentDto> RecentEnrollments { get; set; } = new();
    public List<CertificateItemDto> Certificates { get; set; } = new();
    public List<BadgeDto> Badges { get; set; } = new();
    public List<BadgeDto> RecentBadges { get; set; } = new();
}

public class CertificateItemDto
{
    public Guid Id { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string CourseThumbnail { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public string CertificateUrl { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
}

public class BadgeDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public int XpReward { get; set; }
    public DateTime? EarnedAt { get; set; }
}
