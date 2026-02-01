using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Internship : LocalizedEntity
{
    public string Slug { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyNameAr { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public string? Location { get; set; }
    public string? LocationAr { get; set; }
    public bool IsRemote { get; set; } = false;
    public int DurationInWeeks { get; set; } = 0;
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? ResponsibilitiesEn { get; set; }
    public string? ResponsibilitiesAr { get; set; }
    public string? BenefitsEn { get; set; }
    public string? BenefitsAr { get; set; }
    public InternshipStatus Status { get; set; } = InternshipStatus.Open;
    public DateTime? ApplicationDeadline { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxApplicants { get; set; } = 0;
    public bool IsPaid { get; set; } = false;
    public decimal? Stipend { get; set; }
    public bool HasFee { get; set; } = false;
    public decimal? FeeAmount { get; set; }
    public string? Currency { get; set; }
    public bool IsFeatured { get; set; } = false;

    public virtual ICollection<InternshipApplication> Applications { get; set; } = new List<InternshipApplication>();
    public virtual ICollection<CourseTask> Tasks { get; set; } = new List<CourseTask>();
}

public class InternshipApplication : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid InternshipId { get; set; }
    public virtual Internship Internship { get; set; } = null!;

    public InternshipApplicationStatus Status { get; set; } = InternshipApplicationStatus.Pending;
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
}
