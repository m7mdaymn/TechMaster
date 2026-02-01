using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Internship;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class InternshipsController : BaseApiController
{
    private readonly IInternshipService _internshipService;

    public InternshipsController(IInternshipService internshipService)
    {
        _internshipService = internshipService;
    }

    /// <summary>
    /// Get all internships
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetInternships(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _internshipService.GetInternshipsAsync(pageNumber, pageSize, status, search);
        return HandleResult(result);
    }

    /// <summary>
    /// Get internship by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetInternship(Guid id)
    {
        var result = await _internshipService.GetInternshipByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Get internship by slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetInternshipBySlug(string slug)
    {
        var result = await _internshipService.GetInternshipBySlugAsync(slug);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new internship (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> CreateInternship([FromBody] CreateInternshipDto dto)
    {
        var result = await _internshipService.CreateInternshipAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update an internship (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateInternship(Guid id, [FromBody] CreateInternshipDto dto)
    {
        var result = await _internshipService.UpdateInternshipAsync(id, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete an internship (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteInternship(Guid id)
    {
        var result = await _internshipService.DeleteInternshipAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Apply for an internship
    /// </summary>
    [Authorize]
    [HttpPost("{internshipId:guid}/apply")]
    public async Task<IActionResult> Apply(Guid internshipId, [FromBody] CreateInternshipApplicationDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        dto.InternshipId = internshipId;
        var result = await _internshipService.ApplyAsync(CurrentUserId.Value, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get my applications
    /// </summary>
    [Authorize]
    [HttpGet("my-applications")]
    public async Task<IActionResult> GetMyApplications()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _internshipService.GetUserApplicationsAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get applications for an internship (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{internshipId:guid}/applications")]
    public async Task<IActionResult> GetApplications(
        Guid internshipId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        var result = await _internshipService.GetApplicationsAsync(pageNumber, pageSize, internshipId, null, status);
        return HandleResult(result);
    }

    /// <summary>
    /// Review an application (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("applications/{applicationId:guid}/review")]
    public async Task<IActionResult> ReviewApplication(Guid applicationId, [FromBody] ReviewApplicationDto dto)
    {
        var reviewedBy = CurrentUserEmail ?? "Admin";
        var result = await _internshipService.ReviewApplicationAsync(applicationId, dto, reviewedBy);
        return HandleResult(result);
    }

    // Task management endpoints

    /// <summary>
    /// Get all tasks for an internship
    /// </summary>
    [HttpGet("{internshipId:guid}/tasks")]
    public async Task<IActionResult> GetInternshipTasks(Guid internshipId)
    {
        var result = await _internshipService.GetInternshipTasksAsync(internshipId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get a task by ID
    /// </summary>
    [HttpGet("tasks/{taskId:guid}")]
    public async Task<IActionResult> GetTask(Guid taskId)
    {
        var result = await _internshipService.GetTaskByIdAsync(taskId);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a task for an internship (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{internshipId:guid}/tasks")]
    public async Task<IActionResult> CreateTask(Guid internshipId, [FromBody] CreateInternshipTaskDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _internshipService.CreateTaskAsync(internshipId, dto, CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a task (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("tasks/{taskId:guid}")]
    public async Task<IActionResult> UpdateTask(Guid taskId, [FromBody] UpdateInternshipTaskDto dto)
    {
        var result = await _internshipService.UpdateTaskAsync(taskId, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a task (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("tasks/{taskId:guid}")]
    public async Task<IActionResult> DeleteTask(Guid taskId)
    {
        var result = await _internshipService.DeleteTaskAsync(taskId);
        return HandleResult(result);
    }

    // Task submission endpoints

    /// <summary>
    /// Submit a task (Student)
    /// </summary>
    [Authorize]
    [HttpPost("tasks/{taskId:guid}/submit")]
    public async Task<IActionResult> SubmitTask(Guid taskId, [FromBody] CreateTaskSubmissionDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _internshipService.SubmitTaskAsync(taskId, CurrentUserId.Value, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all submissions for a task (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("tasks/{taskId:guid}/submissions")]
    public async Task<IActionResult> GetTaskSubmissions(Guid taskId)
    {
        var result = await _internshipService.GetTaskSubmissionsAsync(taskId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get current user's submissions for an internship
    /// </summary>
    [Authorize]
    [HttpGet("{internshipId:guid}/my-submissions")]
    public async Task<IActionResult> GetMySubmissions(Guid internshipId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _internshipService.GetUserSubmissionsAsync(CurrentUserId.Value, internshipId);
        return HandleResult(result);
    }

    /// <summary>
    /// Grade a submission (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<IActionResult> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _internshipService.GradeSubmissionAsync(submissionId, dto, CurrentUserId.Value);
        return HandleResult(result);
    }
}
