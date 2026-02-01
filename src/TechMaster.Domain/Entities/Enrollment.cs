using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Enrollment : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public string? PaymentReference { get; set; }
    public string? PaymentScreenshotUrl { get; set; }
    public string? PaymentNotes { get; set; }
    public decimal? AmountPaid { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ProgressPercentage { get; set; } = 0;
    public DateTime? LastAccessedAt { get; set; }

    public virtual ICollection<SessionProgress> SessionProgresses { get; set; } = new List<SessionProgress>();
}
