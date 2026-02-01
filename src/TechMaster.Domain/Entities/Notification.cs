using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Notification : BaseEntity
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public bool EmailSent { get; set; } = false;
    public DateTime? EmailSentAt { get; set; }

    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
}
