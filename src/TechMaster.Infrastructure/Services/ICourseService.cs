using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Course;

namespace TechMaster.Infrastructure.Services;

public interface ICourseService
{
    // Courses
    Task<Result<PaginatedList<CourseDto>>> GetCoursesAsync(int pageNumber, int pageSize, string? status = null, string? category = null, string? search = null, bool? featured = null);
    Task<Result<CourseDetailDto>> GetCourseByIdAsync(Guid courseId);
    Task<Result<CourseDetailDto>> GetCourseBySlugAsync(string slug);
    Task<Result<CourseDto>> CreateCourseAsync(CreateCourseDto dto, Guid instructorId);
    Task<Result<CourseDto>> UpdateCourseAsync(Guid courseId, UpdateCourseDto dto);
    Task<Result> DeleteCourseAsync(Guid courseId);
    Task<Result> PublishCourseAsync(Guid courseId);
    Task<Result> ArchiveCourseAsync(Guid courseId);
    Task<Result> RejectCourseAsync(Guid courseId, string? reason = null);
    Task<Result<List<CourseDto>>> GetInstructorCoursesAsync(Guid instructorId);
    Task<Result<List<CourseDto>>> GetFeaturedCoursesAsync(int count = 6);

    // Categories
    Task<Result<List<CategoryDto>>> GetCategoriesAsync();
    Task<Result<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto);
    Task<Result<CategoryDto>> UpdateCategoryAsync(Guid categoryId, CreateCategoryDto dto);
    Task<Result> DeleteCategoryAsync(Guid categoryId);

    // Modules
    Task<Result<List<ModuleDto>>> GetCourseModulesAsync(Guid courseId);
    Task<Result<ModuleDto>> CreateModuleAsync(CreateModuleDto dto);
    Task<Result<ModuleDto>> UpdateModuleAsync(Guid moduleId, UpdateModuleDto dto);
    Task<Result> DeleteModuleAsync(Guid moduleId);
    Task<Result> ReorderModulesAsync(Guid courseId, List<Guid> moduleIds);

    // Sessions
    Task<Result<SessionDto>> CreateSessionAsync(CreateSessionDto dto);
    Task<Result<SessionDto>> UpdateSessionAsync(Guid sessionId, UpdateSessionDto dto);
    Task<Result> DeleteSessionAsync(Guid sessionId);
    Task<Result> ReorderSessionsAsync(Guid moduleId, List<Guid> sessionIds);

    // Materials
    Task<Result<SessionMaterialDto>> CreateSessionMaterialAsync(CreateSessionMaterialDto dto);
    Task<Result> DeleteSessionMaterialAsync(Guid materialId);

    // Ratings
    Task<Result> SubmitCourseRatingAsync(Guid courseId, Guid userId, int rating, string? comment);
    Task<Result<PaginatedList<CourseRatingDto>>> GetCourseRatingsAsync(Guid courseId, int pageNumber, int pageSize);
    Task<Result<CourseRatingDto?>> GetUserCourseRatingAsync(Guid courseId, Guid userId);
}
