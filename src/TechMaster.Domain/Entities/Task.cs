using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

/// <summary>
/// Represents a task that can be assigned to students in courses or internships
/// </summary>
public class CourseTask : LocalizedEntity
{
    public string Instructions { get; set; } = string.Empty;
    public string? InstructionsAr { get; set; }
    public int SortOrder { get; set; } = 0;
    public int MaxPoints { get; set; } = 100;
    public DateTime? DueDate { get; set; }
    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public TaskType TaskType { get; set; } = TaskType.Assignment;
    
    // For course tasks
    public Guid? CourseId { get; set; }
    public virtual Course? Course { get; set; }
    
    public Guid? SessionId { get; set; }
    public virtual Session? Session { get; set; }
    
    // For internship tasks
    public Guid? InternshipId { get; set; }
    public virtual Internship? Internship { get; set; }
    
    // Creator (instructor/admin)
    public Guid CreatedByUserId { get; set; }
    public virtual ApplicationUser CreatedByUser { get; set; } = null!;
    
    public virtual ICollection<TaskSubmission> Submissions { get; set; } = new List<TaskSubmission>();
    public virtual ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
}

/// <summary>
/// Student submission for a task
/// </summary>
public class TaskSubmission : BaseEntity
{
    public Guid TaskId { get; set; }
    public virtual CourseTask Task { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
    
    public string? SubmissionText { get; set; }
    public string? SubmissionUrl { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    
    // Grading
    public int? Score { get; set; }
    public string? Feedback { get; set; }
    public string? FeedbackAr { get; set; }
    public DateTime? GradedAt { get; set; }
    public Guid? GradedByUserId { get; set; }
    public virtual ApplicationUser? GradedByUser { get; set; }
    
    public virtual ICollection<SubmissionAttachment> Attachments { get; set; } = new List<SubmissionAttachment>();
}

/// <summary>
/// Attachments for tasks (provided by instructor)
/// </summary>
public class TaskAttachment : BaseEntity
{
    public Guid TaskId { get; set; }
    public virtual CourseTask Task { get; set; } = null!;
    
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}

/// <summary>
/// Attachments for submissions (uploaded by student)
/// </summary>
public class SubmissionAttachment : BaseEntity
{
    public Guid SubmissionId { get; set; }
    public virtual TaskSubmission Submission { get; set; } = null!;
    
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}
