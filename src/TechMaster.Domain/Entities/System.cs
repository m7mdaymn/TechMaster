using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public Guid? UserId { get; set; }
    public virtual ApplicationUser? User { get; set; }
}

public class SystemSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? ValueAr { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsPublic { get; set; } = false;
}

public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public string? ReadBy { get; set; }
    public string? Reply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public string? RepliedBy { get; set; }
}

public class Testimonial : LocalizedEntity
{
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorNameAr { get; set; } = string.Empty;
    public string? AuthorTitle { get; set; }
    public string? AuthorTitleAr { get; set; }
    public string? AuthorImageUrl { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}

public class FAQ : LocalizedEntity
{
    public string QuestionEn { get; set; } = string.Empty;
    public string QuestionAr { get; set; } = string.Empty;
    public string AnswerEn { get; set; } = string.Empty;
    public string AnswerAr { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? CategoryAr { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}
