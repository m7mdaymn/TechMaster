using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class SessionMaterial : LocalizedEntity
{
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsRequired { get; set; } = false;
    public bool AllowDownload { get; set; } = true;
    public int Version { get; set; } = 1;

    public Guid SessionId { get; set; }
    public virtual Session Session { get; set; } = null!;

    public virtual ICollection<MaterialAccess> Accesses { get; set; } = new List<MaterialAccess>();
}

public class CourseMaterial : LocalizedEntity
{
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool AllowDownload { get; set; } = true;
    public bool IsPublic { get; set; } = false;
    public int Version { get; set; } = 1;

    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
}

public class LibraryItem : LocalizedEntity
{
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublic { get; set; } = false;
    public bool AllowDownload { get; set; } = false;
    public int Version { get; set; } = 1;
    public string? Tags { get; set; }

    public Guid? CategoryId { get; set; }
    public virtual Category? Category { get; set; }

    public virtual ICollection<LibraryItemAccess> Accesses { get; set; } = new List<LibraryItemAccess>();
}

public class MaterialAccess : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid MaterialId { get; set; }
    public virtual SessionMaterial Material { get; set; } = null!;

    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
    public bool Downloaded { get; set; } = false;
}

public class LibraryItemAccess : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid LibraryItemId { get; set; }
    public virtual LibraryItem LibraryItem { get; set; } = null!;

    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
    public bool Downloaded { get; set; } = false;
}
