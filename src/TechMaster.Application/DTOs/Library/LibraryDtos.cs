using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Library;

public class LibraryItemDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublic { get; set; }
    public bool AllowDownload { get; set; }
    public string? Tags { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLibraryItemDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublic { get; set; }
    public bool AllowDownload { get; set; }
    public string? Tags { get; set; }
    public Guid? CategoryId { get; set; }
}

public class UpdateLibraryItemDto : CreateLibraryItemDto
{
}
