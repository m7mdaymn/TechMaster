using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class Certificate : BaseEntity
{
    public string CertificateNumber { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public string? IssuedBy { get; set; }
    public bool IsValid { get; set; } = true;
    public string? InvalidationReason { get; set; }

    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;

    public int? FinalScore { get; set; }
    public DateTime? CompletedAt { get; set; }
}
