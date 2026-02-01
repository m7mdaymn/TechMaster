using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class Module : LocalizedEntity
{
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();
    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
