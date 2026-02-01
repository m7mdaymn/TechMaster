using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Course;

public class ModuleDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public Guid CourseId { get; set; }
    public List<SessionDto> Sessions { get; set; } = new();
    public int SessionCount { get; set; }
}

public class CreateModuleDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int SortOrder { get; set; }
    public Guid CourseId { get; set; }
}

public class UpdateModuleDto
{
    public string? NameEn { get; set; }
    public string? NameAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class SessionDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public SessionType Type { get; set; }
    public string? VideoUrl { get; set; }
    public int DurationInMinutes { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public bool IsFree { get; set; }
    public bool IsFreePreview => IsFree;
    public DateTime? LiveStartTime { get; set; }
    public DateTime? LiveEndTime { get; set; }
    public string? LiveMeetingUrl { get; set; }
    public int RequiredWatchPercentage { get; set; }
    public bool RequireResourceAccess { get; set; }
    public bool RequireQuizCompletion { get; set; }
    public int QuizPassingScore { get; set; }
    public int MaxQuizAttempts { get; set; }
    public Guid ModuleId { get; set; }
    public List<SessionMaterialDto> Materials { get; set; } = new();
    public bool HasQuiz { get; set; }
    
    // Additional fields for editing
    public string? PdfUrl { get; set; }
    public string? Content { get; set; }
    public int? QuizTimeLimit { get; set; }
    public List<QuizQuestionForSessionDto>? QuizQuestions { get; set; }
}

public class CreateSessionDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public SessionType Type { get; set; }
    public string? VideoUrl { get; set; }
    public int DurationInMinutes { get; set; }
    public int SortOrder { get; set; }
    public bool IsFree { get; set; }
    public DateTime? LiveStartTime { get; set; }
    public DateTime? LiveEndTime { get; set; }
    public string? LiveMeetingUrl { get; set; }
    public int RequiredWatchPercentage { get; set; } = 80;
    public bool RequireResourceAccess { get; set; }
    public bool RequireQuizCompletion { get; set; }
    public int QuizPassingScore { get; set; } = 70;
    public int MaxQuizAttempts { get; set; } = 3;
    public Guid ModuleId { get; set; }
}

public class UpdateSessionDto : CreateSessionDto
{
    public bool? IsActive { get; set; }
}

public class SessionMaterialDto
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
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
    public bool AllowDownload { get; set; }
}

public class CreateSessionMaterialDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
    public bool AllowDownload { get; set; } = true;
    public Guid SessionId { get; set; }
}

public class CreateMaterialDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public MaterialType Type { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
    public bool AllowDownload { get; set; } = true;
}

// DTOs for quiz questions in session editing
public class QuizQuestionForSessionDto
{
    public Guid? Id { get; set; }
    public string QuestionEn { get; set; } = string.Empty;
    public string? QuestionAr { get; set; }
    public string Type { get; set; } = "single";
    public int Points { get; set; } = 1;
    public List<QuizOptionForSessionDto> Options { get; set; } = new();
}

public class QuizOptionForSessionDto
{
    public string TextEn { get; set; } = string.Empty;
    public string? TextAr { get; set; }
    public bool IsCorrect { get; set; }
}
