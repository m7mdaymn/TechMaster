using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Course : LocalizedEntity
{
    public string Slug { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? TrailerVideoUrl { get; set; }
    public CourseStatus Status { get; set; } = CourseStatus.Draft;
    public CourseType Type { get; set; } = CourseType.Paid;
    public decimal Price { get; set; } = 0;
    public decimal? DiscountPrice { get; set; }
    public string? Currency { get; set; } = "EGP";
    public int DurationInHours { get; set; } = 0;
    public string? Level { get; set; } // Beginner, Intermediate, Advanced
    public string? LevelAr { get; set; }
    public string? WhatYouWillLearnEn { get; set; }
    public string? WhatYouWillLearnAr { get; set; }
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? TargetAudienceEn { get; set; }
    public string? TargetAudienceAr { get; set; }
    public bool IsFeatured { get; set; } = false;
    public int SortOrder { get; set; } = 0;
    public int Version { get; set; } = 1;
    public DateTime? PublishedAt { get; set; }

    // Instructor
    public Guid InstructorId { get; set; }
    public virtual ApplicationUser Instructor { get; set; } = null!;

    // Category
    public Guid? CategoryId { get; set; }
    public virtual Category? Category { get; set; }

    // Progression Settings
    public bool RequireSequentialProgress { get; set; } = true;
    public bool RequireFinalAssessment { get; set; } = true;
    public int FinalAssessmentPassingScore { get; set; } = 70;

    // Navigation properties
    public virtual ICollection<Module> Modules { get; set; } = new List<Module>();
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<CourseMaterial> Materials { get; set; } = new List<CourseMaterial>();
    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
    public virtual ICollection<ChatRoom> ChatRooms { get; set; } = new List<ChatRoom>();
    public virtual ICollection<CoursePrerequisite> Prerequisites { get; set; } = new List<CoursePrerequisite>();
    public virtual ICollection<CoursePrerequisite> IsPrerequisiteFor { get; set; } = new List<CoursePrerequisite>();
    public virtual ICollection<CourseTask> Tasks { get; set; } = new List<CourseTask>();
    public virtual ICollection<CourseRating> Ratings { get; set; } = new List<CourseRating>();
}

public class CoursePrerequisite : BaseEntity
{
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    
    public Guid PrerequisiteCourseId { get; set; }
    public virtual Course PrerequisiteCourse { get; set; } = null!;
}

/// <summary>
/// Represents a rating/review for a course by a student
/// </summary>
public class CourseRating : BaseEntity
{
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
    
    /// <summary>
    /// Rating from 1 to 5
    /// </summary>
    public int Rating { get; set; }
    
    /// <summary>
    /// Optional review comment
    /// </summary>
    public string? Comment { get; set; }
    
    /// <summary>
    /// Whether this rating is visible (approved)
    /// </summary>
    public bool IsApproved { get; set; } = true;
}
