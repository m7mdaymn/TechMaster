using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Course;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class CoursesController : BaseApiController
{
    private readonly ICourseService _courseService;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(ICourseService courseService, ILogger<CoursesController> logger)
    {
        _courseService = courseService;
        _logger = logger;
    }

    /// <summary>
    /// Get all published courses with pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCourses(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? featured = null)
    {
        var result = await _courseService.GetCoursesAsync(pageNumber, pageSize, status, category, search, featured);
        return HandleResult(result);
    }

    /// <summary>
    /// Get course by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCourse(Guid id)
    {
        var result = await _courseService.GetCourseByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Get course by slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetCourseBySlug(string slug)
    {
        var result = await _courseService.GetCourseBySlugAsync(slug);
        return HandleResult(result);
    }

    /// <summary>
    /// Get featured courses
    /// </summary>
    [HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedCourses([FromQuery] int count = 6)
    {
        var result = await _courseService.GetFeaturedCoursesAsync(count);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new course (Instructor/Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            _logger.LogWarning("Course creation validation failed: {Errors}", string.Join(", ", errors));
            return BadRequest(new { messageEn = string.Join(", ", errors), isSuccess = false });
        }
        
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        try
        {
            _logger.LogInformation("Creating course: {CourseName} by user {UserId}", dto.NameEn, CurrentUserId.Value);
            var result = await _courseService.CreateCourseAsync(dto, CurrentUserId.Value);
            if (!result.IsSuccess)
            {
                _logger.LogWarning("Course creation failed: {Message}", result.Message);
            }
            return HandleResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception creating course: {CourseName}", dto.NameEn);
            return BadRequest(new { messageEn = ex.Message, isSuccess = false });
        }
    }

    /// <summary>
    /// Update a course (Owner or Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto dto)
    {
        var result = await _courseService.UpdateCourseAsync(id, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a course (Owner or Admin only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        var result = await _courseService.DeleteCourseAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Publish a course (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishCourse(Guid id)
    {
        var result = await _courseService.PublishCourseAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Unpublish a course (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> UnpublishCourse(Guid id)
    {
        var result = await _courseService.ArchiveCourseAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Archive a course (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> ArchiveCourse(Guid id)
    {
        var result = await _courseService.ArchiveCourseAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Reject a course (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectCourse(Guid id, [FromBody] RejectCourseDto? dto)
    {
        var result = await _courseService.RejectCourseAsync(id, dto?.Reason);
        return HandleResult(result);
    }

    /// <summary>
    /// Get course with full content (for enrolled users or instructors)
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}/full")]
    public async Task<IActionResult> GetCourseWithContent(Guid id)
    {
        // Use GetCourseByIdAsync - authorization should be handled at service level
        var result = await _courseService.GetCourseByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _courseService.GetCategoriesAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Create a category (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var result = await _courseService.CreateCategoryAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Add a module to a course
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("{courseId:guid}/modules")]
    public async Task<IActionResult> AddModule(Guid courseId, [FromBody] CreateModuleDto dto)
    {
        // Ensure courseId is set in the dto
        var moduleDto = new CreateModuleDto
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            SortOrder = dto.SortOrder,
            CourseId = courseId
        };
        var result = await _courseService.CreateModuleAsync(moduleDto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get modules for a course
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpGet("{courseId:guid}/modules")]
    public async Task<IActionResult> GetModules(Guid courseId)
    {
        var result = await _courseService.GetCourseModulesAsync(courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a module
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("modules/{moduleId:guid}")]
    public async Task<IActionResult> UpdateModule(Guid moduleId, [FromBody] UpdateModuleDto dto)
    {
        var result = await _courseService.UpdateModuleAsync(moduleId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a module
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid moduleId)
    {
        var result = await _courseService.DeleteModuleAsync(moduleId);
        return HandleResult(result);
    }

    /// <summary>
    /// Add a session to a module
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("modules/{moduleId:guid}/sessions")]
    public async Task<IActionResult> AddSession(Guid moduleId, [FromBody] CreateSessionDto dto)
    {
        // Ensure moduleId is set in the dto
        dto.ModuleId = moduleId;
        var result = await _courseService.CreateSessionAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a session
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPut("sessions/{sessionId:guid}")]
    public async Task<IActionResult> UpdateSession(Guid sessionId, [FromBody] UpdateSessionDto dto)
    {
        var result = await _courseService.UpdateSessionAsync(sessionId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a session
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        var result = await _courseService.DeleteSessionAsync(sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Add material to a session
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("sessions/{sessionId:guid}/materials")]
    public async Task<IActionResult> AddSessionMaterial(Guid sessionId, [FromBody] CreateSessionMaterialDto dto)
    {
        // Ensure sessionId is set in the dto
        dto.SessionId = sessionId;
        var result = await _courseService.CreateSessionMaterialAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete session material
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpDelete("materials/{materialId:guid}")]
    public async Task<IActionResult> DeleteMaterial(Guid materialId)
    {
        var result = await _courseService.DeleteSessionMaterialAsync(materialId);
        return HandleResult(result);
    }

    /// <summary>
    /// Reorder modules
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("{courseId:guid}/modules/reorder")]
    public async Task<IActionResult> ReorderModules(Guid courseId, [FromBody] List<Guid> moduleIds)
    {
        var result = await _courseService.ReorderModulesAsync(courseId, moduleIds);
        return HandleResult(result);
    }

    /// <summary>
    /// Reorder sessions in a module
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("modules/{moduleId:guid}/sessions/reorder")]
    public async Task<IActionResult> ReorderSessions(Guid moduleId, [FromBody] List<Guid> sessionIds)
    {
        var result = await _courseService.ReorderSessionsAsync(moduleId, sessionIds);
        return HandleResult(result);
    }

    /// <summary>
    /// Submit a rating for a course
    /// </summary>
    [Authorize]
    [HttpPost("{courseId:guid}/ratings")]
    public async Task<IActionResult> SubmitRating(Guid courseId, [FromBody] SubmitRatingDto dto)
    {
        if (CurrentUserId == null) return Unauthorized();
        var result = await _courseService.SubmitCourseRatingAsync(courseId, CurrentUserId.Value, dto.Rating, dto.Comment);
        return HandleResult(result);
    }

    /// <summary>
    /// Get ratings for a course
    /// </summary>
    [HttpGet("{courseId:guid}/ratings")]
    public async Task<IActionResult> GetCourseRatings(Guid courseId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _courseService.GetCourseRatingsAsync(courseId, pageNumber, pageSize);
        return HandleResult(result);
    }

    /// <summary>
    /// Check if user has rated a course
    /// </summary>
    [Authorize]
    [HttpGet("{courseId:guid}/ratings/my")]
    public async Task<IActionResult> GetMyRating(Guid courseId)
    {
        if (CurrentUserId == null) return Unauthorized();
        var result = await _courseService.GetUserCourseRatingAsync(courseId, CurrentUserId.Value);
        return HandleResult(result);
    }
}

public record RejectCourseDto
{
    public string? Reason { get; init; }
}

public record SubmitRatingDto
{
    public int Rating { get; init; }
    public string? Comment { get; init; }
}
