using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Certificate;

namespace TechMaster.Infrastructure.Services;

public interface ICertificateService
{
    Task<Result<CertificateDto>> GenerateCertificateAsync(Guid userId, Guid courseId, int? finalScore = null);
    Task<Result<CertificateDto>> GetCertificateByIdAsync(Guid certificateId);
    Task<Result<List<CertificateDto>>> GetUserCertificatesAsync(Guid userId);
    Task<Result<PaginatedList<CertificateDto>>> GetAllCertificatesAsync(int pageNumber, int pageSize, string? search = null, bool? isValid = null);
    Task<Result<CertificateVerificationResult>> VerifyCertificateAsync(string certificateNumber);
    Task<Result> InvalidateCertificateAsync(Guid certificateId, string reason);
    Task<Result<CertificateDto>> ReissueCertificateAsync(Guid certificateId);
}
