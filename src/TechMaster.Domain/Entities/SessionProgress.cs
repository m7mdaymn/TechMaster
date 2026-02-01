using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class SessionProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid SessionId { get; set; }
    public virtual Session Session { get; set; } = null!;

    public Guid EnrollmentId { get; set; }
    public virtual Enrollment Enrollment { get; set; } = null!;

    public int WatchPercentage { get; set; } = 0;
    public int WatchTimeSeconds { get; set; } = 0;
    public bool VideoCompleted { get; set; } = false;
    public bool ResourcesAccessed { get; set; } = false;
    public bool QuizPassed { get; set; } = false;
    public int QuizAttempts { get; set; } = 0;
    public int? QuizScore { get; set; }
    public bool IsCompleted { get; set; } = false;
    public bool IsUnlocked { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
}
