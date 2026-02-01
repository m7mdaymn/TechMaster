using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Internship;

namespace TechMaster.Infrastructure.Services;

public interface IInternshipService
{
    Task<Result<PaginatedList<InternshipDto>>> GetInternshipsAsync(int pageNumber, int pageSize, string? status = null, string? search = null);
    Task<Result<InternshipDto>> GetInternshipByIdAsync(Guid internshipId);
    Task<Result<InternshipDto>> GetInternshipBySlugAsync(string slug);
    Task<Result<InternshipDto>> CreateInternshipAsync(CreateInternshipDto dto);
    Task<Result<InternshipDto>> UpdateInternshipAsync(Guid internshipId, CreateInternshipDto dto);
    Task<Result> DeleteInternshipAsync(Guid internshipId);
    Task<Result<InternshipApplicationDto>> ApplyAsync(Guid userId, CreateInternshipApplicationDto dto);
    Task<Result<PaginatedList<InternshipApplicationDto>>> GetApplicationsAsync(int pageNumber, int pageSize, Guid? internshipId = null, Guid? userId = null, string? status = null);
    Task<Result> ReviewApplicationAsync(Guid applicationId, ReviewApplicationDto dto, string reviewedBy);
    Task<Result<List<InternshipApplicationDto>>> GetUserApplicationsAsync(Guid userId);
    
    // Task management
    Task<Result<List<InternshipTaskDto>>> GetInternshipTasksAsync(Guid internshipId);
    Task<Result<InternshipTaskDto>> GetTaskByIdAsync(Guid taskId);
    Task<Result<InternshipTaskDto>> CreateTaskAsync(Guid internshipId, CreateInternshipTaskDto dto, Guid createdByUserId);
    Task<Result<InternshipTaskDto>> UpdateTaskAsync(Guid taskId, UpdateInternshipTaskDto dto);
    Task<Result> DeleteTaskAsync(Guid taskId);
    
    // Task submissions
    Task<Result<TaskSubmissionDto>> SubmitTaskAsync(Guid taskId, Guid userId, CreateTaskSubmissionDto dto);
    Task<Result<List<TaskSubmissionDto>>> GetTaskSubmissionsAsync(Guid taskId);
    Task<Result<List<TaskSubmissionDto>>> GetUserSubmissionsAsync(Guid userId, Guid? internshipId = null);
    Task<Result<TaskSubmissionDto>> GradeSubmissionAsync(Guid submissionId, GradeSubmissionDto dto, Guid gradedByUserId);
}
