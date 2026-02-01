using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class CertificatesController : BaseApiController
{
    private readonly ICertificateService _certificateService;

    public CertificatesController(ICertificateService certificateService)
    {
        _certificateService = certificateService;
    }

    /// <summary>
    /// Get all certificates (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAllCertificates(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] bool? isValid = null)
    {
        var result = await _certificateService.GetAllCertificatesAsync(pageNumber, pageSize, search, isValid);
        return HandleResult(result);
    }

    /// <summary>
    /// Get user's certificates
    /// </summary>
    [Authorize]
    [HttpGet("my-certificates")]
    public async Task<IActionResult> GetMyCertificates()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _certificateService.GetUserCertificatesAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get certificate by ID
    /// </summary>
    [HttpGet("{certificateId:guid}")]
    public async Task<IActionResult> GetCertificate(Guid certificateId)
    {
        var result = await _certificateService.GetCertificateByIdAsync(certificateId);
        return HandleResult(result);
    }

    /// <summary>
    /// Verify certificate by number
    /// </summary>
    [HttpGet("verify/{certificateNumber}")]
    public async Task<IActionResult> VerifyCertificate(string certificateNumber)
    {
        var result = await _certificateService.VerifyCertificateAsync(certificateNumber);
        return HandleResult(result);
    }

    /// <summary>
    /// Generate certificate for completed course
    /// </summary>
    [Authorize]
    [HttpPost("generate/{courseId:guid}")]
    public async Task<IActionResult> GenerateCertificate(Guid courseId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _certificateService.GenerateCertificateAsync(CurrentUserId.Value, courseId);
        return HandleResult(result);
    }

    /// <summary>
    /// Invalidate a certificate (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{certificateId:guid}/invalidate")]
    public async Task<IActionResult> InvalidateCertificate(Guid certificateId, [FromBody] InvalidateCertificateDto dto)
    {
        var result = await _certificateService.InvalidateCertificateAsync(certificateId, dto.Reason);
        return HandleResult(result);
    }

}

public record InvalidateCertificateDto
{
    public string Reason { get; init; } = string.Empty;
}
