using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Course;

public class CourseDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? TrailerVideoUrl { get; set; }
    public CourseStatus Status { get; set; }
    public CourseType Type { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public string? Currency { get; set; }
    public int DurationInHours { get; set; }
    public string? Level { get; set; }
    public string? LevelAr { get; set; }
    public string? WhatYouWillLearnEn { get; set; }
    public string? WhatYouWillLearnAr { get; set; }
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? TargetAudienceEn { get; set; }
    public string? TargetAudienceAr { get; set; }
    public bool IsFeatured { get; set; }
    public bool RequireSequentialProgress { get; set; }
    public bool RequireFinalAssessment { get; set; }
    public int FinalAssessmentPassingScore { get; set; }
    public InstructorDto? Instructor { get; set; }
    public CategoryDto? Category { get; set; }
    public int EnrollmentCount { get; set; }
    public int ModuleCount { get; set; }
    public int SessionCount { get; set; }
    public double AverageRating { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public class CourseDetailDto : CourseDto
{
    public List<ModuleDto> Modules { get; set; } = new();
    public List<CoursePrerequisiteDto> Prerequisites { get; set; } = new();
}

public class CoursePrerequisiteDto
{
    public Guid CourseId { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class CreateCourseDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? TrailerVideoUrl { get; set; }
    public CourseType Type { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public string? Currency { get; set; }
    public int DurationInHours { get; set; }
    public string? Level { get; set; }
    public string? LevelAr { get; set; }
    public string? WhatYouWillLearnEn { get; set; }
    public string? WhatYouWillLearnAr { get; set; }
    public string? RequirementsEn { get; set; }
    public string? RequirementsAr { get; set; }
    public string? TargetAudienceEn { get; set; }
    public string? TargetAudienceAr { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? InstructorId { get; set; }
    public bool RequireSequentialProgress { get; set; } = true;
    public bool RequireFinalAssessment { get; set; } = true;
    public int FinalAssessmentPassingScore { get; set; } = 70;
    public List<Guid>? PrerequisiteIds { get; set; }
    // Nested modules with sessions for full course creation
    public List<CreateModuleWithSessionsDto>? Modules { get; set; }
    // Status for publish on create
    public string? Status { get; set; }
}

public class CreateModuleWithSessionsDto
{
    public Guid? Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int SortOrder { get; set; }
    public List<CreateSessionWithQuizDto>? Sessions { get; set; }
}

public class CreateSessionWithQuizDto
{
    public Guid? Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string Type { get; set; } = "Video";
    public string? VideoUrl { get; set; }
    public string? PdfUrl { get; set; }
    public string? Content { get; set; }
    public string? ExternalLink { get; set; }
    public int DurationMinutes { get; set; }
    public int SortOrder { get; set; }
    public bool IsFreePreview { get; set; }
    // Quiz properties for Quiz type sessions
    public List<CreateQuizQuestionDto>? QuizQuestions { get; set; }
    public int? QuizPassingScore { get; set; }
    public int? QuizTimeLimit { get; set; }
}

public class CreateQuizQuestionDto
{
    public string QuestionEn { get; set; } = string.Empty;
    public string QuestionAr { get; set; } = string.Empty;
    public string Type { get; set; } = "multiple-choice";
    public int Points { get; set; } = 1;
    public List<CreateQuizOptionDto>? Options { get; set; }
}

public class CreateQuizOptionDto
{
    public string TextEn { get; set; } = string.Empty;
    public string? TextAr { get; set; }
    public bool IsCorrect { get; set; }
}

public class UpdateCourseDto : CreateCourseDto
{
    // Status is already in CreateCourseDto as string
    public bool? IsFeatured { get; set; }
}

public class InstructorDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Bio { get; set; }
    public string? BioAr { get; set; }
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string? ImageUrl { get; set; }
    public int CourseCount { get; set; }
}

public class CreateCategoryDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? IconUrl { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ParentCategoryId { get; set; }
}

public class CourseRatingDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhotoUrl { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsApproved { get; set; }
}
