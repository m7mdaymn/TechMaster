using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class ApplicationUser : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? FirstNameAr { get; set; }
    public string? LastNameAr { get; set; }
    public string? Phone { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public string? BioAr { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public bool IsEmailVerified { get; set; } = false;
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? GoogleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public int XpPoints { get; set; } = 0;
    
    // Additional profile fields
    public string? Expertise { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? CvUrl { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Timezone { get; set; }
    public bool NotificationsEnabled { get; set; } = true;
    public bool EmailNotifications { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<Course> InstructorCourses { get; set; } = new List<Course>();
    public virtual ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    public virtual ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<SessionProgress> SessionProgresses { get; set; } = new List<SessionProgress>();
    public virtual ICollection<InternshipApplication> InternshipApplications { get; set; } = new List<InternshipApplication>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public string FullName => $"{FirstName} {LastName}";
    public string FullNameAr => $"{FirstNameAr} {LastNameAr}";
}
