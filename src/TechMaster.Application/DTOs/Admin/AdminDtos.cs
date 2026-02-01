namespace TechMaster.Application.DTOs.Admin;

public class AdminDashboardDto
{
    public int TotalStudents { get; set; }
    public int TotalInstructors { get; set; }
    public int TotalCourses { get; set; }
    public int PublishedCourses { get; set; }
    public int TotalEnrollments { get; set; }
    public int PendingEnrollments { get; set; }
    public int CompletedEnrollments { get; set; }
    public int TotalInternships { get; set; }
    public int PendingApplications { get; set; }
    public int TotalCertificates { get; set; }
    public int TotalContactMessages { get; set; }
    public int UnreadMessages { get; set; }
    public decimal TotalRevenue { get; set; }
    
    // Growth percentages (comparing current month vs previous month)
    public double UserGrowthPercentage { get; set; }
    public double CourseGrowthPercentage { get; set; }
    public double EnrollmentGrowthPercentage { get; set; }
    public double RevenueGrowthPercentage { get; set; }
    
    // Recent data
    public List<RecentUserDto> RecentUsers { get; set; } = new();
    public List<RecentEnrollmentDto> RecentEnrollments { get; set; } = new();
    
    public List<EnrollmentStatsDto> EnrollmentStats { get; set; } = new();
    public List<EnrollmentStatsDto> UserRegistrationStats { get; set; } = new();
    public List<CategoryBreakdownDto> CategoryBreakdown { get; set; } = new();
    public List<CourseStatsDto> TopCourses { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class RecentUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class RecentEnrollmentDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseThumbnail { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
}

public class InstructorDashboardDto
{
    public int TotalCourses { get; set; }
    public int PublishedCourses { get; set; }
    public int DraftCourses { get; set; }
    public int TotalStudents { get; set; }
    public int TotalEnrollments { get; set; }
    public int ActiveEnrollments { get; set; }
    public int CompletedEnrollments { get; set; }
    public double AverageCompletionRate { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal ThisMonthRevenue { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public List<CourseStatsDto> CourseStats { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
    public List<TechMaster.Application.DTOs.Course.CourseDto> RecentCourses { get; set; } = new();
    public List<TechMaster.Application.DTOs.Enrollment.EnrollmentDto> RecentEnrollments { get; set; } = new();
}

public class EnrollmentStatsDto
{
    public string Period { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CategoryBreakdownDto
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class CourseStatsDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int EnrollmentCount { get; set; }
    public int CompletionCount { get; set; }
    public double AverageProgress { get; set; }
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionAr { get; set; }
    public DateTime Timestamp { get; set; }
    public string? UserName { get; set; }
    public string? ActionUrl { get; set; }
}

public class AuditLogDto
{
    public Guid Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ContactMessageDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? Reply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateContactMessageDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ReplyContactMessageDto
{
    public string Reply { get; set; } = string.Empty;
}

public class TestimonialDto
{
    public Guid Id { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorNameAr { get; set; } = string.Empty;
    public string? AuthorTitle { get; set; }
    public string? AuthorTitleAr { get; set; }
    public string? AuthorImageUrl { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
    public int Rating { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public int SortOrder { get; set; }
}

public class CreateTestimonialDto
{
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorNameAr { get; set; } = string.Empty;
    public string? AuthorTitle { get; set; }
    public string? AuthorTitleAr { get; set; }
    public string? AuthorImageUrl { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public bool IsFeatured { get; set; } = false;
    public int SortOrder { get; set; }
}

public class FAQDto
{
    public Guid Id { get; set; }
    public string QuestionEn { get; set; } = string.Empty;
    public string QuestionAr { get; set; } = string.Empty;
    public string AnswerEn { get; set; } = string.Empty;
    public string AnswerAr { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? CategoryAr { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class CreateFAQDto
{
    public string QuestionEn { get; set; } = string.Empty;
    public string QuestionAr { get; set; } = string.Empty;
    public string AnswerEn { get; set; } = string.Empty;
    public string AnswerAr { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? CategoryAr { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateFAQDto
{
    public string? QuestionEn { get; set; }
    public string? QuestionAr { get; set; }
    public string? AnswerEn { get; set; }
    public string? AnswerAr { get; set; }
    public string? Category { get; set; }
    public string? CategoryAr { get; set; }
    public bool? IsActive { get; set; }
    public int? SortOrder { get; set; }
}

public class SystemSettingsDto
{
    public string SiteName { get; set; } = "TechMaster";
    public string SiteNameAr { get; set; } = "تيك ماستر";
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string DefaultLanguage { get; set; } = "en";
    public string PrimaryColor { get; set; } = "#247090";
    public string WhatsAppNumber { get; set; } = "01029907297";
    public string ContactEmail { get; set; } = "info@techmaster.com";
    public string? FacebookUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? YouTubeUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public bool MaintenanceMode { get; set; }
    public string? MaintenanceMessage { get; set; }
    public string? MaintenanceMessageAr { get; set; }
    public bool EmailNotificationsEnabled { get; set; } = true;
    public bool SmsNotificationsEnabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool SmtpUseSsl { get; set; } = true;
}
