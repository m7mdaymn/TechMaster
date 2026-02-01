using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Enrollment;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class EnrollmentsController : BaseApiController
{
    private readonly IEnrollmentService _enrollmentService;
    private readonly IProgressService _progressService;

    public EnrollmentsController(IEnrollmentService enrollmentService, IProgressService progressService)
    {
        _enrollmentService = enrollmentService;
        _progressService = progressService;
    }

    /// <summary>
    /// Enroll in a course
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Enroll([FromBody] EnrollmentRequestDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _enrollmentService.EnrollAsync(CurrentUserId.Value, dto.CourseId, dto.PaymentScreenshotUrl, dto.PaymentReference);
        return HandleResult(result);
    }

    /// <summary>
    /// Enroll in a free course
    /// </summary>
    [Authorize]
    [HttpPost("free")]
    public async Task<IActionResult> EnrollFree([FromBody] EnrollmentRequestDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        // Use the same service - the service should check if the course is free
        var result = await _enrollmentService.EnrollFreeAsync(CurrentUserId.Value, dto.CourseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get current user's enrollments
    /// </summary>
    [Authorize]
    [HttpGet("my-enrollments")]
    public async Task<IActionResult> GetMyEnrollments()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _enrollmentService.GetUserEnrollmentsAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get enrollment details
    /// </summary>
    [Authorize]
    [HttpGet("{enrollmentId:guid}")]
    public async Task<IActionResult> GetEnrollment(Guid enrollmentId)
    {
        var result = await _enrollmentService.GetEnrollmentAsync(enrollmentId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get enrollment by course (for current user)
    /// </summary>
    [Authorize]
    [HttpGet("course/{courseId:guid}")]
    public async Task<IActionResult> GetEnrollmentByCourse(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _enrollmentService.GetUserEnrollmentAsync(CurrentUserId.Value, courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Check enrollment status
    /// </summary>
    [Authorize]
    [HttpGet("check/{courseId:guid}")]
    public async Task<IActionResult> CheckEnrollmentStatus(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _enrollmentService.GetUserEnrollmentAsync(CurrentUserId.Value, courseId);
        return Ok(new { IsEnrolled = result.IsSuccess && result.Data != null });
    }

    /// <summary>
    /// Get all enrollments (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAllEnrollments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] Guid? courseId = null)
    {
        var result = await _enrollmentService.GetEnrollmentsAsync(pageNumber, pageSize, status, courseId, null);
        return HandleResult(result);
    }

    /// <summary>
    /// Approve enrollment (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{enrollmentId:guid}/approve")]
    public async Task<IActionResult> ApproveEnrollment(Guid enrollmentId, [FromBody] ApproveEnrollmentDto dto)
    {
        var approvedBy = CurrentUserEmail ?? "Admin";
        var result = await _enrollmentService.ApproveEnrollmentAsync(enrollmentId, dto, approvedBy);
        return HandleResult(result);
    }

    /// <summary>
    /// Reject enrollment (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{enrollmentId:guid}/reject")]
    public async Task<IActionResult> RejectEnrollment(Guid enrollmentId, [FromBody] RejectEnrollmentDto dto)
    {
        var result = await _enrollmentService.RejectEnrollmentAsync(enrollmentId, dto.Reason ?? "No reason provided");
        return HandleResult(result);
    }

    /// <summary>
    /// Get pending enrollments (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingEnrollments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _enrollmentService.GetEnrollmentsAsync(pageNumber, pageSize, "Pending", null, null);
        return HandleResult(result);
    }

    #region Progress Tracking

    /// <summary>
    /// Get course progress
    /// </summary>
    [Authorize]
    [HttpGet("{courseId:guid}/progress")]
    public async Task<IActionResult> GetCourseProgress(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.GetCourseProgressAsync(CurrentUserId.Value, courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get session progress
    /// </summary>
    [Authorize]
    [HttpGet("sessions/{sessionId:guid}/progress")]
    public async Task<IActionResult> GetSessionProgress(Guid sessionId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.GetSessionProgressAsync(CurrentUserId.Value, sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Update watch progress
    /// </summary>
    [Authorize]
    [HttpPost("sessions/{sessionId:guid}/watch-progress")]
    public async Task<IActionResult> UpdateWatchProgress(Guid sessionId, [FromBody] UpdateWatchProgressDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.UpdateWatchProgressAsync(CurrentUserId.Value, sessionId, dto.Percentage);
        return HandleResult(result);
    }

    /// <summary>
    /// Complete a session (mark as 100% complete)
    /// </summary>
    [Authorize]
    [HttpPost("sessions/{sessionId:guid}/complete")]
    public async Task<IActionResult> CompleteSession(Guid sessionId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.CompleteSessionAsync(CurrentUserId.Value, sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Mark resources as accessed
    /// </summary>
    [Authorize]
    [HttpPost("sessions/{sessionId:guid}/mark-resources-accessed")]
    public async Task<IActionResult> MarkResourcesAccessed(Guid sessionId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.MarkResourcesAccessedAsync(CurrentUserId.Value, sessionId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get next session to learn
    /// </summary>
    [Authorize]
    [HttpGet("{courseId:guid}/next-session")]
    public async Task<IActionResult> GetNextSession(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _progressService.GetNextSessionToLearnAsync(CurrentUserId.Value, courseId);
        return HandleResult(result);
    }

    #endregion
}

public record RejectEnrollmentDto
{
    public string? Reason { get; init; }
}

public record UpdateWatchProgressDto
{
    public int Percentage { get; init; }
}
