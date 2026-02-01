using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Session : LocalizedEntity
{
    public SessionType Type { get; set; } = SessionType.Recorded;
    public string? VideoUrl { get; set; }
    public int DurationInMinutes { get; set; } = 0;
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsFree { get; set; } = false;

    // Live session details
    public DateTime? LiveStartTime { get; set; }
    public DateTime? LiveEndTime { get; set; }
    public string? LiveMeetingUrl { get; set; }

    // Progression Rules
    public int RequiredWatchPercentage { get; set; } = 80;
    public bool RequireResourceAccess { get; set; } = false;
    public bool RequireQuizCompletion { get; set; } = false;
    public int QuizPassingScore { get; set; } = 70;
    public int MaxQuizAttempts { get; set; } = 3;

    public Guid ModuleId { get; set; }
    public virtual Module Module { get; set; } = null!;

    public virtual ICollection<SessionMaterial> Materials { get; set; } = new List<SessionMaterial>();
    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public virtual ICollection<SessionProgress> Progresses { get; set; } = new List<SessionProgress>();
}
