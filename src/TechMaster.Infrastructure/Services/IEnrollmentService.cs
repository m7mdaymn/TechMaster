using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Enrollment;
using AppStudentDashboardDto = TechMaster.Application.DTOs.Enrollment.StudentDashboardDto;

namespace TechMaster.Infrastructure.Services;

public interface IEnrollmentService
{
    Task<Result<EnrollmentDto>> EnrollAsync(Guid userId, Guid courseId, string? paymentScreenshotUrl = null, string? paymentReference = null);
    Task<Result<EnrollmentDto>> EnrollFreeAsync(Guid userId, Guid courseId);
    Task<Result<EnrollmentDetailDto>> GetEnrollmentAsync(Guid enrollmentId);
    Task<Result<EnrollmentDetailDto>> GetUserEnrollmentAsync(Guid userId, Guid courseId);
    Task<Result<PaginatedList<EnrollmentDto>>> GetEnrollmentsAsync(int pageNumber, int pageSize, string? status = null, Guid? courseId = null, Guid? userId = null);
    Task<Result<List<EnrollmentDto>>> GetUserEnrollmentsAsync(Guid userId);
    Task<Result> ApproveEnrollmentAsync(Guid enrollmentId, ApproveEnrollmentDto dto, string approvedBy);
    Task<Result> RejectEnrollmentAsync(Guid enrollmentId, string reason);
    Task<Result<AppStudentDashboardDto>> GetStudentDashboardAsync(Guid userId);
}
