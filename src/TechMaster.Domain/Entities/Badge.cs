using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Badge : LocalizedEntity
{
    public BadgeType Type { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public int XpReward { get; set; } = 0;
    public string? Criteria { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}

public class UserBadge : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid BadgeId { get; set; }
    public virtual Badge Badge { get; set; } = null!;

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    public string? EarnedFor { get; set; }
}
