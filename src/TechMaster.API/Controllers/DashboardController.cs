using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Admin;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

[Authorize]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    #region Admin Dashboard

    /// <summary>
    /// Get admin dashboard data (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var result = await _dashboardService.GetAdminDashboardAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Get audit logs (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? action = null,
        [FromQuery] Guid? userId = null)
    {
        var result = await _dashboardService.GetAuditLogsAsync(pageNumber, pageSize, action, userId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get users list (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? role = null,
        [FromQuery] string? search = null)
    {
        var result = await _dashboardService.GetUsersAsync(pageNumber, pageSize, role, search);
        return HandleResult(result);
    }

    /// <summary>
    /// Update user role (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("admin/users/{userId:guid}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid userId, [FromBody] UpdateRoleDto dto)
    {
        var result = await _dashboardService.UpdateUserRoleAsync(userId, dto.Role);
        return HandleResult(result);
    }

    /// <summary>
    /// Toggle user status (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("admin/users/{userId:guid}/status")]
    public async Task<IActionResult> ToggleUserStatus(Guid userId, [FromBody] ToggleStatusDto dto)
    {
        var result = await _dashboardService.ToggleUserStatusAsync(userId, dto.IsActive);
        return HandleResult(result);
    }

    /// <summary>
    /// Create new user (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("admin/users")]
    public async Task<IActionResult> CreateUser([FromBody] TechMaster.Application.DTOs.Auth.CreateUserDto dto)
    {
        var result = await _dashboardService.CreateUserAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all instructors (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/instructors")]
    public async Task<IActionResult> GetInstructors()
    {
        var result = await _dashboardService.GetInstructorsAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Delete user (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("admin/users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        var result = await _dashboardService.DeleteUserAsync(userId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get system settings (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _dashboardService.GetSystemSettingsAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Update system settings (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("admin/settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] TechMaster.Application.DTOs.Admin.SystemSettingsDto dto)
    {
        var result = await _dashboardService.UpdateSystemSettingsAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get contact messages (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/contact-messages")]
    public async Task<IActionResult> GetContactMessages(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null)
    {
        var result = await _dashboardService.GetContactMessagesAsync(pageNumber, pageSize, isRead);
        return HandleResult(result);
    }

    /// <summary>
    /// Mark contact message as read (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("admin/contact-messages/{messageId:guid}/read")]
    public async Task<IActionResult> MarkMessageAsRead(Guid messageId)
    {
        var result = await _dashboardService.MarkContactMessageAsReadAsync(messageId);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete contact message (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("admin/contact-messages/{messageId:guid}")]
    public async Task<IActionResult> DeleteContactMessage(Guid messageId)
    {
        var result = await _dashboardService.DeleteContactMessageAsync(messageId);
        return HandleResult(result);
    }

    #endregion

    #region Instructor Dashboard

    /// <summary>
    /// Get instructor dashboard data
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor")]
    public async Task<IActionResult> GetInstructorDashboard()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorDashboardAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's courses
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/courses")]
    public async Task<IActionResult> GetInstructorCourses()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorCoursesAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get course analytics
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/courses/{courseId:guid}/analytics")]
    public async Task<IActionResult> GetCourseAnalytics(Guid courseId)
    {
        var result = await _dashboardService.GetCourseAnalyticsAsync(courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's students across all courses
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/students")]
    public async Task<IActionResult> GetInstructorStudents([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorStudentsAsync(CurrentUserId.Value, pageNumber, pageSize);
        return HandleResult(result);
    }

    /// <summary>
    /// Get detailed student enrollment info (for instructor's own courses)
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/students/{enrollmentId:guid}")]
    public async Task<IActionResult> GetInstructorStudentDetail(Guid enrollmentId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorStudentDetailAsync(CurrentUserId.Value, enrollmentId);
        return HandleResult(result);
    }

    /// <summary>
    /// Remove a student from instructor's course
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpDelete("instructor/students/{enrollmentId:guid}")]
    public async Task<IActionResult> RemoveStudentFromCourse(Guid enrollmentId, [FromQuery] string? reason = null)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.RemoveStudentFromCourseAsync(CurrentUserId.Value, enrollmentId, reason);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's reviews
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/reviews")]
    public async Task<IActionResult> GetInstructorReviews([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, [FromQuery] int? rating = null)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorReviewsAsync(CurrentUserId.Value, pageNumber, pageSize, rating);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's earnings
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/earnings")]
    public async Task<IActionResult> GetInstructorEarnings([FromQuery] int year = 0, [FromQuery] int month = 0)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorEarningsAsync(CurrentUserId.Value, year, month);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's live sessions
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/live-sessions")]
    public async Task<IActionResult> GetInstructorLiveSessions([FromQuery] string? status = null)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorLiveSessionsAsync(CurrentUserId.Value, status);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a live session
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpPost("instructor/live-sessions")]
    public async Task<IActionResult> CreateLiveSession([FromBody] CreateLiveSessionDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.CreateLiveSessionAsync(CurrentUserId.Value, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a live session
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpPut("instructor/live-sessions/{sessionId:guid}")]
    public async Task<IActionResult> UpdateLiveSession(Guid sessionId, [FromBody] UpdateLiveSessionDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.UpdateLiveSessionAsync(CurrentUserId.Value, sessionId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a live session
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpDelete("instructor/live-sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteLiveSession(Guid sessionId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.DeleteLiveSessionAsync(CurrentUserId.Value, sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get instructor's overall analytics
    /// </summary>
    [Authorize(Policy = "InstructorOnly")]
    [HttpGet("instructor/analytics")]
    public async Task<IActionResult> GetInstructorAnalytics()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetInstructorOverallAnalyticsAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    #endregion

    #region Student Dashboard

    /// <summary>
    /// Get student dashboard data
    /// </summary>
    [Authorize(Policy = "StudentOnly")]
    [HttpGet("student")]
    public async Task<IActionResult> GetStudentDashboard()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetStudentDashboardAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get student's enrollments
    /// </summary>
    [Authorize(Policy = "StudentOnly")]
    [HttpGet("student/enrollments")]
    public async Task<IActionResult> GetStudentEnrollments()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetStudentEnrollmentsAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get student's progress in a course
    /// </summary>
    [Authorize(Policy = "StudentOnly")]
    [HttpGet("student/courses/{courseId:guid}/progress")]
    public async Task<IActionResult> GetStudentProgress(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.GetStudentProgressAsync(CurrentUserId.Value, courseId);
        return HandleResult(result);
    }

    #endregion

    #region Testimonials

    /// <summary>
    /// Get approved testimonials (public)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("testimonials")]
    public async Task<IActionResult> GetTestimonials()
    {
        var result = await _dashboardService.GetTestimonialsAsync(true);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all testimonials (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("admin/testimonials")]
    public async Task<IActionResult> GetAllTestimonials([FromQuery] bool? approved = null)
    {
        var result = await _dashboardService.GetTestimonialsAsync(approved);
        return HandleResult(result);
    }

    /// <summary>
    /// Submit a testimonial
    /// </summary>
    [HttpPost("testimonials")]
    public async Task<IActionResult> CreateTestimonial([FromBody] StudentCreateTestimonialDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _dashboardService.CreateTestimonialAsync(CurrentUserId.Value, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Approve/reject testimonial (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("admin/testimonials/{testimonialId:guid}/approve")]
    public async Task<IActionResult> ApproveTestimonial(Guid testimonialId, [FromBody] ApproveTestimonialDto dto)
    {
        var result = await _dashboardService.ApproveTestimonialAsync(testimonialId, dto.Approved);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete testimonial (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("admin/testimonials/{testimonialId:guid}")]
    public async Task<IActionResult> DeleteTestimonial(Guid testimonialId)
    {
        var result = await _dashboardService.DeleteTestimonialAsync(testimonialId);
        return HandleResult(result);
    }

    #endregion

    #region Contact

    /// <summary>
    /// Send contact message (public)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("contact")]
    public async Task<IActionResult> SendContactMessage([FromBody] CreateContactMessageDto dto)
    {
        var result = await _dashboardService.CreateContactMessageAsync(dto);
        return HandleResult(result);
    }

    #endregion
}

public record UpdateRoleDto
{
    public string Role { get; init; } = string.Empty;
}

public record ToggleStatusDto
{
    public bool IsActive { get; init; }
}

public record ApproveTestimonialDto
{
    public bool Approved { get; init; }
}
