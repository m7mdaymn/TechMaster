using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Internship;

public class InternshipDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyNameAr { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public string? Location { get; set; }
    public string? LocationAr { get; set; }
    public bool IsRemote { get; set; }
    public int DurationInWeeks { get; set; }
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? ResponsibilitiesEn { get; set; }
    public string? ResponsibilitiesAr { get; set; }
    public string? BenefitsEn { get; set; }
    public string? BenefitsAr { get; set; }
    public InternshipStatus Status { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxApplicants { get; set; }
    public bool IsPaid { get; set; }
    public decimal? Stipend { get; set; }
    public bool HasFee { get; set; }
    public decimal? FeeAmount { get; set; }
    public string? Currency { get; set; }
    public bool IsFeatured { get; set; }
    public int ApplicationCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateInternshipDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyNameAr { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public string? Location { get; set; }
    public string? LocationAr { get; set; }
    public bool IsRemote { get; set; }
    public int DurationInWeeks { get; set; }
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? ResponsibilitiesEn { get; set; }
    public string? ResponsibilitiesAr { get; set; }
    public string? BenefitsEn { get; set; }
    public string? BenefitsAr { get; set; }
    public DateTime? ApplicationDeadline { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxApplicants { get; set; }
    public bool IsPaid { get; set; }
    public decimal? Stipend { get; set; }
    public bool HasFee { get; set; }
    public decimal? FeeAmount { get; set; }
    public string? Currency { get; set; }
    public InternshipStatus? Status { get; set; }
}

public class InternshipApplicationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public Guid InternshipId { get; set; }
    public string InternshipName { get; set; } = string.Empty;
    public InternshipApplicationStatus Status { get; set; }
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateInternshipApplicationDto
{
    public Guid InternshipId { get; set; }
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
}

public class ReviewApplicationDto
{
    public InternshipApplicationStatus Status { get; set; }
    public string? AdminNotes { get; set; }
}

// Task DTOs
public class InternshipTaskDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string? InstructionsAr { get; set; }
    public int SortOrder { get; set; }
    public int MaxPoints { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsRequired { get; set; }
    public bool IsActive { get; set; }
    public string TaskType { get; set; } = string.Empty;
    public Guid InternshipId { get; set; }
    public int SubmissionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TaskAttachmentDto> Attachments { get; set; } = new();
}

public class CreateInternshipTaskDto
{
    public string NameEn { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string? InstructionsAr { get; set; }
    public int SortOrder { get; set; } = 0;
    public int MaxPoints { get; set; } = 100;
    public DateTime? DueDate { get; set; }
    public bool IsRequired { get; set; } = true;
    public int TaskType { get; set; } = 0; // Assignment = 0
    public List<TaskAttachmentDto> Attachments { get; set; } = new();
}

public class UpdateInternshipTaskDto
{
    public string NameEn { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string? InstructionsAr { get; set; }
    public int SortOrder { get; set; }
    public int MaxPoints { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsRequired { get; set; }
    public bool IsActive { get; set; }
    public int TaskType { get; set; }
    public List<TaskAttachmentDto> Attachments { get; set; } = new();
}

public class TaskSubmissionDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? SubmissionText { get; set; }
    public string? SubmissionUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Score { get; set; }
    public int MaxPoints { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }
    public bool IsLate { get; set; }
    public List<SubmissionAttachmentDto> Attachments { get; set; } = new();
}

public class CreateTaskSubmissionDto
{
    public string? SubmissionText { get; set; }
    public string? SubmissionUrl { get; set; }
    public List<SubmissionAttachmentDto> Attachments { get; set; } = new();
}

public class GradeSubmissionDto
{
    public int Score { get; set; }
    public string? Feedback { get; set; }
    public string? FeedbackAr { get; set; }
}

public class TaskAttachmentDto
{
    public Guid? Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}

public class SubmissionAttachmentDto
{
    public Guid? Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}
